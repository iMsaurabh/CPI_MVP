// apiService is the single point of contact between the frontend
// and the backend API. All HTTP calls go through here.
//
// Same principle as the backend service layer —
// components never call axios directly, they call apiService.
// Swapping the backend URL or adding auth headers
// requires changes in one place only.

import axios from 'axios'

// base URL from environment variable
// in development this points to Vite proxy (localhost:5173)
// in production this points to actual backend URL
const BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
})

const apiService = {

    // sendMessage sends a chat message to the orchestrator agent
    // provider and apiKey come from user settings
    async sendMessage(message, provider, apiKey) {
        const response = await api.post('/api/chat', {
            message,
            provider,
            apiKey: apiKey || null
        })
        return response.data
    },

    // getProviders fetches available AI providers from backend
    // used to populate the provider dropdown in settings
    async getProviders() {
        const response = await api.get('/api/providers')
        return response.data.providers
    },

    // checkHealth verifies backend is reachable
    // used by status bar to show connection state
    async checkHealth() {
        const response = await api.get('/health')
        return response.data
    }

}

export default apiService