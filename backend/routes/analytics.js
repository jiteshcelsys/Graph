const router = require('express').Router();
const { autoDashboard, askQuestion } = require('../controllers/analyticsController');

router.post('/auto-dashboard', autoDashboard);
router.post('/ask', askQuestion);

module.exports = router;
