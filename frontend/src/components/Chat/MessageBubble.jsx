// MessageBubble displays a single message in the conversation.
// User messages appear on the right, agent messages on the left.
// Agent messages show metadata below — which agent handled it.

function MessageBubble({ message }) {
    const isUser = message.role === 'user'
    const isError = message.error

    // format timestamp to readable time
    const time = message.timestamp
        ? new Date(message.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        })
        : ''

    return (
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
            <div className={`max-w-[75%] ${isUser ? 'order-2' : 'order-1'}`}>

                {/* message bubble */}
                <div
                    className={`
            px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap
            ${isUser
                            ? 'bg-blue-600 text-white rounded-br-sm'
                            : isError
                                ? 'bg-red-50 text-red-700 border border-red-200 rounded-bl-sm'
                                : 'bg-white text-gray-800 border border-gray-200 rounded-bl-sm shadow-sm'
                        }
          `}
                >
                    {message.content}
                </div>

                {/* timestamp */}
                <div className={`text-xs text-gray-400 mt-1 ${isUser ? 'text-right' : 'text-left'}`}>
                    {time}
                </div>

                {/* agent metadata — only shown for agent messages */}
                {!isUser && !isError && message.metadata && (
                    <div className="text-xs text-gray-400 mt-1 flex items-center gap-2">
                        {message.metadata.delegatedTo?.length > 0 && (
                            <span className="bg-gray-100 px-2 py-0.5 rounded-full">
                                {message.metadata.delegatedTo.join(', ')}
                            </span>
                        )}
                        {message.metadata.iterations && (
                            <span className="bg-gray-100 px-2 py-0.5 rounded-full">
                                {message.metadata.iterations} {message.metadata.iterations === 1 ? 'step' : 'steps'}
                            </span>
                        )}
                    </div>
                )}

            </div>
        </div>
    )
}

export default MessageBubble