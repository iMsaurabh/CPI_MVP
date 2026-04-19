// ToastStack renders active toast notifications stacked vertically.
// Newest toast appears at top. Max 4 visible simultaneously.
// Each toast auto-dismisses after 6 seconds.
// User can manually dismiss any toast.

import { useNotifications } from '../../context/NotificationContext'

// status config — color and icon per status
const STATUS_CONFIG = {
  success: {
    bg: 'bg-green-600',
    icon: '✓',
    border: 'border-green-700'
  },
  error: {
    bg: 'bg-red-600',
    icon: '✕',
    border: 'border-red-700'
  },
  warning: {
    bg: 'bg-amber-500',
    icon: '⚠',
    border: 'border-amber-600'
  },
  info: {
    bg: 'bg-gray-600',
    icon: '◌',
    border: 'border-gray-700'
  }
}

function Toast({ toast, onDismiss }) {
  const config = STATUS_CONFIG[toast.status] || STATUS_CONFIG.info
  const isBatch = toast.jobs?.length > 1

  return (
    <div
      className={`
        ${config.bg} ${config.border}
        border text-white rounded-lg shadow-lg
        px-4 py-3 min-w-72 max-w-96
        flex items-start gap-3
        animate-slide-in
      `}
    >
      {/* status icon */}
      <span className="text-lg font-bold flex-shrink-0 mt-0.5">
        {config.icon}
      </span>

      {/* content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">{toast.title}</p>
        <p className="text-xs opacity-90 mt-0.5">{toast.message}</p>

        {/* batch job list */}
        {isBatch && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {toast.jobs.map((job, i) => (
              <span
                key={i}
                className={`
                  text-xs px-1.5 py-0.5 rounded
                  ${job.job?.status === 'SUCCESS'
                    ? 'bg-white/20'
                    : 'bg-black/20'
                  }
                `}
              >
                {job.job?.status === 'SUCCESS' ? '✓' : '✕'} {job.job?.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* dismiss button */}
      <button
        onClick={() => onDismiss(toast.id)}
        className="text-white/70 hover:text-white flex-shrink-0 text-lg leading-none"
      >
        ×
      </button>
    </div>
  )
}

function ToastStack() {
  const { toasts, dismissToast } = useNotifications()

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} onDismiss={dismissToast} />
      ))}
    </div>
  )
}

export default ToastStack