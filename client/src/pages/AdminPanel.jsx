import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, Users, FileText, CreditCard, Award, Calendar, Mail, Check, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PageTransition from '../components/common/PageTransition';

function VerificationsTab() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['admin-verifications'],
    queryFn: () => api.get('/admin/verifications').then(r => r.data),
  });

  const decide = useMutation({
    mutationFn: ({ id, status, note }) => api.put(`/admin/verifications/${id}`, { status, note }),
    onSuccess: () => { toast.success('Decision saved'); qc.invalidateQueries({ queryKey: ['admin-verifications'] }); },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed'),
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-10 h-10 border-4 border-brand-100 border-t-brand-600 rounded-full animate-spin mb-3" />
        <p className="text-gray-400 font-medium text-sm">Loading verifications...</p>
      </div>
    );
  }

  const profiles = data?.profiles || [];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <h2 className="text-lg font-bold text-gray-950 tracking-tight mb-4">Pending Verifications ({profiles.length})</h2>
      {profiles.length === 0 ? (
        <div className="card text-center py-16 border-dashed border-2 border-brand-100 max-w-lg mx-auto">
          <div className="w-14 h-14 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={24} className="text-brand-500" />
          </div>
          <h3 className="font-bold text-gray-950 text-base mb-1">All caught up!</h3>
          <p className="text-xs text-gray-500 font-medium max-w-xs mx-auto">
            No trainers or nutritionists are currently waiting for certification approval.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {profiles.map(profile => (
            <div key={profile._id} className="card hover:shadow-md transition-shadow p-6 flex flex-col md:flex-row md:items-start justify-between gap-6">
              <div className="flex-1 space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full ring-2 ring-brand-100 bg-brand-100 flex items-center justify-center text-brand-700 font-black shrink-0 overflow-hidden shadow-sm">
                    {profile.user?.avatar ? (
                      <img src={profile.user.avatar} alt={profile.user.name} className="w-full h-full object-cover" />
                    ) : (
                      profile.user?.name?.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-950 text-base">{profile.user?.name}</h3>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-gray-500 font-medium mt-0.5">
                      <span className="flex items-center gap-1"><Mail size={12} /> {profile.user?.email}</span>
                      <span>•</span>
                      <span className="badge badge-brand text-[10px] uppercase font-black">{profile.user?.role}</span>
                    </div>
                    <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1.5 flex items-center gap-1">
                      <Calendar size={12} /> Registered {new Date(profile.user?.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {profile.certifications?.length > 0 && (
                  <div className="bg-gray-50/60 p-4 border border-gray-150 rounded-2xl">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <Award size={14} className="text-brand-600" />
                      Certifications Submitted
                    </h4>
                    <div className="space-y-2">
                      {profile.certifications.map((c, i) => (
                        <div key={i} className="text-sm font-semibold text-gray-800 flex items-start gap-1.5">
                          <Check size={16} className="text-brand-600 shrink-0 mt-0.5" />
                          <div>
                            <div>{c.name}</div>
                            <div className="text-xs text-gray-400 font-medium">Issued by: {c.issuedBy}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-row md:flex-col gap-2 shrink-0 self-end md:self-start">
                <button className="btn-primary text-xs py-2 px-4 flex items-center justify-center gap-1.5 shadow-sm" onClick={() => decide.mutate({ id: profile._id, status: 'approved' })} disabled={decide.isPending}>
                  <CheckCircle size={14} /> Approve
                </button>
                <button className="btn-danger text-xs py-2 px-4 flex items-center justify-center gap-1.5 shadow-sm" onClick={() => decide.mutate({ id: profile._id, status: 'rejected', note: 'Credentials could not be verified.' })} disabled={decide.isPending}>
                  <XCircle size={14} /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

function UsersTab() {
  const [role, setRole] = useState('');
  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', role],
    queryFn: () => api.get(`/admin/users${role ? `?role=${role}` : ''}`).then(r => r.data),
  });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-gray-950 tracking-tight">System Users ({data?.total || 0})</h2>
        <select className="input bg-white w-auto text-xs py-2 pr-8 font-bold border-gray-200" value={role} onChange={e => setRole(e.target.value)}>
          <option value="">All Roles</option>
          <option value="client">Clients</option>
          <option value="trainer">Trainers</option>
          <option value="nutritionist">Nutritionists</option>
          <option value="admin">Admins</option>
        </select>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-10 h-10 border-4 border-brand-100 border-t-brand-600 rounded-full animate-spin mb-3" />
          <p className="text-gray-400 font-medium text-sm">Loading users list...</p>
        </div>
      ) : (
        <div className="card overflow-hidden p-0 border-gray-200/80 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-150 text-left text-gray-400 text-xs font-black uppercase tracking-wider">
                  <th className="py-3 px-5">Name</th>
                  <th className="py-3 px-5">Email Address</th>
                  <th className="py-3 px-5">Role</th>
                  <th className="py-3 px-5 text-center">Verified Status</th>
                  <th className="py-3 px-5">Joined Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-150">
                {data?.users?.map(u => (
                  <tr key={u._id} className="hover:bg-gray-50/60 transition-colors font-medium">
                    <td className="py-3.5 px-5 font-bold text-gray-950">{u.name}</td>
                    <td className="py-3.5 px-5 text-gray-500 font-semibold">{u.email}</td>
                    <td className="py-3.5 px-5">
                      <span className="badge badge-brand text-[10px] font-black capitalize tracking-wide">{u.role}</span>
                    </td>
                    <td className="py-3.5 px-5 text-center">
                      {u.isVerified ? (
                        <span className="badge-green inline-block py-0.5 px-2.5 rounded-full text-[10px] font-black uppercase">Yes</span>
                      ) : (
                        <span className="badge-gray inline-block py-0.5 px-2.5 rounded-full text-[10px] font-black uppercase">No</span>
                      )}
                    </td>
                    <td className="py-3.5 px-5 text-gray-400 text-xs font-semibold">{new Date(u.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </motion.div>
  );
}

const TABS = [
  { key: 'verifications', label: 'Verifications', icon: CheckCircle },
  { key: 'users', label: 'Users', icon: Users },
];

export default function AdminPanel() {
  const [tab, setTab] = useState('verifications');

  return (
    <PageTransition>
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl md:text-3xl font-black text-gray-950 tracking-tight">Admin Control Panel</h1>
        
        {/* Tab Switcher */}
        <div className="relative border-b border-gray-200/80 mb-6 flex gap-1 overflow-x-auto no-scrollbar scroll-smooth">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`relative flex items-center gap-2 px-5 py-3 text-sm font-bold whitespace-nowrap transition-colors -mb-px z-10 ${
                tab === key
                  ? 'text-brand-600 font-extrabold'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Icon size={16} /> 
              <span>{label}</span>
              {tab === key && (
                <motion.div
                  layoutId="active-admin-tab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-600"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Tab content view */}
        <div className="min-h-[350px]">
          {tab === 'verifications' && <VerificationsTab />}
          {tab === 'users' && <UsersTab />}
        </div>
      </div>
    </PageTransition>
  );
}
