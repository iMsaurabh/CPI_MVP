require('dotenv').config();
const express = require('express');
const logger = require('./utils/logger');
const requestLogger = require('./middleware/requestLogger');
const errorHandler = require('./middleware/errorHandler');
const chatRoutes = require('./routes/chatRoutes');

const app = express();

// middleware registered in order — order matters
// 1. parse JSON bodies first so req.body is available to everything below
app.use(express.json());

// 2. log every request
app.use(requestLogger);

// health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        mock: process.env.USE_MOCK,
        aiProvider: process.env.AI_PROVIDER,
        aiModel: process.env.AI_MODEL
    });
});

// API routes
app.use('/api', chatRoutes);

// 3. error handler — MUST be last
// Express identifies error handlers by four parameters
// removing any parameter breaks error handling silently
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
    logger.info(`Mock mode: ${process.env.USE_MOCK}`);
    logger.info(`AI Provider: ${process.env.AI_PROVIDER}`);
});