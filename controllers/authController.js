const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Đăng ký tài khoản
exports.register = async (req, res) => {
  const { email, password, full_name, phone } = req.body;

  try {
    // Kiểm tra email đã tồn tại chưa
    const userExist = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userExist.rows.length > 0) {
      return res.status(400).json({ message: 'Email này đã được sử dụng!' });
    }

    // Mã hóa mật khẩu
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Thêm User mới (mặc định role_id = 2 - CUSTOMER)
    const newUser = await db.query(
      `INSERT INTO users (email, password_hash, full_name, phone, role_id) 
       VALUES ($1, $2, $3, $4, 2) RETURNING id, email, full_name, role_id`,
      [email, passwordHash, full_name, phone]
    );

    const userId = newUser.rows[0].id;

    // Khởi tạo sở thích mặc định cho người dùng mới
    await db.query('INSERT INTO user_preferences (user_id) VALUES ($1)', [userId]);

    res.status(201).json({
      message: 'Đăng ký tài khoản thành công!',
      user: newUser.rows[0]
    });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server:', error: err.message });
  }
};

// Đăng nhập
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await db.query(
      `SELECT u.*, r.name as role_name 
       FROM users u 
       JOIN roles r ON u.role_id = r.id 
       WHERE u.email = $1`, 
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: 'Email hoặc mật khẩu không chính xác!' });
    }

    const user = result.rows[0];

    // Kiểm tra mật khẩu
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Email hoặc mật khẩu không chính xác!' });
    }

    // Tạo JWT Token
    const token = jwt.sign(
      { id: user.id, email: user.email, role_id: user.role_id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Đăng nhập thành công!',
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role_name
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server:', error: err.message });
  }
};