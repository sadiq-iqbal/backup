import { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { io } from 'socket.io-client';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { X, Send, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

let socket = null;
let socketToken = null;

const normalizeId = (value) => String(value?._id || value?.id || value || '');

function getSocket() {
  const token = localStorage.getItem('fitbid_token');
  if (!socket || socketToken !== token) {
    socket?.disconnect();
    const url = import.meta.env.VITE_API_URL?.replace('/api', '') || window.location.origin;
    socket = io(url, { auth: { token }, transports: ['websocket', 'polling'] });
    socketToken = token;
  }
  return socket;
}

export default function BidChatPanel({ postId, otherUser, onClose }) {
  const { user } = useAuth();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const scrollRef = useRef(null);
  const qc = useQueryClient();

  // Fetch existing messages
  const { data } = useQuery({
    queryKey: ['dm', postId, otherUser._id],
    queryFn: () => api.get(`/dm/${postId}/${otherUser._id}`).then(r => r.data),
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (data?.messages) setMessages(data.messages);
  }, [data]);

  // Socket.io real-time
  useEffect(() => {
    const s = getSocket();
    s.emit('join_dm', { postId, otherUserId: otherUser._id });
    s.emit('mark_dm_read', { postId, senderId: otherUser._id });

    const handler = (dm) => {
      setMessages(prev => {
        if (dm.tempId) {
          const exists = prev.some(m => m.tempId === dm.tempId);
          if (exists) return prev.map(m => m.tempId === dm.tempId ? dm : m);
        }
        if (prev.some(m => m._id === dm._id)) return prev;
        return [...prev, dm];
      });
      s.emit('mark_dm_read', { postId, senderId: otherUser._id });
    };

    const errorHandler = ({ message }) => {
      toast.error(message || 'The message could not be sent');
    };

    s.on('new_dm', handler);
    s.on('dm_error', errorHandler);
    return () => {
      s.off('new_dm', handler);
      s.off('dm_error', errorHandler);
    };
  }, [postId, otherUser._id]);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const tempId = `temp-${Date.now()}`;
    // Optimistic
    setMessages(prev => [...prev, {
      _id: tempId,
      tempId,
      content: input,
      sender: { _id: user._id || user.id, name: user.name, avatar: user.avatar, role: user.role },
      receiver: otherUser,
      createdAt: new Date().toISOString(),
    }]);
    getSocket().emit('send_dm', { postId, receiverId: otherUser._id, content: input, tempId });
    setInput('');
  };

  const myId = normalizeId(user);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        className="fixed inset-x-0 bottom-0 z-50 flex w-full flex-col overflow-hidden rounded-t-[1.5rem] border border-slate-200 bg-white shadow-[0_30px_80px_rgba(15,23,42,.28)] sm:inset-x-auto sm:bottom-4 sm:right-4 sm:w-[400px] sm:max-w-[calc(100vw-2rem)] sm:rounded-[1.5rem]"
        style={{ maxHeight: 'min(620px, 88vh)' }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-slate-100 bg-white px-4 py-3.5">
          <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-sm shrink-0 overflow-hidden">
            {otherUser.avatar
              ? <img src={otherUser.avatar} alt={otherUser.name} className="w-8 h-8 rounded-full object-cover" />
              : <span>{otherUser.name?.charAt(0)?.toUpperCase()}</span>
            }
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-gray-900 text-sm truncate">{otherUser.name}</div>
            <div className="flex items-center gap-1.5 text-[10px] font-semibold capitalize text-gray-400"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />{otherUser.role} · available</div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600">
            <X size={16} />
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-slate-50/80 p-4" style={{ minHeight: '280px' }}>
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-8">
              <div className="w-12 h-12 bg-brand-50 rounded-2xl flex items-center justify-center mb-3">
                <MessageCircle size={20} className="text-brand-400" />
              </div>
              <p className="text-sm text-gray-400 font-medium">Start a conversation</p>
              <p className="text-xs text-gray-300 mt-0.5">Discuss details before finalizing the bid</p>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isMine = normalizeId(msg.sender) === myId;
              return (
                <div key={msg._id || idx} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  {!isMine && (
                    <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-500 shrink-0 mr-2 mt-1 overflow-hidden">
                      {msg.sender?.avatar
                        ? <img src={msg.sender.avatar} className="w-6 h-6 rounded-full object-cover" alt="" />
                        : <span>{msg.sender?.name?.charAt(0)?.toUpperCase() || '?'}</span>
                      }
                    </div>
                  )}
                  <div className={`max-w-[75%] px-3.5 py-2 text-sm leading-relaxed break-words shadow-sm ${
                    isMine
                      ? 'bg-brand-600 text-white rounded-2xl rounded-br-sm ring-1 ring-brand-700/20'
                      : 'bg-white text-gray-900 rounded-2xl rounded-bl-sm border border-gray-200'
                  }`}>
                    <div className={`text-[10px] font-bold mb-1 ${isMine ? 'text-white/75 text-right' : 'text-brand-700'}`}>
                      {isMine ? 'You' : `${msg.sender?.name || otherUser.name} · ${msg.sender?.role || otherUser.role}`}
                    </div>
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    <div className={`text-[9px] mt-1 ${isMine ? 'text-white/50' : 'text-gray-300'}`}>
                      {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Input */}
        <form onSubmit={sendMessage} className="flex items-center gap-2 border-t border-slate-100 bg-white p-3 sm:p-4">
          <input
            className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-medium placeholder:text-slate-300 focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-all"
            placeholder="Type a message…"
            value={input}
            onChange={e => setInput(e.target.value)}
            autoFocus
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-emerald-300 shadow-sm transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <Send size={14} />
          </button>
        </form>
      </motion.div>
    </AnimatePresence>
  );
}
