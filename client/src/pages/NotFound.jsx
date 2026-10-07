import { Link } from 'react-router-dom';
import { Dumbbell, Home, HelpCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import PageTransition from '../components/common/PageTransition';

export default function NotFound() {
  return (
    <PageTransition>
      <div className="min-h-[70vh] relative flex items-center justify-center px-4 overflow-hidden">
        {/* Ambient blobs */}
        <div className="absolute top-[20%] left-[20%] w-72 h-72 bg-brand-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-[20%] right-[20%] w-72 h-72 bg-emerald-300/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 text-center max-w-md">
          {/* Logo / Icon */}
          <motion.div 
            initial={{ scale: 0.8, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="w-20 h-20 rounded-3xl bg-brand-50 border border-brand-100 flex items-center justify-center mx-auto mb-6 shadow-glow-md"
          >
            <Dumbbell size={36} className="text-brand-600" />
          </motion.div>

          <h1 className="text-7xl font-black text-gray-950 tracking-tighter mb-2">404</h1>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight mb-2">Page Not Found</h2>
          <p className="text-sm text-gray-500 mb-8 font-medium leading-relaxed">
            The page you are looking for doesn't exist, has been removed, or is temporarily unavailable.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/dashboard" className="btn-primary w-full sm:w-auto py-2.5 px-5 shadow-glow-sm flex items-center justify-center gap-1.5">
              <Home size={16} />
              Go to Dashboard
            </Link>
            <Link to="/" className="btn-secondary w-full sm:w-auto py-2.5 px-5 flex items-center justify-center gap-1.5">
              <HelpCircle size={16} />
              Visit Homepage
            </Link>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
