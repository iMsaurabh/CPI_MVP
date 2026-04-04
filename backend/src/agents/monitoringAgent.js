// monitoringAgent is a specialist agent responsible for all CPI
// monitoring operations — message status and log retrieval.
//
// It receives a task from the orchestrator, runs its own agentic
// loop using the ReAct pattern, and returns a structured result.
//
// It never receives messages directly from the user.
// It never calls deploymentTools.
// Single responsibility: monitoring operations only.

const { cpiService } = require('../config/apiConfig');
const { monitoringTools } = require('../tools/toolRegistry');

// toolExecutors maps tool names to actual service method calls.
// When LLM decides to call a tool, this map resolves the execution.
const toolExecutors = {
    getMessageStatus: async (params) => {
        return await cpiService.getMessageStatus(params.messageId);
    },
    getMessageLog: async (params) => {
        return await cpiService.getMessageLog(params.messageId);
    }
};

// executeTools runs all tool calls the LLM requested and returns results
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

// run executes the monitoring agent's agentic loop.
//
// provider: instantiated provider from providerFactory
// task: string describing what the user wants to know
// maxIterations: safety limit to prevent infinite loops
async function run(provider, task, maxIterations = 5) {
    // conversation history maintained across loop iterations
    const messages = [
        {
            role: 'system',
            content: `You are a CPI monitoring specialist.
    You MUST use the provided tools to retrieve information.
    NEVER make up or guess monitoring data.
    Always call getMessageStatus or getMessageLog to get real data before responding.`
        },
        {
            role: 'user',
            content: task
        }
    ];

    let iterations = 0;

    // ReAct loop — runs until LLM stops calling tools or max iterations hit
    while (iterations < maxIterations) {
        iterations++;

        // send current conversation to LLM with monitoring tools
        const response = await provider.chat(messages, monitoringTools);

        // if LLM returned text with no tool calls, we are done
        if (response.toolCalls.length === 0) {
            return {
                success: true,
                response: response.content,
                agent: 'monitoringAgent',
                iterations
            };
        }

        // LLM requested tool calls — execute them
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

        // loop continues — LLM will now process tool results
    }

    // safety fallback if max iterations reached
    return {
        success: false,
        response: 'Maximum iterations reached without completing the task.',
        agent: 'monitoringAgent',
        iterations
    };
}

module.exports = { run };