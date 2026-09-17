const express = require('express');
const router = express.Router();
const tourController = require('../controllers/tourController');

router.get('/', tourController.getTours);
router.get('/:id', tourController.getTourById);

module.exports = router;