const { Ollama } = require('ollama')
const BaseProvider = require('./baseProvider')

class OllamaProvider extends BaseProvider {
    constructor(options = {}) {
        super();
        //initialize the ollama client
        this.client = new Ollama({
            host: process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
        });
        // model to use, defaults to env var or llama3.2
        this.model = options.model || process.env.AI_MODEL || 'llama3.2';
    }

    transformTools(tools) {
        return tools.map(tool => ({
            type: 'function',
            function: {
                name: tool.name,
                description: tool.description,
                parameters: tool.parameters
            }
        }))
    }

    normalizeResponse(rawResponse) {
        const message = rawResponse.message;

        const toolCalls = (message.toolCalls || []).map(tc => ({
            name: tc.function.name,
            paramters: tc.function.arguments || {}
        }));

        return {
            content: message.content || '',
            toolCalls,
            raw: rawResponse
        }
    }

    async chat(messages, tools = [], options = {}) {

        const payload = {
            model: this.model,
            messages,
            //only include tools if there are any defined
            ...(tools.length > 0 && { tools: this.transformTools(tools) }),
            stream: false,
            options: {
                temperature: options.temperature || 0.1,
                ...options
            }
        }

        const response = await this.client.chat(payload);
        return this.normalizeResponse(response);
    }
}

module.exports = OllamaProvider;