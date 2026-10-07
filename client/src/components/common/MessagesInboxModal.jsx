import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { X, MessageSquare, ChevronRight, User, Dumbbell, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MessagesInboxModal({ isOpen, onClose, onSelectDmThread }) {
  const navigate = useNavigate();

  // Fetch pre-bid DMs
  const { data: dmData, isLoading: dmLoading } = useQuery({
    queryKey: ['dm-inbox'],
    queryFn: () => api.get('/dm/inbox/list').then(r => r.data),
    enabled: isOpen,
    refetchInterval: 15000,
  });

  // Fetch active engagements
  const { data: engData, isLoading: engLoading } = useQuery({
    queryKey: ['engagements'],
    queryFn: () => api.get('/engagements').then(r => r.data),
    enabled: isOpen,
  });

  if (!isOpen) return null;

  const dmThreads = dmData?.threads || [];
  const engagements = engData?.engagements || [];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-brand-50/50 to-white">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center font-bold">
                <MessageSquare size={18} />
              </div>
              <div>
                <h2 className="font-bold text-gray-950 text-base">Messages & Conversations</h2>
                <p className="text-xs text-gray-500 font-medium">Pre-bid chats and active engagements</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {/* Pre-bid Direct Messages */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Pre-Bid Inquiries</h3>
                <span className="text-[10px] font-bold bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full">{dmThreads.length}</span>
              </div>

              {dmLoading ? (
                <div className="py-4 text-center text-xs text-gray-400">Loading messages…</div>
              ) : dmThreads.length === 0 ? (
                <div className="p-4 rounded-2xl bg-gray-50 text-center text-xs text-gray-400 font-medium">
                  No pre-bid direct messages yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {dmThreads.map(thread => (
                    <div
                      key={`${thread.postId}:${thread.other?._id}`}
                      onClick={() => {
                        onClose();
                        if (thread.postId && thread.other) {
                          onSelectDmThread({ postId: thread.postId, otherUser: thread.other });
                        }
                      }}
                      className="p-3.5 rounded-2xl bg-white border border-gray-150 hover:border-brand-300 hover:bg-brand-50/20 cursor-pointer transition-all flex items-center justify-between gap-3 shadow-sm group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center font-bold text-gray-600 shrink-0 overflow-hidden">
                          {thread.other?.avatar
                            ? <img src={thread.other.avatar} alt={thread.other.name} className="w-10 h-10 rounded-xl object-cover" />
                            : <span>{thread.other?.name?.charAt(0)}</span>
                          }
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900 text-sm truncate">{thread.other?.name}</span>
                            <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-gray-100 text-gray-600 capitalize">{thread.other?.role}</span>
                            {thread.unread > 0 && (
                              <span className="text-[9px] bg-red-500 text-white font-bold px-1.5 py-0.5 rounded-full">{thread.unread} new</span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 truncate font-medium mt-0.5">{thread.lastMessage?.content}</p>
                          {thread.postTitle && <p className="text-[10px] text-brand-600 font-semibold truncate mt-0.5">Re: {thread.postTitle}</p>}
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-gray-300 group-hover:text-brand-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Active Engagements */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Active Engagements</h3>
                <span className="text-[10px] font-bold bg-green-50 text-green-700 px-2 py-0.5 rounded-full">{engagements.length}</span>
              </div>

              {engLoading ? (
                <div className="py-4 text-center text-xs text-gray-400">Loading engagements…</div>
              ) : engagements.length === 0 ? (
                <div className="p-4 rounded-2xl bg-gray-50 text-center text-xs text-gray-400 font-medium">
                  No active engagements right now.
                </div>
              ) : (
                <div className="space-y-2">
                  {engagements.map(eng => (
                    <div
                      key={eng._id}
                      onClick={() => {
                        onClose();
                        navigate(`/engagements/${eng._id}`);
                      }}
                      className="p-3.5 rounded-2xl bg-white border border-gray-150 hover:border-green-300 hover:bg-green-50/20 cursor-pointer transition-all flex items-center justify-between gap-3 shadow-sm group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-green-100 text-green-700 flex items-center justify-center font-bold shrink-0">
                          <Dumbbell size={18} />
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-gray-900 text-sm truncate">{eng.post?.title || 'Active Coaching'}</div>
                          <div className="text-xs text-gray-500 font-medium mt-0.5">Status: <span className="text-green-600 font-bold capitalize">{eng.status}</span></div>
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-gray-300 group-hover:text-green-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
