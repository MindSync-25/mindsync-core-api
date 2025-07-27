// middleware/auth.js
const jwt = require('jsonwebtoken');
// Note: For DynamoDB version, we'll verify JWT without database lookup
// In production, you might want to add user validation against DynamoDB

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // For DynamoDB version, we trust the JWT payload
    // In production, you might want to validate user exists in DynamoDB
    req.user = {
      id: decoded.userId,
      email: decoded.email || 'user@example.com'
    };
    
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// Optional authentication middleware - doesn't fail if no token
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      // No token provided, continue without user
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // For DynamoDB version, we trust the JWT payload
    req.user = {
      id: decoded.userId,
      email: decoded.email || 'user@example.com'
    };
    
    next();
  } catch (error) {
    // Invalid token, continue without user
    req.user = null;
    next();
  }
};

module.exports = { 
  authenticateToken,
  required: authenticateToken,
  optional: optionalAuth
};
