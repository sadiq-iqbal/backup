import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Search, PlusCircle, Clock, DollarSign, ChevronRight, Dumbbell, Utensils, Flame, MapPin } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import PageTransition from '../components/common/PageTransition';

const ALL_TAGS = ['weight-loss','muscle-gain','endurance','rehab','nutrition-only','sports-performance','diabetes-friendly','strength','flexibility'];

const tagColors = {
  'weight-loss': 'bg-red-50 text-red-600 border-red-100',
  'muscle-gain': 'bg-orange-50 text-orange-600 border-orange-100',
  'endurance': 'bg-blue-50 text-blue-600 border-blue-100',
  'rehab': 'bg-purple-50 text-purple-600 border-purple-100',
  'nutrition-only': 'bg-green-50 text-green-600 border-green-100',
  'sports-performance': 'bg-yellow-50 text-yellow-700 border-yellow-100',
  'diabetes-friendly': 'bg-pink-50 text-pink-600 border-pink-100',
  'strength': 'bg-indigo-50 text-indigo-600 border-indigo-100',
  'flexibility': 'bg-teal-50 text-teal-600 border-teal-100',
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 24 } }
};

export default function Posts() {
  const { user } = useAuth();
  const [filters, setFilters] = useState({ tags: '', budgetMin: '', budgetMax: '', needsRole: '' });
  const [search, setSearch] = useState('');
  const isClient = user?.role === 'client';

  const { data, isLoading } = useQuery({
    queryKey: ['posts', filters, isClient],
    queryFn: () => {
      if (isClient) return api.get('/posts/my').then(r => r.data);
      const params = new URLSearchParams();
      if (filters.tags) params.set('tags', filters.tags);
      if (filters.budgetMin) params.set('budgetMin', filters.budgetMin);
      if (filters.budgetMax) params.set('budgetMax', filters.budgetMax);
      if (filters.needsRole === 'trainer') params.set('needsTrainer', 'true');
      if (filters.needsRole === 'nutritionist') params.set('needsNutritionist', 'true');
      return api.get(`/posts?${params}`).then(r => r.data);
    },
  });

  const posts = (data?.posts || []).filter(p =>
    !search || p.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <PageTransition>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-950 tracking-tight">
            {isClient ? 'My Requests' : 'Browse Client Requests'}
          </h1>
          <p className="text-gray-500 text-sm mt-1 font-medium">
            {isClient ? `${posts.length} request${posts.length !== 1 ? 's' : ''}` : `${data?.total || 0} open requests`}
          </p>
        </div>
        {isClient && (
          <Link to="/posts/new" className="btn-primary shadow-glow-sm">
            <PlusCircle size={16} /> New Request
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="card mb-6 p-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input className="input pl-9 w-full" placeholder="Search by title…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          {!isClient && (
            <>
              <select className="input w-auto font-medium" value={filters.needsRole} onChange={e => setFilters({ ...filters, needsRole: e.target.value })}>
                <option value="">All Requests</option>
                <option value="nutritionist">Nutritionist Needed</option>
                <option value="trainer">Trainer Needed</option>
              </select>
              <select className="input w-auto font-medium" value={filters.tags} onChange={e => setFilters({ ...filters, tags: e.target.value })}>
                <option value="">All tags</option>
                {ALL_TAGS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <input className="input w-32" type="number" placeholder="Min $" value={filters.budgetMin} onChange={e => setFilters({ ...filters, budgetMin: e.target.value })} />
              <input className="input w-32" type="number" placeholder="Max $" value={filters.budgetMax} onChange={e => setFilters({ ...filters, budgetMax: e.target.value })} />
            </>
          )}
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-3.5 w-24 bg-gray-200 rounded" />
                  <div className="h-3 w-16 bg-gray-100 rounded" />
                </div>
              </div>
              <div className="h-4 w-3/4 bg-gray-200 rounded mb-2" />
              <div className="h-3 w-full bg-gray-100 rounded mb-1" />
              <div className="h-3 w-5/6 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="card text-center py-20 border-dashed border-2 border-gray-100">
          <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Search size={26} className="text-gray-200" />
          </div>
          <h3 className="font-bold text-gray-700 mb-1">
            {isClient ? "You haven't posted any requests yet" : 'No requests found'}
          </h3>
          <p className="text-gray-400 text-sm mb-4 font-medium">
            {isClient ? 'Post your fitness goal and start receiving bids from professionals.' : 'Try adjusting your filters or check back later.'}
          </p>
          {isClient && (
            <Link to="/posts/new" className="btn-primary shadow-glow-sm inline-flex items-center gap-2">
              <PlusCircle size={16} /> Post a Request
            </Link>
          )}
        </div>
      ) : (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {posts.map(post => {
            const client = post.client;
            return (
              <motion.div key={post._id} variants={itemVariants}>
                <Link
                  to={`/posts/${post._id}`}
                  className="card flex flex-col gap-3 hover:border-brand-200 hover:shadow-card-hover transition-all duration-200 bg-white h-full group"
                >
                  {/* Author row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-black text-sm shrink-0 ring-2 ring-white shadow-sm overflow-hidden">
                        {client?.avatar
                          ? <img src={client.avatar} alt={client.name} className="w-9 h-9 rounded-full object-cover" />
                          : <span>{client?.name?.charAt(0)?.toUpperCase() || '?'}</span>
                        }
                      </div>
                      <div>
                        <div className="font-bold text-gray-900 text-sm group-hover:text-brand-600 transition-colors">{client?.name || 'Client'}</div>
                        <div className="text-[10px] text-gray-400 font-medium">{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</div>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      post.status === 'open' ? 'bg-green-100 text-green-700' :
                      post.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {post.status === 'in_progress' ? 'In Progress' : post.status?.charAt(0).toUpperCase() + post.status?.slice(1)}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="font-black text-gray-950 text-sm leading-snug tracking-tight mb-1">{post.title}</h3>
                    <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed font-medium">{post.description}</p>
                  </div>

                  {/* Tags */}
                  {post.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {post.tags.slice(0, 3).map(tag => (
                        <span key={tag} className={`px-2 py-0.5 border rounded-md text-[10px] font-semibold ${tagColors[tag] || 'bg-gray-50 text-gray-600 border-gray-100'}`}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Meta row */}
                  <div className="flex flex-wrap items-center gap-2.5 text-[11px] text-gray-400 border-t border-gray-100 pt-3 mt-auto font-medium">
                    <div className="flex items-center gap-1">
                      <DollarSign size={10} />
                      <span>${post.budgetMin}–${post.budgetMax}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock size={10} />
                      <span>{post.durationWeeks}w</span>
                    </div>
                    {post.trainingLocation && post.trainingLocation !== 'any' && (
                      <div className="flex items-center gap-1">
                        <MapPin size={10} />
                        <span className="capitalize">{post.trainingLocation}</span>
                      </div>
                    )}
                    {post.needsTrainer && (
                      <div className="flex items-center gap-1 text-green-600">
                        <Dumbbell size={10} />
                        <span>Trainer</span>
                      </div>
                    )}
                    {post.needsNutritionist && (
                      <div className="flex items-center gap-1 text-amber-600">
                        <Utensils size={10} />
                        <span>Nutritionist</span>
                      </div>
                    )}
                    <div className="ml-auto flex items-center gap-1 text-brand-500 font-bold">
                      <Flame size={10} />
                      <span>{post.bidCount} bid{post.bidCount !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </PageTransition>
  );
}
