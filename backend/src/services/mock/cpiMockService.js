// This is the mock implementation of the CPI service layer.
// It returns realistic fake data for all CPI operations.
// Shape of every response mirrors what the real CPI API returns.
// When real service is ready, this file is simply swapped out via config.

const cpiMockService = {

    async getMessageStatus(messageId) {
        return {
            messageId,
            status: 'COMPLETED',
            processingStart: '2026-04-05T10:23:41.000Z',
            processingEnd: '2026-04-05T10:23:45.000Z',
            sender: 'MockSender',
            receiver: 'MockReceiver',
            integrationFlowName: 'MockIntegrationFlow',
            correlationId: 'MOCK-CORR-001',
            logLevel: 'INFO',
            customStatus: 'COMPLETED'
        };
    },

    async getMessageLog(messageId) {
        return {
            messageId,
            status: 'COMPLETED',
            logStart: '2026-04-05T10:23:41.000Z',
            logEnd: '2026-04-05T10:23:45.000Z',
            integrationFlowName: 'MockIntegrationFlow',
            correlationId: 'MOCK-CORR-001',
            logLevel: 'INFO',
            customStatus: 'COMPLETED',
            sender: 'MockSender',
            receiver: 'MockReceiver',
            adapterAttributes: [
                { Name: 'MockAttribute', Value: 'MockValue' }
            ]
        };
    },

    async deployArtifact(artifactId) {
        return {
            artifactId,
            status: 'DEPLOYED',
            deployedAt: new Date().toISOString(),
            message: `Artifact ${artifactId} deployment triggered successfully`
        };
    },

    async undeployArtifact(artifactId) {
        return {
            artifactId,
            status: 'UNDEPLOYED',
            undeployedAt: new Date().toISOString(),
            message: `Artifact ${artifactId} undeployed successfully`
        };
    }
};

module.exports = cpiMockService;