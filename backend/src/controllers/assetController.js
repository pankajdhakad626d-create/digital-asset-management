const https = require('https');
const path = require('path');
const mongoose = require('mongoose');

const Asset = require('../models/Asset');
const {
    cloudinary,
    cloudinaryMaxUploadSize,
    uploadChunkSize,
    uploadFolder,
    uploadRetries,
    uploadTimeout,
} = require('../config/cloudinary');

const uploadBufferOnce = (buffer) => new Promise((resolve, reject) => {
    const uploadMethod = buffer.length <= cloudinaryMaxUploadSize
        ? 'upload_stream'
        : 'upload_chunked_stream';
    const uploadStream = cloudinary.uploader[uploadMethod]({
        ...(uploadMethod === 'upload_chunked_stream' ? { chunk_size: uploadChunkSize } : {}),
        folder: uploadFolder,
        resource_type: 'auto',
        timeout: uploadTimeout,
    }, (error, result) => (error ? reject(error) : resolve(result)));

    uploadStream.on('error', reject);
    uploadStream.end(buffer);
});

const isRetryableCloudinaryError = (error) => error?.http_code === 499
    || error?.name === 'TimeoutError'
    || /timeout/i.test(error?.message || '');

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

const uploadBufferToCloudinary = async (buffer) => {
    let lastError;

    for (let attempt = 0; attempt <= uploadRetries; attempt += 1) {
        try {
            return await uploadBufferOnce(buffer);
        } catch (error) {
            lastError = error;
            if (!isRetryableCloudinaryError(error) || attempt === uploadRetries) throw error;
            await wait(1000 * (attempt + 1));
        }
    }

    throw lastError;
};

const parseTags = (value) => {
    if (typeof value !== 'string') {
        return [];
    }

    return value.split(',')
        .map((tag) => tag.trim().toLowerCase())
        .filter(Boolean);
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const parsePositiveInteger = (value, fallback, maximum) => {
    if (value === undefined) return fallback;
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 1 || (maximum && parsed > maximum)) return null;
    return parsed;
};

const parseDate = (value, endOfDay = false) => {
    if (value === undefined || value === '') return undefined;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    if (endOfDay && /^\d{4}-\d{2}-\d{2}$/.test(value)) date.setUTCHours(23, 59, 59, 999);
    return date;
};

const getAssets = async (request, response, next) => {
    try {
        const { search, type, tag, sort = 'newest' } = request.query;
        const page = parsePositiveInteger(request.query.page, 1);
        const limit = parsePositiveInteger(request.query.limit, 12, 50);
        const fromDate = parseDate(request.query.fromDate);
        const toDate = parseDate(request.query.toDate, true);

        if (!page || !limit || !['newest', 'oldest'].includes(sort)) {
            const error = new Error('Invalid pagination or sort values');
            error.code = 'INVALID_QUERY';
            return next(error);
        }
        if (fromDate === null || toDate === null || (fromDate && toDate && fromDate > toDate)) {
            const error = new Error('Invalid date filter values');
            error.code = 'INVALID_QUERY';
            return next(error);
        }
        if (type && !['image', 'video', 'pdf'].includes(type)) {
            const error = new Error('Type must be image, video, or pdf');
            error.code = 'INVALID_QUERY';
            return next(error);
        }

        const query = {};
        if (search?.trim()) query.originalName = { $regex: escapeRegex(search.trim()), $options: 'i' };
        if (tag?.trim()) query.tags = tag.trim().toLowerCase();
        if (type === 'image') query.mimeType = { $regex: /^image\// };
        if (type === 'video') query.mimeType = { $regex: /^video\// };
        if (type === 'pdf') query.mimeType = 'application/pdf';
        if (fromDate || toDate) query.uploadedAt = {};
        if (fromDate) query.uploadedAt.$gte = fromDate;
        if (toDate) query.uploadedAt.$lte = toDate;

        const [assets, total] = await Promise.all([
            Asset.find(query)
                .sort({ uploadedAt: sort === 'oldest' ? 1 : -1 })
                .skip((page - 1) * limit)
                .limit(limit),
            Asset.countDocuments(query),
        ]);
        return response.status(200).json({
            success: true,
            data: {
                assets,
                pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
            },
        });
    } catch (databaseError) {
        const error = new Error('Database read failed', { cause: databaseError });
        error.code = 'DATABASE_READ_FAILED';
        return next(error);
    }
};

const findAssetById = async (assetId) => {
    if (!mongoose.Types.ObjectId.isValid(assetId)) {
        const error = new Error('Invalid asset ID');
        error.code = 'INVALID_ASSET_ID';
        throw error;
    }

    const asset = await Asset.findById(assetId);
    if (!asset) {
        const error = new Error('Asset not found');
        error.code = 'ASSET_NOT_FOUND';
        throw error;
    }

    return asset;
};

const getAsset = async (request, response, next) => {
    try {
        const asset = await findAssetById(request.params.id);
        return response.status(200).json({ success: true, data: asset });
    } catch (error) {
        return next(error);
    }
};

const downloadAsset = async (request, response, next) => {
    let asset;

    try {
        asset = await findAssetById(request.params.id);
    } catch (error) {
        return next(error);
    }

    const filename = path.basename(asset.originalName).replace(/[\r\n"]/g, '_');
    response.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    response.setHeader('Content-Type', asset.mimeType);
    response.setHeader('Content-Length', asset.size);

    https.get(asset.secureUrl, (cloudinaryResponse) => {
        if (cloudinaryResponse.statusCode < 200 || cloudinaryResponse.statusCode >= 300) {
            cloudinaryResponse.resume();
            const error = new Error('Asset download failed');
            error.code = 'ASSET_DOWNLOAD_FAILED';
            return next(error);
        }

        cloudinaryResponse.pipe(response);
        cloudinaryResponse.on('error', next);
        return undefined;
    }).on('error', (downloadError) => {
        const error = new Error('Asset download failed', { cause: downloadError });
        error.code = 'ASSET_DOWNLOAD_FAILED';
        next(error);
    });
};

const getAssetView = async (request, response, next) => {
    try {
        const asset = await findAssetById(request.params.id);
        return response.redirect(asset.secureUrl);
    } catch (error) {
        return next(error);
    }
};

const getStats = async (request, response, next) => {
    try {
        const [summary] = await Asset.aggregate([
            {
                $group: {
                    _id: null,
                    totalAssets: { $sum: 1 },
                    totalStorage: { $sum: '$size' },
                    imageCount: { $sum: { $cond: [{ $eq: ['$resourceType', 'image'] }, 1, 0] } },
                    videoCount: { $sum: { $cond: [{ $eq: ['$resourceType', 'video'] }, 1, 0] } },
                    pdfCount: { $sum: { $cond: [{ $eq: ['$mimeType', 'application/pdf'] }, 1, 0] } },
                },
            },
        ]);
        return response.json({
            success: true,
            data: summary || { totalAssets: 0, totalStorage: 0, imageCount: 0, videoCount: 0, pdfCount: 0 },
        });
    } catch (databaseError) {
        const error = new Error('Database read failed', { cause: databaseError });
        error.code = 'DATABASE_READ_FAILED';
        return next(error);
    }
};

const uploadAsset = async (request, response, next) => {
    if (!request.file) {
        const error = new Error('A file is required in the file field');
        error.code = 'MISSING_FILE';
        return next(error);
    }

    if (request.file.size > cloudinaryMaxUploadSize) {
        const error = new Error('Cloudinary upload exceeds the configured account limit');
        error.code = 'CLOUDINARY_FILE_TOO_LARGE';
        return next(error);
    }

    let cloudinaryAsset;

    try {
        cloudinaryAsset = await uploadBufferToCloudinary(request.file.buffer);
    } catch (uploadError) {
        const error = new Error(uploadError.message || 'Cloudinary upload failed', { cause: uploadError });
        error.code = uploadError.http_code === 400 && /file size too large/i.test(uploadError.message || '')
            ? 'CLOUDINARY_FILE_TOO_LARGE'
            : isRetryableCloudinaryError(uploadError)
                ? 'CLOUDINARY_UPLOAD_TIMEOUT'
                : 'CLOUDINARY_UPLOAD_FAILED';
        return next(error);
    }

    const asset = new Asset({
        originalName: request.file.originalname,
        publicId: cloudinaryAsset.public_id,
        secureUrl: cloudinaryAsset.secure_url,
        resourceType: cloudinaryAsset.resource_type,
        mimeType: request.file.mimetype,
        format: cloudinaryAsset.format,
        size: request.file.size,
        tags: parseTags(request.body?.tags),
    });

    try {
        await asset.save();
    } catch (databaseError) {
        try {
            await cloudinary.uploader.destroy(cloudinaryAsset.public_id, {
                resource_type: cloudinaryAsset.resource_type,
                type: 'upload',
                invalidate: true,
            });
        } catch (cleanupError) {
            console.error('Failed to remove orphaned Cloudinary asset', cleanupError);
        }

        const error = new Error('Database save failed', { cause: databaseError });
        error.code = 'DATABASE_SAVE_FAILED';
        return next(error);
    }

    return response.status(201).json({ success: true, data: asset });
};

module.exports = {
    downloadAsset,
    getAsset,
    getAssets,
    getAssetView,
    getStats,
    uploadAsset,
};
