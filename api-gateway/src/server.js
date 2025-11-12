const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const { errorHandler } = require('./middlewares/errorMiddleware');
const allRoutes = require('./routes');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // Body parser for JSON
app.use(express.urlencoded({ extended: false }));

// Routes
app.use('/api', allRoutes);

// Error Handler Middleware (harus terakhir)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
});