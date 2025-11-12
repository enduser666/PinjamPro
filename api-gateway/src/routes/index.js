const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const itemRoutes = require('./itemRoutes');
const borrowingRoutes = require('./borrowingRoutes');
const adminRoutes = require('./adminRoutes');

router.use('/auth', authRoutes);
router.use('/items', itemRoutes); // (Belum diimplementasi)
router.use('/borrowings', borrowingRoutes); // (Belum diimplementasi)
router.use('/admin', adminRoutes); // (Belum diimplementasi)

module.exports = router;