const { cpiService } = require('../config/apiConfig');
const { deploymentTools } = require('../tools/toolRegistry');
const { getAgentLogger } = require('../utils/agentLogger');

const logger = getAgentLogger('deploymentAgent');

const toolExecutors = {
    deployArtifact: async (params) => {
        logger.debug({ params }, 'Executing deployArtifact');
        return await cpiService.deployArtifact(params.artifactId);
    },
    undeployArtifact: async (params) => {
        logger.debug({ params }, 'Executing undeployArtifact');
        return await cpiService.undeployArtifact(params.artifactId);
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
    logger.info({ task }, 'Deployment agent started');

    const messages = [
        {
            role: 'system',
            content: `You are a CPI deployment specialist.
        You MUST use the provided tools to execute deployments.
        NEVER confirm a deployment without calling deployArtifact or undeployArtifact first.
        Always call the appropriate tool and report the actual result.`
        },
        { role: 'user', content: task }
    ];

    let iterations = 0;

    while (iterations < maxIterations) {
        iterations++;
        logger.debug({ iterations }, 'ReAct loop iteration');

        const response = await provider.chat(messages, deploymentTools);

        if (response.toolCalls.length === 0) {
            logger.info({ iterations }, 'Deployment agent completed');
            return {
                success: true,
                response: response.content,
                agent: 'deploymentAgent',
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
        agent: 'deploymentAgent',
        iterations
    };
}

module.exports = { run };