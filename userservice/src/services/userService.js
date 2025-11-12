const grpc = require('@grpc/grpc-js');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

// Fungsi helper untuk generate JWT
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d',
  });
};

// Implementasi Logika Service gRPC
const userService = {
  /**
   * Register: Membuat user baru
   */
  Register: async (call, callback) => {
    const { name, email, password } = call.request;

    try {
      // Cek apakah email sudah ada
      const userExists = await User.findOne({ where: { email } });
      if (userExists) {
        return callback({
          code: grpc.status.ALREADY_EXISTS,
          message: 'Email already exists',
        });
      }

      // Buat user (password akan di-hash oleh hook)
      const user = await User.create({
        name,
        email,
        password,
        role: 'user', // Default role
      });

      // Kembalikan data user (tanpa password)
      callback(null, {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          created_at: user.createdAt.toISOString(),
        },
      });
    } catch (error) {
      console.error(error);
      callback({
        code: grpc.status.INTERNAL,
        message: error.message,
      });
    }
  },

  /**
   * Login: Otentikasi user dan kembalikan token
   */
  Login: async (call, callback) => {
    const { email, password } = call.request;

    try {
      const user = await User.findOne({ where: { email } });

      if (!user) {
        return callback({
          code: grpc.status.NOT_FOUND,
          message: 'Invalid credentials',
        });
      }

      // Cek password
      const isMatch = await user.matchPassword(password);
      if (!isMatch) {
        return callback({
          code: grpc.status.UNAUTHENTICATED,
          message: 'Invalid credentials',
        });
      }

      // Generate token
      const token = generateToken(user.id, user.role);

      callback(null, {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        token: token,
      });
    } catch (error) {
      console.error(error);
      callback({
        code: grpc.status.INTERNAL,
        message: error.message,
      });
    }
  },

  /**
   * GetUser: Mengambil data user berdasarkan ID
   */
  GetUser: async (call, callback) => {
    const { id } = call.request;
    try {
      const user = await User.findByPk(id, {
        attributes: { exclude: ['password'] }, // Jangan kembalikan password
      });

      if (!user) {
        return callback({
          code: grpc.status.NOT_FOUND,
          message: 'User not found',
        });
      }

      callback(null, {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          created_at: user.createdAt.toISOString(),
        },
      });
    } catch (error) {
      console.error(error);
      callback({
        code: grpc.status.INTERNAL,
        message: error.message,
      });
    }
  },
  
  /**
   * CreateAdmin: Membuat user baru dengan role admin
   * (Hanya boleh dipanggil oleh admin lain via gRPC, misal dari adminController di gateway)
   */
  CreateAdmin: async (call, callback) => {
     // Implementasi mirip Register, tapi set role: 'admin'
     // ...
  },

  /**
   * ListUsers: Mengambil daftar semua user
   * (Untuk admin)
   */
  ListUsers: async (call, callback) => {
    try {
      const users = await User.findAll({
        attributes: { exclude: ['password'] },
        order: [['createdAt', 'DESC']],
      });

      const userList = users.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        created_at: user.createdAt.toISOString(),
      }));

      callback(null, { users: userList });
    } catch (error)
 {
      console.error(error);
      callback({
        code: grpc.status.INTERNAL,
        message: error.message,
      });
    }
  },
};

module.exports = userService;