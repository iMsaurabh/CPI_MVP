const { allTools, toolMap } = require('../tools/toolRegistry');
const monitoringAgent = require('./monitoringAgent');
const deploymentAgent = require('./deploymentAgent');
const { getAgentLogger } = require('../utils/agentLogger');

const logger = getAgentLogger('orchestratorAgent');

const agentRegistry = {
    monitoringAgent: monitoringAgent.run,
    deploymentAgent: deploymentAgent.run
};

async function run(provider, userMessage) {
    logger.info({ userMessage }, 'Orchestrator received message');

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

    if (intentResponse.toolCalls.length === 0) {
        logger.info('No tool calls detected — returning direct response');
        return {
            success: true,
            response: intentResponse.content,
            agent: 'orchestratorAgent',
            delegatedTo: []
        };
    }

    logger.info({ toolCalls: intentResponse.toolCalls.map(tc => tc.name) }, 'Tool calls detected');

    const agentTasks = {};
    for (const toolCall of intentResponse.toolCalls) {
        const responsibleAgent = toolMap[toolCall.name];
        if (!responsibleAgent) continue;
        if (!agentTasks[responsibleAgent]) agentTasks[responsibleAgent] = [];
        agentTasks[responsibleAgent].push(toolCall);
    }

    logger.info({ agentTasks: Object.keys(agentTasks) }, 'Delegating to specialist agents');

    const agentResults = [];
    for (const [agentName, toolCalls] of Object.entries(agentTasks)) {
        const agentRun = agentRegistry[agentName];
        if (!agentRun) continue;

        const taskDescription = `${userMessage}
      Focus on these operations: ${toolCalls.map(tc => tc.name).join(', ')}`;

        const result = await agentRun(provider, taskDescription);
        agentResults.push(result);
    }

    if (agentResults.length === 1) {
        logger.info({ delegatedTo: Object.keys(agentTasks) }, 'Orchestrator completed');
        return {
            ...agentResults[0],
            delegatedTo: Object.keys(agentTasks)
        };
    }

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

    logger.info({ delegatedTo: Object.keys(agentTasks) }, 'Orchestrator synthesized response');

    return {
        success: true,
        response: synthesisResponse.content,
        agent: 'orchestratorAgent',
        delegatedTo: Object.keys(agentTasks)
    };
}

module.exports = { run };