// jobExecutor runs a single job attempt by calling the appropriate
// tool on the CPI MCP server via HTTP.
//
// It does NOT handle retries — that is the scheduler's responsibility.
// It handles:
//   - calling the correct CPI tool with job parameters
//   - enforcing timeout per attempt
//   - returning structured result or error
//
// Why call CPI MCP server via HTTP instead of direct MCP protocol:
// The scheduler MCP server and CPI MCP server are separate processes.
// HTTP admin endpoints are the simplest inter-process communication
// for this use case. MCP protocol is for agent-to-server communication,
// not server-to-server.

const axios = require('axios');

const CPI_MCP_BASE = (process.env.CPI_MCP_URL || 'http://localhost:3001');

// executeTool calls the CPI MCP server's tool execution
// via its internal execution engine
// toolName: name of tool to execute
// parameters: tool parameters
// timeoutMs: maximum execution time in milliseconds
async function executeTool(toolName, parameters, timeoutMs = 30000) {
    const startedAt = new Date().toISOString();
    const start = Date.now();

    try {
        // call CPI MCP server's direct tool execution endpoint
        // we add this endpoint to CPI MCP server in next step
        const response = await axios.post(
            `${CPI_MCP_BASE}/admin/execute`,
            { toolName, parameters },
            { timeout: timeoutMs }
        );

        const duration = Date.now() - start;

        return {
            success: true,
            result: response.data.result,
            error: null,
            startedAt,
            completedAt: new Date().toISOString(),
            duration
        };

    } catch (err) {
        const duration = Date.now() - start;
        const isTimeout = err.code === 'ECONNABORTED' || duration >= timeoutMs;

        return {
            success: false,
            result: null,
            error: isTimeout
                ? `Execution timed out after ${timeoutMs / 1000} seconds`
                : err.response?.data?.error || err.message,
            startedAt,
            completedAt: new Date().toISOString(),
            duration
        };
    }
}

module.exports = { executeTool };