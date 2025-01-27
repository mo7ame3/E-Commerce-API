const express = require('express');
const morgan = require('morgan');
const app = express();

const globalErrorHandler = require('./controllers/errorController');

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

app.use(express.json());

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

//! routes

app.all('*', (req, res, next) => {
  next(new appError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);
module.exports = app;
