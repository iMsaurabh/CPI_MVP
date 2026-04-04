require('dotenv').config();
const express = require('express');
const chatRoutes = require('./routes/chatRoutes');

const app = express();

app.use(express.json());

// health check
app.get('/health', (req, res) => {
    const response = {
        status: 'ok',
        mock: process.env.USE_MOCK,
        aiProvider: process.env.AI_PROVIDER,
        aiModel: process.env.AI_MODEL
    };
    res.json(response);
});

// mount chat routes under /api prefix
// all routes in chatRoutes.js are prefixed with /api
// POST /chat becomes POST /api/chat
// GET /providers becomes GET /api/providers
app.use('/api', chatRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Mock mode: ${process.env.USE_MOCK}`);
    console.log(`AI Provider: ${process.env.AI_PROVIDER}`);
});