import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { User, Save } from 'lucide-react';
import { motion } from 'framer-motion';
import PageTransition from '../components/common/PageTransition';
import AvatarUpload from '../components/common/AvatarUpload';

function FormSection({ title, subtitle, children }) {
  return (
    <div className="card bg-white space-y-4">
      <div className="border-b border-gray-100 pb-3">
        <h2 className="font-bold text-gray-900">{title}</h2>
        {subtitle && <p className="text-xs text-gray-400 font-medium mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

export default function ProfileEdit() {
  const { user, setUser } = useAuth();
  const qc = useQueryClient();
  const [form, setForm] = useState({});

  const { data } = useQuery({
    queryKey: ['my-profile'],
    queryFn: () => api.get('/profiles/me').then(r => r.data),
  });

  useEffect(() => {
    if (data?.profile) setForm({ name: user?.name || '', ...data.profile });
  }, [data]);

  const { mutate, isPending } = useMutation({
    mutationFn: (d) => api.put('/profiles/me', d),
    onSuccess: () => {
      toast.success('Profile updated!');
      setUser(u => ({ ...u, name: form.name }));
      qc.invalidateQueries({ queryKey: ['my-profile'] });
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Update failed'),
  });

  const isClient = user?.role === 'client';
  const isProfessional = ['trainer', 'nutritionist'].includes(user?.role);

  return (
    <PageTransition>
      <div className="max-w-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center gap-4 mb-2">
          <AvatarUpload
            currentAvatar={user?.avatar}
            userName={user?.name}
            size="w-16 h-16"
            textSize="text-2xl"
            onAvatarUploaded={(newUrl) => {
              qc.invalidateQueries({ queryKey: ['my-profile'] });
              qc.invalidateQueries({ queryKey: ['profile'] });
            }}
          />
          <div>
            <h1 className="text-2xl font-black text-gray-950 tracking-tight">Edit Profile</h1>
            <p className="text-gray-500 text-sm font-medium">Click on the photo to upload or change your avatar</p>
          </div>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); mutate(form); }} className="space-y-5">
          <FormSection title="Basic Info" subtitle="Your name and public bio">
            <div>
              <label className="label font-semibold text-gray-700">Full Name</label>
              <input className="input w-full" value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Jane Smith" />
            </div>
            <div>
              <label className="label font-semibold text-gray-700">Bio</label>
              <textarea className="input min-h-24 resize-y w-full" value={form.bio || ''} onChange={e => setForm({ ...form, bio: e.target.value })} placeholder="Tell others about yourself, your expertise, and what you offer…" />
            </div>
          </FormSection>

          {isClient && (
            <FormSection title="Health Profile" subtitle="Used to help professionals tailor their proposals">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label font-semibold text-gray-700">Age</label>
                  <input className="input w-full" type="number" placeholder="30" value={form.age || ''} onChange={e => setForm({ ...form, age: e.target.value })} />
                </div>
                <div>
                  <label className="label font-semibold text-gray-700">Gender</label>
                  <select className="input w-full" value={form.gender || ''} onChange={e => setForm({ ...form, gender: e.target.value })}>
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="non-binary">Non-binary</option>
                    <option value="prefer-not-to-say">Prefer not to say</option>
                  </select>
                </div>
                <div>
                  <label className="label font-semibold text-gray-700">Height (cm)</label>
                  <input className="input w-full" type="number" placeholder="175" value={form.heightCm || ''} onChange={e => setForm({ ...form, heightCm: e.target.value })} />
                </div>
                <div>
                  <label className="label font-semibold text-gray-700">Weight (kg)</label>
                  <input className="input w-full" type="number" placeholder="70" value={form.weightKg || ''} onChange={e => setForm({ ...form, weightKg: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="label font-semibold text-gray-700">Activity Level</label>
                <select className="input w-full" value={form.activityLevel || ''} onChange={e => setForm({ ...form, activityLevel: e.target.value })}>
                  <option value="">Select</option>
                  <option value="sedentary">Sedentary</option>
                  <option value="lightly-active">Lightly active</option>
                  <option value="moderately-active">Moderately active</option>
                  <option value="very-active">Very active</option>
                </select>
              </div>
            </FormSection>
          )}

          {isProfessional && (
            <FormSection title="Professional Info" subtitle="Your credentials and availability">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label font-semibold text-gray-700">Years of Experience</label>
                  <input className="input w-full" type="number" placeholder="5" value={form.yearsExperience || ''} onChange={e => setForm({ ...form, yearsExperience: e.target.value })} />
                </div>
                <div>
                  <label className="label font-semibold text-gray-700">Hourly Rate ($)</label>
                  <input className="input w-full" type="number" placeholder="50" value={form.hourlyRate || ''} onChange={e => setForm({ ...form, hourlyRate: e.target.value })} />
                </div>
                <div>
                  <label className="label font-semibold text-gray-700">Location</label>
                  <input className="input w-full" placeholder="New York, USA" value={form.location || ''} onChange={e => setForm({ ...form, location: e.target.value })} />
                </div>
                <div>
                  <label className="label font-semibold text-gray-700">Availability</label>
                  <select className="input w-full" value={form.availabilityStatus || 'open'} onChange={e => setForm({ ...form, availabilityStatus: e.target.value })}>
                    <option value="open">Open to bids</option>
                    <option value="booked">Fully booked</option>
                  </select>
                </div>
              </div>
            </FormSection>
          )}

          <button type="submit" className="btn-primary w-full py-3 shadow-glow-sm" disabled={isPending}>
            {isPending ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Saving Changes…
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Save size={16} /> Save Changes
              </span>
            )}
          </button>
        </form>
      </div>
    </PageTransition>
  );
}
