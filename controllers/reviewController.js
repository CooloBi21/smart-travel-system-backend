const db = require('../config/db');

// Hàm hỗ trợ phân tích cảm xúc (Rule-based / PhoBERT Call placeholder)
const analyzeSentiment = (text) => {
  const lowerText = text.toLowerCase();
  const positiveWords = ['tuyệt vời', 'sạch sẽ', 'chu đáo', 'nhiệt tình', 'đẹp', 'ngon', 'thích', 'tốt'];
  const negativeWords = ['tệ', 'dở', 'trễ', 'bẩn', 'đắt', 'thất vọng', 'kém', 'hỏng'];

  let score = 0.5;
  positiveWords.forEach(w => { if (lowerText.includes(w)) score += 0.15; });
  negativeWords.forEach(w => { if (lowerText.includes(w)) score -= 0.20; });

  score = Math.max(0.05, Math.min(0.99, score));

  let label = 'NEUTRAL';
  if (score >= 0.65) label = 'POSITIVE';
  if (score <= 0.40) label = 'NEGATIVE';

  return { label, score: Number(score.toFixed(4)) };
};

// Đăng bài đánh giá Tour
exports.addReview = async (req, res) => {
  const user_id = req.user.id;
  const { tour_id, booking_id, rating, comment } = req.body;

  try {
    // Phân tích Cảm xúc bài review bằng AI Sentiment Analysis
    const { label, score } = analyzeSentiment(comment);

    const result = await db.query(
      `INSERT INTO reviews (user_id, tour_id, booking_id, rating, comment, sentiment_label, sentiment_score)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [user_id, tour_id, booking_id || null, rating, comment, label, score]
    );

    res.status(201).json({
      success: true,
      message: 'Đã gửi đánh giá thành công!',
      data: result.rows[0]
    });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi gửi đánh giá:', error: err.message });
  }
};