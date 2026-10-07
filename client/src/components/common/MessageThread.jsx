import React from 'react';

/**
 * MessageThread component
 * Renders a list of messages differentiating between sent and received messages.
 *
 * @param {Object} props
 * @param {Array} props.messages - Array of message objects: { id/ _id, senderId/sender, text/content, timestamp/createdAt }
 * @param {string} props.currentUserId - The ID of the current logged-in user
 * @param {string} [props.sentBgClass] - Tailwind background color for sent messages (defaults to bg-brand-600 or solid blue/green)
 * @param {string} [props.receivedBgClass] - Tailwind background color for received messages (defaults to bg-gray-100)
 */
export default function MessageThread({
  messages = [],
  currentUserId,
  sentBgClass = 'bg-brand-600 text-white',
  receivedBgClass = 'bg-gray-100 text-gray-950',
}) {
  // Normalize current user ID
  const myId = String(currentUserId || '').toLowerCase().trim();

  // Helper to extract fields from either specific user schemas or mongoose schema
  const getMessageDetails = (msg) => {
    const id = msg.id || msg._id || Math.random().toString();
    
    // senderId can come from message.senderId or mongoose object message.sender._id / id
    let senderId = msg.senderId;
    if (!senderId && msg.sender) {
      senderId = typeof msg.sender === 'object' ? (msg.sender._id || msg.sender.id) : msg.sender;
    }
    
    const text = msg.text || msg.content || '';
    const timestamp = msg.timestamp || msg.createdAt;
    
    // Normalize sender id
    const normalizedSenderId = String(senderId || '').toLowerCase().trim();
    const isSentByMe = normalizedSenderId === myId;
    
    // Get sender info for profile avatar
    const senderName = typeof msg.sender === 'object' ? msg.sender.name : 'User';
    const senderAvatar = typeof msg.sender === 'object' ? msg.sender.avatar : null;
    const senderRole = typeof msg.sender === 'object' ? msg.sender.role : null;

    return {
      id,
      senderId: normalizedSenderId,
      text,
      timestamp,
      isSentByMe,
      senderName,
      senderAvatar,
      senderRole
    };
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    try {
      const date = new Date(timeStr);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="flex flex-col space-y-4 p-4 overflow-y-auto w-full h-full bg-white">
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full text-gray-400 text-sm">
          No messages yet.
        </div>
      ) : (
        messages.map((msg, index) => {
          const {
            id,
            text,
            timestamp,
            isSentByMe,
            senderName,
            senderAvatar,
            senderRole
          } = getMessageDetails(msg);

          return (
            <div
              key={id || index}
              className={`flex items-end gap-3 w-full ${isSentByMe ? 'justify-end' : 'justify-start'}`}
            >
              {/* Profile Avatar Placeholder for Received Messages */}
              {!isSentByMe && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 border border-gray-300 flex items-center justify-center text-xs font-bold text-gray-600 select-none" title={senderName}>
                  {senderAvatar ? (
                    <img
                      src={senderAvatar}
                      alt={senderName}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span>{senderName ? senderName.charAt(0).toUpperCase() : 'U'}</span>
                  )}
                </div>
              )}

              {/* Message Bubble & Meta */}
              <div className={`flex flex-col max-w-[70%] ${isSentByMe ? 'items-end' : 'items-start'}`}>
                {/* Bubble styling wrapper with strict custom border-radius requirements */}
                <div
                  className={`px-4 py-2.5 text-sm leading-relaxed break-words shadow-sm ${
                    isSentByMe
                      ? `${sentBgClass} rounded-[18px] rounded-br-[2px]` // Sent: align right, solid blue/green, sharp bottom-right
                      : `${receivedBgClass} rounded-[18px] rounded-bl-[2px]` // Received: align left, light gray, sharp bottom-left
                  }`}
                  style={{
                    wordBreak: 'break-word',
                  }}
                >
                  <p className="whitespace-pre-wrap">{text}</p>
                </div>

                {/* Timestamp */}
                <span className="text-[10px] text-gray-400 mt-1 px-1">
                  {formatTime(timestamp)}
                </span>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
