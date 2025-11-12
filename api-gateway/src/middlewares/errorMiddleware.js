const errorHandler = (err, req, res, next) => {
  // Ambil statusCode dari error atau set default 500
  const statusCode = err.statusCode || res.statusCode || 500;
  
  res.status(statusCode);

  res.json({
    message: err.message,
    // Tampilkan stack trace hanya di mode development
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

module.exports = {
  errorHandler,
};