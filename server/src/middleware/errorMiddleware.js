export const notFound = (req, res, next) => {
    const error = new Error(`Resource Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error);
  };
  
  export const errorHandler = (err, req, res, next) => {
    let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    let message = err.message;
  
    // Handle Mongoose duplicate key errors
    if (err.code === 11000) {
      statusCode = 400;
      message = 'Duplicate field value entered. Please choose another value.';
    }
  
    // Handle Mongoose CastError (invalid ObjectId)
    if (err.name === 'CastError') {
      statusCode = 404;
      message = `Resource not found with id: ${err.value}`;
    }
  
    // Handle Mongoose ValidationError
    if (err.name === 'ValidationError') {
      statusCode = 400;
      message = Object.values(err.errors).map((val) => val.message).join(', ');
    }
  
    res.status(statusCode).json({
      success: false,
      message,
      stack: process.env.NODE_ENV === 'production' ? null : err.stack
    });
  };