// cpiRealService implements all CPI operations against the real
// SAP Cloud Platform Integration OData APIs.
//
// Authentication: OAuth 2.0 Client Credentials flow
// Write operations: require CSRF token fetched before each call
// Base path: /api/v1/ for all endpoints

const axios = require('axios');

// base API path for all CPI OData endpoints
const API_BASE = '/api/v1';

// tokenCache stores OAuth access token in memory
// avoids fetching new token on every API call
let tokenCache = {
    accessToken: null,
    expiresAt: null
};

// getAccessToken fetches OAuth token using Client Credentials flow
// returns cached token if still valid
async function getAccessToken() {
    const now = Date.now();

    if (tokenCache.accessToken && tokenCache.expiresAt > now) {
        return tokenCache.accessToken;
    }

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

    // cache token with 60 second buffer before actual expiry
    tokenCache = {
        accessToken: response.data.access_token,
        expiresAt: now + (response.data.expires_in - 60) * 1000
    };

    return tokenCache.accessToken;
}

// getApiClient returns an axios instance configured for CPI API calls
// maintains cookies across requests for CSRF session handling
function getApiClient(accessToken) {
    return axios.create({
        baseURL: process.env.CPI_BASE_URL,
        headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/json',
            'Content-Type': 'application/json'
        },
        // withCredentials ensures cookies are maintained across requests
        // required for CSRF token session binding
        withCredentials: true
    });
}

// getCsrfToken fetches a CSRF token required for write operations
// CPI requires X-CSRF-Token: Fetch header to get a valid token
// returned token must be included in subsequent write requests
async function getCsrfToken(client) {
    const response = await client.get(`${API_BASE}/`, {
        headers: { 'X-CSRF-Token': 'Fetch' }
    });
    return response.headers['x-csrf-token'];
}

// parseCpiDate converts CPI OData date format to ISO string
// CPI returns dates as /Date(1521463557739)/ — Unix ms timestamp
function parseCpiDate(cpiDate) {
    if (!cpiDate) return null;
    const match = cpiDate.match(/\/Date\((\d+)\)\//);
    if (!match) return cpiDate;
    return new Date(parseInt(match[1])).toISOString();
}

const cpiRealService = {

    // getMessageStatus retrieves processing status of a CPI message
    // Endpoint: GET /api/v1/MessageProcessingLogs('{MessageGuid}')
    async getMessageStatus(messageId) {
        const accessToken = await getAccessToken();
        const client = getApiClient(accessToken);

        const response = await client.get(
            `${API_BASE}/MessageProcessingLogs('${messageId}')`
        );

        const log = response.data.d;

        // normalize response to match our mock service shape
        return {
            messageId: log.MessageGuid,
            status: log.Status,
            processingStart: parseCpiDate(log.LogStart),
            processingEnd: parseCpiDate(log.LogEnd),
            sender: log.Sender,
            receiver: log.Receiver,
            integrationFlowName: log.IntegrationFlowName,
            correlationId: log.CorrelationId,
            logLevel: log.LogLevel,
            customStatus: log.CustomStatus
        };
    },

    // getMessageLog retrieves detailed processing log for a CPI message
    // Endpoint: GET /api/v1/MessageProcessingLogs('{MessageGuid}')
    // with $expand=AdapterAttributes for full detail
    async getMessageLog(messageId) {
        const accessToken = await getAccessToken();
        const client = getApiClient(accessToken);

        const response = await client.get(
            `${API_BASE}/MessageProcessingLogs('${messageId}')`,
            {
                params: {
                    $expand: 'AdapterAttributes'
                }
            }
        );

        const log = response.data.d;

        return {
            messageId: log.MessageGuid,
            status: log.Status,
            logStart: parseCpiDate(log.LogStart),
            logEnd: parseCpiDate(log.LogEnd),
            integrationFlowName: log.IntegrationFlowName,
            correlationId: log.CorrelationId,
            logLevel: log.LogLevel,
            customStatus: log.CustomStatus,
            sender: log.Sender,
            receiver: log.Receiver,
            adapterAttributes: log.AdapterAttributes?.results || []
        };
    },

    // deployArtifact deploys an integration artifact (iFlow) on CPI
    // Endpoint: POST /api/v1/DeployIntegrationDesigntimeArtifact
    // Requires CSRF token — fetched before the deploy call
    async deployArtifact(artifactId, version = 'active') {
        const accessToken = await getAccessToken();
        const client = getApiClient(accessToken);

        // step 1 — fetch CSRF token required for write operation
        const csrfToken = await getCsrfToken(client);

        // step 2 — deploy the artifact
        // Id and Version must be enclosed in single quotes as per YAML spec
        await client.post(
            `${API_BASE}/DeployIntegrationDesigntimeArtifact`,
            null, // no request body required
            {
                params: {
                    Id: `'${artifactId}'`,
                    Version: `'${version}'`
                },
                headers: { 'X-CSRF-Token': csrfToken }
            }
        );

        return {
            artifactId,
            status: 'DEPLOYED',
            deployedAt: new Date().toISOString(),
            message: `Artifact ${artifactId} deployment triggered successfully`
        };
    },

    // undeployArtifact stops a running integration artifact on CPI
    // Endpoint: DELETE /api/v1/IntegrationRuntimeArtifacts('{Id}')
    // Requires CSRF token — fetched before the undeploy call
    async undeployArtifact(artifactId) {
        const accessToken = await getAccessToken();
        const client = getApiClient(accessToken);

        // step 1 — fetch CSRF token required for write operation
        const csrfToken = await getCsrfToken(client);

        // step 2 — undeploy the artifact
        await client.delete(
            `${API_BASE}/IntegrationRuntimeArtifacts('${artifactId}')`,
            {
                headers: { 'X-CSRF-Token': csrfToken }
            }
        );

        return {
            artifactId,
            status: 'UNDEPLOYED',
            undeployedAt: new Date().toISOString(),
            message: `Artifact ${artifactId} undeployed successfully`
        };
    },

    // temporary — list deployed artifacts to find safe test ID
    async listArtifacts() {
        const accessToken = await getAccessToken();
        const client = getApiClient(accessToken);
        const response = await client.get(`${API_BASE}/IntegrationRuntimeArtifacts`);
        return response.data.d.results.map(a => ({
            Id: a.Id,
            Name: a.Name,
            Status: a.Status,
            Version: a.Version
        }));
    }

};

module.exports = cpiRealService;