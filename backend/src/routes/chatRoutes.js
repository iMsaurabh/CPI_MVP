const express = require('express');
const router = express.Router();
const { getProvider, getSupportedProviders } = require('../providers/providerFactory');
const orchestrator = require('../agents/orchestratorAgent');
const responseFormatter = require('../utils/responseFormatter');

router.post('/chat', async (req, res, next) => {
    const { message, provider, apiKey } = req.body;

    // validate required fields
    if (!message || typeof message !== 'string' || message.trim() === '') {
        return responseFormatter.error(res, 'message is required and must be a non-empty string', 400);
    }

    // wrap in try/catch and pass errors to global error handler via next(err)
    try {
        const providerInstance = getProvider(provider, {
            apiKey: apiKey || undefined
        });

        const result = await orchestrator.run(providerInstance, message.trim());
        return responseFormatter.success(res, result);

    } catch (err) {
        // passing err to next() triggers the global errorHandler middleware
        next(err);
    }
});

router.get('/providers', (req, res) => {
    return responseFormatter.success(res, {
        providers: getSupportedProviders()
    });
});

module.exports = router;