import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Search, Clock, DollarSign, Dumbbell, Utensils, MapPin,
  User, MessageCircle, Flame, Filter, Tag, X
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import PageTransition from '../components/common/PageTransition';

const ALL_TAGS = ['weight-loss','muscle-gain','endurance','rehab','nutrition-only','sports-performance','diabetes-friendly','strength','flexibility','general-health'];

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
  'general-health': 'bg-brand-50 text-brand-600 border-brand-100',
};

function PostCard({ post, currentUserId }) {
  const client = post.client;
  const isOwn = client?._id === currentUserId;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 260, damping: 24 }}
      className="card hover:border-brand-200 hover:shadow-card-hover transition-all duration-200 bg-white"
    >
      {/* Author row */}
      <div className="flex items-center justify-between mb-4">
        <Link to={`/profile/${client?._id}`} className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-black shrink-0 ring-2 ring-white shadow-sm group-hover:ring-brand-200 transition-all overflow-hidden">
            {client?.avatar
              ? <img src={client.avatar} alt={client.name} className="w-10 h-10 rounded-full object-cover" />
              : <span>{client?.name?.charAt(0).toUpperCase()}</span>
            }
          </div>
          <div>
            <div className="font-bold text-gray-900 text-sm group-hover:text-brand-600 transition-colors">
              {isOwn ? 'You' : (client?.name || 'Anonymous')}
            </div>
            <div className="text-xs text-gray-400 flex items-center gap-1 font-medium">
              <Clock size={10} />
              {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
            </div>
          </div>
        </Link>

        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
          post.status === 'open' ? 'bg-green-100 text-green-700' :
          post.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' :
          'bg-gray-100 text-gray-600'
        }`}>
          {post.status === 'in_progress' ? 'In Progress' : post.status.charAt(0).toUpperCase() + post.status.slice(1)}
        </span>
      </div>

      {/* Content */}
      <h3 className="font-black text-gray-950 text-base mb-1.5 leading-snug tracking-tight">{post.title}</h3>
      <p className="text-sm text-gray-500 line-clamp-2 mb-3 leading-relaxed font-medium">{post.description}</p>

      {/* Tags */}
      {post.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {post.tags.slice(0, 4).map(tag => (
            <span key={tag} className={`px-2.5 py-0.5 border rounded-md text-xs font-semibold ${tagColors[tag] || 'bg-gray-50 text-gray-600 border-gray-100'}`}>
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Meta */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 border-t border-gray-100 pt-3 mt-1 font-medium">
        <div className="flex items-center gap-1">
          <DollarSign size={11} />
          <span>${post.budgetMin}–${post.budgetMax}/mo</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock size={11} />
          <span>{post.durationWeeks}w</span>
        </div>
        {post.trainingLocation && post.trainingLocation !== 'any' && (
          <div className="flex items-center gap-1">
            <MapPin size={11} />
            <span className="capitalize">{post.trainingLocation}</span>
          </div>
        )}
        {post.needsTrainer && (
          <div className="flex items-center gap-1 text-green-600">
            <Dumbbell size={11} />
            <span>Trainer</span>
          </div>
        )}
        {post.needsNutritionist && (
          <div className="flex items-center gap-1 text-amber-600">
            <Utensils size={11} />
            <span>Nutritionist</span>
          </div>
        )}
        <div className="ml-auto flex items-center gap-1 text-brand-500 font-bold">
          <Flame size={11} />
          <span>{post.bidCount} bid{post.bidCount !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Actions */}
      {!isOwn && (
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100">
          <Link
            to={`/profile/${client?._id}`}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-gray-700 text-sm font-semibold hover:border-brand-300 hover:text-brand-600 hover:bg-brand-50/40 transition-all duration-150"
          >
            <User size={14} />
            View Profile
          </Link>
          <Link
            to={`/profile/${client?._id}`}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 text-white text-sm font-bold shadow-sm hover:shadow-glow-sm active:scale-95 transition-all duration-150"
          >
            <MessageCircle size={14} />
            Contact
          </Link>
        </div>
      )}
    </motion.div>
  );
}

export default function Feed() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['feed', selectedTag],
    queryFn: () => {
      const params = new URLSearchParams();
      if (selectedTag) params.set('tags', selectedTag);
      params.set('limit', '50');
      // Always show all posts in community feed regardless of bid status
      params.set('includeBidded', 'true');
      return api.get(`/posts?${params}`).then(r => r.data);
    },
  });

  const posts = (data?.posts || []).filter(p =>
    !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <PageTransition>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-black text-gray-950 tracking-tight">Community Feed</h1>
          <p className="text-gray-500 text-sm mt-1 font-medium">Explore fitness goals from the community. View profiles and reach out.</p>
        </div>

        {/* Search & filter bar */}
        <div className="mb-5 space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                className="input pl-9 w-full"
                placeholder="Search goals, titles, keywords…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <button
              onClick={() => setShowFilters(f => !f)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-sm font-bold transition-all ${
                showFilters || selectedTag
                  ? 'border-brand-400 text-brand-600 bg-brand-50 shadow-glow-sm'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50/60'
              }`}
            >
              <Filter size={15} />
              Filter
              {selectedTag && <span className="w-2 h-2 rounded-full bg-brand-500" />}
            </button>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="overflow-hidden"
              >
                <div className="card py-3 px-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Filter by tag</div>
                    {selectedTag && (
                      <button onClick={() => setSelectedTag('')} className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 font-semibold transition-colors">
                        <X size={12} /> Clear
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedTag('')}
                      className={`px-3 py-1 rounded-full text-xs border font-semibold transition-all ${!selectedTag ? 'bg-brand-600 text-white border-brand-600 shadow-glow-sm' : 'border-gray-200 text-gray-600 hover:border-brand-300 hover:bg-brand-50'}`}
                    >
                      All
                    </button>
                    {ALL_TAGS.map(tag => (
                      <button
                        key={tag}
                        onClick={() => setSelectedTag(tag === selectedTag ? '' : tag)}
                        className={`px-3 py-1 rounded-full text-xs border font-semibold transition-all ${
                          selectedTag === tag
                            ? 'bg-brand-600 text-white border-brand-600 shadow-glow-sm'
                            : `${tagColors[tag] || 'border-gray-200 text-gray-600'} hover:border-brand-300`
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Feed */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="card animate-pulse bg-white">
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
              <Dumbbell size={26} className="text-gray-200" />
            </div>
            <h3 className="font-bold text-gray-700 mb-1">Nothing here yet</h3>
            <p className="text-gray-400 text-sm font-medium">No fitness goals match your search. Try a different keyword or tag.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-xs text-gray-400 font-bold px-1">{posts.length} post{posts.length !== 1 ? 's' : ''} in the community</div>
            <AnimatePresence>
              {posts.map(post => (
                <PostCard key={post._id} post={post} currentUserId={user?._id} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
