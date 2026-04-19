// ProviderSettings contains the AI provider selector, API key input
// and mock mode toggle. Extracted from SettingsPanel for sidebar use.

import { useState, useEffect } from 'react'
import { useSettings } from '../../context/SettingsContext'
import apiService from '../../services/apiService'

function ProviderSettings() {
  const { settings, providers, providersLoading, updateSettings } = useSettings()
  const [form, setForm] = useState({
    provider: settings.provider,
    apiKey: settings.apiKey,
    mockMode: settings.mockMode
  })
  const [showApiKey, setShowApiKey] = useState(false)
  const [saved, setSaved] = useState(false)

  // sync form when settings change externally
  useEffect(() => {
    setForm({
      provider: settings.provider,
      apiKey: settings.apiKey,
      mockMode: settings.mockMode
    })
  }, [settings])

  function handleSave() {
    updateSettings(form)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-4">

      {/* AI Provider */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1.5">
          AI Provider
        </label>
        {providersLoading ? (
          <div className="h-9 bg-gray-100 rounded-lg animate-pulse" />
        ) : (
          <select
            value={form.provider}
            onChange={e => setForm(p => ({ ...p, provider: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {providers.map(p => (
              <option key={p} value={p}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* API Key */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1.5">
          API Key
        </label>
        <div className="relative">
          <input
            type={showApiKey ? 'text' : 'password'}
            value={form.apiKey}
            onChange={e => setForm(p => ({ ...p, apiKey: e.target.value }))}
            placeholder={`${form.provider} API key (optional)`}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm pr-9 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => setShowApiKey(p => !p)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showApiKey ? (
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            )}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-1">Leave empty to use server key</p>
      </div>

      {/* Mock Mode */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500">Mock Mode</p>
          <p className="text-xs text-gray-400">
            {form.mockMode ? 'Using fake CPI data' : 'Using real CPI API'}
          </p>
        </div>
        <button
          onClick={() => setForm(p => ({ ...p, mockMode: !p.mockMode }))}
          className={`
            relative h-6 w-11 rounded-full transition-colors duration-200
            ${form.mockMode ? 'bg-blue-600' : 'bg-gray-300'}
          `}
        >
          <span className={`
            absolute top-1 left-1 h-4 w-4 rounded-full bg-white shadow-sm
            transition-transform duration-200
            ${form.mockMode ? 'translate-x-5' : 'translate-x-0'}
          `} />
        </button>
      </div>

      {/* Save button */}
      <button
        onClick={handleSave}
        className="w-full bg-blue-600 text-white text-sm font-medium py-2 rounded-lg hover:bg-blue-700 transition-colors"
      >
        {saved ? '✓ Saved' : 'Save Settings'}
      </button>

    </div>
  )
}

export default ProviderSettings