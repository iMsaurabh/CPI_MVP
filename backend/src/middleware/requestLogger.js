// requestLogger automatically logs every incoming HTTP request.
// Runs before route handlers so every request is captured
// regardless of whether it succeeds or fails.
//
// Logs: HTTP method, URL, status code, response time
// Uses pino logger from utils for consistent log format.

const logger = require('../utils/logger');

function requestLogger(req, res, next) {
    const start = Date.now();

    // intercept res.json to capture status code after response is sent
    const originalJson = res.json.bind(res);
    res.json = function (body) {
        const duration = Date.now() - start;

        logger.info({
            method: req.method,
            url: req.url,
            status: res.statusCode,
            duration: `${duration}ms`,
            provider: req.body?.provider || 'none'
        }, 'HTTP Request');

        return originalJson(body);
    };

    // next() passes control to the next middleware or route handler
    next();
}

module.exports = requestLogger;