const appError = require('./../utils/appError');

const sendErrorDev = (err, req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  }
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: err.message,
  });
};

const sendErrorProd = (err, req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    }
    return res.status(500).json({
      status: 'error',
      message: 'Something went very wrong!',
    });
  }
  if (err.isOperational) {
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      msg: err.message,
    });
  }
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: 'Please try again later.',
  });
};

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new appError(message, 400);
};

const handleJWTError = () =>
  new appError('Invalid token. Please log in again!', 401);

const handleJWTExpiredError = () =>
  new appError('Your token has expired! Please log in again.', 401);
const handleValidationError = (err) => {
  const error = Object.values(err.errors).map((el) => el.message);
  console.log(error);
  const message = `Invalid input data. ${error.join('. ')}`;
  return new appError(message, 400);
};

const handleDuplicationFields = (err) => {
  if (err.errorResponse.errmsg) {
    const value = err.errorResponse.errmsg.match(/(["'])(\\?.)*?\1/)[0];
    const message = `Duplicate field value: ${value}. Please use another value!`;
    return new appError(message, 400);
  } else {
    const message = 'Duplicate field value. Please use another value!';
    return new appError(message, 400);
  }
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    error.message = err.message;

    if (error.code === 11000) error = handleDuplicationFields(error);
    if (
      error.name === 'ValidationError' ||
      error._message === 'User validation failed'
    )
      error = handleValidationError(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();
    if (error.name === 'CastError') error = handleCastErrorDB(error);
    sendErrorProd(error, req, res);
  }
};
