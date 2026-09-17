const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/my-bookings', verifyToken, bookingController.getMyBookings);
router.post('/', verifyToken, bookingController.createBooking);

module.exports = router;