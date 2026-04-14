// toolLoader reads toolsConfig.json and converts each tool entry
// into an MCP compatible tool definition.
//
// It also builds the JSON Schema for each tool's input parameters
// so the MCP SDK can validate inputs before execution.
//
// This is called data driven tool registration — tool behaviour
// is defined by configuration data, not code.

const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.resolve(__dirname, '../config/toolsConfig.json');

// loadTools reads and parses toolsConfig.json
// returns array of tool configs
function loadTools() {
    const raw = fs.readFileSync(CONFIG_PATH, 'utf8');
    const config = JSON.parse(raw);
    return config.tools;
}

// buildInputSchema converts our parameter definitions into
// JSON Schema format required by the MCP SDK
// MCP uses JSON Schema to validate tool inputs before execution
function buildInputSchema(parameters) {
    const properties = {};
    const required = [];

    for (const param of parameters) {
        properties[param.name] = {
            type: param.type,
            description: param.description
        };

        if (param.required) {
            required.push(param.name);
        }
    }

    return {
        type: 'object',
        properties,
        required
    };
}

// getMcpToolDefinitions converts tool configs to MCP tool definitions
// These are what the MCP SDK registers and sends to the LLM client
function getMcpToolDefinitions() {
    const tools = loadTools();

    return tools.map(tool => ({
        name: tool.name,
        description: tool.description,
        inputSchema: buildInputSchema(tool.parameters)
    }));
}

// getToolConfig returns full config for a specific tool by name
// Used by the execution engine to know how to call CPI
function getToolConfig(toolName) {
    const tools = loadTools();
    return tools.find(t => t.name === toolName) || null;
}

// getAllToolConfigs returns all tool configs
// Used by admin API to list available tools
function getAllToolConfigs() {
    return loadTools();
}

// addTool adds a new tool to toolsConfig.json
// Called by admin API when user adds a tool via UI
function addTool(toolConfig) {
    const raw = fs.readFileSync(CONFIG_PATH, 'utf8');
    const config = JSON.parse(raw);

    // check for duplicate name
    const exists = config.tools.find(t => t.name === toolConfig.name);
    if (exists) {
        throw new Error(`Tool with name "${toolConfig.name}" already exists`);
    }

    config.tools.push(toolConfig);
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf8');

    return toolConfig;
}

// removeTool removes a tool from toolsConfig.json by name
// Called by admin API when user removes a tool via UI
function removeTool(toolName) {
    const raw = fs.readFileSync(CONFIG_PATH, 'utf8');
    const config = JSON.parse(raw);

    const index = config.tools.findIndex(t => t.name === toolName);
    if (index === -1) {
        throw new Error(`Tool "${toolName}" not found`);
    }

    config.tools.splice(index, 1);
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf8');
}

module.exports = {
    loadTools,
    getMcpToolDefinitions,
    getToolConfig,
    getAllToolConfigs,
    addTool,
    removeTool
};