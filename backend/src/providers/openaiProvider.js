// openaiProvider wraps the OpenAI API behind our common interface.
// Requires OPENAI_API_KEY in .env to activate.
// OpenAI format is very similar to Ollama since Ollama is compatible with it.

const BaseProvider = require('./baseProvider');

class OpenAIProvider extends BaseProvider {

    constructor(options = {}) {
        super();
        const OpenAI = require('openai');
        this.client = new OpenAI({
            apiKey: options.apiKey || process.env.OPENAI_API_KEY
        });
        this.model = options.model || 'gpt-4o';
    }

    // OpenAI uses same format as Ollama
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

    // OpenAI returns tool calls in message.tool_calls array
    normalizeResponse(rawResponse) {
        const message = rawResponse.choices[0].message;

        const toolCalls = (message.tool_calls || []).map(tc => ({
            name: tc.function.name,
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
            ...(tools.length > 0 && { tools: this.transformTools(tools) })
        };

        const response = await this.client.chat.completions.create(payload);
        return this.normalizeResponse(response);
    }

}

module.exports = OpenAIProvider;