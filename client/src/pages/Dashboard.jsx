import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { motion } from 'framer-motion';
import {
  Dumbbell, Utensils, TrendingUp, Clock, CheckCircle,
  AlertCircle, PlusCircle, ChevronRight, Gavel, Star,
  Activity, Users, BarChart2, ShieldCheck
} from 'lucide-react';
import PageTransition from '../components/common/PageTransition';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 24 } }
};

const getMissingTeamRoles = (engagement) => [
  engagement.post?.needsTrainer && !engagement.trainer ? 'trainer' : null,
  engagement.post?.needsNutritionist && !engagement.nutritionist ? 'nutritionist' : null,
].filter(Boolean);

function StatCard({ icon: Icon, value, label, colorClass, bgClass }) {
  return (
    <motion.div variants={cardVariants} className="card flex items-center gap-3.5 p-4 sm:gap-4 sm:p-5">
      <div className={`w-11 h-11 sm:w-12 sm:h-12 ${bgClass} rounded-2xl flex items-center justify-center shrink-0`}>
        <Icon size={22} className={colorClass} />
      </div>
      <div>
        <div className="text-xl font-black tracking-tight text-gray-950 sm:text-2xl">{value}</div>
        <div className="text-xs font-semibold text-gray-500 sm:text-sm">{label}</div>
      </div>
    </motion.div>
  );
}

function ClientDashboard({ user }) {
  const { data: posts } = useQuery({ queryKey: ['my-posts'], queryFn: () => api.get('/posts/my').then(r => r.data) });
  const { data: engs } = useQuery({ queryKey: ['engagements'], queryFn: () => api.get('/engagements').then(r => r.data) });

  const activeEngagements = engs?.engagements?.filter(e => e.status === 'active') || [];
  const openPosts = posts?.posts?.filter(p => p.status === 'open' || p.status === 'in_progress') || [];
  const completedPosts = posts?.posts?.filter(p => p.status === 'completed') || [];

  return (
    <PageTransition>
      {/* Greeting Banner */}
      <div className="relative mb-6 overflow-hidden rounded-[1.75rem] bg-slate-950 p-6 shadow-[0_24px_60px_-28px_rgba(15,23,42,.65)] sm:mb-8 sm:p-8">
        <div className="absolute -right-16 -top-24 h-64 w-64 rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="absolute inset-0 bg-mesh opacity-10 pointer-events-none" />
        <div className="relative z-10">
          <p className="mb-1 text-xs font-bold uppercase tracking-[.16em] text-emerald-300">Welcome back</p>
          <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">{user.name.split(' ')[0]}</h1>
          <p className="mt-1 max-w-lg text-sm font-medium leading-relaxed text-slate-400 sm:text-base">Track your journey, review proposals and keep your wellness team moving together.</p>
          <Link to="/posts/new" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-5 py-2.5 text-sm font-extrabold text-slate-950 shadow-md transition-colors hover:bg-emerald-300">
            <PlusCircle size={16} /> Post New Request
          </Link>
        </div>
      </div>

      {/* Stats Row */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="mb-7 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4"
      >
        <StatCard icon={CheckCircle} value={activeEngagements.length} label="Active Engagements" colorClass="text-green-600" bgClass="bg-green-50" />
        <StatCard icon={Clock} value={openPosts.length} label="Open Requests" colorClass="text-blue-600" bgClass="bg-blue-50" />
        <StatCard icon={TrendingUp} value={completedPosts.length} label="Completed" colorClass="text-purple-600" bgClass="bg-purple-50" />
      </motion.div>

      {activeEngagements.length === 0 && openPosts.length === 0 ? (
        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}
          className="card text-center py-20 border-dashed border-2 border-brand-100"
        >
          <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <Dumbbell size={30} className="text-brand-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Ready to start your journey?</h2>
          <p className="text-gray-500 mb-6 font-medium text-sm max-w-sm mx-auto">Post your fitness goal and receive tailored bids from certified professionals.</p>
          <Link to="/posts/new" className="btn-primary shadow-glow-sm">Post your first request</Link>
        </motion.div>
      ) : (
        <div className="space-y-8">
          {activeEngagements.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Active Engagements
              </h2>
              <div className="space-y-3">
                {activeEngagements.map(eng => (
                  <Link key={eng._id} to={`/engagements/${eng._id}`}
                    className="card flex items-center justify-between hover:border-brand-300 hover:shadow-card-hover transition-all group"
                  >
                    <div>
                      <div className="font-bold text-gray-900 group-hover:text-brand-600 transition-colors">{eng.post?.title || 'Engagement'}</div>
                      <div className="text-sm text-gray-500 mt-0.5 font-medium">
                        {eng.trainer && `Trainer: ${eng.trainer.name}`}
                        {eng.trainer && eng.nutritionist && ' · '}
                        {eng.nutritionist && `Nutritionist: ${eng.nutritionist.name}`}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={getMissingTeamRoles(eng).length === 0 ? 'badge-green' : 'badge-yellow'}>
                        {getMissingTeamRoles(eng).length === 0 ? 'Team Ready' : `Awaiting ${getMissingTeamRoles(eng).join(' & ')}`}
                      </span>
                      <ChevronRight size={16} className="text-gray-400 group-hover:text-brand-500 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
          {openPosts.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-yellow-500" />
                Open Requests
              </h2>
              <div className="space-y-3">
                {openPosts.map(post => (
                  <div key={post._id} className="card flex items-center justify-between hover:border-brand-300 hover:shadow-card-hover transition-all gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-gray-900 truncate">{post.title}</div>
                      <div className="text-sm text-gray-500 mt-0.5 flex items-center gap-1.5 font-medium">
                        <Gavel size={13} className="text-gray-400 shrink-0" />
                        {post.bidCount} bid{post.bidCount !== 1 ? 's' : ''} received
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="badge-yellow">{post.status === 'in_progress' ? 'Building Team' : 'Open'}</span>
                      <Link
                        to={`/posts/${post._id}`}
                        className="relative inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 text-white text-sm font-bold shadow-sm hover:from-brand-600 hover:to-brand-700 hover:shadow-glow-sm active:scale-95 transition-all duration-150"
                      >
                        Show Bids
                        <ChevronRight size={15} />
                        {post.bidCount > 0 && (
                          <span className="absolute -top-2 -right-2 min-w-[20px] h-5 px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[11px] font-bold shadow-md ring-2 ring-white">
                            {post.bidCount > 99 ? '99+' : post.bidCount}
                          </span>
                        )}
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      )}
    </PageTransition>
  );
}

function ProfessionalDashboard({ user }) {
  const { data: bids } = useQuery({ queryKey: ['my-bids'], queryFn: () => api.get('/bids/my').then(r => r.data) });
  const { data: engs } = useQuery({ queryKey: ['engagements'], queryFn: () => api.get('/engagements').then(r => r.data) });
  const [activeTab, setActiveTab] = useState('active');

  const activeEngagements = engs?.engagements?.filter(e => e.status === 'active') || [];
  const pendingBids = bids?.bids?.filter(b => b.status === 'pending') || [];

  return (
    <PageTransition>
      {/* Greeting Banner */}
      <div className="relative mb-6 overflow-hidden rounded-[1.75rem] bg-slate-950 p-6 shadow-[0_24px_60px_-28px_rgba(15,23,42,.65)] sm:mb-8 sm:p-8">
        <div className="absolute -right-16 -top-24 h-64 w-64 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="absolute inset-0 bg-mesh opacity-10 pointer-events-none" />
        <div className="relative z-10 flex items-start justify-between gap-4">
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-[.16em] text-emerald-300">Professional workspace</p>
            <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">{user.name.split(' ')[0]}</h1>
            <p className="mt-1 font-medium capitalize text-slate-400">
              {user.role}
              {user.isVerified
                ? <span className="ml-2 inline-flex items-center gap-1 text-xs text-green-200 font-bold"><CheckCircle size={12} /> Verified</span>
                : <span className="ml-2 inline-flex items-center gap-1 text-xs text-yellow-200 font-bold"><AlertCircle size={12} /> Pending verification</span>
              }
            </p>
          </div>
          <Link to="/posts" className="mt-1 inline-flex shrink-0 items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-xs font-bold text-white backdrop-blur-sm transition-colors hover:bg-white/20 sm:px-4 sm:text-sm">
            Browse Requests <ChevronRight size={15} />
          </Link>
        </div>
      </div>

      {/* Stats */}
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <StatCard icon={Users} value={activeEngagements.length} label="Active Clients" colorClass="text-green-600" bgClass="bg-green-50" />
        <button
          type="button"
          onClick={() => setActiveTab('pending')}
          className="w-full text-left rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
          aria-label="Show pending bids"
        >
          <StatCard icon={Clock} value={pendingBids.length} label="Pending Bids" colorClass="text-yellow-600" bgClass="bg-yellow-50" />
        </button>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 bg-gray-100/80 rounded-xl w-fit">
        {[['active', `Active Clients (${activeEngagements.length})`], ['pending', `Pending Bids (${pendingBids.length})`]].map(([tab, label]) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 whitespace-nowrap ${
              activeTab === tab ? 'bg-white text-brand-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'pending' && (
        pendingBids.length > 0 ? (
          <div className="space-y-3">
            {pendingBids.map(bid => (
              <Link key={bid._id} to={`/posts/${bid.post._id}`} className="card flex items-center justify-between hover:border-brand-300 hover:shadow-card-hover transition-all group">
                <div>
                  <div className="font-bold text-gray-900 group-hover:text-brand-600 transition-colors">{bid.post.title}</div>
                  <div className="text-sm text-gray-500 font-medium">${bid.price}/mo — {bid.proposal.slice(0, 60)}…</div>
                </div>
                <span className="badge-yellow shrink-0">Pending</span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="card text-center py-14 border-dashed border-2 border-gray-100 text-gray-500 font-medium">
            No pending bids. <Link to="/posts" className="text-brand-600 font-bold">Browse requests →</Link>
          </div>
        )
      )}

      {activeTab === 'active' && (
        activeEngagements.length > 0 ? (
          <div className="space-y-3">
            {activeEngagements.map(eng => {
              const teammate = user.role === 'trainer' ? eng.nutritionist : eng.trainer;
              const missingRoles = getMissingTeamRoles(eng);
              return (
                <Link key={eng._id} to={`/engagements/${eng._id}`} className="card flex items-center justify-between hover:border-brand-300 hover:shadow-card-hover transition-all group">
                  <div>
                    <div className="font-bold text-gray-900 group-hover:text-brand-600 transition-colors">{eng.client?.name}</div>
                    <div className="text-sm text-gray-500 font-medium">{eng.post?.title}</div>
                    <div className="text-xs text-gray-400 font-semibold mt-1">
                      {teammate ? `Working with ${teammate.name} · ${teammate.role}` : 'You are the first professional on this team'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={missingRoles.length === 0 ? 'badge-green' : 'badge-yellow'}>
                      {missingRoles.length === 0 ? 'Team Ready' : `Awaiting ${missingRoles.join(' & ')}`}
                    </span>
                    <ChevronRight size={16} className="text-gray-400 group-hover:text-brand-500 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="card text-center py-16 border-dashed border-2 border-gray-100">
            <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Dumbbell size={28} className="text-gray-300" />
            </div>
            <h2 className="font-bold text-gray-700 mb-2">No active clients yet</h2>
            <p className="text-gray-500 text-sm mb-4 font-medium">Browse client requests and start submitting proposals.</p>
            <Link to="/posts" className="btn-primary shadow-glow-sm">Browse Requests</Link>
          </div>
        )
      )}
    </PageTransition>
  );
}

function AdminDashboard() {
  const { data } = useQuery({ queryKey: ['admin-dashboard'], queryFn: () => api.get('/admin/dashboard').then(r => r.data) });

  return (
    <PageTransition>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-950 tracking-tight">Admin Dashboard</h1>
          <p className="text-gray-500 text-sm font-medium mt-1">Platform overview and management controls.</p>
        </div>
        <Link to="/admin" className="btn-primary shadow-glow-sm"><ShieldCheck size={16} /> Admin Panel</Link>
      </div>
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Users', value: data?.totalUsers, icon: Users, colorClass: 'text-blue-600', bgClass: 'bg-blue-50' },
          { label: 'Engagements', value: data?.totalEngagements, icon: Activity, colorClass: 'text-green-600', bgClass: 'bg-green-50' },
          { label: 'Open Posts', value: data?.totalPosts, icon: BarChart2, colorClass: 'text-purple-600', bgClass: 'bg-purple-50' },
          { label: 'Pending Verifications', value: data?.pendingVerifications, icon: ShieldCheck, colorClass: 'text-yellow-600', bgClass: 'bg-yellow-50', alert: true },
        ].map(({ label, value, icon, colorClass, bgClass, alert }) => (
          <StatCard key={label} icon={icon} value={value ?? '…'} label={label} colorClass={colorClass} bgClass={bgClass} />
        ))}
      </motion.div>
    </PageTransition>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  if (!user) return null;
  if (user.role === 'admin') return <AdminDashboard />;
  if (user.role === 'client') return <ClientDashboard user={user} />;
  return <ProfessionalDashboard user={user} />;
}
