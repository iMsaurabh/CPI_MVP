// Scheduler MCP Server
// Exposes job scheduling tools via MCP protocol.
// Also provides SSE endpoint for real time job notifications.
// Runs independently on port 3002.

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { SSEServerTransport } = require('@modelcontextprotocol/sdk/server/sse.js');
const { z } = require('zod');
const schedulerTools = require('./tools/schedulerTools');
const schedulerToolExecutor = require('./services/schedulerToolExecutor');
const jobScheduler = require('./services/jobScheduler');
const sseManager = require('./utils/sseManager');
const jobStore = require('./services/jobStore');

const app = express();
app.use(express.json());
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:80', 'http://localhost'],
    methods: ['GET', 'POST', 'DELETE', 'PUT'],
    allowedHeaders: ['Content-Type']
}));

// initialize MCP server
const mcpServer = new McpServer({
    name: 'scheduler-mcp-server',
    version: '1.0.0'
});

// build Zod schema from JSON Schema properties
function buildZodSchema(properties, required = []) {
    const shape = {};

    if (!properties || Object.keys(properties).length === 0) {
        return shape;
    }

    for (const [name, prop] of Object.entries(properties)) {
        let zodType;

        switch (prop.type) {
            case 'string':
                zodType = z.string().describe(prop.description || '');
                break;
            case 'number':
                // z.coerce.number() converts string "2" to number 2 automatically
                // LLMs frequently return numbers as strings
                zodType = z.coerce.number().describe(prop.description || '');
                break;
            case 'boolean':
                // z.coerce.boolean() converts string "false" to boolean false
                zodType = z.coerce.boolean().describe(prop.description || '');
                break;
            case 'array':
                zodType = z.array(z.string()).describe(prop.description || '');
                break;
            case 'object':
                zodType = z.string().optional().describe(
                    `${prop.description || ''} (pass as JSON string)`
                );
                break;
            default:
                zodType = z.string().describe(prop.description || '');
        }

        if (!required.includes(name)) {
            zodType = zodType.optional();
        }

        shape[name] = zodType;
    }

    return shape;
}

// register all scheduler tools with MCP server
function registerTools() {
    console.log(`[Scheduler MCP] Registering ${schedulerTools.length} tools`);

    for (const tool of schedulerTools) {
        const zodSchema = buildZodSchema(
            tool.parameters.properties,
            tool.parameters.required || []
        );

        mcpServer.tool(
            tool.name,
            tool.description,
            zodSchema,
            async (params) => {
                console.log(`[Scheduler MCP] Tool called: ${tool.name}`, params);

                const executor = schedulerToolExecutor[tool.name];
                if (!executor) {
                    throw new Error(`No executor for tool: ${tool.name}`);
                }

                const result = await executor(params);
                return {
                    content: [{ type: 'text', text: JSON.stringify(result) }]
                };
            }
        );

        console.log(`[Scheduler MCP] Registered: ${tool.name}`);
    }
}

// MCP SSE transport for agent connections
const mcpTransports = {};

app.get('/mcp', async (req, res) => {
    const transport = new SSEServerTransport('/messages', res);
    mcpTransports[transport.sessionId] = transport;
    res.on('close', () => delete mcpTransports[transport.sessionId]);
    try {
        await mcpServer.connect(transport);
    } catch (err) {
        console.warn('[Scheduler MCP] Connection warning:', err.message);
    }
});

app.post('/messages', async (req, res) => {
    const sessionId = req.query.sessionId;
    const transport = mcpTransports[sessionId];
    if (!transport) return res.status(404).json({ error: 'Session not found' });
    await transport.handlePostMessage(req, res, req.body);
});

// SSE endpoint for frontend job notifications
// separate from MCP SSE — this is for real time job events
app.get('/events', (req, res) => {
    const clientId = `client_${Date.now()}`;
    sseManager.addClient(clientId, res);
    req.on('close', () => sseManager.removeClient(clientId));
});

// health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        server: 'scheduler-mcp-server',
        activeJobs: jobScheduler.getActiveJobCount(),
        connectedClients: sseManager.getClientCount()
    });
});

// admin — list all jobs (for UI jobs panel)
app.get('/admin/jobs', (req, res) => {
    res.json({ jobs: jobStore.getAllJobs() });
});

// admin — get execution history for a job
app.get('/admin/jobs/:jobId/history', (req, res) => {
    const executions = jobStore.getExecutionsByJobId(req.params.jobId);
    res.json({ executions });
});

// admin — get all recent executions
app.get('/admin/executions', (req, res) => {
    res.json({ executions: jobStore.getAllExecutions() });
});

// initialize and start
registerTools();
jobScheduler.initialize();

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
    console.log(`[Scheduler MCP] Server running on port ${PORT}`);
    console.log(`[Scheduler MCP] MCP endpoint: http://localhost:${PORT}/mcp`);
    console.log(`[Scheduler MCP] SSE events: http://localhost:${PORT}/events`);
});