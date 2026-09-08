const multer = require('multer');
const path = require('path');

const allowedMimeTypes = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
    'video/mp4',
    'video/webm',
]);

const allowedExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp', '.pdf', '.mp4', '.webm']);

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 20 * 1024 * 1024,
    },
    fileFilter: (request, file, callback) => {
        const extension = path.extname(file.originalname).toLowerCase();

        if (!allowedMimeTypes.has(file.mimetype) || !allowedExtensions.has(extension)) {
            const error = new Error('Unsupported file type');
            error.code = 'UNSUPPORTED_FILE_TYPE';
            return callback(error);
        }

        return callback(null, true);
    },
});

module.exports = upload;
