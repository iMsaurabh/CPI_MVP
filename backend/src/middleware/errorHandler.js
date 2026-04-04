// errorHandler is the global error catching middleware.
// It catches any error thrown or passed to next(err) anywhere
// in the application and returns a consistent error response.
//
// MUST be registered last in server.js after all routes.
// Express identifies error handlers by their four parameters (err, req, res, next).
// All four parameters are required even if next is not used.

const logger = require('../utils/logger');

function errorHandler(err, req, res, next) {
    // log full error details server side
    logger.error({
        method: req.method,
        url: req.url,
        error: err.message,
        stack: err.stack
    }, 'Unhandled error');

    // determine status code
    // use error's status if set, otherwise default to 500
    const statusCode = err.status || err.statusCode || 500;

    // return consistent error response to client
    // never expose stack trace to client in production
    return res.status(statusCode).json({
        success: false,
        error: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
}

module.exports = errorHandler;