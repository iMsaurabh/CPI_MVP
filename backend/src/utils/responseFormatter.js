// responseFormatter enforces consistent response envelope
// across all API endpoints.
//
// Every successful response follows this shape:
// { success: true, data: {...} }
//
// Every error response follows this shape:
// { success: false, error: '...' }
//
// This is called the Response Envelope Pattern.
// Frontend always knows exactly what shape to expect.

const responseFormatter = {

    // success wraps data in standard success envelope
    success(res, data, statusCode = 200) {
        return res.status(statusCode).json({
            success: true,
            ...data
        });
    },

    // error wraps error message in standard error envelope
    error(res, message, statusCode = 500) {
        return res.status(statusCode).json({
            success: false,
            error: message
        });
    },

    // notFound returns standard 404 response
    notFound(res, message = 'Resource not found') {
        return res.status(404).json({
            success: false,
            error: message
        });
    }

};

module.exports = responseFormatter;