// App.jsx is the root component.
// Settings state now comes from SettingsContext.
// App just wires layout and components together.

import { useState } from 'react'
import { useSettings } from './context/SettingsContext'
import useChat from './hooks/useChat'
import ChatWindow from './components/Chat/ChatWindow'
import ChatInput from './components/Chat/ChatInput'
import Header from './components/Layout/Header'
import SettingsPanel from './components/Settings/settingsPanel'

function App() {
  const { settings } = useSettings()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const { messages, loading, sendMessage, clearMessages } = useChat(settings)

  return (
    <div className="h-screen flex flex-col bg-gray-50">

      <Header
        onSettingsClick={() => setSettingsOpen(prev => !prev)}
        provider={settings.provider}
        mockMode={settings.mockMode}
      />

      <div className="flex-1 flex overflow-hidden">

        {/* chat area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <ChatWindow messages={messages} loading={loading} />
          <ChatInput onSend={sendMessage} loading={loading} />
        </div>

        {/* settings panel */}
        {settingsOpen && (
          <SettingsPanel onClose={() => setSettingsOpen(false)} />
        )}

      </div>

    </div>
  )
}

export default App