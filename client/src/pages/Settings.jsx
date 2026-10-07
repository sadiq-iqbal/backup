import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { User, Mail, Shield, CheckCircle, Lock, Eye, EyeOff, Camera } from 'lucide-react';
import { motion } from 'framer-motion';
import PageTransition from '../components/common/PageTransition';
import AvatarUpload from '../components/common/AvatarUpload';

export default function Settings() {
  const { user } = useAuth();
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const { mutate, isPending } = useMutation({
    mutationFn: (d) => api.put('/auth/password', d),
    onSuccess: () => {
      toast.success('Password updated successfully!');
      setPasswords({ currentPassword: '', newPassword: '', confirm: '' });
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed'),
  });

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirm) { toast.error('Passwords do not match'); return; }
    mutate({ currentPassword: passwords.currentPassword, newPassword: passwords.newPassword });
  };

  return (
    <PageTransition>
      <div className="max-w-xl space-y-6">
        <div className="mb-2">
          <h1 className="text-2xl font-black text-gray-950 tracking-tight">Settings</h1>
          <p className="text-gray-500 text-sm font-medium mt-1">Manage your account preferences and security.</p>
        </div>

        {/* Profile Picture Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 24 }}
          className="card bg-white"
        >
          <div className="flex items-center gap-4">
            <AvatarUpload
              currentAvatar={user?.avatar}
              userName={user?.name}
              size="w-20 h-20"
              textSize="text-3xl"
            />
            <div>
              <h2 className="font-bold text-gray-900 text-base">Profile Photo</h2>
              <p className="text-xs text-gray-500 font-medium mt-0.5 mb-2">
                Upload a clear photo. JPG, PNG or WebP, max 5MB.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Account card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 24, delay: 0.05 }}
          className="card bg-white"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
              <User size={20} className="text-brand-600" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">Account Details</h2>
              <p className="text-xs text-gray-400 font-medium">Your identity on FitBid</p>
            </div>
          </div>

          <div className="space-y-3">
            {[
              { label: 'Full Name', value: user?.name, icon: User },
              { label: 'Email Address', value: user?.email, icon: Mail },
              { label: 'Role', value: user?.role, capitalize: true, icon: Shield },
            ].map(({ label, value, capitalize, icon: Icon }) => (
              <div key={label} className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50/60 border border-gray-100">
                <div className="flex items-center gap-2.5">
                  <Icon size={15} className="text-gray-400" />
                  <span className="text-sm text-gray-500 font-semibold">{label}</span>
                </div>
                <span className={`text-sm font-bold text-gray-900 ${capitalize ? 'capitalize' : ''}`}>{value}</span>
              </div>
            ))}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50/60 border border-gray-100">
              <div className="flex items-center gap-2.5">
                <CheckCircle size={15} className="text-gray-400" />
                <span className="text-sm text-gray-500 font-semibold">Verification</span>
              </div>
              {user?.isVerified ? <span className="badge-green text-xs font-bold">Verified ✓</span> : <span className="badge-yellow text-xs font-bold">Pending</span>}
            </div>
          </div>
        </motion.div>

        {/* Password card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 24, delay: 0.1 }}
          className="card bg-white"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
              <Lock size={20} className="text-red-500" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">Change Password</h2>
              <p className="text-xs text-gray-400 font-medium">Use a strong, unique password</p>
            </div>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="label font-semibold text-gray-700">Current Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type={showCurrent ? 'text' : 'password'}
                  className="input pl-10 pr-10 w-full"
                  value={passwords.currentPassword}
                  onChange={e => setPasswords({ ...passwords, currentPassword: e.target.value })}
                  required
                />
                <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                  {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <div>
              <label className="label font-semibold text-gray-700">New Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type={showNew ? 'text' : 'password'}
                  className="input pl-10 pr-10 w-full"
                  value={passwords.newPassword}
                  onChange={e => setPasswords({ ...passwords, newPassword: e.target.value })}
                  required
                  minLength={6}
                />
                <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                  {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <div>
              <label className="label font-semibold text-gray-700">Confirm New Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="password"
                  className="input pl-10 w-full"
                  value={passwords.confirm}
                  onChange={e => setPasswords({ ...passwords, confirm: e.target.value })}
                  required
                  minLength={6}
                />
              </div>
            </div>
            <button type="submit" className="btn-primary py-2.5 shadow-glow-sm" disabled={isPending}>
              {isPending ? (
                <span className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Updating…
                </span>
              ) : 'Update Password'}
            </button>
          </form>
        </motion.div>
      </div>
    </PageTransition>
  );
}
