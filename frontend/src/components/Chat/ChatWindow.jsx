// ChatWindow displays the scrollable conversation history.
// It automatically scrolls to the bottom when new messages arrive.
// Shows a loading indicator while waiting for agent response.

import { useEffect, useRef } from 'react'
import MessageBubble from './MessageBubble'

function ChatWindow({ messages, loading }) {
    // ref gives direct access to the DOM element
    // used to scroll to bottom when new messages arrive
    const bottomRef = useRef(null)

    // useEffect runs after every render where messages changed
    // scrolls to bottom automatically when new message arrives
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, loading])

    return (
        <div className="flex-1 overflow-y-auto px-4 py-4">

            {/* empty state — shown before any messages */}
            {messages.length === 0 && !loading && (
                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                    <div className="text-4xl mb-3">💬</div>
                    <p className="text-sm font-medium">Start a conversation</p>
                    <p className="text-xs mt-1">Ask about message status, logs, or deployments</p>
                </div>
            )}

            {/* message list */}
            {messages.map(message => (
                <MessageBubble key={message.id} message={message} />
            ))}

            {/* loading indicator — shown while waiting for agent */}
            {loading && (
                <div className="flex justify-start mb-4">
                    <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                        <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        </div>
                    </div>
                </div>
            )}

            {/* invisible div at bottom — scrolled into view on new messages */}
            <div ref={bottomRef} />
        </div>
    )
}

export default ChatWindow