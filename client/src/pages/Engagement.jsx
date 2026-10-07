import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Dumbbell, Utensils, TrendingUp, MessageSquare, ClipboardList, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import PageTransition from '../components/common/PageTransition';

import OverviewTab from '../components/dashboard/OverviewTab';
import WorkoutsTab from '../components/dashboard/WorkoutsTab';
import MealsTab from '../components/dashboard/MealsTab';
import ProgressTab from '../components/dashboard/ProgressTab';
import MessagesTab from '../components/dashboard/MessagesTab';
import CheckInsTab from '../components/dashboard/CheckInsTab';

const TABS = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard },
  { key: 'workouts', label: 'Workouts', icon: Dumbbell },
  { key: 'meals', label: 'Meal Plan', icon: Utensils },
  { key: 'progress', label: 'Progress', icon: TrendingUp },
  { key: 'messages', label: 'Messages', icon: MessageSquare },
  { key: 'checkins', label: 'Check-ins', icon: ClipboardList },
];

export default function Engagement() {
  const { id } = useParams();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  const { data, isLoading } = useQuery({
    queryKey: ['engagement', id],
    queryFn: () => api.get(`/engagements/${id}`).then(r => r.data),
  });

  if (isLoading) {
    return (
      <PageTransition>
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mb-4" />
          <p className="text-gray-500 font-medium">Loading engagement dashboard...</p>
        </div>
      </PageTransition>
    );
  }

  if (!data?.engagement) {
    return (
      <PageTransition>
        <div className="card text-center py-16 max-w-md mx-auto">
          <p className="text-gray-500 font-semibold text-lg">Dashboard not found</p>
          <p className="text-sm text-gray-400 mt-2 mb-6">The requested engagement could not be found or you don't have access.</p>
          <Link to="/dashboard" className="btn-primary inline-flex">Go to Dashboard</Link>
        </div>
      </PageTransition>
    );
  }

  const { engagement } = data;

  return (
    <PageTransition>
      {/* Back button & Title Header Card */}
      <div className="mb-7">
        <Link to="/dashboard" className="inline-flex items-center gap-1 text-sm font-semibold text-gray-500 hover:text-brand-600 transition-colors mb-3 group">
          <ChevronLeft size={16} className="transform group-hover:-translate-x-0.5 transition-transform" />
          Back to Dashboard
        </Link>

        <div className="relative overflow-hidden rounded-[1.75rem] bg-slate-950 p-6 text-white shadow-[0_24px_70px_-32px_rgba(15,23,42,.8)] md:p-8 lg:p-10">
          <div className="pointer-events-none absolute -right-20 -top-32 h-80 w-80 rounded-full bg-emerald-400/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />
          <div className="relative z-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div className="max-w-4xl">
              <span className={`badge mb-3 inline-block uppercase tracking-wider text-[10px] font-black ${
                engagement.status === 'active' ? 'badge-green' : engagement.status === 'disputed' ? 'badge-red' : 'badge-gray'
              }`}>
                {engagement.status}
              </span>
              <h1 className="mt-1 text-2xl font-black tracking-tight text-white md:text-3xl lg:text-4xl lg:leading-tight">
                {engagement.post?.title || 'Engagement Dashboard'}
              </h1>
              
              <div className="mt-5 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-300">
                <span className="rounded-full border border-white/10 bg-white/[.07] px-3 py-1.5">Client: <span className="font-bold text-white">{engagement.client?.name}</span></span>
                {engagement.trainer && (
                  <>
                    <span className="rounded-full border border-white/10 bg-white/[.07] px-3 py-1.5">Trainer: <span className="font-bold text-white">{engagement.trainer.name}</span></span>
                  </>
                )}
                {engagement.nutritionist && (
                  <>
                    <span className="rounded-full border border-white/10 bg-white/[.07] px-3 py-1.5">Nutritionist: <span className="font-bold text-white">{engagement.nutritionist.name}</span></span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="no-scrollbar mb-7 flex scroll-smooth gap-1 overflow-x-auto rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-[0_8px_25px_rgba(15,23,42,.04)] lg:grid lg:grid-cols-6">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`relative z-10 flex items-center justify-center gap-2 whitespace-nowrap rounded-xl px-5 py-3 text-sm font-bold transition-colors ${
              activeTab === key
                ? 'text-emerald-700 font-extrabold'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Icon size={16} /> 
            <span>{label}</span>
            {key === 'messages' && data?.unreadMessagesCount > 0 && (
              <span className="absolute top-2 right-2 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
              </span>
            )}
            {activeTab === key && (
              <motion.div
                layoutId="active-engagement-tab"
                className="absolute inset-0 -z-10 rounded-xl border border-emerald-100 bg-emerald-50"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'overview' && <OverviewTab data={data} user={user} onNavigate={setActiveTab} />}
        {activeTab === 'workouts' && <WorkoutsTab engagementId={id} engagement={engagement} user={user} />}
        {activeTab === 'meals' && <MealsTab engagementId={id} engagement={engagement} user={user} />}
        {activeTab === 'progress' && <ProgressTab engagementId={id} engagement={engagement} user={user} />}
        {activeTab === 'messages' && <MessagesTab engagementId={id} user={user} engagement={engagement} />}
        {activeTab === 'checkins' && <CheckInsTab engagementId={id} engagement={engagement} user={user} />}
      </div>
    </PageTransition>
  );
}
