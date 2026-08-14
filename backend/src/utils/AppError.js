// AppError.js — Custom operational error class.
// Use this instead of plain new Error() when you want the error middleware
// to send a structured JSON response (not a generic 500).
//
// Examples:
//   throw new AppError('User not found', 404);
//   throw new AppError('Invalid input', 400);
//   next(new AppError('Forbidden', 403));

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = String(statusCode).startsWith('4') ? 'fail' : 'error';
    // isOperational = true means this is a known, expected error.
    // The error middleware will expose its message to the client in production.
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;
