const asyncHandler = require('express-async-handler');
const { userClient } = require('../config/grpcClients');

// Helper untuk membungkus gRPC callback dalam Promise
const grpcCall = (client, method, params) => {
  return new Promise((resolve, reject) => {
    client[method](params, (error, response) => {
      if (error) {
        console.error('gRPC Error:', error.message);
        // Terjemahkan error gRPC ke error HTTP
        const status = error.code === grpc.status.NOT_FOUND ? 404 :
                       error.code === grpc.status.ALREADY_EXISTS ? 409 :
                       error.code === grpc.status.INVALID_ARGUMENT ? 400 :
                       error.code === grpc.status.UNAUTHENTICATED ? 401 : 500;
        
        const err = new Error(error.details || error.message);
        err.statusCode = status;
        return reject(err);
      }
      resolve(response);
    });
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error('Please fill all fields');
  }

  const response = await grpcCall(userClient, 'Register', {
    name,
    email,
    password,
  });

  // response berisi { user }
  res.status(201).json(response.user);
});

// @desc    Login a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error('Please provide email and password');
  }

  const response = await grpcCall(userClient, 'Login', { email, password });

  // response berisi { user, token }
  res.status(200).json({
    id: response.user.id,
    name: response.user.name,
    email: response.user.email,
    role: response.user.role,
    token: response.token,
  });
});

// @desc    Get current user data
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  // req.user di-set oleh middleware 'protect'
  const userId = req.user.id;

  const response = await grpcCall(userClient, 'GetUser', { id: userId });

  // response berisi { user }
  res.status(200).json(response.user);
});

module.exports = {
  registerUser,
  loginUser,
  getMe,
};