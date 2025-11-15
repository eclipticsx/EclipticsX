module.exports = function errorHandler(err, req, res, next) {
  console.error(err);

  if (res.headersSent) {
    return next(err);
  }

  res.status(err.statusCode || 500).json({
    error: true,
    message: err.message || 'Internal server error'
  });
};
