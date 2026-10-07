import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { Star, Briefcase, CheckCircle, MapPin, Clock, Award, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import PageTransition from '../components/common/PageTransition';
import ImageViewerModal from '../components/common/ImageViewerModal';

export default function Profile() {
  const { id } = useParams();
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['profile', id],
    queryFn: () => api.get(`/profiles/${id}`).then(r => r.data),
  });

  const { data: reviewsData } = useQuery({
    queryKey: ['reviews', id],
    queryFn: () => api.get(`/reviews/professional/${id}`).then(r => r.data),
    enabled: !!id,
  });

  if (isLoading) return (
    <div className="max-w-3xl space-y-4 animate-pulse">
      <div className="card">
        <div className="flex gap-5">
          <div className="w-20 h-20 rounded-full bg-gray-200 shrink-0" />
          <div className="flex-1 space-y-3 pt-1">
            <div className="h-5 bg-gray-200 rounded w-1/3" />
            <div className="h-4 bg-gray-100 rounded w-1/4" />
            <div className="h-3 bg-gray-100 rounded w-full mt-4" />
            <div className="h-3 bg-gray-100 rounded w-4/5" />
          </div>
        </div>
      </div>
    </div>
  );

  const { user, profile } = data || {};
  const reviews = reviewsData?.reviews || [];

  return (
    <PageTransition>
      <div className="max-w-3xl space-y-5">
        {/* Full Resolution Image Lightbox Viewer Modal */}
        <ImageViewerModal
          isOpen={isViewerOpen}
          onClose={() => setIsViewerOpen(false)}
          src={user?.avatar}
          title={`${user?.name || 'User'}'s Profile Picture`}
        />

        {/* Hero card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 24 }}
          className="card bg-white overflow-hidden"
        >
          {/* Gradient top strip */}
          <div className="h-20 bg-gradient-to-r from-brand-500 to-emerald-500 rounded-t-2xl -mx-6 -mt-6 mb-0" />

          <div className="flex items-start gap-5 -mt-10 relative z-10 px-2">
            <div
              className={`w-20 h-20 rounded-2xl bg-brand-100 flex items-center justify-center text-3xl font-black text-brand-600 shrink-0 ring-4 ring-white shadow-lg overflow-hidden relative group ${user?.avatar ? 'cursor-pointer' : ''}`}
              onClick={() => {
                if (user?.avatar) setIsViewerOpen(true);
              }}
              title={user?.avatar ? 'Click to view photo' : ''}
            >
              {user?.avatar ? (
                <>
                  <img src={user.avatar} alt={user.name} className="w-20 h-20 object-cover transition-transform duration-200 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity duration-200">
                    <Eye size={20} />
                  </div>
                </>
              ) : (
                user?.name?.charAt(0)
              )}
            </div>
            <div className="flex-1 pt-12">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-black text-gray-950 tracking-tight">{user?.name}</h1>
                {user?.isVerified && (
                  <span className="badge-green flex items-center gap-1 text-xs font-bold">
                    <CheckCircle size={11} /> Verified
                  </span>
                )}
                {user?.role === 'client' ? (
                  <span className="badge-blue text-xs font-bold">Community Member</span>
                ) : profile?.availabilityStatus === 'open' ? (
                  <span className="badge-green text-xs font-bold">Open to bids</span>
                ) : (
                  <span className="badge-gray text-xs font-bold">Fully booked</span>
                )}
              </div>
              <div className="text-gray-500 capitalize mt-1 font-semibold text-sm">{user?.role}</div>
              {profile?.location && (
                <div className="flex items-center gap-1 text-sm text-gray-400 mt-1 font-medium">
                  <MapPin size={13} />{profile.location}
                </div>
              )}
            </div>
          </div>

          {profile?.bio && (
            <p className="text-gray-600 mt-5 text-sm leading-relaxed font-medium border-t border-gray-100 pt-4">{profile.bio}</p>
          )}

          {/* Stats or Client Info */}
          {user?.role === 'client' ? (
            <div className="mt-5 pt-4 border-t border-gray-100 space-y-3">
              {profile?.fitnessGoals?.length > 0 && (
                <div>
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Fitness Goals</div>
                  <div className="flex flex-wrap gap-2">
                    {profile.fitnessGoals.map(goal => (
                      <span key={goal} className="px-3 py-1 bg-brand-50 text-brand-700 border border-brand-100 rounded-lg text-xs font-bold capitalize">
                        {goal.replace('-', ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {profile?.activityLevel && (
                <div className="text-xs text-gray-500 font-medium">
                  Activity Level: <span className="font-bold text-gray-800 capitalize">{profile.activityLevel.replace('-', ' ')}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4 mt-5 pt-4 border-t border-gray-100">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-2xl font-black text-gray-950">
                  <Star size={18} className="text-yellow-400 fill-yellow-400" />
                  {profile?.avgRating?.toFixed(1) || '—'}
                </div>
                <div className="text-xs text-gray-500 font-semibold mt-0.5">{profile?.totalReviews || 0} reviews</div>
              </div>
              <div className="text-center border-x border-gray-100">
                <div className="text-2xl font-black text-gray-950">{profile?.totalEngagements || 0}</div>
                <div className="text-xs text-gray-500 font-semibold mt-0.5">Engagements</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-black text-gray-950">{profile?.yearsExperience || 0}<span className="text-base text-gray-400">y</span></div>
                <div className="text-xs text-gray-500 font-semibold mt-0.5">Experience</div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Certifications */}
        {profile?.certifications?.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card bg-white">
            <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Award size={18} className="text-brand-500" /> Certifications
            </h2>
            <div className="space-y-3">
              {profile.certifications.map((cert, i) => (
                <div key={i} className="flex items-center gap-3 text-sm p-3 rounded-xl bg-green-50/50 border border-green-100">
                  <CheckCircle size={16} className="text-green-500 shrink-0" />
                  <div>
                    <span className="font-bold text-gray-900">{cert.name}</span>
                    <span className="text-gray-500 ml-2">— {cert.issuedBy}{cert.year ? ` (${cert.year})` : ''}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Specialties */}
        {profile?.specialty?.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="card bg-white">
            <h2 className="font-bold text-gray-900 mb-4">Specialties</h2>
            <div className="flex flex-wrap gap-2">
              {profile.specialty.map(s => (
                <span key={s} className="badge-blue font-semibold">{s}</span>
              ))}
            </div>
          </motion.div>
        )}

        {/* Reviews */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card bg-white">
          <h2 className="font-bold text-gray-900 mb-5">Reviews ({reviews.length})</h2>
          {reviews.length === 0 ? (
            <p className="text-gray-400 text-sm font-medium py-6 text-center">No reviews yet.</p>
          ) : (
            <div className="space-y-5">
              {reviews.map(r => (
                <div key={r._id} className="border-b border-gray-100 pb-5 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-bold text-sm text-gray-900">{r.reviewer?.name}</div>
                    <div className="flex items-center gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={12} className={i < r.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'} />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed font-medium">{r.comment}</p>
                  {r.professionalReply && (
                    <div className="mt-3 pl-3 border-l-2 border-brand-200 text-xs text-gray-500 italic font-medium bg-brand-50/40 py-2 pr-3 rounded-r-lg">
                      {r.professionalReply}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </PageTransition>
  );
}
