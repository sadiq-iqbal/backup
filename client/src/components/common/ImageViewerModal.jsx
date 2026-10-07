import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, User } from 'lucide-react';

export default function ImageViewerModal({ isOpen, onClose, src, title = 'Profile Picture' }) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 select-none">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-md cursor-pointer"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.85, y: 10 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="relative z-10 max-w-lg w-full bg-gray-950/90 rounded-3xl p-4 sm:p-6 shadow-2xl border border-white/10 text-white space-y-4 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center">
                <User size={16} />
              </div>
              <h3 className="font-bold text-sm sm:text-base text-gray-100">{title}</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition-colors cursor-pointer"
              title="Close"
            >
              <X size={18} />
            </button>
          </div>

          {/* Full Image Display */}
          <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-black/60 flex items-center justify-center border border-white/5 shadow-inner">
            {src ? (
              <img
                src={src}
                alt={title}
                className="w-full h-full object-cover object-center transition-transform duration-300 hover:scale-105"
              />
            ) : (
              <div className="text-gray-500 text-sm font-medium">No image available</div>
            )}
          </div>

          {/* Footer Actions */}
          {src && (
            <div className="flex items-center justify-between pt-1 text-xs text-gray-400 font-medium">
              <span>FitBid Media</span>
              <a
                href={src}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-brand-400 hover:text-brand-300 font-semibold transition-colors"
              >
                Open Full Resolution <ExternalLink size={13} />
              </a>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
