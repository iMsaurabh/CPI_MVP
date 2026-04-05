const { cpiService } = require('../config/apiConfig');
const { monitoringTools } = require('../tools/toolRegistry');
const { getAgentLogger } = require('../utils/agentLogger');

const logger = getAgentLogger('monitoringAgent');

const toolExecutors = {
    getMessageStatus: async (params) => {
        logger.debug({ params }, 'Executing getMessageStatus');
        return await cpiService.getMessageStatus(params.messageId);
    },
    getMessageLog: async (params) => {
        logger.debug({ params }, 'Executing getMessageLog');
        return await cpiService.getMessageLog(params.messageId);
    }
};

async function executeTools(toolCalls) {
    const results = [];
    for (const toolCall of toolCalls) {
        const executor = toolExecutors[toolCall.name];
        if (!executor) {
            logger.warn({ toolName: toolCall.name }, 'Unknown tool requested');
            results.push({ tool: toolCall.name, error: `Unknown tool: ${toolCall.name}` });
            continue;
        }
        try {
            const result = await executor(toolCall.parameters);
            logger.info({ toolName: toolCall.name }, 'Tool executed successfully');
            results.push({ tool: toolCall.name, result });
        } catch (err) {
            logger.error({ toolName: toolCall.name, error: err.message }, 'Tool execution failed');
            results.push({ tool: toolCall.name, error: err.message });
        }
    }
    return results;
}

async function run(provider, task, maxIterations = 5) {
    logger.info({ task }, 'Monitoring agent started');

    const messages = [
        {
            role: 'system',
            content: `You are a CPI monitoring specialist.
        You MUST use the provided tools to retrieve information.
        NEVER make up or guess monitoring data.
        Always call getMessageStatus or getMessageLog to get real data before responding.`
        },
        { role: 'user', content: task }
    ];

    let iterations = 0;

    while (iterations < maxIterations) {
        iterations++;
        logger.debug({ iterations }, 'ReAct loop iteration');

        const response = await provider.chat(messages, monitoringTools);

        if (response.toolCalls.length === 0) {
            logger.info({ iterations }, 'Monitoring agent completed');
            return {
                success: true,
                response: response.content,
                agent: 'monitoringAgent',
                iterations
            };
        }

        const toolResults = await executeTools(response.toolCalls);
        messages.push(response.raw.choices[0].message);
        response.raw.choices[0].message.tool_calls.forEach((tc, index) => {
            messages.push({
                role: 'tool',
                tool_call_id: tc.id,
                content: JSON.stringify(toolResults[index]?.result || toolResults[index]?.error)
            });
        });
    }

    logger.warn({ maxIterations }, 'Max iterations reached');
    return {
        success: false,
        response: 'Maximum iterations reached without completing the task.',
        agent: 'monitoringAgent',
        iterations
    };
}

module.exports = { run };