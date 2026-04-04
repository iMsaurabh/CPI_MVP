// chatRoutes exposes the agent pipeline via HTTP endpoints.
// It is the boundary between the HTTP world and the agent world.
//
// Responsibilities:
// - Receive and validate incoming HTTP requests
// - Extract provider selection and user message from request body
// - Instantiate correct provider via providerFactory
// - Delegate to orchestratorAgent
// - Return structured HTTP response
//
// Routes never contain business logic.
// They only handle HTTP concerns and delegate everything else.

const express = require('express');
const router = express.Router();
const { getProvider, getSupportedProviders } = require('../providers/providerFactory');
const orchestrator = require('../agents/orchestratorAgent');

// POST /api/chat
// Main endpoint — sends user message through agent pipeline
//
// Request body:
// {
//   "message": "What is the status of MSG12345?",  // required
//   "provider": "groq",                             // optional, defaults to env var
//   "apiKey": null                                  // optional, for user provided keys
// }
//
// Response:
// {
//   "success": true,
//   "response": "Message MSG12345 is currently...",
//   "agent": "monitoringAgent",
//   "delegatedTo": ["monitoringAgent"]
// }

router.post('/chat', async (req, res) => {
    const { message, provider, apiKey } = req.body;

    // validate required fields
    if (!message || typeof message !== 'string' || message.trim() === '') {
        return res.status(400).json({
            success: false,
            error: 'message is required and must be a non-empty string'
        });
    }

    // instantiate provider from request
    // if provider not specified, falls back to AI_PROVIDER env var
    const providerInstance = getProvider(provider, {
        apiKey: apiKey || undefined
    });

    // delegate to orchestrator
    const result = await orchestrator.run(providerInstance, message.trim());

    return res.status(200).json({
        success: true,
        ...result
    });
});

// GET /api/providers
// Returns list of supported AI providers
// Used by frontend to populate provider selection dropdown

router.get('/providers', (req, res) => {
    return res.status(200).json({
        success: true,
        providers: getSupportedProviders()
    });
});

module.exports = router;