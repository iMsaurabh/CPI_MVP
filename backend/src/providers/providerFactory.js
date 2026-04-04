// providerFactory is the single entry point for obtaining a provider instance.
// It implements the Factory Pattern — given a provider name and options,
// it returns the correct provider implementation.
//
// Agents and routes never instantiate providers directly.
// They always go through providerFactory.
//
// This is where user's UI selection (provider + apiKey) gets resolved
// into an actual provider instance.

const OllamaProvider = require('./ollamaProvider');
const ClaudeProvider = require('./claudeProvider');
const OpenAIProvider = require('./openaiProvider');
const GroqAIProvider = require('./groqProvider');

// supported providers registry
// adding a new provider requires only one new entry here
const PROVIDERS = {
    ollama: OllamaProvider,
    claude: ClaudeProvider,
    openai: OpenAIProvider,
    groq: GroqAIProvider
};

// getProvider returns an instantiated provider ready to use.
//
// providerName: string — 'ollama', 'claude', 'openai'
// options: object — { apiKey, model, temperature }
//   apiKey comes from UI selection (user provides their own key)
//   model falls back to env var if not specified

function getProvider(providerName, options = {}) {
    const providerName_normalized = (providerName || process.env.AI_PROVIDER || 'ollama')
        .toLowerCase()
        .trim();

    const ProviderClass = PROVIDERS[providerName_normalized];

    if (!ProviderClass) {
        throw new Error(
            `Unknown provider: "${providerName_normalized}". ` +
            `Supported providers: ${Object.keys(PROVIDERS).join(', ')}`
        );
    }

    return new ProviderClass(options);
}

// getSupportedProviders returns list of available providers.
// Used by frontend to populate the provider selection dropdown.
function getSupportedProviders() {
    return Object.keys(PROVIDERS);
}

module.exports = { getProvider, getSupportedProviders };