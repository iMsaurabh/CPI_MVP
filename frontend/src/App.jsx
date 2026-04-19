import { useState } from 'react'
import { useSettings } from './context/SettingsContext'
import useChat from './hooks/useChat'
import ChatWindow from './components/Chat/ChatWindow'
import ChatInput from './components/Chat/ChatInput'
import Header from './components/Layout/Header'
import SettingsPanel from './components/Settings/SettingsPanel'
import ToastStack from './components/Notifications/ToastStack'
import { NotificationPanel } from './components/Notifications/NotificationCenter'

function App() {
  const { settings } = useSettings()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const { messages, loading, sendMessage, clearMessages } = useChat(settings)

  // only one panel open at a time
  function openSettings() {
    setNotificationsOpen(false)
    setSettingsOpen(prev => !prev)
  }

  function openNotifications() {
    setSettingsOpen(false)
    setNotificationsOpen(prev => !prev)
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">

      <Header
        onSettingsClick={openSettings}
        onNotificationsClick={openNotifications}
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

        {/* notification panel */}
        {notificationsOpen && (
          <NotificationPanel onClose={() => setNotificationsOpen(false)} />
        )}

      </div>

      {/* toast stack — fixed position, always rendered */}
      <ToastStack />

    </div>
  )
}

export default App