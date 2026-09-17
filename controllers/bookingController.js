const db = require('../config/db');

// Lấy lịch sử đặt tour của user hiện tại
exports.getMyBookings = async (req, res) => {
  const user_id = req.user.id;

  try {
    const result = await db.query(
      `SELECT 
         b.id,
         b.user_id,
         b.total_amount,
         b.status,
         bd.tour_id,
         bd.quantity,
         bd.departure_date,
         bd.price_at_booking,
         t.title AS tour_title
       FROM bookings b
       LEFT JOIN booking_details bd ON bd.booking_id = b.id
       LEFT JOIN tours t ON t.id = bd.tour_id
       WHERE b.user_id = $1
       ORDER BY b.id DESC`,
      [user_id]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tải lịch sử đặt tour:',
      error: err.message
    });
  }
};

// Tạo đơn đặt tour mới
exports.createBooking = async (req, res) => {
  const user_id = req.user.id;
  const { tour_id, quantity, departure_date } = req.body;

  try {
    // 1. Kiểm tra Tour và số lượng chỗ còn trống
    const tourQuery = await db.query('SELECT price, discount_rate, available_seats FROM tours WHERE id = $1', [tour_id]);
    if (tourQuery.rows.length === 0) {
      return res.status(404).json({ message: 'Tour không tồn tại!' });
    }

    const tour = tourQuery.rows[0];
    if (tour.available_seats < quantity) {
      return res.status(400).json({ message: 'Số lượng chỗ còn lại không đủ!' });
    }

    // Tính tổng tiền sau giảm giá
    const finalPrice = tour.price * (1 - tour.discount_rate);
    const totalAmount = finalPrice * quantity;

    // 2. Bắt đầu Transaction
    await db.query('BEGIN');

    // Tạo record Booking
    const bookingResult = await db.query(
      `INSERT INTO bookings (user_id, total_amount, status) 
       VALUES ($1, $2, 'CONFIRMED') RETURNING id`,
      [user_id, totalAmount]
    );
    const bookingId = bookingResult.rows[0].id;

    // Tạo Booking Detail
    await db.query(
      `INSERT INTO booking_details (booking_id, tour_id, quantity, price_at_booking, departure_date) 
       VALUES ($1, $2, $3, $4, $5)`,
      [bookingId, tour_id, quantity, finalPrice, departure_date]
    );

    // Trừ số ghế khả dụng của Tour
    await db.query(
      'UPDATE tours SET available_seats = available_seats - $1 WHERE id = $2',
      [quantity, tour_id]
    );

    // Ghi nhận log hành vi người dùng (phục vụ AI Recommendation)
    await db.query(
      `INSERT INTO behavior_logs (user_id, tour_id, action_type) VALUES ($1, $2, 'BOOKING')`,
      [user_id, tour_id]
    );

    await db.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Đặt tour thành công!',
      booking_id: bookingId,
      total_amount: totalAmount
    });
  } catch (err) {
    await db.query('ROLLBACK');
    res.status(500).json({ message: 'Lỗi xử lý đặt tour:', error: err.message });
  }
};