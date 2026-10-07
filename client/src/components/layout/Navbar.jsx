import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, LogOut, Check, Clock, ExternalLink, MessageSquare, Dumbbell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import MessageBadgeIcon from '../common/MessageBadgeIcon';
import MessagesInboxModal from '../common/MessagesInboxModal';
import BidChatPanel from '../common/BidChatPanel';

const formatRelativeTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  if (isNaN(diffMs) || diffMs < 0) return 'just now';
  
  const diffSecs = Math.floor(diffMs / 1000);
  if (diffSecs < 60) return 'just now';
  
  const diffMins = Math.floor(diffSecs / 60);
  if (diffMins < 60) return `${diffMins}m ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [isInboxOpen, setIsInboxOpen] = useState(false);
  const [activeChatTarget, setActiveChatTarget] = useState(null); // { postId, otherUser }
  const dropdownRef = useRef(null);

  const { data } = useQuery({
    queryKey: ['notifications-count'],
    queryFn: () => api.get('/notifications').then(r => r.data),
    enabled: !!user,
    refetchInterval: 30000,
  });

  const { data: messagesUnreadData } = useQuery({
    queryKey: ['messages-unread-count'],
    queryFn: () => api.get('/messages/unread/count').then(r => r.data),
    enabled: !!user,
    refetchInterval: 15000,
  });

  const { data: dmUnreadData } = useQuery({
    queryKey: ['dm-unread-count'],
    queryFn: () => api.get('/dm/unread/count').then(r => r.data),
    enabled: !!user,
    refetchInterval: 15000,
  });

  const totalUnreadMessages = (messagesUnreadData?.unreadCount || 0) + (dmUnreadData?.unreadCount || 0);

  const handleMessageIconClick = () => {
    setIsInboxOpen(true);
  };

  const markAsReadMutation = useMutation({
    mutationFn: (id) => api.put(`/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-count'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => api.put('/notifications/read-all'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-count'] });
    },
  });

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleNotificationClick = (notif) => {
    if (!notif.read) {
      markAsReadMutation.mutate(notif._id);
    }
    setIsOpen(false);
    if (notif.link) {
      navigate(notif.link);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex min-h-[68px] items-center justify-between border-b border-slate-200/70 bg-white/80 px-4 py-3 backdrop-blur-xl sm:px-6 xl:px-10">
        <Link to={user ? '/dashboard' : '/'} className="group flex items-center gap-2.5 md:hidden">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-emerald-300 shadow-sm transition-transform group-hover:scale-105">
            <Dumbbell size={17} strokeWidth={2.5} />
          </span>
          <span className="text-xl font-black tracking-tight text-slate-950">Fit<span className="text-emerald-600">Bid</span></span>
        </Link>

        <div className="hidden md:block">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Your workspace</p>
          <p className="text-sm font-bold text-slate-800">Stay focused. Keep moving.</p>
        </div>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2.5">
          {user ? (
            <>
              <MessageBadgeIcon
                count={totalUnreadMessages}
                onClick={handleMessageIconClick}
                icon={MessageSquare}
              />

              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsOpen(!isOpen)}
                  className={`relative flex h-10 w-10 items-center justify-center rounded-xl border transition-all ${isOpen ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200/80 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-900'}`}
                  title="Notifications"
                >
                  <Bell size={20} />
                  {data?.unreadCount > 0 && (
                    <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                      {data.unreadCount > 9 ? '9+' : data.unreadCount}
                    </span>
                  )}
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      className="absolute right-0 mt-2 w-80 sm:w-96 bg-white/95 backdrop-blur-md rounded-2xl shadow-float border border-surface-200/60 py-2 z-50 origin-top-right"
                    >
                      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
                        <h3 className="font-bold text-gray-950 text-sm">Notifications</h3>
                        {data?.unreadCount > 0 && (
                          <button
                            onClick={() => markAllReadMutation.mutate()}
                            className="text-xs text-brand-600 hover:text-brand-700 font-semibold flex items-center gap-1 transition-colors"
                          >
                            <Check size={14} />
                            Mark all as read
                          </button>
                        )}
                      </div>

                      <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
                        {data?.notifications && data.notifications.length > 0 ? (
                          data.notifications.map((notif) => (
                            <div
                              key={notif._id}
                              onClick={() => handleNotificationClick(notif)}
                              className={`p-4 flex gap-3 hover:bg-gray-50/80 cursor-pointer transition-colors ${!notif.read ? 'bg-brand-50/40 hover:bg-brand-50/70' : ''}`}
                            >
                              <div className="flex-shrink-0 mt-1">
                                {!notif.read ? (
                                  <span className="flex h-2 w-2 rounded-full bg-brand-500 mt-1.5" />
                                ) : (
                                  <span className="flex h-2 w-2 rounded-full bg-transparent mt-1.5" />
                                )}
                              </div>

                              <div className="flex-1 min-w-0">
                                <p className={`text-xs text-gray-800 leading-relaxed ${!notif.read ? 'font-medium text-gray-950' : 'text-gray-600'}`}>
                                  {notif.message}
                                </p>
                                <div className="flex items-center gap-2 mt-1.5">
                                  <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                                    <Clock size={10} />
                                    {formatRelativeTime(notif.createdAt)}
                                  </span>
                                  {notif.link && (
                                    <span className="text-[10px] text-brand-600 font-medium flex items-center gap-0.5">
                                      View details <ExternalLink size={10} />
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="py-8 px-4 text-center">
                            <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-3">
                              <Bell size={20} className="text-gray-400" />
                            </div>
                            <p className="text-sm font-semibold text-gray-900">All caught up!</p>
                            <p className="text-xs text-gray-400 mt-1">You have no new notifications.</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <Link to="/profile/edit" className="ml-0.5 flex items-center gap-2.5 rounded-xl p-1 pr-1 sm:pr-2.5 text-sm text-gray-700 transition-colors hover:bg-slate-50 hover:text-brand-600">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="h-9 w-9 rounded-xl object-cover ring-1 ring-slate-200" />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-xs font-bold text-emerald-300 shadow-sm">
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="hidden text-left sm:block">
                  <span className="block max-w-32 truncate text-xs font-bold text-slate-900">{user.name}</span>
                  <span className="block text-[10px] font-semibold capitalize text-slate-400">{user.role}</span>
                </span>
              </Link>
              <button onClick={handleLogout} className="hidden h-10 w-10 items-center justify-center rounded-xl border border-slate-200/80 bg-white text-slate-400 transition-all hover:border-red-100 hover:bg-red-50 hover:text-red-600 sm:flex" title="Log out">
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="btn-secondary text-sm py-1.5">Log in</Link>
              <Link to="/register" className="btn-primary text-sm py-1.5">Sign up</Link>
            </div>
          )}
        </div>
      </header>

      {/* Global Inbox Modal */}
      <MessagesInboxModal
        isOpen={isInboxOpen}
        onClose={() => setIsInboxOpen(false)}
        onSelectDmThread={({ postId, otherUser }) => {
          setActiveChatTarget({ postId, otherUser });
        }}
      />

      {/* Global Chat Panel */}
      {activeChatTarget && (
        <BidChatPanel
          postId={activeChatTarget.postId}
          otherUser={activeChatTarget.otherUser}
          onClose={() => setActiveChatTarget(null)}
        />
      )}
    </>
  );
}
