class baseProvider {
    // chat is the single method every provider must implement.
    //
    // messages: array of conversation history in this format:
    //   [{ role: 'user', content: 'hello' }, { role: 'assistant', content: 'hi' }]
    //
    // tools: array of tool definitions in our internal format
    //   (provider is responsible for transforming to its own schema)
    //
    // options: optional config like temperature, maxTokens etc.
    //
    // returns: normalized response object:
    //   { content, toolCalls: [{ name, parameters }], raw }
    async chat(messages, tools = [], options = {}) {
        throw new Error(`${this.constructor.name} must implement chat()`)
    }

    transformaTools(tools) {
        throw new Error(`${this.constructor.name} must implement transformTools()`)
    }

    normalizeResponse(rawResponse) {
        throw new Error(`${this.constructor.name} must implement normalizeResponse()`)
    }
}

module.exports = baseProvider;