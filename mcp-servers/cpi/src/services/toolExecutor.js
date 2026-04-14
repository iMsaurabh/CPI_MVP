// toolExecutor is the execution engine for all CPI tool calls.
// When the MCP server receives a tool call from the agent:
//   1. Checks USE_MOCK — returns mockResponse if true
//   2. Otherwise constructs CPI HTTP request from tool config
//   3. Handles OAuth token fetching and CSRF token for write operations
//   4. Returns normalized response
//
// This is fully data driven — no hardcoded service methods per tool.
// Adding a new tool to toolsConfig.json automatically gets
// full execution support without any code changes here.

const axios = require('axios');

// tokenCache stores OAuth access token in memory
let tokenCache = {
    accessToken: null,
    expiresAt: null
};

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

    tokenCache = {
        accessToken: response.data.access_token,
        expiresAt: now + (response.data.expires_in - 60) * 1000
    };

    return tokenCache.accessToken;
}

function getApiClient(accessToken) {
    return axios.create({
        baseURL: process.env.CPI_BASE_URL,
        headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/json',
            'Content-Type': 'application/json'
        },
        withCredentials: true
    });
}

async function getCsrfToken(client) {
    const response = await client.get('/api/v1/', {
        headers: { 'X-CSRF-Token': 'Fetch' }
    });
    return response.headers['x-csrf-token'];
}

// buildUrl replaces path parameters in endpoint template with actual values
// e.g. /api/v1/MessageProcessingLogs('{messageId}') + { messageId: 'ABC' }
//   → /api/v1/MessageProcessingLogs('ABC')
function buildUrl(endpoint, params, parameters) {
    let url = endpoint;

    for (const paramConfig of parameters) {
        if (paramConfig.location === 'path') {
            const value = params[paramConfig.name];
            if (value !== undefined) {
                url = url.replace(`{${paramConfig.name}}`, value);
                // handle single quoted path params for CPI OData format
                url = url.replace(`'{${paramConfig.name}}'`, `'${value}'`);
            }
        }
    }

    return url;
}

// buildQueryParams extracts query parameters from tool call params
function buildQueryParams(params, parameters, staticQueryParams) {
    const queryParams = { ...staticQueryParams };

    for (const paramConfig of parameters) {
        if (paramConfig.location === 'query') {
            const value = params[paramConfig.name] || paramConfig.default;
            if (value !== undefined) {
                // CPI OData query params require single quotes around values
                queryParams[paramConfig.name] === 'Id' || paramConfig.name === 'Version'
                    ? queryParams[paramConfig.name] = `'${value}'`
                    : queryParams[paramConfig.name] = value;
            }
        }
    }

    return queryParams;
}

// parseCpiDate converts CPI OData date format to ISO string
function parseCpiDate(cpiDate) {
    if (!cpiDate) return null;
    const match = String(cpiDate).match(/\/Date\((\d+)\)\//);
    if (!match) return cpiDate;
    return new Date(parseInt(match[1])).toISOString();
}

// normalizeResponse extracts relevant fields from CPI OData response
function normalizeResponse(data) {
    // OData wraps response in 'd' property
    if (data && data.d) {
        const d = data.d;
        // recursively parse date fields
        const result = {};
        for (const [key, value] of Object.entries(d)) {
            if (typeof value === 'string' && value.startsWith('/Date(')) {
                result[key] = parseCpiDate(value);
            } else if (typeof value === 'object' && value !== null && !value.__deferred) {
                result[key] = value;
            } else if (!value?.__deferred) {
                result[key] = value;
            }
        }
        return result;
    }
    return data;
}

// executeTool is the main entry point called by the MCP server
// toolConfig: full tool config from toolsConfig.json
// params: parameters passed by the LLM (e.g. { messageId: 'ABC' })
async function executeTool(toolConfig, params) {
    // mock mode — return mock response from config
    if (process.env.USE_MOCK === 'true') {
        console.log(`[Executor] Mock mode — returning mock response for ${toolConfig.name}`);

        // inject actual params into mock response where relevant
        const mock = { ...toolConfig.mockResponse };

        // replace placeholder IDs with actual params
        for (const param of toolConfig.parameters) {
            if (param.required && params[param.name]) {
                const key = Object.keys(mock).find(k =>
                    k.toLowerCase().includes(param.name.toLowerCase())
                );
                if (key) mock[key] = params[param.name];
            }
        }

        return mock;
    }

    // real mode — construct and execute CPI HTTP request
    console.log(`[Executor] Real mode — calling CPI for ${toolConfig.name}`);

    const accessToken = await getAccessToken();
    const client = getApiClient(accessToken);

    // build URL with path parameters substituted
    const url = buildUrl(toolConfig.endpoint, params, toolConfig.parameters);

    // build query parameters
    const queryParams = buildQueryParams(
        params,
        toolConfig.parameters,
        toolConfig.queryParams || {}
    );

    // fetch CSRF token for write operations
    let csrfToken = null;
    if (toolConfig.requiresCsrf) {
        csrfToken = await getCsrfToken(client);
    }

    // construct request config
    const requestConfig = {
        params: Object.keys(queryParams).length > 0 ? queryParams : undefined,
        headers: csrfToken ? { 'X-CSRF-Token': csrfToken } : {}
    };

    let response;

    switch (toolConfig.method.toUpperCase()) {
        case 'GET':
            response = await client.get(url, requestConfig);
            break;
        case 'POST':
            response = await client.post(url, null, requestConfig);
            break;
        case 'DELETE':
            response = await client.delete(url, requestConfig);
            break;
        case 'PUT':
            response = await client.put(url, req.body || null, requestConfig);
            break;
        default:
            throw new Error(`Unsupported HTTP method: ${toolConfig.method}`);
    }

    // normalize and return response
    return normalizeResponse(response.data) || {
        status: 'success',
        message: `${toolConfig.name} executed successfully`
    };
}

module.exports = { executeTool };