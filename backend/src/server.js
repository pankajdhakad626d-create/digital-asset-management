require('dotenv').config();

const cors = require('cors');
const express = require('express');
const connectDatabase = require('./config/database');
const assetRoutes = require('./routes/assetRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const port = process.env.PORT || 5000;
const normalizeOrigin = (origin) => origin.trim().replace(/\/$/, '');
const allowedOrigins = (process.env.CLIENT_URL || '')
    .split(',')
    .map(normalizeOrigin)
    .filter(Boolean);

app.use(cors({
    origin: (requestOrigin, callback) => {
        if (!requestOrigin || allowedOrigins.includes(normalizeOrigin(requestOrigin))) {
            return callback(null, true);
        }

        return callback(null, false);
    },
}));
app.use(express.json());
app.get('/api/health', (request, response) => response.json({ success: true, data: { status: 'ok' } }));
app.use('/api/assets', assetRoutes);
app.use((request, response) => response.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: 'Route not found' },
}));
app.use(errorHandler);

const startServer = async () => {
    try {
        await connectDatabase();
    } catch (error) {
        console.error(`MongoDB connection failed: ${error.name}: ${error.message}`);
        console.error('Database-backed routes may be unavailable until MongoDB Atlas network access is configured');
    }

    app.listen(port, () => {
        console.log(`Server listening on port ${port}`);
    });
};

if (require.main === module) {
    startServer();
}

module.exports = app;
