require('dotenv').config();

const express = require('express');

const app = express();

app.use(express.json());

const logger = require('./utils/logger')

app.get('/health', (req, res) => {
    const response = {
        status: 'ok',
        mock: process.env.USE_MOCK,
        aiProvider: process.env.AI_PROVIDER,
        aiModel: process.env.AI_MODEL
    };

    // sends response to HTTP client (Postman/browser)
    res.json(response);

    // logs same response to console in pretty format
    logger.info(response, 'Health check hit');
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    logger.info(`Server is running on port:${PORT}`);
    logger.info(`Mock mode: ${process.env.USE_MOCK}`);
    logger.info(`AI provider: ${process.env.AI_PROVIDER}`);
    logger.info(`AI model: ${process.env.AI_MODEL}`);
})