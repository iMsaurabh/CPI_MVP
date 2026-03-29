const monitoringTools = require('./monitoringTools');
const deploymentTools = require('./deploymentTools');

const allTools = {
    ...monitoringTools,
    ...deploymentTools
};

const toolMap = {
    getMessageStatus: 'monitoringAgent',
    getMessageLog: 'monitoringAgent',
    deployArtifact: 'deploymentAgent',
    undeployArtifact: 'deploymentAgent'
};

module.exports = {
    monitoringTools,
    deploymentTools,
    allTools,
    toolMap
}