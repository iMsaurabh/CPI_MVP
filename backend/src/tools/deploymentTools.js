// deploymentTools defines the capability contracts for the deployment agent.
// These definitions are read by the LLM to understand what deployment
// actions are available and when to use them.

const deploymentTools = [

    {
        name: 'deployArtifact',
        description: `Deploys an integration artifact (iFlow) on the CPI tenant.
      Use this tool when the user asks to deploy, start, activate or publish
      an integration artifact or iFlow. Requires the artifact ID.
      Returns deployment status and timestamp.`,
        parameters: {
            type: 'object',
            properties: {
                artifactId: {
                    type: 'string',
                    description: 'The unique ID of the CPI integration artifact to deploy'
                }
            },
            required: ['artifactId']
        }
    },

    {
        name: 'undeployArtifact',
        description: `Undeploys (stops) a running integration artifact (iFlow)
      on the CPI tenant. Use this tool when the user asks to undeploy, stop,
      deactivate or take offline an integration artifact or iFlow.
      Requires the artifact ID. Returns undeployment status and timestamp.`,
        parameters: {
            type: 'object',
            properties: {
                artifactId: {
                    type: 'string',
                    description: 'The unique ID of the CPI integration artifact to undeploy'
                }
            },
            required: ['artifactId']
        }
    }

];

module.exports = deploymentTools;