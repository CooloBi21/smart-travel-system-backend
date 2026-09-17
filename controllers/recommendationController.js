const db = require('../config/db');

// Gợi ý Tour thông minh cho người dùng
exports.getRecommendations = async (req, res) => {
  const user_id = req.user.id;

  try {
    // 1. Lấy sở thích người dùng
    const prefQuery = await db.query('SELECT * FROM user_preferences WHERE user_id = $1', [user_id]);
    const pref = prefQuery.rows[0] || {};

    // 2. Thuật toán Scoring lọc Tour phù hợp
    const toursQuery = await db.query(
      `SELECT t.*, d.name as destination_name, img.image_url as primary_image,
              COALESCE(AVG(r.rating), 0) as avg_rating
       FROM tours t
       JOIN destinations d ON t.destination_id = d.id
       LEFT JOIN tour_images img ON t.id = img.tour_id AND img.is_primary = TRUE
       LEFT JOIN reviews r ON t.id = r.tour_id
       WHERE t.status = 'ACTIVE'
       GROUP BY t.id, d.name, img.image_url`
    );

    // Tính điểm phù hợp (Match Score) cho từng Tour
    const scoredTours = toursQuery.rows.map(tour => {
      let score = 0;

      // Tiêu chí 1: Danh mục yêu thích (+30 điểm)
      if (pref.preferred_category_id && tour.category_id === pref.preferred_category_id) {
        score += 30;
      }

      // Tiêu chí 2: Phong cách chuyến đi (+25 điểm)
      if (pref.travel_style && tour.travel_style === pref.travel_style) {
        score += 25;
      }

      // Tiêu chí 3: Nằm trong ngân sách (+25 điểm)
      if (tour.price >= pref.budget_min && tour.price <= pref.budget_max) {
        score += 25;
      }

      // Tiêu chí 4: Số ngày phù hợp (+10 điểm)
      if (pref.duration_days && Math.abs(tour.duration_days - pref.duration_days) <= 1) {
        score += 10;
      }

      // Tiêu chí 5: Rating trung bình cao (+10 điểm tối đa)
      const avgRating = Number(tour.avg_rating) || 0;
      score += avgRating * 2;

      const roundedScore = Math.min(100, Number(score.toFixed(2)));

      return {
        ...tour,
        match_score: roundedScore
      };
    });

    // Sắp xếp giảm dần theo điểm Scoring và lấy Top 5
    scoredTours.sort((a, b) => b.match_score - a.match_score);
    const topRecommendations = scoredTours.slice(0, 5);

    // Ghi Log gợi ý vào Database
    await db.query(
      `INSERT INTO recommendation_logs (user_id, recommended_tours, algorithm_used) 
       VALUES ($1, $2, 'HYBRID_RULE_SCORING')`,
      [user_id, JSON.stringify(topRecommendations.map(t => ({ tour_id: t.id, score: t.match_score })))]
    );

    res.json({
      success: true,
      count: topRecommendations.length,
      data: topRecommendations
    });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi tạo gợi ý tour:', error: err.message });
  }
};