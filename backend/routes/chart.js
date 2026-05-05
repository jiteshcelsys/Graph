const router = require('express').Router();
const { generateChart, saveChart, getSavedCharts, deleteChart } = require('../controllers/chartController');

router.post('/generate', generateChart);
router.post('/save', saveChart);
router.get('/saved', getSavedCharts);
router.delete('/:id', deleteChart);

module.exports = router;
