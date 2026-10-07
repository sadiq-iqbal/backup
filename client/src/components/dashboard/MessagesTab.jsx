import { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { io } from 'socket.io-client';
import api from '../../services/api';
import { Send } from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import toast from 'react-hot-toast';

function getInitials(name = '') {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function getRoleColor(role) {
  if (role === 'trainer') return 'bg-green-500';
  if (role === 'nutritionist') return 'bg-yellow-500';
  return 'bg-blue-500';
}

function getRoleBubbleStyle(role) {
  if (role === 'trainer') return 'bg-green-50 text-gray-900 border-green-200';
  if (role === 'nutritionist') return 'bg-amber-50 text-gray-900 border-amber-200';
  return 'bg-blue-50 text-gray-900 border-blue-200';
}

function formatTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isToday(d)) return format(d, 'h:mm a');
  if (isYesterday(d)) return `Yesterday ${format(d, 'h:mm a')}`;
  return format(d, 'MMM d, h:mm a');
}

export default function MessagesTab({ engagementId, user, engagement }) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [connected, setConnected] = useState(false);
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimeout = useRef(null);
  const socketRef = useRef(null);
  const queryClient = useQueryClient();
  // Track message IDs we sent in this session for reliable "isMine" detection
  const sentByMe = useRef(new Set());

  // Normalize any ID value to a plain lowercase hex string
  const normalizeId = (val) => {
    if (!val) return '';
    const s = typeof val === 'object' ? (val.toString ? val.toString() : JSON.stringify(val)) : String(val);
    return s.toLowerCase().trim();
  };

  const myId = normalizeId(user?._id || user?.id);
  const teamMembers = [engagement?.client, engagement?.trainer, engagement?.nutritionist].filter(Boolean);

  const clearUnreadIndicators = () => {
    queryClient.setQueryData(['engagement', engagementId], (current) => (
      current ? { ...current, unreadMessagesCount: 0 } : current
    ));
    queryClient.invalidateQueries({ queryKey: ['messages-unread-count'] });
  };

  const isMine = (msg) => {
    // 1) Check our session-sent set first (most reliable)
    if (msg._id && sentByMe.current.has(String(msg._id))) return true;
    if (msg.tempId && sentByMe.current.has(msg.tempId)) return true;
    // 2) Normalize and compare sender ID vs current user ID
    const senderId = normalizeId(msg.sender?._id || msg.sender?.id || msg.sender);
    if (!senderId || !myId) return false;
    return senderId === myId;
  };

  const { data, isLoading } = useQuery({
    queryKey: ['messages', engagementId],
    queryFn: () => api.get(`/messages/${engagementId}`).then(r => r.data),
  });

  useEffect(() => {
    if (data?.messages) {
      setMessages(data.messages);
      clearUnreadIndicators();
    }
  }, [data]);

  useEffect(() => {
    const token = localStorage.getItem('fitbid_token');
    // In production, connect directly to the backend server URL.
    // VITE_SOCKET_URL can be set explicitly, or derived from VITE_API_URL.
    // In dev, Vite's proxy handles socket.io, so we use '' (relative).
    const socketUrl = import.meta.env.VITE_SOCKET_URL ||
      (import.meta.env.VITE_API_URL
        ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '')
        : '');
    const activeSocket = io(socketUrl, { auth: { token }, transports: ['websocket', 'polling'] });
    socketRef.current = activeSocket;

    activeSocket.on('connect', () => {
      activeSocket.emit('join_engagement', engagementId, ({ ok }) => {
        setConnected(Boolean(ok));
        if (ok) clearUnreadIndicators();
      });
    });
    activeSocket.on('disconnect', () => setConnected(false));

    activeSocket.on('new_message', (msg) => {
      setMessages(prev => {
        // Remove any optimistic version of this message
        const filtered = prev.filter(m => !m._isOptimistic || m.tempId !== msg.tempId);
        return [...filtered, msg];
      });
      activeSocket.emit('mark_read', { engagementId }, ({ ok }) => {
        if (ok) clearUnreadIndicators();
      });
    });

    activeSocket.on('user_typing', ({ userId }) => {
      if (normalizeId(userId) !== myId) {
        setTyping(true);
        clearTimeout(typingTimeout.current);
        typingTimeout.current = setTimeout(() => setTyping(false), 2500);
      }
    });
    activeSocket.on('user_stop_typing', () => setTyping(false));
    activeSocket.on('chat_error', ({ message: errorMessage, tempId }) => {
      if (tempId) setMessages((current) => current.filter((item) => item.tempId !== tempId));
      toast.error(errorMessage || 'Team chat is unavailable');
    });

    return () => {
      activeSocket.disconnect();
      if (socketRef.current === activeSocket) socketRef.current = null;
      clearTimeout(typingTimeout.current);
    };
  }, [engagementId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const sendMessage = (e) => {
    e.preventDefault();
    const content = message.trim();
    const activeSocket = socketRef.current;
    if (!content || !activeSocket || !connected) return;

    // Add an optimistic message immediately (definitely from me)
    const tempId = `temp-${Date.now()}`;
    const optimistic = {
      tempId,
      _isOptimistic: true,
      sender: { _id: myId, id: myId, name: user?.name, role: user?.role },
      content,
      createdAt: new Date().toISOString(),
    };
    sentByMe.current.add(tempId);
    setMessages(prev => [...prev, optimistic]);

    activeSocket.emit('send_message', { engagementId, content, tempId });
    activeSocket.emit('stop_typing', { engagementId });
    setMessage('');
    inputRef.current?.focus();
  };

  const handleTyping = (e) => {
    setMessage(e.target.value);
    const activeSocket = socketRef.current;
    if (activeSocket && connected) {
      activeSocket.emit('typing', { engagementId });
      clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => activeSocket.emit('stop_typing', { engagementId }), 1500);
    }
  };

  // When server sends back new_message, mark it in sentByMe if it's ours
  // (by checking sender ID)
  useEffect(() => {
    messages.forEach(msg => {
      if (msg._id && normalizeId(msg.sender?._id || msg.sender?.id || msg.sender) === myId) {
        sentByMe.current.add(String(msg._id));
      }
    });
  }, [messages]);

  return (
    <div className="flex h-[calc(100vh-285px)] min-h-[520px] flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_15px_45px_rgba(15,23,42,.06)] xl:h-[calc(100vh-300px)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4 lg:px-6">
        <div>
          <h2 className="font-extrabold tracking-tight text-slate-900">Team conversation</h2>
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
            {teamMembers.map((member) => (
              <span key={member._id} className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-500 capitalize">
                <span className={`w-1.5 h-1.5 rounded-full ${getRoleColor(member.role)}`} />
                {member.name} · {member.role}
              </span>
            ))}
          </div>
        </div>
        <span className={`text-xs flex items-center gap-1.5 font-medium ${connected ? 'text-green-600' : 'text-amber-500'}`}>
          <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-amber-400'}`} />
          {connected ? 'Live' : 'Reconnecting…'}
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-1 overflow-y-auto bg-slate-50/60 p-4 lg:px-8 lg:py-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400 text-sm">Loading messages…</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <Send size={20} className="text-blue-500" />
            </div>
            <p className="text-gray-500 text-sm font-medium">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const mine = isMine(msg);
            const prev = messages[i - 1];
            const prevSenderId = normalizeId(prev?.sender?._id || prev?.sender?.id || prev?.sender);
            const currSenderId = normalizeId(msg.sender?._id || msg.sender?.id || msg.sender);
            const isGrouped = prev && prevSenderId === currSenderId;

            return (
              <div
                key={msg._id || msg.tempId || i}
                className={`flex items-end gap-2 ${mine ? 'flex-row-reverse' : 'flex-row'} ${isGrouped ? 'mt-0.5' : 'mt-4'}`}
              >
                {/* Avatar */}
                {!mine && (
                  isGrouped
                    ? <div className="w-8 shrink-0" />
                    : (
                      <div title={`${msg.sender?.name} (${msg.sender?.role})`}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 mb-0.5 bg-gray-200 border border-gray-300 overflow-hidden">
                        {msg.sender?.avatar ? (
                          <img src={msg.sender.avatar} alt={msg.sender.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className={`w-full h-full flex items-center justify-center ${getRoleColor(msg.sender?.role)}`}>
                            {getInitials(msg.sender?.name)}
                          </div>
                        )}
                      </div>
                    )
                )}

                {/* Bubble */}
                <div className={`flex max-w-[78%] flex-col lg:max-w-[62%] xl:max-w-[52%] ${mine ? 'items-end' : 'items-start'}`}>
                  {/* Sender label (only first in group, only for others) */}
                  {!mine && !isGrouped && msg.sender?.name && (
                    <span className="text-[11px] text-gray-500 font-semibold mb-1 ml-1 capitalize">
                      {msg.sender.name}
                      {msg.sender.role && <span className="font-normal text-gray-400"> · {msg.sender.role}</span>}
                    </span>
                  )}
                  {mine && !isGrouped && (
                    <span className="text-[11px] text-brand-600 font-semibold mb-1 mr-1 capitalize">You · {user?.role}</span>
                  )}

                  {/* Message bubble */}
                  <div
                    className={`px-4 py-2.5 text-sm leading-relaxed break-words shadow-sm ${
                      mine
                        ? 'rounded-2xl rounded-br-sm bg-slate-950 text-white ring-1 ring-slate-900/10'
                        : `${getRoleBubbleStyle(msg.sender?.role)} border rounded-2xl rounded-bl-sm`
                    } ${msg._isOptimistic ? 'opacity-70' : 'opacity-100'}`}
                  >
                    {msg.content}
                  </div>

                  {/* Time */}
                  <span className="text-[10px] text-gray-400 mt-1 px-1 font-semibold">
                    {formatTime(msg.createdAt)}
                    {msg._isOptimistic && <span className="ml-1">· Sending…</span>}
                  </span>
                </div>
              </div>
            );
          })
        )}

        {/* Typing indicator */}
        {typing && (
          <div className="flex items-end gap-2 mt-4">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200 shrink-0">
              <div className="flex gap-0.5">
                <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" />
                <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
            <div className="bg-gray-100 rounded-3xl rounded-bl-sm px-4 py-3 flex gap-1 items-center text-xs text-gray-500 font-medium">
              Typing...
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-slate-100 bg-white px-4 py-3.5 lg:px-6 lg:py-4">
        <form onSubmit={sendMessage} className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${getRoleColor(user?.role)}`}>
            {getInitials(user?.name)}
          </div>
          <input
            ref={inputRef}
            className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none transition-all placeholder:text-slate-400 focus:border-emerald-300 focus:bg-white focus:ring-2 focus:ring-emerald-100"
            placeholder="Type a message…"
            value={message}
            maxLength={5000}
            onChange={handleTyping}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage(e)}
          />
          <button
            type="submit"
            disabled={!message.trim() || !connected}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-emerald-300 shadow-sm transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Send size={15} />
          </button>
        </form>
      </div>
    </div>
  );
}
