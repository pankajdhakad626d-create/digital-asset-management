const cloudinary = require('cloudinary').v2;

const requiredVariables = [
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
];

const missingVariables = requiredVariables.filter((name) => !process.env[name]);

if (missingVariables.length > 0) {
    throw new Error(`Missing Cloudinary environment variables: ${missingVariables.join(', ')}`);
}

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
});

const uploadTimeout = Number(process.env.CLOUDINARY_UPLOAD_TIMEOUT_MS) || 300000;
const uploadRetries = Number(process.env.CLOUDINARY_UPLOAD_RETRIES) || 2;
const cloudinaryMaxUploadSize = Number(process.env.CLOUDINARY_MAX_UPLOAD_SIZE_BYTES) || 10 * 1024 * 1024;
const configuredChunkSize = Number(process.env.CLOUDINARY_UPLOAD_CHUNK_SIZE_BYTES);
const uploadChunkSize = Math.max(6000000, Math.min(configuredChunkSize || 6000000, 6000000));

module.exports = {
    cloudinary,
    cloudinaryMaxUploadSize,
    uploadChunkSize,
    uploadTimeout,
    uploadRetries,
    uploadFolder: 'dam-assets',
};
