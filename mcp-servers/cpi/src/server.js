// server.js is the entry point for the CPI MCP Server.
// It does three things:
// 1. Initializes the MCP server with the official SDK
// 2. Registers tools dynamically from toolsConfig.json
// 3. Starts an HTTP server with SSE transport for client connections
//
// SSE Transport: Server Sent Events — persistent HTTP connection
// that allows the MCP server to push messages to connected clients.
//
// The MCP server runs independently on port 3001.
// The backend agent connects to it as an MCP client.

require('dotenv').config();

const { z } = require('zod');

const express = require('express');
const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { SSEServerTransport } = require('@modelcontextprotocol/sdk/server/sse.js');
const { getMcpToolDefinitions, getToolConfig } = require('./tools/toolLoader');
const { executeTool } = require('./services/toolExecutor');

const app = express();
app.use(express.json());

// initialize MCP server instance
// name and version identify this server to connected clients
const mcpServer = new McpServer({
    name: 'cpi-mcp-server',
    version: '1.0.0'
});

// buildZodSchema converts our parameter definitions into a Zod schema
// MCP SDK requires Zod schemas for tool input validation
// This bridges our config-driven approach with the SDK requirement
function buildZodSchema(properties, required) {
    const shape = {};

    for (const [name, prop] of Object.entries(properties)) {
        let zodType;

        // map JSON Schema types to Zod types
        switch (prop.type) {
            case 'string':
                zodType = z.string().describe(prop.description || '');
                break;
            case 'number':
                zodType = z.number().describe(prop.description || '');
                break;
            case 'boolean':
                zodType = z.boolean().describe(prop.description || '');
                break;
            case 'array':
                zodType = z.array(z.any()).describe(prop.description || '');
                break;
            default:
                zodType = z.any().describe(prop.description || '');
        }

        // make optional if not in required array
        if (!required.includes(name)) {
            zodType = zodType.optional();
        }

        shape[name] = zodType;
    }

    return shape;
}

// register all tools from toolsConfig.json with MCP server
// getMcpToolDefinitions() reads config and builds MCP tool definitions
// this runs at startup — tools are registered before any client connects
function registerTools() {
    const toolDefinitions = getMcpToolDefinitions();

    console.log(`[MCP Server] Registering ${toolDefinitions.length} tools`);

    for (const tool of toolDefinitions) {
        // build Zod schema from tool parameter definitions
        const zodSchema = buildZodSchema(tool.inputSchema.properties, tool.inputSchema.required || []);

        mcpServer.tool(
            tool.name,
            tool.description,
            zodSchema,
            async (params) => {
                console.log(`[MCP Server] Tool called: ${tool.name}`, params);
                const toolConfig = getToolConfig(tool.name);
                const result = await executeTool(toolConfig, params);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(result)
                        }
                    ]
                };
            }
        );

        console.log(`[MCP Server] Registered tool: ${tool.name}`);
    }
}

// SSE transport map — tracks active client connections
// key: session ID, value: SSEServerTransport instance
const transports = {};

// SSE endpoint — clients connect here to establish MCP session
// Each connection gets its own transport instance and session ID
app.get('/mcp', async (req, res) => {
    console.log('[MCP Server] New client connection');

    const transport = new SSEServerTransport('/messages', res);
    transports[transport.sessionId] = transport;

    // clean up transport when client disconnects
    res.on('close', () => {
        console.log(`[MCP Server] Client disconnected: ${transport.sessionId}`);
        delete transports[transport.sessionId];
    });

    await mcpServer.connect(transport);
});

// messages endpoint — clients send requests here
// SSE transport routes messages to correct session
app.post('/messages', async (req, res) => {
    const sessionId = req.query.sessionId;
    const transport = transports[sessionId];

    if (!transport) {
        return res.status(404).json({ error: 'Session not found' });
    }

    await transport.handlePostMessage(req, res, req.body);
});

// health check endpoint
app.get('/health', (req, res) => {
    const toolDefinitions = getMcpToolDefinitions();
    res.json({
        status: 'ok',
        server: 'cpi-mcp-server',
        tools: toolDefinitions.length,
        mock: process.env.USE_MOCK
    });
});

// admin endpoint — list all tools (used by frontend admin panel)
app.get('/admin/tools', (req, res) => {
    const { getAllToolConfigs } = require('./tools/toolLoader');
    res.json({ tools: getAllToolConfigs() });
});

// admin endpoint — add new tool
app.post('/admin/tools', (req, res) => {
    const { addTool } = require('./tools/toolLoader');
    try {
        const tool = addTool(req.body);
        res.status(201).json({ success: true, tool });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
});

// admin endpoint — remove tool by name
app.delete('/admin/tools/:name', (req, res) => {
    const { removeTool } = require('./tools/toolLoader');
    try {
        removeTool(req.params.name);
        res.json({ success: true });
    } catch (err) {
        res.status(404).json({ success: false, error: err.message });
    }
});

// register tools then start server
registerTools();

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`[MCP Server] CPI MCP Server running on port ${PORT}`);
    console.log(`[MCP Server] Mock mode: ${process.env.USE_MOCK}`);
    console.log(`[MCP Server] SSE endpoint: http://localhost:${PORT}/mcp`);
});