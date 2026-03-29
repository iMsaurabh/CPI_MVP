// This is the real implementation of the CPI service layer.
// It makes authenticated HTTP calls to the SAP CPI OData APIs
// using OAuth 2.0 Client Credentials flow.
// This file is activated by setting USE_MOCK=false in .env

const axios = require('axios');

// tokenCache stores the OAuth access token in memory.
// Avoids fetching a new token on every single API call.
// Token is refreshed automatically when it expires.
let tokenCache = {
    accessToken: null,
    expiresAt: null
};

// Fetches a fresh OAuth access token from the CPI token endpoint.
// Uses Client Credentials grant type — no user login required.
// Token is cached in memory until it expires.
async function getAccessToken() {
    const now = Date.now();

    // return cached token if still valid
    if (tokenCache.accessToken && tokenCache.expiresAt > now) {
        return tokenCache.accessToken;
    }

    // fetch new token
    const response = await axios.post(
        process.env.CPI_TOKEN_URL,
        new URLSearchParams({ grant_type: 'client_credentials' }),
        {
            auth: {
                username: process.env.CPI_CLIENT_ID,
                password: process.env.CPI_CLIENT_SECRET
            },
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        }
    );

    // cache token with expiry (subtract 60s buffer)
    tokenCache = {
        accessToken: response.data.access_token,
        expiresAt: now + (response.data.expires_in - 60) * 1000
    };

    return tokenCache.accessToken;
}

const cpiRealService = {

    async getMessageStatus(messageId) {
        // TODO: implement when CPI API is live
        throw new Error('Real service not yet implemented');
    },

    async getMessageLog(messageId) {
        // TODO: implement when CPI API is live
        throw new Error('Real service not yet implemented');
    },

    async deployArtifact(artifactId) {
        // TODO: implement when CPI API is live
        throw new Error('Real service not yet implemented');
    },

    async undeployArtifact(artifactId) {
        // TODO: implement when CPI API is live
        throw new Error('Real service not yet implemented');
    }

};

module.exports = cpiRealService;