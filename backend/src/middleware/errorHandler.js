const multer = require('multer');

const errorHandler = (error, request, response, next) => {
    let statusCode = 500;
    let message = 'Internal server error';

    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            statusCode = 413;
            message = 'File exceeds the 20 MB size limit';
        } else if (error.code === 'LIMIT_UNEXPECTED_FILE') {
            statusCode = 400;
            message = `Unexpected file field "${error.field || 'unknown'}". Use the file field name "file"`;
        } else {
            statusCode = 400;
            message = `Invalid file upload (${error.code})`;
        }
    } else if (error.code === 'UNSUPPORTED_FILE_TYPE') {
        statusCode = 400;
        message = error.message;
    } else if (error.code === 'MISSING_FILE') {
        statusCode = 400;
        message = 'A file is required in the file field';
    } else if (error.code === 'INVALID_ASSET_ID') {
        statusCode = 400;
        message = 'Invalid asset ID';
    } else if (error.code === 'ASSET_NOT_FOUND') {
        statusCode = 404;
        message = 'Asset not found';
    } else if (error.code === 'ASSET_DOWNLOAD_FAILED') {
        statusCode = 502;
        message = 'Asset download failed';
    } else if (error.code === 'CLOUDINARY_UPLOAD_FAILED') {
        statusCode = 502;
        message = `Cloudinary upload failed: ${error.message}`;
    } else if (error.code === 'CLOUDINARY_UPLOAD_TIMEOUT') {
        statusCode = 504;
        message = 'Cloudinary upload timed out after retries. Check network connectivity or retry the upload.';
    } else if (error.code === 'CLOUDINARY_FILE_TOO_LARGE') {
        statusCode = 413;
        message = 'Cloudinary rejected this file because the configured account limit is 10 MB';
    } else if (error.code === 'DATABASE_SAVE_FAILED') {
        statusCode = 500;
        message = 'Database save failed';
    } else if (error.code === 'DATABASE_READ_FAILED') {
        statusCode = 500;
        message = 'Database read failed';
    } else if (error.code === 'INVALID_QUERY') {
        statusCode = 400;
        message = error.message;
    } else if (error.name === 'ValidationError') {
        statusCode = 400;
        message = 'Asset metadata is invalid';
    } else if (error.code === 11000) {
        statusCode = 409;
        message = 'An asset with this public ID already exists';
    }

    if (statusCode >= 500) {
        console.error(`${error.code || error.name || 'ERROR'}: ${error.message}`);
        if (error.cause?.http_code || error.cause?.name) {
            console.error(`Upstream: ${error.cause.name || 'CloudinaryError'} (${error.cause.http_code || 'unknown'})`);
        }
    }

    return response.status(statusCode).json({
        success: false,
        error: {
            code: error.code || 'INTERNAL_SERVER_ERROR',
            message,
        },
    });
};

module.exports = errorHandler;
