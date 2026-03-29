// monitoringTools defines the capability contracts for the monitoring agent.
// These definitions are read by the LLM to understand what monitoring
// actions are available and when to use them.
//
// Each tool maps directly to a method in the CPI service layer.
// The LLM never calls the service directly — it declares intent via tools
// and your code executes the actual service call.

const monitoringTools = [

    {
        name: 'getMessageStatus',
        // description is critical — LLM reads this to decide when to use this tool
        // be specific about what triggers this tool
        description: `Retrieves the current processing status of a CPI message
      by its message ID. Use this tool when the user asks about the status,
      result, or outcome of a specific message or transaction. Returns status,
      processing timestamps, sender and receiver information.`,
        parameters: {
            type: 'object',
            properties: {
                messageId: {
                    type: 'string',
                    description: 'The unique message ID of the CPI message to retrieve status for'
                }
            },
            required: ['messageId']
        }
    },

    {
        name: 'getMessageLog',
        description: `Retrieves the detailed step by step processing log for a
      CPI message by its message ID. Use this tool when the user asks for
      logs, processing details, execution trace, or wants to investigate
      what happened during message processing. Returns each processing step
      with its status, timestamp and details.`,
        parameters: {
            type: 'object',
            properties: {
                messageId: {
                    type: 'string',
                    description: 'The unique message ID of the CPI message to retrieve logs for'
                }
            },
            required: ['messageId']
        }
    }

];

module.exports = monitoringTools;