// NotificationCenter provides two components:
//   NotificationBubble — bell icon with unread count badge
//   NotificationPanel  — slide-in panel with notification history
//
// Bubble shows in header. Panel opens when bubble is clicked.
// Unread count resets when panel is opened.

import { useState } from 'react'
import { useNotifications } from '../../context/NotificationContext'

const STATUS_COLORS = {
  success: 'bg-green-100 text-green-800 border-green-200',
  error: 'bg-red-100 text-red-800 border-red-200',
  warning: 'bg-amber-100 text-amber-800 border-amber-200',
  info: 'bg-gray-100 text-gray-800 border-gray-200'
}

const STATUS_ICONS = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: '◌'
}

function NotificationItem({ notification }) {
  const [expanded, setExpanded] = useState(false)
  const colorClass = STATUS_COLORS[notification.status] || STATUS_COLORS.info
  const icon = STATUS_ICONS[notification.status] || STATUS_ICONS.info

  return (
    <div
      className={`
        border rounded-lg p-3 text-sm
        ${colorClass}
        ${!notification.read ? 'ring-1 ring-blue-400' : ''}
      `}
    >
      {/* header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="font-bold flex-shrink-0">{icon}</span>
          <div className="min-w-0">
            <p className="font-semibold truncate">{notification.title}</p>
            <p className="text-xs opacity-75 mt-0.5">{notification.message}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span className="text-xs opacity-60">
            {new Date(notification.createdAt).toLocaleTimeString([], {
              hour: '2-digit', minute: '2-digit'
            })}
          </span>
          {notification.isBatch && (
            <button
              onClick={() => setExpanded(prev => !prev)}
              className="text-xs underline opacity-70 hover:opacity-100"
            >
              {expanded ? 'collapse' : 'details'}
            </button>
          )}
        </div>
      </div>

      {/* expanded batch details */}
      {expanded && notification.jobs && (
        <div className="mt-2 space-y-1 border-t border-current/20 pt-2">
          {notification.jobs.map((job, i) => (
            <div key={i} className="flex items-center justify-between text-xs">
              <span>{job.job?.name}</span>
              <span className={job.job?.status === 'SUCCESS' ? 'text-green-700' : 'text-red-700'}>
                {job.job?.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function NotificationBubble({ onClick }) {
  const { unreadCount, sseConnected } = useNotifications()

  return (
    <button
      onClick={onClick}
      className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
      title="Notifications"
    >
      {/* bell icon */}
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
      </svg>

      {/* unread count badge */}
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-4 h-4 flex items-center justify-center px-1 font-bold">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}

      {/* SSE connection indicator */}
      <span className={`
        absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full
        ${sseConnected ? 'bg-green-500' : 'bg-gray-300'}
      `} />
    </button>
  )
}

export function NotificationPanel({ onClose }) {
  const { notifications, unreadCount, markAllRead } = useNotifications()

  // mark all read when panel opens
  useState(() => {
    if (unreadCount > 0) markAllRead()
  })

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full">

      {/* header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <h2 className="font-semibold text-gray-800">Notifications</h2>
        <div className="flex items-center gap-2">
          {notifications.length > 0 && (
            <button
              onClick={markAllRead}
              className="text-xs text-blue-600 hover:text-blue-700"
            >
              Mark all read
            </button>
          )}
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>

      {/* notification list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {notifications.length === 0 && (
          <div className="text-center text-gray-400 mt-8">
            <p className="text-sm">No notifications yet</p>
            <p className="text-xs mt-1">Job completions will appear here</p>
          </div>
        )}

        {notifications.map(notification => (
          <NotificationItem key={notification.id} notification={notification} />
        ))}
      </div>

    </div>
  )
}