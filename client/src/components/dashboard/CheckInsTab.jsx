import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { ClipboardList, Plus, Send, Check, Shield, User, MessageSquare, AlertTriangle, HelpCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const RESPONSE_METADATA = {
  wentWell: { label: 'What went well this week?', icon: Check, iconClass: 'text-green-600 bg-green-50' },
  wasHard: { label: 'What was challenging?', icon: Shield, iconClass: 'text-blue-600 bg-blue-50' },
  painOrDiscomfort: { label: 'Any pain or discomfort?', icon: AlertTriangle, iconClass: 'text-red-600 bg-red-50' },
  questions: { label: 'Questions for your team?', icon: HelpCircle, iconClass: 'text-purple-600 bg-purple-50' }
};

export default function CheckInsTab({ engagementId, engagement, user }) {
  const qc = useQueryClient();
  const [feedback, setFeedback] = useState({});
  const [form, setForm] = useState({ wentWell: '', wasHard: '', painOrDiscomfort: '', questions: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['checkins', engagementId],
    queryFn: () => api.get(`/checkins/${engagementId}`).then(r => r.data),
  });

  const submitCheckin = useMutation({
    mutationFn: ({ id }) => api.put(`/checkins/${id}/submit`, { responses: form }),
    onSuccess: () => { 
      toast.success('Check-in submitted!'); 
      qc.invalidateQueries({ queryKey: ['checkins', engagementId] }); 
      setForm({ wentWell: '', wasHard: '', painOrDiscomfort: '', questions: '' });
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to submit check-in'),
  });

  const submitFeedback = useMutation({
    mutationFn: ({ id, note }) => api.put(`/checkins/${id}/feedback`, { feedback: note }),
    onSuccess: () => { toast.success('Feedback saved!'); qc.invalidateQueries({ queryKey: ['checkins', engagementId] }); },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to submit feedback'),
  });

  const createCheckin = useMutation({
    mutationFn: (weekNumber) => api.post('/checkins', { engagementId, weekNumber }),
    onSuccess: () => { toast.success('Check-in created for client!'); qc.invalidateQueries({ queryKey: ['checkins', engagementId] }); },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to create check-in'),
  });

  const checkins = data?.checkins || [];
  const isClient = user._id === (engagement.client?._id || engagement.client);
  const isProfessional = ['trainer', 'nutritionist'].includes(user.role);
  const nextWeek = checkins.length > 0 ? Math.max(...checkins.map(c => c.weekNumber)) + 1 : 1;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 12 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-gray-950 tracking-tight flex items-center gap-2">
          <ClipboardList size={20} className="text-brand-600" />
          Weekly Check-ins
        </h2>
        {isProfessional && (
          <button className="btn-primary py-2 px-4 text-sm shadow-glow-sm flex items-center gap-1.5" onClick={() => createCheckin.mutate(nextWeek)} disabled={createCheckin.isPending}>
            <Plus size={16} /> Create Week {nextWeek} Check-in
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-10 h-10 border-4 border-brand-100 border-t-brand-600 rounded-full animate-spin mb-3" />
          <p className="text-gray-400 font-medium text-sm">Loading check-ins...</p>
        </div>
      ) : checkins.length === 0 ? (
        <div className="card text-center py-16 border-dashed border-2 border-brand-100 max-w-lg mx-auto">
          <div className="w-14 h-14 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ClipboardList size={24} className="text-brand-500" />
          </div>
          <h3 className="font-bold text-gray-950 text-base mb-1">No check-ins yet</h3>
          <p className="text-xs text-gray-500 font-medium leading-relaxed max-w-xs mx-auto">
            {isProfessional 
              ? "Prepare the first check-in questionnaire for your client using the button above." 
              : "Your certified professionals haven't assigned any check-ins for this week yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {checkins.map(checkin => (
            <div key={checkin._id} className="card hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
                <div>
                  <h3 className="font-extrabold text-gray-950 text-base">Week {checkin.weekNumber} Check-in</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
                    {checkin.createdAt && `Assigned ${new Date(checkin.createdAt).toLocaleDateString()}`}
                  </p>
                </div>
                <span className={`badge uppercase tracking-wider text-[9px] font-black ${
                  checkin.status === 'reviewed' ? 'badge-green bg-green-100 text-green-800' : 
                  checkin.status === 'submitted' ? 'badge-yellow bg-amber-100 text-amber-800' : 'badge-gray'
                }`}>{checkin.status}</span>
              </div>

              {/* Client submits responses */}
              {isClient && checkin.status === 'pending' && (
                <form onSubmit={(e) => { e.preventDefault(); submitCheckin.mutate({ id: checkin._id }); }} className="space-y-4">
                  {[
                    ['wentWell', 'What went well this week? (workouts, nutrition, consistency...)'],
                    ['wasHard', 'What was challenging or difficult?'],
                    ['painOrDiscomfort', 'Did you experience any physical pain, joint issues, or muscle discomfort?'],
                    ['questions', 'Do you have any questions or adjustment requests for your team?'],
                  ].map(([key, label]) => (
                    <div key={key}>
                      <label className="label font-bold text-gray-800">{label}</label>
                      <textarea className="input bg-white resize-none" rows={3} placeholder="Type your honest response here..." value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} required={key !== 'painOrDiscomfort' && key !== 'questions'} />
                    </div>
                  ))}
                  <button type="submit" className="btn-primary w-full py-3 shadow-glow-sm" disabled={submitCheckin.isPending}>
                    {submitCheckin.isPending ? 'Submitting...' : 'Submit Weekly Responses'}
                  </button>
                </form>
              )}

              {/* Show submitted responses */}
              {checkin.responses && checkin.status !== 'pending' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {Object.entries(checkin.responses).filter(([, v]) => v).map(([key, value]) => {
                    const meta = RESPONSE_METADATA[key] || { label: key, icon: User, iconClass: 'text-gray-600 bg-gray-50' };
                    const Icon = meta.icon;
                    return (
                      <div key={key} className="border border-gray-100 rounded-2xl p-4 bg-gray-50/40 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${meta.iconClass}`}>
                            <Icon size={14} />
                          </div>
                          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{meta.label.split('?')[0]}?</span>
                        </div>
                        <div className="text-sm font-semibold text-gray-800 leading-relaxed pl-1">{value}</div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Feedback sections */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {checkin.trainerFeedback && (
                  <div className="p-4 border-l-4 border-l-green-500 border border-gray-200/50 bg-green-50/10 rounded-2xl">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-xs font-bold shrink-0">
                        {engagement.trainer?.name?.charAt(0).toUpperCase() || 'T'}
                      </div>
                      <span className="text-xs font-extrabold text-green-800 tracking-tight">Trainer's Review</span>
                    </div>
                    <p className="text-xs font-semibold text-green-950 leading-relaxed">{checkin.trainerFeedback}</p>
                  </div>
                )}
                {checkin.nutritionistFeedback && (
                  <div className="p-4 border-l-4 border-l-amber-500 border border-gray-200/50 bg-amber-50/10 rounded-2xl">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 text-xs font-bold shrink-0">
                        {engagement.nutritionist?.name?.charAt(0).toUpperCase() || 'N'}
                      </div>
                      <span className="text-xs font-extrabold text-amber-800 tracking-tight">Nutritionist's Review</span>
                    </div>
                    <p className="text-xs font-semibold text-amber-950 leading-relaxed">{checkin.nutritionistFeedback}</p>
                  </div>
                )}
              </div>

              {/* Professional submits feedback */}
              {isProfessional && checkin.status === 'submitted' && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <label className="label flex items-center gap-1.5 font-bold text-gray-800">
                    <MessageSquare size={16} className="text-brand-600" />
                    Provide Professional Feedback
                  </label>
                  <textarea className="input bg-white resize-none" rows={3} value={feedback[checkin._id] || ''} onChange={e => setFeedback({ ...feedback, [checkin._id]: e.target.value })} placeholder="Write your encouraging and corrective feedback for this client..." />
                  <button className="btn-primary py-2 px-4 text-xs mt-2 flex items-center gap-1 shadow-sm" onClick={() => submitFeedback.mutate({ id: checkin._id, note: feedback[checkin._id] })} disabled={submitFeedback.isPending || !feedback[checkin._id]}>
                    <Send size={12} />
                    {submitFeedback.isPending ? 'Sending...' : 'Submit Feedback'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
