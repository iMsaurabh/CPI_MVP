// This is the mock implementation of the CPI service layer.
// It returns realistic fake data for all CPI operations.
// Shape of every response mirrors what the real CPI API returns.
// When real service is ready, this file is simply swapped out via config.

const cpiMockService = {

    // Retrieves the processing status of a CPI message by its message ID.
    // In real CPI, this calls the Message Processing Logs OData API.
    async getMessageStatus(messageId) {
        return {
            messageId,
            status: 'COMPLETED',
            processingStart: '2024-01-15T10:23:41Z',
            processingEnd: '2024-01-15T10:23:45Z',
            sender: 'MockSender',
            receiver: 'MockReceiver'
        };
    },

    // Retrieves the full processing log for a CPI message.
    // In real CPI, this returns detailed step by step execution trace.
    async getMessageLog(messageId) {
        return {
            messageId,
            log: [
                {
                    step: 'Sender Channel',
                    status: 'COMPLETED',
                    timestamp: '2024-01-15T10:23:41Z',
                    details: 'Message received successfully'
                },
                {
                    step: 'Groovy Script',
                    status: 'COMPLETED',
                    timestamp: '2024-01-15T10:23:43Z',
                    details: 'Transformation applied'
                },
                {
                    step: 'Receiver Channel',
                    status: 'COMPLETED',
                    timestamp: '2024-01-15T10:23:45Z',
                    details: 'Message delivered to receiver'
                }
            ]
        };
    },

    // Deploys an integration artifact (iFlow) on the CPI tenant.
    // In real CPI, this triggers the deployment API and returns job status.
    async deployArtifact(artifactId) {
        return {
            artifactId,
            status: 'DEPLOYED',
            deployedAt: new Date().toISOString(),
            message: `Artifact ${artifactId} deployed successfully`
        };
    },

    // Undeploys (stops) a running integration artifact on the CPI tenant.
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