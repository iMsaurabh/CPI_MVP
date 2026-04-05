// SettingsContext provides shared settings state to all components.
// Any component can read current settings or update them
// without props being passed through intermediate components.
//
// Settings are persisted to localStorage so they survive page refresh.
// Provider list is fetched from backend on mount.

import { createContext, useContext, useState, useEffect } from 'react'
import apiService from '../services/apiService'

// default settings applied on first load
const DEFAULT_SETTINGS = {
    provider: 'groq',
    apiKey: '',
    mockMode: true
}

// create the context object
// this is what components import to access settings
const SettingsContext = createContext(null)

// SettingsProvider wraps the app and makes settings available
// to all components inside it
export function SettingsProvider({ children }) {
    // load settings from localStorage or use defaults
    const [settings, setSettings] = useState(() => {
        try {
            const saved = localStorage.getItem('cpi-agent-settings')
            return saved ? JSON.parse(saved) : DEFAULT_SETTINGS
        } catch {
            return DEFAULT_SETTINGS
        }
    })

    // available providers fetched from backend
    const [providers, setProviders] = useState([])
    const [providersLoading, setProvidersLoading] = useState(true)

    // fetch providers from backend on mount
    useEffect(() => {
        async function fetchProviders() {
            try {
                const list = await apiService.getProviders()
                setProviders(list)
            } catch (err) {
                console.error('Failed to fetch providers:', err)
                // fallback to known providers if backend unreachable
                setProviders(['ollama', 'groq', 'claude', 'openai'])
            } finally {
                setProvidersLoading(false)
            }
        }
        fetchProviders()
    }, [])

    // updateSettings merges partial updates and persists to localStorage
    function updateSettings(updates) {
        setSettings(prev => {
            const next = { ...prev, ...updates }
            try {
                localStorage.setItem('cpi-agent-settings', JSON.stringify(next))
            } catch {
                console.error('Failed to persist settings')
            }
            return next
        })
    }

    // resetSettings restores defaults and clears localStorage
    function resetSettings() {
        setSettings(DEFAULT_SETTINGS)
        localStorage.removeItem('cpi-agent-settings')
    }

    return (
        <SettingsContext.Provider value={{
            settings,
            providers,
            providersLoading,
            updateSettings,
            resetSettings
        }}>
            {children}
        </SettingsContext.Provider>
    )
}

// useSettings is a custom hook for consuming the context
// components call useSettings() instead of useContext(SettingsContext)
// cleaner API, throws helpful error if used outside provider
export function useSettings() {
    const context = useContext(SettingsContext)
    if (!context) {
        throw new Error('useSettings must be used inside SettingsProvider')
    }
    return context
}