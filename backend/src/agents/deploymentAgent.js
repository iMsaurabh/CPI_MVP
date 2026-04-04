// deploymentAgent is a specialist agent responsible for all CPI
// deployment operations — deploying and undeploying artifacts.
//
// Same ReAct pattern as monitoringAgent.
// Single responsibility: deployment operations only.

const { cpiService } = require('../config/apiConfig');
const { deploymentTools } = require('../tools/toolRegistry');

const toolExecutors = {
    deployArtifact: async (params) => {
        return await cpiService.deployArtifact(params.artifactId);
    },
    undeployArtifact: async (params) => {
        return await cpiService.undeployArtifact(params.artifactId);
    }
};

async function executeTools(toolCalls) {
    const results = [];

    for (const toolCall of toolCalls) {
        const executor = toolExecutors[toolCall.name];

        if (!executor) {
            results.push({
                tool: toolCall.name,
                error: `Unknown tool: ${toolCall.name}`
            });
            continue;
        }

        try {
            const result = await executor(toolCall.parameters);
            results.push({
                tool: toolCall.name,
                result
            });
        } catch (err) {
            results.push({
                tool: toolCall.name,
                error: err.message
            });
        }
    }

    return results;
}

async function run(provider, task, maxIterations = 5) {
    const messages = [
        {
            role: 'system',
            content: `You are a CPI deployment specialist.
    You MUST use the provided tools to execute deployments.
    NEVER confirm a deployment without calling deployArtifact or undeployArtifact first.
    Always call the appropriate tool and report the actual result.`
        },
        {
            role: 'user',
            content: task
        }
    ];

    let iterations = 0;

    while (iterations < maxIterations) {
        iterations++;

        const response = await provider.chat(messages, deploymentTools);

        if (response.toolCalls.length === 0) {
            return {
                success: true,
                response: response.content,
                agent: 'deploymentAgent',
                iterations
            };
        }

        const toolResults = await executeTools(response.toolCalls);

        // correct OpenAI/Groq format
        // assistant message uses raw provider response format
        messages.push(response.raw.choices[0].message);

        // tool results need tool_call_id matching the original tool call
        response.raw.choices[0].message.tool_calls.forEach((tc, index) => {
            messages.push({
                role: 'tool',
                tool_call_id: tc.id,
                content: JSON.stringify(toolResults[index]?.result || toolResults[index]?.error)
            });
        });
    }

    return {
        success: false,
        response: 'Maximum iterations reached without completing the task.',
        agent: 'deploymentAgent',
        iterations
    };
}

module.exports = { run };