const jwt = require('jsonwebtoken');

const auth = (requiredRoles = []) => (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Authentication token missing' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    if (requiredRoles.length && !requiredRoles.includes(decoded.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

module.exports = auth;
