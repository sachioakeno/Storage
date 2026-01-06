const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

module.exports = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];
  if (!token) return res.status(401).json({ message: "Akses ditolak, token hilang" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Berisi ID dan Email user
    next();
  } catch (err) {
    res.status(400).json({ message: "Token tidak valid" });
  }
};