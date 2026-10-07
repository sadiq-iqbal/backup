import React from 'react';
import { MessageSquare } from 'lucide-react';

/**
 * MessageBadgeIcon component
 * Displays an icon (e.g., message/bell) with a dynamic unread badge count in the top-right.
 * Hides completely from the DOM if the count is 0.
 *
 * @param {Object} props
 * @param {number} props.count - Number of unread notifications/messages
 * @param {React.Component} [props.icon] - Optional custom Lucide icon component (defaults to MessageSquare)
 * @param {function} [props.onClick] - Click event handler
 * @param {string} [props.className] - Additional classes for the button container
 */
export default function MessageBadgeIcon({ count, icon: Icon = MessageSquare, onClick, className = '' }) {
  const displayCount = count > 99 ? '99+' : count;

  return (
    <button
      onClick={onClick}
      className={`relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500/30 ${className}`}
      title="Messages"
    >
      <Icon size={20} className="w-5 h-5" />
      {count > 0 && (
        <span 
          id="message-badge-count"
          className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm select-none animate-in zoom-in duration-200"
        >
          {displayCount}
        </span>
      )}
    </button>
  );
}
