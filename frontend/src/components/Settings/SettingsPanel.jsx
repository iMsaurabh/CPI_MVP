// SettingsPanel allows users to configure AI provider, API key
// and mock mode. Settings are persisted to localStorage.
// Provider list is fetched dynamically from the backend.

import { useState } from 'react'
import { useSettings } from '../../context/SettingsContext'

function SettingsPanel({ onClose }) {
    const { settings, providers, providersLoading, updateSettings, resetSettings } = useSettings()

    // local form state — only applied when user clicks Save
    const [form, setForm] = useState({
        provider: settings.provider,
        apiKey: settings.apiKey,
        mockMode: settings.mockMode
    })

    const [showApiKey, setShowApiKey] = useState(false)
    const [saved, setSaved] = useState(false)

    function handleSave() {
        updateSettings(form)
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
    }

    function handleReset() {
        resetSettings()
        setForm({
            provider: 'groq',
            apiKey: '',
            mockMode: true
        })
    }

    return (
        <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full">

            {/* panel header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                <h2 className="font-semibold text-gray-800">Settings</h2>
                <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* panel body */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">

                {/* AI Provider */}
                <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        AI Provider
                    </label>
                    {providersLoading ? (
                        <div className="h-9 bg-gray-100 rounded-lg animate-pulse" />
                    ) : (
                        <select
                            value={form.provider}
                            onChange={e => setForm(prev => ({ ...prev, provider: e.target.value }))}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {providers.map(p => (
                                <option key={p} value={p}>
                                    {p.charAt(0).toUpperCase() + p.slice(1)}
                                </option>
                            ))}
                        </select>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                        Select which AI engine processes your requests
                    </p>
                </div>

                {/* API Key */}
                <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        API Key
                    </label>
                    <div className="relative">
                        <input
                            type={showApiKey ? 'text' : 'password'}
                            value={form.apiKey}
                            onChange={e => setForm(prev => ({ ...prev, apiKey: e.target.value }))}
                            placeholder={`Enter ${form.provider} API key`}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                            onClick={() => setShowApiKey(prev => !prev)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            {showApiKey ? (
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                    <line x1="1" y1="1" x2="23" y2="23" />
                                </svg>
                            ) : (
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                    <circle cx="12" cy="12" r="3" />
                                </svg>
                            )}
                        </button>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                        Leave empty to use server default key
                    </p>
                </div>

                {/* Mock Mode */}
                <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        Mock Mode
                    </label>
                    <button
                        onClick={() => setForm(prev => ({ ...prev, mockMode: !prev.mockMode }))}
                        className={`
              relative inline-flex h-6 w-11 items-center rounded-full transition-colors
              ${form.mockMode ? 'bg-blue-600' : 'bg-gray-300'}
            `}
                    >
                        <span
                            className={`
                inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm
                ${form.mockMode ? 'translate-x-6' : 'translate-x-1'}
              `}
                        />
                    </button>
                    <span className="ml-3 text-sm text-gray-600">
                        {form.mockMode ? 'Using mock CPI data' : 'Using real CPI API'}
                    </span>
                    <p className="text-xs text-gray-400 mt-1">
                        Mock mode returns fake CPI data for testing
                    </p>
                </div>

                {/* divider */}
                <hr className="border-gray-200" />

                {/* Jobs placeholder — post MVP */}
                <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        Scheduled Jobs
                    </label>
                    <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-4 text-center">
                        <p className="text-xs text-gray-400">
                            Job scheduling coming post-MVP
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                            Schedule deployments and monitor their status here
                        </p>
                    </div>
                </div>

            </div>

            {/* panel footer — save and reset buttons */}
            <div className="px-4 py-3 border-t border-gray-200 space-y-2">
                <button
                    onClick={handleSave}
                    className="w-full bg-blue-600 text-white text-sm font-medium py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                    {saved ? '✓ Saved' : 'Save Settings'}
                </button>
                <button
                    onClick={handleReset}
                    className="w-full text-sm text-gray-500 hover:text-gray-700 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                    Reset to defaults
                </button>
            </div>

        </div>
    )
}

export default SettingsPanel