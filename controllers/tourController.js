const db = require('../config/db');

// Lấy danh sách Tour (Hỗ trợ Lọc & Tìm kiếm)
exports.getTours = async (req, res) => {
  try {
    const { category_id, search, min_price, max_price, travel_style } = req.query;

    let queryText = `
      SELECT t.*, d.name as destination_name, c.name as category_name, img.image_url as primary_image
      FROM tours t
      JOIN destinations d ON t.destination_id = d.id
      JOIN tour_categories c ON t.category_id = c.id
      LEFT JOIN tour_images img ON t.id = img.tour_id AND img.is_primary = TRUE
      WHERE t.status = 'ACTIVE'
    `;

    const queryParams = [];

    if (category_id) {
      queryParams.push(category_id);
      queryText += ` AND t.category_id = $${queryParams.length}`;
    }

    if (travel_style) {
      queryParams.push(travel_style);
      queryText += ` AND t.travel_style = $${queryParams.length}`;
    }

    if (search) {
      queryParams.push(`%${search}%`);
      queryText += ` AND (t.title ILIKE $${queryParams.length} OR d.name ILIKE $${queryParams.length})`;
    }

    if (min_price) {
      queryParams.push(min_price);
      queryText += ` AND t.price >= $${queryParams.length}`;
    }

    if (max_price) {
      queryParams.push(max_price);
      queryText += ` AND t.price <= $${queryParams.length}`;
    }

    queryText += ` ORDER BY t.created_at DESC`;

    const tours = await db.query(queryText, queryParams);
    res.json({ success: true, count: tours.rows.length, data: tours.rows });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server:', error: err.message });
  }
};

// Lấy chi tiết 1 Tour
exports.getTourById = async (req, res) => {
  const { id } = req.params;
  try {
    const tourResult = await db.query(
      `SELECT t.*, d.name as destination_name, d.latitude, d.longitude, c.name as category_name
       FROM tours t
       JOIN destinations d ON t.destination_id = d.id
       JOIN tour_categories c ON t.category_id = c.id
       WHERE t.id = $1`,
      [id]
    );

    if (tourResult.rows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy tour này!' });
    }

    const imagesResult = await db.query('SELECT image_url, is_primary FROM tour_images WHERE tour_id = $1', [id]);
    const reviewsResult = await db.query(
      `SELECT r.*, u.full_name, u.avatar_url 
       FROM reviews r 
       JOIN users u ON r.user_id = u.id 
       WHERE r.tour_id = $1 ORDER BY r.created_at DESC`,
      [id]
    );

    res.json({
      success: true,
      data: {
        ...tourResult.rows[0],
        images: imagesResult.rows,
        reviews: reviewsResult.rows
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server:', error: err.message });
  }
};