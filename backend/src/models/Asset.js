const mongoose = require('mongoose');

const normalizeTags = (tags) => {
    if (!Array.isArray(tags)) {
        return [];
    }

    return [...new Set(tags
        .map((tag) => String(tag).trim().toLowerCase())
        .filter(Boolean))];
};

const assetSchema = new mongoose.Schema({
    originalName: {
        type: String,
        required: true,
        trim: true,
    },
    publicId: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    secureUrl: {
        type: String,
        required: true,
        trim: true,
    },
    resourceType: {
        type: String,
        required: true,
        trim: true,
    },
    mimeType: {
        type: String,
        required: true,
        trim: true,
    },
    format: {
        type: String,
        required: true,
        trim: true,
    },
    size: {
        type: Number,
        required: true,
        min: 1,
    },
    tags: {
        type: [String],
        default: [],
        set: normalizeTags,
    },
    uploadedAt: {
        type: Date,
        default: Date.now,
    },
}, { timestamps: true });

module.exports = mongoose.model('Asset', assetSchema);
