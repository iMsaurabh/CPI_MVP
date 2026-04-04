// orchestratorAgent is the entry point for all user messages.
// It reads user intent, determines which specialist agent(s) to invoke,
// delegates tasks, and synthesizes a final response.
//
// The orchestrator never executes CPI operations directly.
// It never calls cpiService.
// Its only job is coordination and delegation.

const { allTools, toolMap } = require('../tools/toolRegistry');
const monitoringAgent = require('./monitoringAgent');
const deploymentAgent = require('./deploymentAgent');

// agentRegistry maps agent names to their run functions
// adding a new specialist requires one entry here
const agentRegistry = {
    monitoringAgent: monitoringAgent.run,
    deploymentAgent: deploymentAgent.run
};

// run is the main entry point called by routes
//
// provider: instantiated provider from providerFactory
// userMessage: raw message from the user
async function run(provider, userMessage) {

    // step 1 — send user message to LLM with all available tools
    // LLM uses tool descriptions to understand what is possible
    const intentMessages = [
        {
            role: 'system',
            content: `You are an orchestrator for SAP Cloud Platform Integration.
    You MUST use the provided tools to handle user requests.
    NEVER answer CPI operation requests with text alone.
    When a user asks about message status or logs, call getMessageStatus or getMessageLog.
    When a user asks to deploy or undeploy, call deployArtifact or undeployArtifact.
    Always call the appropriate tool first, then respond based on the result.`
        },
        {
            role: 'user',
            content: userMessage
        }
    ];

    const intentResponse = await provider.chat(intentMessages, allTools);

    // temporary diagnostic — remove after debugging
    console.log('RAW INTENT RESPONSE:', JSON.stringify(intentResponse, null, 2));

    // step 2 — if no tool calls, LLM answered directly (greeting, unknown request etc)
    if (intentResponse.toolCalls.length === 0) {
        return {
            success: true,
            response: intentResponse.content,
            agent: 'orchestratorAgent',
            delegatedTo: []
        };
    }

    // step 3 — group tool calls by responsible agent using toolMap
    const agentTasks = {};

    for (const toolCall of intentResponse.toolCalls) {
        const responsibleAgent = toolMap[toolCall.name];

        if (!responsibleAgent) {
            continue; // unknown tool, skip
        }

        if (!agentTasks[responsibleAgent]) {
            agentTasks[responsibleAgent] = [];
        }

        agentTasks[responsibleAgent].push(toolCall);
    }

    // step 4 — delegate to each responsible specialist agent
    // build task description from tool calls for each agent
    const agentResults = [];

    for (const [agentName, toolCalls] of Object.entries(agentTasks)) {
        const agentRun = agentRegistry[agentName];

        if (!agentRun) {
            continue;
        }

        // build a natural language task description for the specialist
        // specialist uses this as its starting instruction
        const taskDescription = `${userMessage}
      Focus on these operations: ${toolCalls.map(tc => tc.name).join(', ')}`;

        const result = await agentRun(provider, taskDescription);
        agentResults.push(result);
    }

    // step 5 — synthesize results from all specialists into final response
    if (agentResults.length === 1) {
        // single agent result — return directly
        return {
            ...agentResults[0],
            delegatedTo: Object.keys(agentTasks)
        };
    }

    // multiple agent results — ask LLM to synthesize into coherent response
    const synthesisMessages = [
        {
            role: 'system',
            content: 'Combine the following operation results into a single clear response for the user.'
        },
        {
            role: 'user',
            content: agentResults.map(r => r.response).join('\n\n')
        }
    ];

    const synthesisResponse = await provider.chat(synthesisMessages, []);

    return {
        success: true,
        response: synthesisResponse.content,
        agent: 'orchestratorAgent',
        delegatedTo: Object.keys(agentTasks)
    };
}

module.exports = { run };