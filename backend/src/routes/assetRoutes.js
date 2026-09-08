const express = require('express');
const upload = require('../middleware/upload');
const {
	downloadAsset,
	getAsset,
	getAssets,
	getAssetView,
	getStats,
	uploadAsset,
} = require('../controllers/assetController');

const router = express.Router();

router.get('/', getAssets);
router.get('/stats', getStats);
router.get('/:id/view', getAssetView);
router.get('/:id/download', downloadAsset);
router.get('/:id', getAsset);
router.post('/', upload.single('file'), uploadAsset);

module.exports = router;
