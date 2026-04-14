// orchestratorAgent is the entry point for all user messages.
// It now uses the MCP client to discover tools dynamically
// and route tool calls to the correct MCP server.
//
// Key change from previous implementation:
//   Before: hardcoded tool registry + specialist agents
//   After: dynamic tool discovery via MCP client
//
// The orchestrator no longer knows about specific CPI operations.
// It only knows how to:
//   1. Get available tools from MCP client
//   2. Send tools + message to LLM
//   3. Execute tool calls via MCP client
//   4. Return synthesized response

const mcpClient = require('../mcp/mcpClient');
const { getAgentLogger } = require('../utils/agentLogger');

const logger = getAgentLogger('orchestratorAgent');

// maximum iterations of the ReAct loop before giving up
const MAX_ITERATIONS = 5;

async function run(provider, userMessage) {
    logger.info({ userMessage }, 'Orchestrator received message');

    // get all available tools from connected MCP servers
    const tools = mcpClient.getTools();
    logger.info({ toolCount: tools.length }, 'Tools loaded from MCP servers');

    // conversation history maintained across ReAct loop iterations
    const messages = [
        {
            role: 'system',
            content: `You are an intelligent assistant for SAP Cloud Platform Integration.
        You have access to tools that can retrieve message status, logs and manage deployments.
        Always use the available tools to answer questions about CPI operations.
        Never make up or guess CPI data — always call the appropriate tool first.
        If the user request is unclear, ask for clarification before calling tools.`
        },
        {
            role: 'user',
            content: userMessage
        }
    ];

    let iterations = 0;
    const toolsUsed = [];

    // ReAct loop — Reason + Act
    // continues until LLM stops calling tools or max iterations reached
    while (iterations < MAX_ITERATIONS) {
        iterations++;
        logger.debug({ iterations }, 'ReAct loop iteration');

        // send current conversation + tools to LLM
        const response = await provider.chat(messages, tools);

        // no tool calls — LLM has final answer
        if (response.toolCalls.length === 0) {
            logger.info({ iterations, toolsUsed }, 'Orchestrator completed');
            return {
                success: true,
                response: response.content,
                agent: 'orchestratorAgent',
                delegatedTo: [...new Set(toolsUsed)],
                iterations
            };
        }

        logger.info(
            { toolCalls: response.toolCalls.map(tc => tc.name) },
            'Tool calls requested by LLM'
        );

        // execute each tool call via MCP client
        const toolResults = [];

        for (const toolCall of response.toolCalls) {
            try {
                logger.debug({ toolName: toolCall.name, params: toolCall.parameters }, 'Executing tool');

                const result = await mcpClient.callTool(
                    toolCall.name,
                    toolCall.parameters
                );

                toolsUsed.push(toolCall.name);
                toolResults.push({ tool: toolCall.name, result });

                logger.info({ toolName: toolCall.name }, 'Tool executed successfully');

            } catch (err) {
                logger.error({ toolName: toolCall.name, error: err.message }, 'Tool execution failed');
                toolResults.push({ tool: toolCall.name, error: err.message });
            }
        }

        // add assistant message to conversation history
        // must use raw provider response format for Groq/OpenAI compatibility
        messages.push(response.raw.choices[0].message);

        // add tool results to conversation history
        response.raw.choices[0].message.tool_calls.forEach((tc, index) => {
            messages.push({
                role: 'tool',
                tool_call_id: tc.id,
                content: JSON.stringify(
                    toolResults[index]?.result || toolResults[index]?.error
                )
            });
        });
    }

    logger.warn({ MAX_ITERATIONS }, 'Max iterations reached');

    return {
        success: false,
        response: 'Maximum iterations reached without completing the task.',
        agent: 'orchestratorAgent',
        delegatedTo: [...new Set(toolsUsed)],
        iterations
    };
}

module.exports = { run };