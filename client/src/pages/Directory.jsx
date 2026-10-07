import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Star, Briefcase, CheckCircle, Search, Filter } from 'lucide-react';
import { motion } from 'framer-motion';
import PageTransition from '../components/common/PageTransition';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07 } }
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 24 } }
};

export default function Directory() {
  const [filters, setFilters] = useState({ role: '', specialty: '', minRating: '', availability: '' });
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['directory', filters, search],
    queryFn: () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
      if (search.trim()) params.set('search', search.trim());
      return api.get(`/directory?${params}`).then(r => r.data);
    },
    refetchInterval: 30000,
    staleTime: 0,
    refetchOnMount: true,
  });

  const members = data?.professionals || data?.members || [];

  return (
    <PageTransition>
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <span className="text-[10px] font-black uppercase tracking-[.2em] text-emerald-600">FitBid network</span>
        <h1 className="page-heading mt-2">Find the right professional</h1>
        <p className="page-subtitle">Browse trainers and nutritionists currently listed in the FitBid community.</p>
      </div>

      {/* Filters */}
      <div className="card mb-6 p-3 sm:p-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              className="input pl-9 w-full"
              placeholder="Search members by name…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select className="input min-w-[140px] flex-1 font-medium sm:w-auto sm:flex-none" value={filters.role} onChange={e => setFilters({ ...filters, role: e.target.value })}>
            <option value="">All Roles</option>
            <option value="trainer">Trainers</option>
            <option value="nutritionist">Nutritionists</option>
            <option value="client">Clients</option>
          </select>
          {filters.role !== 'client' && (
            <>
              <select className="input min-w-[140px] flex-1 font-medium sm:w-auto sm:flex-none" value={filters.minRating} onChange={e => setFilters({ ...filters, minRating: e.target.value })}>
                <option value="">Any rating</option>
                <option value="4">4+ stars</option>
                <option value="4.5">4.5+ stars</option>
              </select>
              <select className="input min-w-[140px] flex-1 font-medium sm:w-auto sm:flex-none" value={filters.availability} onChange={e => setFilters({ ...filters, availability: e.target.value })}>
                <option value="">Any availability</option>
                <option value="open">Open to bids</option>
              </select>
            </>
          )}
        </div>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gray-200 shrink-0" />
                <div className="space-y-2 flex-1">
                  <div className="h-3.5 bg-gray-200 rounded w-2/3" />
                  <div className="h-3 bg-gray-100 rounded w-1/3" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-100 rounded" />
                <div className="h-3 bg-gray-100 rounded w-4/5" />
              </div>
            </div>
          ))}
        </div>
      ) : members.length === 0 ? (
        <div className="card text-center py-20 border-dashed border-2 border-gray-100">
          <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Filter size={24} className="text-gray-300" />
          </div>
          <p className="font-bold text-gray-700 mb-1">No members found</p>
          <p className="text-gray-400 text-sm font-medium">Try adjusting your filters or search terms.</p>
        </div>
      ) : (
        <>
          <p className="text-xs text-gray-400 font-semibold mb-4">{members.length} member{members.length !== 1 ? 's' : ''} found</p>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4"
          >
            {members.map(({ user: prof, ...profile }) => {
              const isClient = prof?.role === 'client';
              return (
                <motion.div key={prof?._id} variants={cardVariants}>
                  <Link to={`/profile/${prof?._id}`} className="card-interactive flex flex-col gap-3 bg-white h-full">
                    {/* Avatar + Name */}
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-black text-lg shrink-0 ring-2 ring-brand-100 shadow-sm overflow-hidden">
                        {prof?.avatar ? <img src={prof.avatar} alt={prof.name} className="w-12 h-12 rounded-full object-cover" /> : prof?.name?.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-gray-900 truncate">{prof?.name}</div>
                        <div className="text-xs text-gray-500 capitalize flex items-center gap-1 font-medium">
                          {prof?.role}
                          {prof?.isVerified && <CheckCircle size={11} className="text-green-500 shrink-0" />}
                        </div>
                      </div>
                    </div>

                    {/* Bio or Client Info */}
                    <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed font-medium flex-1">
                      {profile.bio || (isClient ? 'Fitness enthusiast & community client.' : 'No bio provided.')}
                    </p>

                    {/* Goals / Specialties Tags */}
                    {isClient && profile.fitnessGoals?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {profile.fitnessGoals.slice(0, 3).map(goal => (
                          <span key={goal} className="px-2 py-0.5 bg-brand-50 text-brand-700 border border-brand-100 text-[10px] font-bold rounded-md capitalize">
                            {goal.replace('-', ' ')}
                          </span>
                        ))}
                      </div>
                    )}
                    {!isClient && profile.specialty?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {profile.specialty.slice(0, 3).map(s => (
                          <span key={s} className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 text-[10px] font-bold rounded-md">
                            {s}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between text-xs pt-3 border-t border-gray-100/80 mt-auto">
                      {!isClient ? (
                        <>
                          <div className="flex items-center gap-1">
                            <Star size={13} className="text-yellow-400 fill-yellow-400" />
                            <span className="font-bold text-gray-900">{profile.avgRating?.toFixed(1) || '—'}</span>
                            <span className="text-gray-400">({profile.totalReviews || 0})</span>
                          </div>
                          <div className="flex items-center gap-1 text-gray-400 font-medium">
                            <Briefcase size={12} />
                            {profile.totalEngagements || 0} engagements
                          </div>
                          <span className={`badge text-[10px] font-bold ${profile.availabilityStatus === 'open' ? 'badge-green' : 'badge-gray'}`}>
                            {profile.availabilityStatus === 'open' ? 'Open' : 'Booked'}
                          </span>
                        </>
                      ) : (
                        <div className="flex items-center justify-between w-full">
                          <span className="text-gray-400 font-medium">Activity: <span className="capitalize text-gray-700 font-semibold">{profile.activityLevel || 'Member'}</span></span>
                          <span className="badge-blue text-[10px] font-bold">Client</span>
                        </div>
                      )}
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        </>
      )}
    </PageTransition>
  );
}
