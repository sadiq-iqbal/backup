import { useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Star, Clock, DollarSign, CheckCircle, User, MapPin, Dumbbell, Lock, ArrowRight, ChevronRight, Gavel, Gift, MessageCircle, X as XIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import PageTransition from '../components/common/PageTransition';
import BidChatPanel from '../components/common/BidChatPanel';

function BidForm({ postId, budgetMax, onSuccess }) {
  const [form, setForm] = useState({ proposal: '', price: '', estimatedWeeks: '', introOffer: '' });
  const { mutate, isPending } = useMutation({
    mutationFn: (data) => api.post('/bids', { ...data, post: postId }),
    onSuccess: () => { toast.success('Bid submitted!'); onSuccess?.(); },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to submit bid'),
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); mutate({ ...form, price: Number(form.price), estimatedWeeks: Number(form.estimatedWeeks) }); }} className="space-y-4">
      <div>
        <label className="label font-semibold text-gray-700">Your proposal</label>
        <textarea className="input min-h-32 resize-y" placeholder="Describe your approach, methodology, and why you're the best fit…" value={form.proposal} onChange={e => setForm({ ...form, proposal: e.target.value })} required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label font-semibold text-gray-700">Your price ($/month, max ${budgetMax})</label>
          <div className="relative">
            <DollarSign size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input className="input pl-8" type="number" min="1" max={budgetMax} placeholder={budgetMax} value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} required />
          </div>
        </div>
        <div>
          <label className="label font-semibold text-gray-700">Estimated weeks</label>
          <div className="relative">
            <Clock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input className="input pl-8" type="number" min="1" placeholder="8" value={form.estimatedWeeks} onChange={e => setForm({ ...form, estimatedWeeks: e.target.value })} required />
          </div>
        </div>
      </div>
      <div>
        <label className="label font-semibold text-gray-700">Intro offer <span className="text-gray-400 font-medium">(optional)</span></label>
        <input className="input" placeholder="e.g. First week free, free initial assessment…" value={form.introOffer} onChange={e => setForm({ ...form, introOffer: e.target.value })} />
      </div>
      <button type="submit" className="btn-primary w-full py-3 shadow-glow-sm" disabled={isPending}>
        {isPending ? (
          <span className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            Submitting…
          </span>
        ) : 'Submit Bid'}
      </button>
    </form>
  );
}

export default function PostDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [showBidForm, setShowBidForm] = useState(false);
  const [chatTarget, setChatTarget] = useState(null); // { _id, name, avatar, role }

  const { data: postData } = useQuery({ queryKey: ['post', id], queryFn: () => api.get(`/posts/${id}`).then(r => r.data) });
  const { data: bidsData } = useQuery({
    queryKey: ['post-bids', id],
    queryFn: () => api.get(`/posts/${id}/bids`).then(r => r.data),
    enabled: user?.role === 'client' || user?.role === 'admin',
  });

  const post = postData?.post;
  const bids = bidsData?.bids || [];
  const isOwner = (post?.client?._id || post?.client) === user?._id;

  const { data: dmThreadsData } = useQuery({
    queryKey: ['post-dm-threads', id],
    queryFn: () => api.get(`/dm/post-threads/${id}`).then(r => r.data),
    enabled: !!user && !!id,
    refetchInterval: 15000,
  });
  const dmThreads = dmThreadsData?.threads || [];

  const acceptBid = useMutation({
    mutationFn: (bidId) => api.put(`/bids/${bidId}/accept`),
    onSuccess: () => {
      toast.success('Bid accepted! Engagement created.');
      qc.invalidateQueries({ queryKey: ['post', id] });
      qc.invalidateQueries({ queryKey: ['engagements'] });
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed'),
  });

  const rejectBid = useMutation({
    mutationFn: (bidId) => api.put(`/bids/${bidId}/reject`),
    onSuccess: () => {
      toast.success('Bid rejected.');
      qc.invalidateQueries({ queryKey: ['post-bids', id] });
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed'),
  });

  const trainerHired = bids.some(b => b.status === 'accepted' && b.professional?.role === 'trainer');
  const nutritionistHired = bids.some(b => b.status === 'accepted' && b.professional?.role === 'nutritionist');
  const canBid = (post?.status === 'open' || post?.status === 'in_progress') && (
    (user?.role === 'trainer' && post?.needsTrainer && !trainerHired) ||
    (user?.role === 'nutritionist' && post?.needsNutritionist && !nutritionistHired)
  );

  if (!post) return (
    <div className="space-y-4 animate-pulse max-w-3xl">
      <div className="card"><div className="h-6 bg-gray-200 rounded w-2/3 mb-4" /><div className="h-4 bg-gray-100 rounded w-full mb-2" /><div className="h-4 bg-gray-100 rounded w-4/5" /></div>
    </div>
  );

  if (user?.role === 'client' && !isOwner) {
    return (
      <div className="max-w-md mx-auto mt-16 card text-center py-14">
        <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Lock size={24} className="text-red-400" />
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-500 text-sm mb-6 font-medium">You can only view your own requests.</p>
        <Link to="/posts" className="btn-primary">Back to My Requests</Link>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="max-w-3xl space-y-5">
        {/* Post card */}
        <div className="card bg-white">
          <div className="flex items-start justify-between gap-4 mb-4">
            <h1 className="text-xl font-black text-gray-950 tracking-tight">{post.title}</h1>
            <span className={`badge shrink-0 font-bold ${post.status === 'open' ? 'badge-green' : post.status === 'in_progress' ? 'badge-yellow' : 'badge-gray'}`}>
              {post.status?.replace('_', ' ')}
            </span>
          </div>
          <p className="text-gray-600 whitespace-pre-wrap mb-4 font-medium leading-relaxed">{post.description}</p>

          {post.age && (
            <div className="mb-4 p-4 bg-gray-50/80 rounded-2xl border border-gray-100 grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[['Age', `${post.age} years`], ['Gender', post.gender?.replace('-', ' ')], ['Height', `${post.heightCm} cm`], ['Weight', `${post.weightKg} kg`]].map(([label, value]) => (
                <div key={label}>
                  <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">{label}</div>
                  <div className="font-bold text-gray-900 capitalize">{value}</div>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags?.map(t => <span key={t} className="badge-blue font-semibold text-xs">{t}</span>)}
            {post.needsTrainer && !trainerHired && <span className="badge-green font-semibold text-xs">Trainer needed</span>}
            {post.needsNutritionist && !nutritionistHired && <span className="badge-yellow font-semibold text-xs">Nutritionist needed</span>}
          </div>

          <div className="flex flex-wrap gap-5 text-sm text-gray-500 border-t border-gray-100 pt-4 font-medium">
            <div className="flex items-center gap-1.5"><DollarSign size={14} />${post.budgetMin}–${post.budgetMax}/month</div>
            <div className="flex items-center gap-1.5"><Clock size={14} />{post.durationWeeks} weeks</div>
            {post.trainingLocation && <div className="flex items-center gap-1.5 capitalize"><MapPin size={14} />{post.trainingLocation === 'any' ? 'Flexible Location' : post.trainingLocation}</div>}
            <div>{post.bidCount} bid{post.bidCount !== 1 ? 's' : ''}</div>
            <div className="text-gray-400">Posted {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</div>
          </div>

          {post.equipmentAvailable && (
            <div className="mt-4 p-3.5 bg-gray-50 rounded-xl text-sm border border-gray-100">
              <div className="font-bold text-gray-700 flex items-center gap-1.5 mb-1"><Dumbbell size={14} />Available Equipment</div>
              <p className="text-gray-600 font-medium">{post.equipmentAvailable}</p>
            </div>
          )}
        </div>

        {/* Professional: Chat with Client card */}
        {!isOwner && (user?.role === 'trainer' || user?.role === 'nutritionist') && (
          <div className="card bg-white border-brand-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 shadow-sm">
            <div>
              <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <MessageCircle size={18} className="text-brand-600" />
                Chat with Client
              </h3>
              <p className="text-xs text-gray-500 font-medium mt-1">Discuss requirements, ask questions, or negotiate terms directly.</p>
            </div>
            <button
              onClick={() => setChatTarget({ _id: post.client?._id || post.client, name: post.client?.name || 'Client', avatar: post.client?.avatar, role: 'client' })}
              className="btn-primary text-sm py-2 px-5 flex items-center gap-2 font-bold shrink-0 shadow-glow-sm w-full sm:w-auto justify-center"
            >
              <MessageCircle size={16} /> Open Chat
            </button>
          </div>
        )}

        {/* Client: Direct Messages & Inquiries section */}
        {isOwner && dmThreads.length > 0 && (
          <div className="card bg-white border border-brand-100">
            <h2 className="text-lg font-bold text-gray-950 mb-3 tracking-tight flex items-center justify-between">
              <span>Direct Messages ({dmThreads.length})</span>
              <span className="text-xs font-bold text-brand-600 bg-brand-50 px-2.5 py-1 rounded-full">Pre-Bid Inquiries</span>
            </h2>
            <div className="divide-y divide-gray-100">
              {dmThreads.map(thread => (
                <div key={thread.other._id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center font-bold text-gray-600 shrink-0 overflow-hidden">
                      {thread.other.avatar
                        ? <img src={thread.other.avatar} alt={thread.other.name} className="w-10 h-10 rounded-xl object-cover" />
                        : <span>{thread.other.name?.charAt(0)}</span>
                      }
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 text-sm truncate">{thread.other.name}</span>
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-brand-50 text-brand-700 capitalize">{thread.other.role}</span>
                        {thread.unreadCount > 0 && (
                          <span className="text-[10px] bg-red-500 text-white font-bold px-1.5 py-0.5 rounded-full">{thread.unreadCount} new</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate font-medium mt-0.5">{thread.lastMessage?.content}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setChatTarget(thread.other)}
                    className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 font-bold shrink-0"
                  >
                    <MessageCircle size={14} /> Open Chat
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bid submitted */}
        {canBid && post.hasBidded && (
          <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="card border-green-200 bg-green-50 text-center py-8">
            <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <CheckCircle size={24} className="text-green-500" />
            </div>
            <h2 className="font-bold text-green-900 mb-1">Bid Submitted Successfully</h2>
            <p className="text-sm text-green-700 font-medium">Your proposal is under review by the client. Good luck!</p>
          </motion.div>
        )}

        {/* Bid prompt */}
        {canBid && !post.hasBidded && !showBidForm && (
          <div className="card border-brand-200 bg-brand-50/40">
            <h2 className="font-bold mb-1 text-gray-900">Interested in this client?</h2>
            <p className="text-sm text-gray-600 mb-4 font-medium">Submit a competitive proposal and pitch your expertise.</p>
            <button className="btn-primary shadow-glow-sm" onClick={() => setShowBidForm(true)}>
              Submit a Bid <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* Bid form */}
        {canBid && !post.hasBidded && showBidForm && (
          <div className="card bg-white">
            <h2 className="font-bold mb-5 text-gray-900">Your Bid</h2>
            <BidForm postId={id} budgetMax={post.budgetMax} onSuccess={() => {
              setShowBidForm(false);
              qc.invalidateQueries({ queryKey: ['post', id] });
            }} />
          </div>
        )}

        {/* Bids received */}
        {isOwner && bids.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-gray-950 mb-4 tracking-tight">Bids Received ({bids.length})</h2>
            <div className="space-y-4">
              {bids.map(bid => (
                <motion.div
                  key={bid._id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`card bg-white ${bid.status === 'accepted' ? 'border-green-200 bg-green-50/30' : ''}`}
                >
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <Link to={`/profile/${bid.professional?._id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                      <div className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 font-black text-lg shadow-sm overflow-hidden">
                        {bid.professional?.avatar
                          ? <img src={bid.professional.avatar} alt={bid.professional.name} className="w-11 h-11 rounded-xl object-cover" />
                          : bid.professional?.name?.charAt(0)
                        }
                      </div>
                      <div>
                        <div className="font-bold text-gray-950">{bid.professional?.name}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-[10px] uppercase font-bold tracking-wide px-1.5 py-0.5 rounded-md ${bid.professional?.role === 'trainer' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                            {bid.professional?.role}
                          </span>
                          {bid.professional?.isVerified && <span className="text-xs text-brand-600 font-bold">· ✓ Verified</span>}
                        </div>
                      </div>
                    </Link>
                    <div className="text-right shrink-0">
                      <div className="font-black text-gray-950 text-lg">${bid.price}<span className="text-sm text-gray-400 font-medium">/mo</span></div>
                      <div className="text-xs text-gray-400 font-medium">{bid.estimatedWeeks} weeks</div>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 mb-3 whitespace-pre-wrap leading-relaxed font-medium">{bid.proposal}</p>

                  {bid.introOffer && (
                    <div className="flex items-center gap-2 text-xs text-brand-600 font-bold mb-4 p-2.5 bg-brand-50 rounded-xl border border-brand-100">
                      <Gift size={14} className="shrink-0" />
                      {bid.introOffer}
                    </div>
                  )}

                  {bid.status === 'accepted' ? (
                    <span className="badge-green font-bold">Accepted</span>
                  ) : bid.status === 'rejected' ? (
                    <span className="badge-red font-bold">Rejected</span>
                  ) : (
                    <div className="flex gap-2 pt-2 border-t border-gray-100">
                      <button
                        className="btn-primary text-sm py-2 shadow-glow-sm"
                        onClick={() => acceptBid.mutate(bid._id)}
                        disabled={acceptBid.isPending}
                      >
                        {acceptBid.isPending ? 'Accepting…' : 'Accept Bid'}
                      </button>
                      <button
                        className="btn-secondary text-sm py-2 text-red-500 border-red-200 hover:bg-red-50"
                        onClick={() => { if (window.confirm('Reject this bid?')) rejectBid.mutate(bid._id); }}
                        disabled={rejectBid.isPending}
                      >
                        {rejectBid.isPending ? 'Rejecting…' : 'Reject'}
                      </button>
                      <button
                        className="btn-secondary text-sm py-2 flex items-center gap-1.5"
                        onClick={() => setChatTarget({ _id: bid.professional?._id, name: bid.professional?.name, avatar: bid.professional?.avatar, role: bid.professional?.role })}
                      >
                        <MessageCircle size={14} /> Message
                      </button>
                      <Link to={`/profile/${bid.professional?._id}`} className="btn-secondary text-sm py-2">View Profile</Link>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {isOwner && bids.length === 0 && (
          <div className="card text-center py-14 border-dashed border-2 border-gray-100">
            <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <User size={24} className="text-gray-300" />
            </div>
            <p className="font-bold text-gray-700">No bids yet</p>
            <p className="text-sm mt-1 text-gray-400 font-medium">Professionals will start submitting bids soon. Check back later!</p>
          </div>
        )}
      </div>

      {/* Chat panel */}
      {chatTarget && (
        <BidChatPanel
          postId={id}
          otherUser={chatTarget}
          onClose={() => setChatTarget(null)}
        />
      )}
    </PageTransition>
  );
}
