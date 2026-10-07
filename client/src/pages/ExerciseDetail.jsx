import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getExerciseById, searchYouTubeVideos } from '../services/exerciseApi';
import { ArrowLeft, Dumbbell, Target, Layers, Zap, PlayCircle, Loader2, X, ZoomIn, ZoomOut, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PageTransition from '../components/common/PageTransition';

function MuscleTag({ label, color = 'blue' }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    green: 'bg-green-50 text-green-700 border-green-100',
    yellow: 'bg-yellow-50 text-yellow-700 border-yellow-100',
    purple: 'bg-purple-50 text-purple-700 border-purple-100',
  };
  return (
    <span className={`capitalize text-xs font-bold px-3 py-1 rounded-full border ${colors[color]}`}>
      {label}
    </span>
  );
}

export default function ExerciseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showGifModal, setShowGifModal] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  const handleOpenModal = () => {
    setZoomLevel(1); // reset zoom when opening
    setShowGifModal(true);
  };

  const { data: exercise, isLoading, error } = useQuery({
    queryKey: ['exercise', id],
    queryFn: () => getExerciseById(id),
    staleTime: 1000 * 60 * 30,
  });

  const { data: videos } = useQuery({
    queryKey: ['exercise-videos', exercise?.name],
    queryFn: () => searchYouTubeVideos(`${exercise.name} exercise tutorial`),
    enabled: !!exercise?.name,
    staleTime: 1000 * 60 * 60,
  });

  if (isLoading) {
    return (
      <PageTransition>
        <div className="flex flex-col items-center justify-center py-24">
          <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mb-4" />
          <p className="text-gray-500 font-medium">Loading exercise details...</p>
        </div>
      </PageTransition>
    );
  }

  if (error || !exercise) {
    return (
      <PageTransition>
        <div className="max-w-xl mx-auto mt-16 card text-center py-14">
          <Dumbbell size={44} className="text-gray-200 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-gray-800 mb-2">Exercise not found</h2>
          <p className="text-gray-400 text-sm mb-6 font-medium">This exercise could not be loaded from the database.</p>
          <button onClick={() => navigate(-1)} className="btn-secondary inline-flex">Go back</button>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      {/* Back button */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-brand-600 transition-colors mb-6 group">
        <ChevronLeft size={16} className="transform group-hover:-translate-x-0.5 transition-transform" /> 
        Back
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* GIF Container */}
        <div className="card flex items-center justify-center bg-gray-50/50 min-h-64 p-5 hover:shadow-md transition-shadow">
          {exercise.gifUrl ? (
            <button 
              onClick={handleOpenModal} 
              className="relative group cursor-zoom-in rounded-2xl overflow-hidden focus:outline-none focus:ring-4 focus:ring-brand-100 border border-gray-150"
            >
              <img
                src={exercise.gifUrl}
                alt={exercise.name}
                className="max-h-80 w-auto object-contain transition-opacity group-hover:opacity-95"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/5 transition-colors">
              </div>
            </button>
          ) : (
            <Dumbbell size={64} className="text-gray-200" />
          )}
        </div>

        {/* Info Card */}
        <div className="card flex flex-col justify-between p-6 md:p-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-mesh opacity-[0.02] pointer-events-none" />
          <div className="relative z-10">
            <h1 className="text-2xl md:text-3xl font-black text-gray-950 capitalize tracking-tight mb-6">{exercise.name}</h1>

            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center shrink-0 border border-brand-100">
                  <Target size={18} className="text-brand-600" />
                </div>
                <div>
                  <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Primary Target</div>
                  <MuscleTag label={exercise.target} color="green" />
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0 border border-blue-100">
                  <Layers size={18} className="text-blue-600" />
                </div>
                <div>
                  <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Body Part</div>
                  <MuscleTag label={exercise.bodyPart} color="blue" />
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-yellow-50 flex items-center justify-center shrink-0 border border-yellow-100">
                  <Dumbbell size={18} className="text-yellow-600" />
                </div>
                <div>
                  <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Equipment Required</div>
                  <MuscleTag label={exercise.equipment} color="yellow" />
                </div>
              </div>

              {exercise.secondaryMuscles?.length > 0 && (
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center shrink-0 border border-purple-100">
                    <Zap size={18} className="text-purple-600" />
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1.5">Secondary Muscles</div>
                    <div className="flex flex-wrap gap-1.5">
                      {exercise.secondaryMuscles.map(m => (
                        <MuscleTag key={m} label={m} color="purple" />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Step-by-step instructions */}
      {exercise.instructions?.length > 0 && (
        <div className="card mb-6">
          <h2 className="font-extrabold text-gray-950 text-lg tracking-tight mb-5 flex items-center gap-2">
            <span className="w-7 h-7 rounded-xl bg-brand-50 flex items-center justify-center border border-brand-100">
              <Dumbbell size={15} className="text-brand-600" />
            </span>
            Step-by-Step Instructions
          </h2>
          <ol className="space-y-4">
            {exercise.instructions.map((step, i) => (
              <li key={i} className="flex gap-4 text-sm font-semibold">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-600 text-white flex items-center justify-center font-black text-xs shadow-sm shadow-brand-100">
                  {i + 1}
                </span>
                <p className="text-gray-600 leading-relaxed pt-0.5 font-medium">{step}</p>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* YouTube videos */}
      {videos?.length > 0 && (
        <div className="card">
          <h2 className="font-extrabold text-gray-950 text-lg tracking-tight mb-5 flex items-center gap-2">
            <PlayCircle size={20} className="text-red-500 animate-pulse" />
            Tutorial & Demonstration Videos
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {videos.map((item, i) => {
              const v = item.video;
              const videoId = v?.videoId;
              if (!videoId) return null;
              return (
                <a
                  key={i}
                  href={`https://www.youtube.com/watch?v=${videoId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group rounded-2xl overflow-hidden border border-gray-200/80 bg-gray-50/50 hover:bg-white hover:border-brand-300 hover:shadow-card-hover transition-all duration-300"
                >
                  <div className="relative overflow-hidden aspect-video">
                    <img
                      src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
                      alt={v.title}
                      className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/35 transition-colors duration-300">
                      <PlayCircle size={40} className="text-white opacity-90 drop-shadow-md group-hover:scale-110 transition-transform" />
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="text-xs text-gray-800 font-extrabold line-clamp-2 leading-snug group-hover:text-brand-600 transition-colors">{v.title}</p>
                    {v.channelName && <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">{v.channelName}</p>}
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      )}

      {/* GIF Modal */}
      <AnimatePresence>
        {showGifModal && exercise.gifUrl && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" 
            onClick={() => setShowGifModal(false)}
          >
            <div className="relative max-w-4xl w-full max-h-[90vh] flex items-center justify-center flex-col" onClick={e => e.stopPropagation()}>
              <div className="absolute -top-14 right-0 flex gap-3 z-10">
                <button 
                  onClick={() => setZoomLevel(z => Math.min(z + 0.25, 3))}
                  className="text-white hover:text-gray-300 p-2 bg-black/40 rounded-full transition-colors backdrop-blur-sm"
                  title="Zoom In"
                >
                  <ZoomIn size={22} />
                </button>
                <button 
                  onClick={() => setZoomLevel(z => Math.max(z - 0.25, 0.5))}
                  className="text-white hover:text-gray-300 p-2 bg-black/40 rounded-full transition-colors backdrop-blur-sm"
                  title="Zoom Out"
                >
                  <ZoomOut size={22} />
                </button>
                <button 
                  onClick={() => setShowGifModal(false)}
                  className="text-white hover:text-gray-300 p-2 bg-black/40 rounded-full transition-colors backdrop-blur-sm"
                  title="Close"
                >
                  <X size={22} />
                </button>
              </div>
              <motion.div 
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.95 }}
                className="overflow-auto max-w-full max-h-[85vh] rounded-3xl shadow-2xl bg-white flex items-center justify-center p-4 custom-scrollbar"
              >
                <img
                  src={exercise.gifUrl}
                  alt={exercise.name}
                  style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center' }}
                  className="transition-transform duration-200 max-h-[70vh] object-contain rounded-2xl"
                />
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageTransition>
  );
}
