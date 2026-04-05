// App.jsx is the root component.
// It holds the settings state and wires all components together.
// Settings panel slides in from the right when gear icon is clicked.

import { useState } from 'react'
import useChat from './hooks/useChat'
import ChatWindow from './components/Chat/ChatWindow'
import ChatInput from './components/Chat/ChatInput'
import Header from './components/Layout/Header'

function App() {
  // settings state — will be moved to Context in Group 11
  const [settings, setSettings] = useState({
    provider: 'groq',
    apiKey: '',
    mockMode: true
  })

  // settings panel open/closed
  const [settingsOpen, setSettingsOpen] = useState(false)

  // chat hook — all chat logic lives here
  const { messages, loading, sendMessage, clearMessages } = useChat(settings)

  return (
    <div className="h-screen flex flex-col bg-gray-50">

      {/* header */}
      <Header
        onSettingsClick={() => setSettingsOpen(prev => !prev)}
        provider={settings.provider}
      />

      {/* main content area */}
      <div className="flex-1 flex overflow-hidden">

        {/* chat area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <ChatWindow messages={messages} loading={loading} />
          <ChatInput onSend={sendMessage} loading={loading} />
        </div>

        {/* settings panel placeholder — built in Group 11 */}
        {settingsOpen && (
          <div className="w-80 bg-white border-l border-gray-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-800">Settings</h2>
              <button
                onClick={() => setSettingsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <p className="text-sm text-gray-500">
              Settings panel coming in Group 11.
            </p>
            <div className="mt-4">
              <p className="text-xs text-gray-400">Current provider:</p>
              <p className="text-sm font-medium text-gray-700">{settings.provider}</p>
            </div>
            <button
              onClick={clearMessages}
              className="mt-6 w-full text-sm text-red-500 hover:text-red-700 border border-red-200 hover:border-red-300 rounded-lg py-2 transition-colors"
            >
              Clear conversation
            </button>
          </div>
        )}

      </div>

    </div>
  )
}

export default App