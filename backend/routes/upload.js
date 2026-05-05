const router = require('express').Router();
const upload = require('../middleware/upload');
const { uploadFile, getDataPreview, listDatasets, deleteDataset, loadDataset } = require('../controllers/uploadController');

router.post('/', upload.single('file'), uploadFile);
router.get('/preview', getDataPreview);
router.get('/datasets', listDatasets);
router.get('/datasets/:id', loadDataset);
router.delete('/datasets/:id', deleteDataset);

module.exports = router;
