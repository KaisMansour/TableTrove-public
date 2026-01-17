// middleware/auth.js
const jwt = require("jsonwebtoken");
require("dotenv").config();

// Generic JWT validation
const auth = (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ message: "Access denied" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; 
    next();
  } catch (err) {
    res.status(400).json({ message: "Invalid token" });
  }
};

// Role-specific middleware
const requireRole = (role) => (req, res, next) => {
  if (req.user?.role !== role) {
    return res.status(403).json({ message: `Access denied: ${role}s only` });
  }
  next();
};

module.exports = { auth, requireRole };