import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import api from '../services/api';
import toast from 'react-hot-toast';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import PageTransition from '../components/common/PageTransition';

const ALL_TAGS = ['weight-loss','muscle-gain','endurance','rehab','nutrition-only','sports-performance','diabetes-friendly','strength','flexibility','general-health'];

const tagColors = {
  'weight-loss': 'bg-red-100 text-red-700 border-red-200',
  'muscle-gain': 'bg-orange-100 text-orange-700 border-orange-200',
  'endurance': 'bg-blue-100 text-blue-700 border-blue-200',
  'rehab': 'bg-purple-100 text-purple-700 border-purple-200',
  'nutrition-only': 'bg-green-100 text-green-700 border-green-200',
  'sports-performance': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  'diabetes-friendly': 'bg-pink-100 text-pink-700 border-pink-200',
  'strength': 'bg-indigo-100 text-indigo-700 border-indigo-200',
  'flexibility': 'bg-teal-100 text-teal-700 border-teal-200',
  'general-health': 'bg-brand-100 text-brand-700 border-brand-200',
};

function FormSection({ title, children }) {
  return (
    <div className="card bg-white space-y-4">
      <h2 className="font-bold text-gray-900 text-base border-b border-gray-100 pb-3">{title}</h2>
      {children}
    </div>
  );
}

export default function PostNew() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '', description: '', tags: [], needsTrainer: true, needsNutritionist: true,
    budgetMin: '', budgetMax: '', durationWeeks: '', visibility: 'public', deadline: '',
    trainingLocation: 'any', equipmentAvailable: '', age: '', gender: 'male', heightCm: '', weightKg: '',
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (data) => api.post('/posts', data),
    onSuccess: ({ data }) => {
      toast.success('Request posted!');
      navigate(`/posts/${data.post._id}`);
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to post request'),
  });

  const toggleTag = (tag) => {
    setForm(f => ({
      ...f,
      tags: f.tags.includes(tag) ? f.tags.filter(t => t !== tag) : [...f.tags, tag],
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.needsTrainer && !form.needsNutritionist) { toast.error('Select at least one professional type'); return; }
    mutate({
      ...form,
      budgetMin: Number(form.budgetMin),
      budgetMax: Number(form.budgetMax),
      durationWeeks: Number(form.durationWeeks),
      age: Number(form.age),
      heightCm: Number(form.heightCm),
      weightKg: Number(form.weightKg),
    });
  };

  return (
    <PageTransition>
      <div className="max-w-2xl">
        <div className="mb-8">
          <h1 className="text-2xl font-black text-gray-950 tracking-tight">Post a New Request</h1>
          <p className="text-gray-500 mt-1 text-sm font-medium">The more detail you provide, the better proposals you'll receive from professionals.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <FormSection title="About your goal">
            <div>
              <label className="label font-semibold text-gray-700">Title</label>
              <input className="input w-full" placeholder="e.g. Need help losing 10kg before my wedding in 4 months" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div>
              <label className="label font-semibold text-gray-700">Description</label>
              <textarea className="input min-h-28 resize-y w-full" placeholder="Tell professionals about your current situation, what you've tried, any medical conditions, and what success looks like for you…" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required />
            </div>
            <div>
              <label className="label font-semibold text-gray-700">Tags <span className="text-gray-400 font-normal">(select all that apply)</span></label>
              <div className="flex flex-wrap gap-2 mt-1">
                {ALL_TAGS.map(tag => (
                  <button key={tag} type="button" onClick={() => toggleTag(tag)}
                    className={`px-3 py-1 rounded-full text-xs border font-semibold transition-all duration-150 ${
                      form.tags.includes(tag)
                        ? `${tagColors[tag] || ''} shadow-sm`
                        : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                    }`}>
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </FormSection>

          <FormSection title="Who do you need?">
            <div className="flex gap-4">
              {[['needsTrainer', 'Trainer', 'bg-green-50 border-green-200 text-green-700'], ['needsNutritionist', 'Nutritionist', 'bg-amber-50 border-amber-200 text-amber-700']].map(([key, label, activeClass]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setForm({ ...form, [key]: !form[key] })}
                  className={`flex items-center gap-2.5 px-5 py-3 rounded-xl border-2 text-sm font-bold transition-all ${form[key] ? activeClass : 'border-gray-100 text-gray-500 hover:border-gray-200'}`}
                >
                  <div className={`w-4 h-4 rounded-md border-2 flex items-center justify-center transition-colors ${form[key] ? 'bg-current border-current' : 'border-gray-300'}`}>
                    {form[key] && <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                  </div>
                  {label}
                </button>
              ))}
            </div>
          </FormSection>

          <FormSection title="Client Details">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label font-semibold text-gray-700">Age</label>
                <input className="input w-full" type="number" min="1" placeholder="e.g. 30" value={form.age} onChange={e => setForm({ ...form, age: e.target.value })} required />
              </div>
              <div>
                <label className="label font-semibold text-gray-700">Gender</label>
                <select className="input w-full" value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="non-binary">Non-binary</option>
                  <option value="prefer-not-to-say">Prefer not to say</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label font-semibold text-gray-700">Height (cm)</label>
                <input className="input w-full" type="number" min="1" placeholder="175" value={form.heightCm} onChange={e => setForm({ ...form, heightCm: e.target.value })} required />
              </div>
              <div>
                <label className="label font-semibold text-gray-700">Weight (kg)</label>
                <input className="input w-full" type="number" min="1" placeholder="70" value={form.weightKg} onChange={e => setForm({ ...form, weightKg: e.target.value })} required />
              </div>
            </div>
          </FormSection>

          <FormSection title="Training Preferences">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label font-semibold text-gray-700">Training Location</label>
                <select className="input w-full" value={form.trainingLocation} onChange={e => setForm({ ...form, trainingLocation: e.target.value })}>
                  <option value="any">Any (Online/Flexible)</option>
                  <option value="home">Home</option>
                  <option value="gym">Gym</option>
                </select>
              </div>
              <div>
                <label className="label font-semibold text-gray-700">Available Equipment</label>
                <input className="input w-full" placeholder="Dumbbells, resistance bands…" value={form.equipmentAvailable} onChange={e => setForm({ ...form, equipmentAvailable: e.target.value })} />
              </div>
            </div>
          </FormSection>

          <FormSection title="Budget & Timeline">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label font-semibold text-gray-700">Min budget ($/month)</label>
                <input className="input w-full" type="number" min="0" placeholder="100" value={form.budgetMin} onChange={e => setForm({ ...form, budgetMin: e.target.value })} required />
              </div>
              <div>
                <label className="label font-semibold text-gray-700">Max budget ($/month)</label>
                <input className="input w-full" type="number" min="0" placeholder="300" value={form.budgetMax} onChange={e => setForm({ ...form, budgetMax: e.target.value })} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label font-semibold text-gray-700">Duration (weeks)</label>
                <input className="input w-full" type="number" min="1" placeholder="8" value={form.durationWeeks} onChange={e => setForm({ ...form, durationWeeks: e.target.value })} required />
              </div>
              <div>
                <label className="label font-semibold text-gray-700">Deadline <span className="text-gray-400 font-normal">(optional)</span></label>
                <input className="input w-full" type="date" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="label font-semibold text-gray-700">Visibility</label>
              <select className="input w-full" value={form.visibility} onChange={e => setForm({ ...form, visibility: e.target.value })}>
                <option value="public">Public — any verified professional can bid</option>
                <option value="invite-only">Invite only — I'll invite professionals directly</option>
              </select>
            </div>
          </FormSection>

          <button type="submit" className="btn-primary w-full py-3.5 text-base shadow-glow-md" disabled={isPending}>
            {isPending ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Publishing…
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                Publish Request <ArrowRight size={18} />
              </span>
            )}
          </button>
        </form>
      </div>
    </PageTransition>
  );
}
