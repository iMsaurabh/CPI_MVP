// ChatInput handles user text input and message submission.
// Supports Enter key to send and Shift+Enter for new line.
// Disabled while agent is processing to prevent duplicate sends.

import { useState } from 'react'

function ChatInput({ onSend, loading }) {
    const [text, setText] = useState('')

    function handleSend() {
        if (!text.trim() || loading) return
        onSend(text)
        setText('') // clear input after sending
    }

    function handleKeyDown(e) {
        // Enter sends message
        // Shift+Enter adds new line
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    return (
        <div className="border-t border-gray-200 bg-white px-4 py-3">
            <div className="flex items-end gap-2 max-w-4xl mx-auto">

                {/* text input */}
                <textarea
                    value={text}
                    onChange={e => setText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask about message status, logs, or deployments..."
                    disabled={loading}
                    rows={1}
                    className="
            flex-1 resize-none rounded-xl border border-gray-300
            px-4 py-2.5 text-sm text-gray-800
            placeholder:text-gray-400
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            disabled:bg-gray-50 disabled:text-gray-400
            max-h-32 overflow-y-auto
          "
                    style={{
                        // auto-expand textarea up to max height
                        height: 'auto',
                        minHeight: '42px'
                    }}
                    onInput={e => {
                        e.target.style.height = 'auto'
                        e.target.style.height = e.target.scrollHeight + 'px'
                    }}
                />

                {/* send button */}
                <button
                    onClick={handleSend}
                    disabled={!text.trim() || loading}
                    className="
            flex items-center justify-center
            w-10 h-10 rounded-xl
            bg-blue-600 text-white
            hover:bg-blue-700
            disabled:bg-gray-200 disabled:text-gray-400
            transition-colors duration-150
            flex-shrink-0
          "
                >
                    {loading ? (
                        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                    ) : (
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                        </svg>
                    )}
                </button>

            </div>

            {/* hint text */}
            <p className="text-xs text-gray-400 text-center mt-2">
                Press Enter to send · Shift+Enter for new line
            </p>
        </div>
    )
}

export default ChatInput