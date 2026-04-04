// groqProvider wraps the Groq API behind our common provider interface.
// Groq uses OpenAI compatible API format — same as ollamaProvider.
// Key advantage: models like llama3-groq-70b-tool-use are specifically
// fine tuned for reliable structured tool calling.
//
// Free tier: 14,400 requests per day, no credit card required.

const Groq = require('groq-sdk').default || require('groq-sdk');
const BaseProvider = require('./baseProvider');

class GroqProvider extends BaseProvider {

    constructor(options = {}) {
        super();
        this.client = new Groq({
            apiKey: options.apiKey || process.env.GROQ_API_KEY
        });
        // default to tool-use optimized model
        this.model = options.model || process.env.GROQ_MODEL || 'llama3-groq-70b-8192-tool-use-preview';
    }

    // Groq uses identical format to OpenAI for tool definitions
    transformTools(tools) {
        return tools.map(tool => ({
            type: 'function',
            function: {
                name: tool.name,
                description: tool.description,
                parameters: tool.parameters
            }
        }));
    }

    // Groq response structure mirrors OpenAI
    normalizeResponse(rawResponse) {
        const message = rawResponse.choices[0].message;

        const toolCalls = (message.tool_calls || []).map(tc => ({
            name: tc.function.name,
            // Groq returns arguments as JSON string, must parse
            parameters: JSON.parse(tc.function.arguments || '{}')
        }));

        return {
            content: message.content || '',
            toolCalls,
            raw: rawResponse
        };
    }

    async chat(messages, tools = [], options = {}) {

        const payload = {
            model: this.model,
            messages,
            ...(tools.length > 0 && { tools: this.transformTools(tools) }),
            ...(tools.length > 0 && { tool_choice: 'auto' }),
            temperature: options.temperature || 0.1,
            max_tokens: options.maxTokens || 1024
        };

        const response = await this.client.chat.completions.create(payload);
        return this.normalizeResponse(response);
    }

}

module.exports = GroqProvider;