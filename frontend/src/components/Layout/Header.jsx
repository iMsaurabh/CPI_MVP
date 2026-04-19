import { NotificationBubble } from '../Notifications/NotificationCenter'

function Header({ onNotificationsClick, provider, mockMode }) {
  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between flex-shrink-0">

      {/* app identity */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <span className="text-white text-sm font-bold">C</span>
        </div>
        <div>
          <h1 className="text-sm font-semibold text-gray-800">CPI Agent</h1>
          <div className="flex items-center gap-2">
            <p className="text-xs text-gray-400">
              {provider
                ? provider.charAt(0).toUpperCase() + provider.slice(1)
                : 'Groq'}
            </p>
            {mockMode && (
              <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">
                Mock
              </span>
            )}
          </div>
        </div>
      </div>

      {/* right actions */}
      <div className="flex items-center gap-1">
        <NotificationBubble onClick={onNotificationsClick} />
      </div>

    </header>
  )
}

export default Header