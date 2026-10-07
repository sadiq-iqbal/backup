import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Dumbbell, User, Mail, Lock, Eye, EyeOff, ArrowRight, ChevronLeft, Utensils, UserCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const roles = [
  {
    value: 'client',
    label: 'Client',
    icon: UserCircle,
    color: 'brand',
    desc: 'Post fitness goals and hire certified professionals',
  },
  {
    value: 'trainer',
    label: 'Trainer',
    icon: Dumbbell,
    color: 'green',
    desc: 'Certified fitness coach looking to bid on clients',
  },
  {
    value: 'nutritionist',
    label: 'Nutritionist',
    icon: Utensils,
    color: 'yellow',
    desc: 'Certified nutrition expert ready to create meal plans',
  },
];

const colorMap = {
  brand: { border: 'border-brand-500 bg-brand-50/60', icon: 'bg-brand-100 text-brand-600', badge: 'text-brand-700' },
  green: { border: 'border-green-500 bg-green-50/60', icon: 'bg-green-100 text-green-600', badge: 'text-green-700' },
  yellow: { border: 'border-yellow-500 bg-yellow-50/60', icon: 'bg-yellow-100 text-yellow-600', badge: 'text-yellow-700' },
};

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.role) { toast.error('Please select a role'); return; }
    setLoading(true);
    try {
      await register(form);
      toast.success('Welcome to FitBid!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4 overflow-hidden bg-gradient-to-br from-surface-50 via-white to-brand-50/30">
      {/* Ambient blobs */}
      <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-brand-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-80 h-80 bg-emerald-300/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 28 }}
        className="relative w-full max-w-lg z-10"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-1.5 mb-3">
            <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center shadow-glow-md">
              <Dumbbell size={20} className="text-white" />
            </div>
          </Link>
          <h1 className="text-3xl font-black text-gray-950 tracking-tight">Create your account</h1>
          <p className="text-gray-500 mt-1 font-medium text-sm">Join thousands achieving their fitness goals</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {[1, 2].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                s === step ? 'bg-brand-600 text-white shadow-glow-sm scale-110' :
                s < step ? 'bg-brand-200 text-brand-700' : 'bg-gray-100 text-gray-400'
              }`}>{s}</div>
              {s < 2 && <div className={`w-8 h-0.5 rounded-full transition-colors duration-300 ${step > s ? 'bg-brand-400' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="bg-white/80 backdrop-blur-md rounded-3xl border border-surface-200/60 shadow-card-elevated p-8">
          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              >
                <h2 className="text-lg font-bold text-gray-900 mb-4">I am a…</h2>
                <div className="space-y-3 mb-6">
                  {roles.map((r) => {
                    const colors = colorMap[r.color];
                    const isSelected = form.role === r.value;
                    const Icon = r.icon;
                    return (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => setForm({ ...form, role: r.value })}
                        className={`w-full text-left p-4 rounded-2xl border-2 transition-all duration-200 flex items-start gap-4 ${
                          isSelected ? colors.border + ' shadow-sm' : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50/60'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${colors.icon}`}>
                          <Icon size={20} />
                        </div>
                        <div>
                          <div className={`font-bold text-sm ${isSelected ? colors.badge : 'text-gray-900'}`}>{r.label}</div>
                          <div className="text-xs text-gray-500 mt-0.5 font-medium">{r.desc}</div>
                        </div>
                        {isSelected && (
                          <div className="ml-auto shrink-0 mt-0.5">
                            <div className={`w-5 h-5 rounded-full ${colors.icon} flex items-center justify-center`}>
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
                <button
                  className="btn-primary w-full py-3 text-base shadow-glow-sm"
                  disabled={!form.role}
                  onClick={() => setStep(2)}
                >
                  Continue <ArrowRight size={16} />
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              >
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-600 font-semibold mb-4 transition-colors group"
                >
                  <ChevronLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
                  Back
                </button>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="label font-semibold text-gray-700">Full name</label>
                    <div className="relative">
                      <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      <input
                        type="text"
                        className="input pl-10 w-full"
                        placeholder="Jane Smith"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="label font-semibold text-gray-700">Email address</label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      <input
                        type="email"
                        className="input pl-10 w-full"
                        placeholder="you@example.com"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="label font-semibold text-gray-700">Password</label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className="input pl-10 pr-10 w-full"
                        placeholder="Min. 6 characters"
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="btn-primary w-full py-3 text-base shadow-glow-md mt-2"
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        Creating account…
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        Create account <ArrowRight size={16} />
                      </span>
                    )}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6 font-medium">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-600 font-bold hover:text-brand-700 transition-colors">
            Sign in →
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
