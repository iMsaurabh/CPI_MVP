// claudeProvider wraps the Anthropic Claude API behind our common interface.
// Requires ANTHROPIC_API_KEY in .env to activate.
// Claude uses a different tool schema than Ollama/OpenAI.
// input_schema instead of parameters is the key difference.

const BaseProvider = require('./baseProvider');

class ClaudeProvider extends BaseProvider {

    constructor(options = {}) {
        super();
        // anthropic sdk is imported here so app does not crash if
        // package is not installed — only fails when Claude is actually used
        const Anthropic = require('@anthropic-ai/sdk');
        this.client = new Anthropic({
            apiKey: options.apiKey || process.env.ANTHROPIC_API_KEY
        });
        this.model = options.model || 'claude-sonnet-4-20250514';
    }

    // Claude uses input_schema instead of parameters
    // This is the key structural difference from Ollama/OpenAI
    transformTools(tools) {
        return tools.map(tool => ({
            name: tool.name,
            description: tool.description,
            input_schema: tool.parameters  // claude specific field name
        }));
    }

    // Claude returns tool use blocks in content array
    normalizeResponse(rawResponse) {
        const toolCalls = [];
        let content = '';

        for (const block of rawResponse.content) {
            if (block.type === 'text') {
                content += block.text;
            } else if (block.type === 'tool_use') {
                toolCalls.push({
                    name: block.name,
                    parameters: block.input || {}
                });
            }
        }

        return { content, toolCalls, raw: rawResponse };
    }

    async chat(messages, tools = [], options = {}) {
        const payload = {
            model: this.model,
            max_tokens: options.maxTokens || 1024,
            messages,
            ...(tools.length > 0 && { tools: this.transformTools(tools) })
        };

        const response = await this.client.messages.create(payload);
        return this.normalizeResponse(response);
    }

}

module.exports = ClaudeProvider;