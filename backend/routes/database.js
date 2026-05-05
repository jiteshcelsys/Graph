const router = require('express').Router();
const { connectDB, disconnectDB, getTables, getTableData } = require('../controllers/dbController');

router.post('/connect', connectDB);
router.post('/disconnect', disconnectDB);
router.get('/tables', getTables);
router.get('/table-data', getTableData);

module.exports = router;
