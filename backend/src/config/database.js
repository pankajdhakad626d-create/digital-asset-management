const mongoose = require('mongoose');

const connectDatabase = async () => {
    const connectionString = process.env.MONGODB_URI || process.env.MONGODB_URL;

    if (!connectionString) {
        throw new Error('Missing MONGODB_URI environment variable');
    }

    await mongoose.connect(connectionString, {
        serverSelectionTimeoutMS: Number(process.env.MONGODB_TIMEOUT_MS) || 5000,
    });
    console.log('MongoDB connected');
};

module.exports = connectDatabase;
