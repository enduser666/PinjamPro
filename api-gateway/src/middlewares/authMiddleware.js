const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
// Kita panggil gRPC client untuk verifikasi user jika perlu
const { userClient } = require('../config/grpcClients');

const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Set user di req object, HANYA dari data token
      // Ini cepat dan tidak perlu panggil gRPC setiap saat
      req.user = {
          id: decoded.id,
          role: decoded.role
      }; 
      
      // OPSIONAL: Jika Anda ingin data user terbaru dari DB di setiap request
      // (lebih aman tapi lebih lambat):
      // const { user } = await new Promise((resolve, reject) => ... )
      // req.user = user;

      next();
    } catch (error) {
      console.error(error);
      res.status(401);
      throw new Error('Not authorized, token failed');
    }
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token');
  }
});

// Middleware untuk cek role admin
const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403); // Forbidden
    throw new Error('Not authorized as an admin');
  }
};

module.exports = { protect, admin };