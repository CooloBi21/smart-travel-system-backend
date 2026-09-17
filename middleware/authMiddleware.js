const jwt = require('jsonwebtoken');

// Middleware xác thực JWT Token
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer <TOKEN>"

  if (!token) {
    return res.status(401).json({ message: 'Không tìm thấy token xác thực!' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Token không hợp lệ hoặc đã hết hạn!' });
  }
};

// Middleware kiểm tra quyền Admin
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role_id === 1) {
    next();
  } else {
    return res.status(403).json({ message: 'Quyền truy cập bị từ chối! Yêu cầu vai trò Admin.' });
  }
};

module.exports = { verifyToken, isAdmin };