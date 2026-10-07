import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Plus, ChevronDown, ChevronRight, Dumbbell, Trash2, X, Search, Check, Info } from 'lucide-react';
import ExerciseSearchModal from '../ExerciseSearchModal';
import { motion, AnimatePresence } from 'framer-motion';

const DAYS_OF_WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const emptyExercise = () => ({ name: '', sets: 3, reps: '10', restSeconds: 60, notes: '' });

const emptyDay = (dayOfWeek) => ({
  dayOfWeek,
  focusArea: '',
  durationMinutes: 45,
  isRestDay: false,
  exercises: [emptyExercise()],
  notes: '',
});

function WorkoutForm({ engagementId, nextWeek, initialData, onClose }) {
  const qc = useQueryClient();
  const isEditing = !!initialData;
  const [form, setForm] = useState(initialData || {
    weekNumber: nextWeek,
    title: '',
    difficultyLevel: 'beginner',
    notes: '',
    days: [emptyDay('monday')],
  });
  const [searchModalDay, setSearchModalDay] = useState(null);

  const mutation = useMutation({
    mutationFn: (data) => isEditing ? api.put(`/workouts/${initialData._id}`, data) : api.post('/workouts', data),
    onSuccess: () => {
      toast.success(isEditing ? 'Workout plan updated!' : 'Workout plan created!');
      qc.invalidateQueries({ queryKey: ['workouts', engagementId] });
      qc.invalidateQueries({ queryKey: ['engagement', engagementId] });
      onClose();
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to save workout plan'),
  });

  const addDay = () => {
    const usedDays = form.days.map(d => d.dayOfWeek);
    const nextDay = DAYS_OF_WEEK.find(d => !usedDays.includes(d));
    if (!nextDay) return toast.error('All days already added');
    setForm({ ...form, days: [...form.days, emptyDay(nextDay)] });
  };

  const removeDay = (idx) => {
    setForm({ ...form, days: form.days.filter((_, i) => i !== idx) });
  };

  const updateDay = (idx, field, value) => {
    const days = [...form.days];
    days[idx] = { ...days[idx], [field]: value };
    if (field === 'isRestDay' && value) {
      days[idx].exercises = [];
    } else if (field === 'isRestDay' && !value && days[idx].exercises.length === 0) {
      days[idx].exercises = [emptyExercise()];
    }
    setForm({ ...form, days });
  };

  const addExercise = (dayIdx) => {
    const days = [...form.days];
    days[dayIdx] = { ...days[dayIdx], exercises: [...days[dayIdx].exercises, emptyExercise()] };
    setForm({ ...form, days });
  };

  const removeExercise = (dayIdx, exIdx) => {
    const days = [...form.days];
    days[dayIdx] = { ...days[dayIdx], exercises: days[dayIdx].exercises.filter((_, i) => i !== exIdx) };
    setForm({ ...form, days });
  };

  const updateExercise = (dayIdx, exIdx, field, value) => {
    const days = [...form.days];
    const exercises = [...days[dayIdx].exercises];
    exercises[exIdx] = { ...exercises[exIdx], [field]: value };
    days[dayIdx] = { ...days[dayIdx], exercises };
    setForm({ ...form, days });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (form.days.length === 0) return toast.error('Add at least one day');
    for (const day of form.days) {
      if (!day.isRestDay && day.exercises.length === 0) {
        return toast.error(`Add at least one exercise for ${day.dayOfWeek}`);
      }
      if (!day.isRestDay) {
        for (const ex of day.exercises) {
          if (!ex.name.trim()) return toast.error('All exercises must have a name');
        }
      }
    }
    mutation.mutate({
      engagementId,
      weekNumber: Number(form.weekNumber),
      title: form.title,
      difficultyLevel: form.difficultyLevel,
      days: form.days.map((d, i) => ({
        ...d,
        exercises: d.exercises.map((ex, j) => ({ ...ex, order: j, sets: Number(ex.sets), restSeconds: Number(ex.restSeconds) })),
      })),
      notes: form.notes,
    });
  };

  const usedDays = form.days.map(d => d.dayOfWeek);

  return (
    <div className="card relative overflow-hidden border-brand-200/80 bg-brand-50/20 p-6 md:p-8">
      <div className="absolute inset-0 bg-mesh opacity-5 pointer-events-none" />
      <div className="flex items-center justify-between mb-6 relative z-10">
        <h3 className="font-black text-gray-950 text-xl tracking-tight">{isEditing ? 'Edit Workout Plan' : 'Create Workout Plan'}</h3>
        <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"><X size={18} /></button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
        {/* Top-level fields */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="label">Week Number</label>
            <input className="input bg-white" type="number" min="1" value={form.weekNumber} onChange={e => setForm({ ...form, weekNumber: e.target.value })} required />
          </div>
          <div>
            <label className="label">Title</label>
            <input className="input bg-white" placeholder="e.g. Foundation Week" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <label className="label">Difficulty</label>
            <select className="input bg-white" value={form.difficultyLevel} onChange={e => setForm({ ...form, difficultyLevel: e.target.value })}>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
        </div>

        {/* Days */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-gray-200/50 pb-2">
            <h4 className="font-bold text-sm text-gray-800 tracking-tight">Training Days</h4>
            <button type="button" onClick={addDay} disabled={usedDays.length >= 7} className="btn-secondary py-1 px-3 text-xs flex items-center gap-1">
              <Plus size={14} /> Add Day
            </button>
          </div>

          <div className="space-y-3">
            {form.days.map((day, dayIdx) => (
              <div key={dayIdx} className="border border-surface-200 bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="flex flex-wrap items-center gap-3 px-4 py-3 bg-gray-50/50 border-b border-gray-100">
                  <select className="input bg-white w-auto py-1 text-sm font-bold text-gray-900 border-gray-200" value={day.dayOfWeek}
                    onChange={e => updateDay(dayIdx, 'dayOfWeek', e.target.value)}>
                    {DAYS_OF_WEEK.filter(d => d === day.dayOfWeek || !usedDays.includes(d)).map(d => (
                      <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>
                    ))}
                  </select>

                  <label className="flex items-center gap-2 text-sm font-bold text-gray-600 cursor-pointer">
                    <input type="checkbox" checked={day.isRestDay} onChange={e => updateDay(dayIdx, 'isRestDay', e.target.checked)}
                      className="rounded border-gray-300 text-brand-600 focus:ring-brand-500 w-4 h-4 cursor-pointer" />
                    Rest Day
                  </label>

                  {!day.isRestDay && (
                    <input className="input bg-white py-1 text-sm flex-1 min-w-[150px]" placeholder="Focus area (e.g. Upper Body)"
                      value={day.focusArea} onChange={e => updateDay(dayIdx, 'focusArea', e.target.value)} />
                  )}

                  <button type="button" onClick={() => removeDay(dayIdx)} className="w-8 h-8 rounded-full hover:bg-red-50 text-red-400 hover:text-red-600 flex items-center justify-center shrink-0 transition-colors ml-auto">
                    <Trash2 size={16} />
                  </button>
                </div>

                {!day.isRestDay && (
                  <div className="p-4 space-y-3">
                    {day.exercises.map((ex, exIdx) => (
                      <div key={exIdx} className="flex flex-col sm:flex-row items-stretch sm:items-start gap-2 border-b sm:border-b-0 border-gray-100 pb-3 sm:pb-0">
                        <div className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-xs shrink-0 sm:mt-2.5">
                          {exIdx + 1}
                        </div>
                        {ex.gifUrl && (
                          <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-50 shrink-0 border border-gray-200 sm:mt-1 self-start">
                            <img src={ex.gifUrl} alt={ex.name} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-5 gap-2">
                          <input className="input bg-white py-1.5 text-sm sm:col-span-2" placeholder="Exercise name"
                            value={ex.name} onChange={e => updateExercise(dayIdx, exIdx, 'name', e.target.value)} required />
                          <input className="input bg-white py-1.5 text-sm" type="number" min="1" placeholder="Sets"
                            value={ex.sets} onChange={e => updateExercise(dayIdx, exIdx, 'sets', e.target.value)} />
                          <input className="input bg-white py-1.5 text-sm" placeholder="Reps (e.g. 10)"
                            value={ex.reps} onChange={e => updateExercise(dayIdx, exIdx, 'reps', e.target.value)} />
                          <input className="input bg-white py-1.5 text-sm" type="number" min="0" placeholder="Rest (s)"
                            value={ex.restSeconds} onChange={e => updateExercise(dayIdx, exIdx, 'restSeconds', e.target.value)} />
                        </div>
                        <button type="button" onClick={() => removeExercise(dayIdx, exIdx)}
                          className="w-8 h-8 rounded-full hover:bg-red-50 text-red-400 hover:text-red-600 flex items-center justify-center shrink-0 sm:mt-1.5 self-end sm:self-start">
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                    <div className="flex items-center gap-3 pt-2 border-t border-gray-100 mt-2">
                      <button type="button" onClick={() => addExercise(dayIdx)}
                        className="text-brand-600 hover:text-brand-700 text-xs font-bold flex items-center gap-1 transition-colors">
                        <Plus size={14} /> Add Manually
                      </button>
                      <span className="text-gray-300 text-xs">•</span>
                      <button type="button" onClick={() => setSearchModalDay(dayIdx)}
                        className="text-emerald-600 hover:text-emerald-700 text-xs font-bold flex items-center gap-1 transition-colors">
                        <Search size={14} /> Search ExerciseDB
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="label">Notes for Client (optional)</label>
          <textarea className="input bg-white resize-none" rows={3} placeholder="General guidance, reminders, tips…"
            value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
        </div>

        <button type="submit" className="btn-primary w-full py-3 text-base shadow-glow-sm" disabled={mutation.isPending}>
          {mutation.isPending ? (isEditing ? 'Updating…' : 'Creating…') : (isEditing ? 'Update Workout Plan' : 'Create Workout Plan')}
        </button>
      </form>

      {searchModalDay !== null && (
        <ExerciseSearchModal
          dayLabel={form.days[searchModalDay]?.dayOfWeek}
          onSelect={(exercise) => {
            const days = [...form.days];
            days[searchModalDay] = {
              ...days[searchModalDay],
              exercises: [...days[searchModalDay].exercises, exercise],
            };
            setForm({ ...form, days });
          }}
          onClose={() => setSearchModalDay(null)}
        />
      )}
    </div>
  );
}

function WorkoutDayCard({ day, engagementId, user, planId, completionLog }) {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();

  const logWorkout = useMutation({
    mutationFn: (data) => api.post('/workouts/log', data),
    onSuccess: () => {
      toast.success('Workout completed!');
      qc.invalidateQueries({ queryKey: ['workout-logs', engagementId] });
      qc.invalidateQueries({ queryKey: ['engagement', engagementId] });
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed'),
  });

  return (
    <div className="border border-gray-200/80 bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-5 py-4 bg-gray-50/30 hover:bg-gray-50 transition-colors text-left">
        <div>
          <span className="font-extrabold text-gray-900 capitalize">{day.dayOfWeek}</span>
          {day.isRestDay ? (
            <span className="ml-3 badge badge-gray font-bold text-xs">Rest Day</span>
          ) : completionLog && !completionLog.skipped ? (
            <span className="ml-3 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-emerald-700"><Check size={11} /> Completed</span>
          ) : (
            <span className="ml-3 badge badge-brand font-bold text-xs">{day.focusArea || 'Workout'}</span>
          )}
        </div>
        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-gray-400 hover:text-gray-600 border border-gray-100 shadow-sm shrink-0">
          {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden bg-white"
          >
            <div className="px-5 py-4 space-y-4 border-t border-gray-100">
              {day.isRestDay ? (
                <p className="text-sm text-gray-500 font-medium leading-relaxed">Rest and recovery day. Light stretching, hydration, and active recovery are encouraged.</p>
              ) : (
                <>
                  <div className="space-y-3">
                    {day.exercises?.map((ex, i) => {
                      const inner = (
                        <div className={`flex items-start gap-4 text-sm rounded-xl p-3 border border-transparent transition-all ${ex.exerciseDbId ? 'hover:bg-brand-50/40 hover:border-brand-100 cursor-pointer group' : ''}`}>
                          <div className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">{i + 1}</div>
                          {ex.gifUrl && (
                            <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 shrink-0">
                              <img src={ex.gifUrl} alt={ex.name} className="w-full h-full object-cover" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className={`font-bold text-gray-900 capitalize leading-snug group-hover:text-brand-600 transition-colors ${ex.exerciseDbId ? 'group-hover:text-brand-600' : ''}`}>{ex.name}</div>
                            <div className="text-gray-500 text-xs font-semibold mt-1 flex items-center gap-1.5 flex-wrap">
                              <span>{ex.sets} sets × {ex.reps} reps</span>
                              <span className="text-gray-300">•</span>
                              <span>{ex.restSeconds}s rest</span>
                              {ex.target && (
                                <>
                                  <span className="text-gray-300">•</span>
                                  <span className="text-brand-600 capitalize">{ex.target}</span>
                                  <span className="text-gray-300">•</span>
                                  <span className="text-gray-400 capitalize">{ex.bodyPart}</span>
                                </>
                              )}
                            </div>
                            {ex.notes && <div className="text-xs text-gray-400 mt-2 bg-gray-50 px-2 py-1.5 rounded-lg border border-gray-100 font-medium">{ex.notes}</div>}
                          </div>
                          {ex.exerciseDbId && (
                            <ChevronRight size={14} className="text-gray-300 group-hover:text-brand-500 shrink-0 mt-1 transition-colors self-center" />
                          )}
                        </div>
                      );

                      return ex.exerciseDbId ? (
                        <Link key={i} to={`/exercise/${ex.exerciseDbId}`} className="block">{inner}</Link>
                      ) : (
                        <div key={i}>{inner}</div>
                      );
                    })}
                  </div>

                  {user.role === 'client' && (
                    <button
                      className="btn-primary text-sm w-full mt-3 shadow-sm py-2.5 flex items-center justify-center gap-1.5"
                      onClick={() => logWorkout.mutate({ engagementId, workoutPlanId: planId, dayId: day._id, notes: '', rating: 4 })}
                      disabled={logWorkout.isPending || Boolean(completionLog && !completionLog.skipped)}
                    >
                      <Check size={16} />
                      {completionLog && !completionLog.skipped ? 'Workout Completed' : logWorkout.isPending ? 'Saving...' : 'Mark Day as Completed'}
                    </button>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function WorkoutsTab({ engagementId, engagement, user }) {
  const qc = useQueryClient();
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['workouts', engagementId],
    queryFn: () => api.get(`/workouts/engagement/${engagementId}`).then(r => r.data),
  });

  const { data: logsData } = useQuery({
    queryKey: ['workout-logs', engagementId],
    queryFn: () => api.get(`/workouts/logs/${engagementId}`).then(r => r.data),
  });

  const deletePlan = useMutation({
    mutationFn: (planId) => api.delete(`/workouts/${planId}`),
    onSuccess: () => {
      toast.success('Workout plan deleted');
      qc.invalidateQueries({ queryKey: ['workouts', engagementId] });
      qc.invalidateQueries({ queryKey: ['engagement', engagementId] });
      setSelectedWeek(null);
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to delete plan'),
  });

  const plans = data?.plans || [];
  const startDate = new Date(engagement.startDate || engagement.createdAt);
  const elapsedWeeks = Math.floor(Math.max(0, Date.now() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
  const currentWeek = Math.min(elapsedWeeks + 1, engagement.durationWeeks || Number.MAX_SAFE_INTEGER);
  const defaultPlan = [...plans].reverse().find(plan => plan.weekNumber <= currentWeek) || plans[0];
  const activePlan = selectedWeek !== null ? plans.find(p => p.weekNumber === selectedWeek) : defaultPlan;
  const nextWeek = plans.length > 0 ? Math.max(...plans.map(p => p.weekNumber)) + 1 : 1;
  const logs = logsData?.logs || [];

  const isTrainer = user._id === engagement.trainer?._id || user._id === engagement.trainer;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-gray-950 tracking-tight flex items-center gap-2">
          <Dumbbell size={20} className="text-brand-600" />
          Workout Plans
        </h2>
        {isTrainer && !showCreateForm && !editingPlan && (
          <button className="btn-primary py-2 px-4 text-sm shadow-glow-sm flex items-center gap-1.5" onClick={() => setShowCreateForm(true)}>
            <Plus size={16} /> New Plan
          </button>
        )}
      </div>

      {showCreateForm && isTrainer && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <WorkoutForm engagementId={engagementId} nextWeek={nextWeek} onClose={() => setShowCreateForm(false)} />
        </motion.div>
      )}

      {editingPlan && isTrainer && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <WorkoutForm engagementId={engagementId} nextWeek={nextWeek} initialData={editingPlan} onClose={() => setEditingPlan(null)} />
        </motion.div>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-10 h-10 border-4 border-brand-100 border-t-brand-600 rounded-full animate-spin mb-3" />
          <p className="text-gray-400 font-medium text-sm">Loading plans...</p>
        </div>
      ) : plans.length === 0 && !showCreateForm ? (
        <div className="card text-center py-16 border-dashed border-2 border-brand-100 max-w-lg mx-auto">
          <div className="w-14 h-14 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Dumbbell size={24} className="text-brand-500" />
          </div>
          <h3 className="font-bold text-gray-950 text-base mb-1">No workout plan assigned</h3>
          <p className="text-xs text-gray-500 font-medium leading-relaxed max-w-xs mx-auto">
            {isTrainer 
              ? 'Create a custom workout plan by clicking "New Plan" at the top right.' 
              : 'Your trainer hasn\'t assigned a workout plan yet. Check back soon!'}
          </p>
        </div>
      ) : (
        <>
          <div className="flex gap-2 pb-1 overflow-x-auto no-scrollbar scroll-smooth">
            {plans.map(p => (
              <button key={p._id} onClick={() => setSelectedWeek(p.weekNumber)}
                className={`px-4 py-2 rounded-full text-xs font-bold border transition-all shrink-0 ${
                  activePlan?.weekNumber === p.weekNumber 
                    ? 'bg-brand-600 text-white border-brand-600 shadow-glow-sm scale-105' 
                    : 'border-gray-200 text-gray-500 bg-white hover:border-brand-400 hover:text-brand-600'
                }`}>
                Week {p.weekNumber}
              </button>
            ))}
          </div>

          {activePlan && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-50/50 p-4 border border-gray-100 rounded-2xl">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h3 className="font-bold text-gray-950 text-base">Week {activePlan.weekNumber}: {activePlan.title || 'Workout'}</h3>
                  <span className="badge badge-blue text-xs uppercase tracking-wide font-black">{activePlan.difficultyLevel}</span>
                  <div className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">
                    {activePlan.createdAt !== activePlan.updatedAt ? 
                      `Updated ${new Date(activePlan.updatedAt).toLocaleDateString()}` : 
                      `Created ${new Date(activePlan.createdAt).toLocaleDateString()}`}
                  </div>
                </div>
                {isTrainer && (
                  <div className="flex items-center gap-3">
                    <button onClick={() => setEditingPlan(activePlan)} className="text-brand-600 hover:text-brand-800 text-sm font-bold transition-colors">Edit</button>
                    <span className="text-gray-300">|</span>
                    <button onClick={() => {
                      if (window.confirm('Are you sure you want to delete this workout plan?')) {
                        deletePlan.mutate(activePlan._id);
                      }
                    }} className="text-red-500 hover:text-red-700 text-sm font-bold transition-colors">Delete</button>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                {activePlan.days?.map((day, i) => (
                  <WorkoutDayCard
                    key={day._id || i}
                    day={day}
                    engagementId={engagementId}
                    user={user}
                    planId={activePlan._id}
                    completionLog={logs.find(log => String(log.workoutPlan) === String(activePlan._id) && String(log.dayId) === String(day._id))}
                  />
                ))}
              </div>

              {activePlan.notes && (
                <div className="border border-brand-100 bg-brand-50/40 rounded-2xl p-5 flex items-start gap-4">
                  <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center shrink-0 text-brand-600">
                    <Info size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-brand-900 text-sm mb-1">Trainer's Notes</h4>
                    <p className="text-xs text-brand-700 font-medium leading-relaxed">
                      {activePlan.notes}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
