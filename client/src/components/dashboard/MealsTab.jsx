import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Utensils, Plus, X, Trash2, Info, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DAYS_OF_WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];

const MEAL_COLORS = {
  breakfast: { border: 'border-l-4 border-l-amber-500 border-gray-200/80', bg: 'bg-amber-50/10 hover:bg-amber-50/20', badge: 'bg-amber-100 text-amber-800' },
  lunch: { border: 'border-l-4 border-l-green-500 border-gray-200/80', bg: 'bg-green-50/10 hover:bg-green-50/20', badge: 'bg-green-100 text-green-800' },
  dinner: { border: 'border-l-4 border-l-blue-500 border-gray-200/80', bg: 'bg-blue-50/10 hover:bg-blue-50/20', badge: 'bg-blue-100 text-blue-800' },
  snack: { border: 'border-l-4 border-l-purple-500 border-gray-200/80', bg: 'bg-purple-50/10 hover:bg-purple-50/20', badge: 'bg-purple-100 text-purple-800' }
};


const emptyItem = () => ({ name: '', portionSize: '', calories: '' });

const emptyDayMeals = () => ({
  breakfast: { items: [emptyItem()], notes: '' },
  lunch: { items: [emptyItem()], notes: '' },
  dinner: { items: [emptyItem()], notes: '' },
  snack: { items: [emptyItem()], notes: '' }
});

const emptyDay = (dayOfWeek) => ({
  dayOfWeek,
  meals: emptyDayMeals()
});

const mapPlanToForm = (plan) => {
  const daysMap = {};
  
  plan.meals.forEach(m => {
    if (!daysMap[m.dayOfWeek]) {
      daysMap[m.dayOfWeek] = {
        dayOfWeek: m.dayOfWeek,
        meals: {
          breakfast: { items: [], notes: '' },
          lunch: { items: [], notes: '' },
          dinner: { items: [], notes: '' },
          snack: { items: [], notes: '' }
        }
      };
    }
    daysMap[m.dayOfWeek].meals[m.mealType] = {
      items: m.items.map(it => ({
        name: it.name || '',
        portionSize: it.portionSize || '',
        calories: it.calories !== undefined ? String(it.calories) : ''
      })),
      notes: m.notes || ''
    };
  });
  
  Object.values(daysMap).forEach(d => {
    MEAL_TYPES.forEach(t => {
      if (!d.meals[t].items || d.meals[t].items.length === 0) {
        d.meals[t].items = [emptyItem()];
      }
    });
  });
  
  const days = Object.values(daysMap).sort((a, b) => {
    return DAYS_OF_WEEK.indexOf(a.dayOfWeek) - DAYS_OF_WEEK.indexOf(b.dayOfWeek);
  });
  
  return {
    weekNumber: plan.weekNumber,
    dailyCalories: plan.dailyCalories !== undefined ? String(plan.dailyCalories) : '',
    proteinG: plan.proteinG !== undefined ? String(plan.proteinG) : '',
    carbsG: plan.carbsG !== undefined ? String(plan.carbsG) : '',
    fatsG: plan.fatsG !== undefined ? String(plan.fatsG) : '',
    fiberG: plan.fiberG !== undefined ? String(plan.fiberG) : '',
    allergyFlags: plan.allergyFlags ? plan.allergyFlags.join(', ') : '',
    notes: plan.notes || '',
    days: days.length > 0 ? days : [emptyDay('monday')]
  };
};

function CreateMealPlanForm({ engagementId, plans, nextWeek, initialData, onClose }) {
  const qc = useQueryClient();
  const isEditing = !!initialData;

  const [form, setForm] = useState(() => {
    if (isEditing && initialData) {
      return mapPlanToForm(initialData);
    }
    return {
      weekNumber: nextWeek,
      dailyCalories: '',
      proteinG: '',
      carbsG: '',
      fatsG: '',
      fiberG: '',
      allergyFlags: '',
      notes: '',
      days: [emptyDay('monday')],
    };
  });

  const mutation = useMutation({
    mutationFn: (data) => isEditing ? api.put(`/meals/${initialData._id}`, data) : api.post('/meals', data),
    onSuccess: () => {
      toast.success(isEditing ? 'Meal plan updated!' : 'Meal plan created!');
      qc.invalidateQueries({ queryKey: ['meals', engagementId] });
      qc.invalidateQueries({ queryKey: ['engagement', engagementId] });
      onClose();
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to save meal plan'),
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

  const updateDayOfWeek = (idx, dayOfWeek) => {
    const days = [...form.days];
    days[idx] = { ...days[idx], dayOfWeek };
    setForm({ ...form, days });
  };

  const addItem = (dayIdx, mealType) => {
    const days = [...form.days];
    const day = { ...days[dayIdx] };
    const meals = { ...day.meals };
    const meal = { ...meals[mealType] };
    meal.items = [...meal.items, emptyItem()];
    meals[mealType] = meal;
    day.meals = meals;
    days[dayIdx] = day;
    setForm({ ...form, days });
  };

  const removeItem = (dayIdx, mealType, itemIdx) => {
    const days = [...form.days];
    const day = { ...days[dayIdx] };
    const meals = { ...day.meals };
    const meal = { ...meals[mealType] };
    meal.items = meal.items.filter((_, i) => i !== itemIdx);
    if (meal.items.length === 0) {
      meal.items = [emptyItem()];
    }
    meals[mealType] = meal;
    day.meals = meals;
    days[dayIdx] = day;
    setForm({ ...form, days });
  };

  const updateItem = (dayIdx, mealType, itemIdx, field, value) => {
    const days = [...form.days];
    const day = { ...days[dayIdx] };
    const meals = { ...day.meals };
    const meal = { ...meals[mealType] };
    const items = [...meal.items];
    items[itemIdx] = { ...items[itemIdx], [field]: value };
    meal.items = items;
    meals[mealType] = meal;
    day.meals = meals;
    days[dayIdx] = day;
    setForm({ ...form, days });
  };

  const updateMealNotes = (dayIdx, mealType, value) => {
    const days = [...form.days];
    const day = { ...days[dayIdx] };
    const meals = { ...day.meals };
    meals[mealType] = { ...meals[mealType], notes: value };
    day.meals = meals;
    days[dayIdx] = day;
    setForm({ ...form, days });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (form.days.length === 0) return toast.error('Add at least one day');

    const meals = [];
    let hasAtLeastOneMeal = false;

    for (const d of form.days) {
      for (const t of MEAL_TYPES) {
        const mealData = d.meals[t];
        const filledItems = mealData.items.filter(it => it.name.trim());

        if (filledItems.length > 0) {
          hasAtLeastOneMeal = true;
          meals.push({
            dayOfWeek: d.dayOfWeek,
            mealType: t,
            items: filledItems.map(it => ({
              name: it.name.trim(),
              portionSize: it.portionSize.trim(),
              calories: Number(it.calories) || 0,
            })),
            totalCalories: filledItems.reduce((sum, it) => sum + (Number(it.calories) || 0), 0),
            notes: mealData.notes.trim() || undefined,
          });
        }
      }
    }

    if (!hasAtLeastOneMeal) {
      return toast.error('Please add at least one food item to any meal');
    }

    mutation.mutate({
      engagementId,
      weekNumber: Number(form.weekNumber),
      dailyCalories: Number(form.dailyCalories) || undefined,
      proteinG: Number(form.proteinG) || undefined,
      carbsG: Number(form.carbsG) || undefined,
      fatsG: Number(form.fatsG) || undefined,
      fiberG: Number(form.fiberG) || undefined,
      allergyFlags: form.allergyFlags ? form.allergyFlags.split(',').map(s => s.trim()).filter(Boolean) : [],
      meals,
      notes: form.notes,
    });
  };

  const assignedWeeks = plans.map(p => p.weekNumber);
  const maxWeek = Math.max(12, ...assignedWeeks, nextWeek) + 2;
  const weekOptions = [];
  for (let i = 1; i <= maxWeek; i++) {
    if (!assignedWeeks.includes(i) || (isEditing && i === initialData.weekNumber)) {
      weekOptions.push(i);
    }
  }

  const usedDays = form.days.map(d => d.dayOfWeek);

  return (
    <div className="card relative overflow-hidden border-brand-200/80 bg-brand-50/20 p-6 md:p-8">
      <div className="absolute inset-0 bg-mesh opacity-5 pointer-events-none" />
      <div className="flex items-center justify-between mb-6 relative z-10">
        <h3 className="font-black text-gray-950 text-xl tracking-tight">{isEditing ? 'Edit Meal Plan' : 'Create Meal Plan'}</h3>
        <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"><X size={18} /></button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
        {/* Week & Macros */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
          <div>
            <label className="label">Week #</label>
            <select className="input bg-white" value={form.weekNumber} onChange={e => setForm({ ...form, weekNumber: e.target.value })} required>
              {weekOptions.map(w => (
                <option key={w} value={w}>Week {w}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Calories</label>
            <input className="input bg-white" type="number" placeholder="2000" value={form.dailyCalories} onChange={e => setForm({ ...form, dailyCalories: e.target.value })} />
          </div>
          <div>
            <label className="label">Protein (g)</label>
            <input className="input bg-white" type="number" placeholder="150" value={form.proteinG} onChange={e => setForm({ ...form, proteinG: e.target.value })} />
          </div>
          <div>
            <label className="label">Carbs (g)</label>
            <input className="input bg-white" type="number" placeholder="200" value={form.carbsG} onChange={e => setForm({ ...form, carbsG: e.target.value })} />
          </div>
          <div>
            <label className="label">Fats (g)</label>
            <input className="input bg-white" type="number" placeholder="65" value={form.fatsG} onChange={e => setForm({ ...form, fatsG: e.target.value })} />
          </div>
          <div>
            <label className="label">Fiber (g)</label>
            <input className="input bg-white" type="number" placeholder="30" value={form.fiberG} onChange={e => setForm({ ...form, fiberG: e.target.value })} />
          </div>
        </div>

        <div>
          <label className="label">Allergy Flags (comma-separated)</label>
          <input className="input bg-white" placeholder="e.g. gluten, dairy, nuts" value={form.allergyFlags} onChange={e => setForm({ ...form, allergyFlags: e.target.value })} />
        </div>

        {/* Days & Meals */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-gray-200/50 pb-2">
            <h4 className="font-bold text-sm text-gray-800 tracking-tight">Days & Meals</h4>
            <button type="button" onClick={addDay} disabled={usedDays.length >= 7} className="btn-secondary py-1 px-3 text-xs flex items-center gap-1">
              <Plus size={14} /> Add Day
            </button>
          </div>

          <div className="space-y-4">
            {form.days.map((day, dayIdx) => (
              <div key={dayIdx} className="border border-surface-200 bg-white rounded-2xl overflow-hidden shadow-sm">
                <div className="flex flex-wrap items-center gap-3 px-4 py-3 bg-gray-50/50 border-b border-gray-100">
                  <select className="input bg-white w-auto py-1 text-sm font-bold text-gray-900 border-gray-200" value={day.dayOfWeek}
                    onChange={e => updateDayOfWeek(dayIdx, e.target.value)}>
                    {DAYS_OF_WEEK.filter(d => d === day.dayOfWeek || !usedDays.includes(d)).map(d => (
                      <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>
                    ))}
                  </select>

                  <button type="button" onClick={() => removeDay(dayIdx)} className="w-8 h-8 rounded-full hover:bg-red-50 text-red-400 hover:text-red-600 flex items-center justify-center shrink-0 transition-colors ml-auto">
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 p-4 bg-gray-50/20">
                  {MEAL_TYPES.map(mealType => {
                    const mealData = day.meals[mealType];
                    return (
                      <div key={mealType} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm flex flex-col justify-between">
                        <div>
                          <h5 className="text-xs font-black capitalize text-gray-800 mb-3 pb-1.5 border-b border-gray-100 flex items-center gap-1.5">
                            <span className={`w-2.5 h-2.5 rounded-full ${
                              mealType === 'breakfast' ? 'bg-amber-500' :
                              mealType === 'lunch' ? 'bg-green-500' :
                              mealType === 'dinner' ? 'bg-blue-500' : 'bg-purple-500'
                            }`} />
                            {mealType}
                          </h5>

                          <div className="space-y-2">
                            {mealData.items.map((item, itemIdx) => (
                              <div key={itemIdx} className="flex items-center gap-1.5">
                                <input 
                                  className="input bg-white py-1.5 text-xs flex-[2] border-gray-200 focus:border-brand-500 focus:ring-0" 
                                  placeholder="Food item name"
                                  value={item.name} 
                                  onChange={e => updateItem(dayIdx, mealType, itemIdx, 'name', e.target.value)} 
                                />
                                <input 
                                  className="input bg-white py-1.5 text-xs flex-1 border-gray-200 focus:border-brand-500 focus:ring-0" 
                                  placeholder="Portion"
                                  value={item.portionSize} 
                                  onChange={e => updateItem(dayIdx, mealType, itemIdx, 'portionSize', e.target.value)} 
                                />
                                <input 
                                  className="input bg-white py-1.5 text-xs w-16 border-gray-200 focus:border-brand-500 focus:ring-0" 
                                  type="number"
                                  placeholder="kcal"
                                  value={item.calories} 
                                  onChange={e => updateItem(dayIdx, mealType, itemIdx, 'calories', e.target.value)} 
                                />
                                <button 
                                  type="button" 
                                  onClick={() => removeItem(dayIdx, mealType, itemIdx)}
                                  className="w-6 h-6 rounded-full hover:bg-red-50 text-red-400 hover:text-red-600 flex items-center justify-center shrink-0 transition-colors"
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            ))}

                            <button 
                              type="button" 
                              onClick={() => addItem(dayIdx, mealType)}
                              className="text-brand-600 hover:text-brand-700 text-[11px] font-bold flex items-center gap-1 transition-colors mt-2"
                            >
                              <Plus size={12} /> Add Food Item
                            </button>
                          </div>
                        </div>

                        <div className="mt-3 pt-2 border-t border-gray-50">
                          <input 
                            className="input bg-gray-50/40 py-1 text-[11px] w-full border-dashed" 
                            placeholder="Meal note (optional)" 
                            value={mealData.notes} 
                            onChange={e => updateMealNotes(dayIdx, mealType, e.target.value)} 
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="label">Notes for Client (optional)</label>
          <textarea className="input bg-white resize-none" rows={3} placeholder="Dietary guidance, hydration tips, supplements…"
            value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
        </div>

        <button type="submit" className="btn-primary w-full py-3 text-base shadow-glow-sm" disabled={mutation.isPending}>
          {mutation.isPending ? 'Saving…' : (isEditing ? 'Update Meal Plan' : 'Create Meal Plan')}
        </button>
      </form>
    </div>
  );
}

export default function MealsTab({ engagementId, engagement, user }) {
  const qc = useQueryClient();
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [selectedDay, setSelectedDay] = useState(
    () => ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][new Date().getDay()]
  );
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['meals', engagementId],
    queryFn: () => api.get(`/meals/engagement/${engagementId}`).then(r => r.data),
  });

  const { data: logsData } = useQuery({
    queryKey: ['meal-logs', engagementId],
    queryFn: () => api.get(`/meals/logs/${engagementId}`).then(r => r.data),
  });

  const logMeal = useMutation({
    mutationFn: (data) => api.post('/meals/log', data),
    onSuccess: () => {
      toast.success('Meal logged successfully!');
      qc.invalidateQueries({ queryKey: ['meal-logs', engagementId] });
      qc.invalidateQueries({ queryKey: ['engagement', engagementId] });
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to log meal'),
  });

  const logs = logsData?.logs || [];
  const plans = data?.plans || [];
  const startDate = new Date(engagement.startDate || engagement.createdAt);
  const elapsedWeeks = Math.floor(Math.max(0, Date.now() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
  const currentWeek = Math.min(elapsedWeeks + 1, engagement.durationWeeks || Number.MAX_SAFE_INTEGER);
  const defaultPlan = [...plans].reverse().find(plan => plan.weekNumber <= currentWeek) || plans[0];
  const activePlan = selectedWeek !== null ? plans.find(p => p.weekNumber === selectedWeek) : defaultPlan;
  const dayMeals = activePlan?.meals?.filter(m => m.dayOfWeek === selectedDay) || [];
  const nextWeek = plans.length > 0 ? Math.max(...plans.map(p => p.weekNumber)) + 1 : 1;

  const isNutritionist = user._id === engagement.nutritionist?._id || user._id === engagement.nutritionist;
  const isClient = user._id === (engagement.client?._id || engagement.client);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-gray-950 tracking-tight flex items-center gap-2">
          <Utensils size={20} className="text-brand-600" />
          Meal Plans
        </h2>
        {isNutritionist && !showCreateForm && !editingPlan && (
          <button className="btn-primary py-2 px-4 text-sm shadow-glow-sm flex items-center gap-1.5" onClick={() => setShowCreateForm(true)}>
            <Plus size={16} /> New Plan
          </button>
        )}
      </div>

      {showCreateForm && isNutritionist && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <CreateMealPlanForm engagementId={engagementId} plans={plans} nextWeek={nextWeek} onClose={() => setShowCreateForm(false)} />
        </motion.div>
      )}

      {editingPlan && isNutritionist && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <CreateMealPlanForm engagementId={engagementId} plans={plans} nextWeek={nextWeek} initialData={editingPlan} onClose={() => setEditingPlan(null)} />
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
            <Utensils size={24} className="text-brand-500" />
          </div>
          <h3 className="font-bold text-gray-950 text-base mb-1">No meal plan assigned</h3>
          <p className="text-xs text-gray-500 font-medium leading-relaxed max-w-xs mx-auto">
            {isNutritionist 
              ? 'Create a custom meal plan by clicking "New Plan" at the top right.' 
              : "Your nutritionist hasn't assigned a meal plan yet. Check back soon!"}
          </p>
        </div>
      ) : (
        <>
          {/* Week selector */}
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
            <div className="space-y-6">
              {/* Header with Edit Action */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-50/50 p-4 border border-gray-100 rounded-2xl">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h3 className="font-bold text-gray-950 text-base">Week {activePlan.weekNumber} Meal Plan</h3>
                  <div className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">
                    {activePlan.createdAt !== activePlan.updatedAt ? 
                      `Updated ${new Date(activePlan.updatedAt).toLocaleDateString()}` : 
                      `Created ${new Date(activePlan.createdAt).toLocaleDateString()}`}
                  </div>
                </div>
                {isNutritionist && (
                  <div className="flex items-center gap-3">
                    <button onClick={() => setEditingPlan(activePlan)} className="text-brand-600 hover:text-brand-800 text-sm font-bold transition-colors">Edit Plan</button>
                  </div>
                )}
              </div>

              {/* Daily Targets Card */}
              <div className="card relative overflow-hidden">
                <div className="absolute inset-0 bg-mesh opacity-[0.02] pointer-events-none" />
                <h3 className="font-bold text-gray-950 text-sm tracking-tight mb-4 uppercase tracking-wider text-[10px] text-gray-400">Daily Targets • Week {activePlan.weekNumber}</h3>
                
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {[
                    { label: 'Calories', value: activePlan.dailyCalories ? `${activePlan.dailyCalories} kcal` : null, color: 'text-brand-600 bg-brand-50/60' },
                    { label: 'Protein', value: activePlan.proteinG ? `${activePlan.proteinG}g` : null, color: 'text-blue-600 bg-blue-50/60' },
                    { label: 'Carbs', value: activePlan.carbsG ? `${activePlan.carbsG}g` : null, color: 'text-emerald-600 bg-emerald-50/60' },
                    { label: 'Fats', value: activePlan.fatsG ? `${activePlan.fatsG}g` : null, color: 'text-orange-600 bg-orange-50/60' },
                    { label: 'Fiber', value: activePlan.fiberG ? `${activePlan.fiberG}g` : null, color: 'text-indigo-600 bg-indigo-50/60' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="border border-gray-100 rounded-2xl p-4 flex flex-col items-center justify-center text-center bg-gray-50/40">
                      <span className="text-sm font-black text-gray-900">{value || '—'}</span>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1">{label}</span>
                    </div>
                  ))}
                </div>

                {activePlan.allergyFlags?.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-gray-100/80 flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-red-500 mr-1 flex items-center gap-1">
                      <AlertTriangle size={14} />
                      Allergy Warnings:
                    </span>
                    {activePlan.allergyFlags.map(f => (
                      <span key={f} className="badge bg-red-50 text-red-700 border border-red-100 rounded-full py-0.5 px-2.5 font-bold text-[11px] capitalize">
                        {f}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Day selector */}
              <div className="flex gap-2 pb-1 overflow-x-auto no-scrollbar scroll-smooth">
                {DAYS_OF_WEEK.map(day => (
                  <button key={day} onClick={() => setSelectedDay(day)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 border ${
                      selectedDay === day 
                        ? 'bg-brand-600 text-white border-brand-600 shadow-sm' 
                        : 'border-gray-200 text-gray-500 bg-white hover:border-brand-400 hover:text-brand-600'
                    }`}>
                    {day.slice(0, 3).charAt(0).toUpperCase() + day.slice(1, 3)}
                  </button>
                ))}
              </div>

              {/* Meals for selected day */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {MEAL_TYPES.map(mealType => {
                  const meal = dayMeals.find(m => m.mealType === mealType);
                  const colors = MEAL_COLORS[mealType];

                  return (
                    <div key={mealType} className={`border rounded-2xl overflow-hidden shadow-sm transition-all p-5 flex flex-col justify-between ${colors.border} ${colors.bg}`}>
                      <div>
                        <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100/50">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-black capitalize tracking-wide ${colors.badge}`}>
                            {mealType}
                          </span>
                          {meal && <span className="text-xs text-gray-500 font-extrabold">{meal.totalCalories} kcal</span>}
                        </div>
                        {meal ? (
                          <div className="space-y-2.5">
                            {meal.items?.map((item, i) => (
                              <div key={i} className="flex items-center justify-between text-sm py-1 border-b border-dashed border-gray-100 last:border-0 pb-1">
                                <span className="font-semibold text-gray-800">{item.name}</span>
                                <span className="text-xs text-gray-400 font-bold">{item.portionSize} • {item.calories} kcal</span>
                              </div>
                            ))}
                            {meal.notes && (
                              <div className="text-[11px] text-gray-500 mt-2 bg-gray-50/50 px-2 py-1.5 rounded-xl border border-gray-100/60 font-medium">
                                <span className="font-bold text-gray-600">Note: </span>{meal.notes}
                              </div>
                            )}

                            {/* Client Meal Logging Actions */}
                            {isClient && (
                              <div className="mt-4 pt-3 border-t border-gray-100">
                                {(() => {
                                  const mealLog = logs.find(l => String(l.mealId) === String(meal._id));
                                  if (mealLog) {
                                    return (
                                      <div className="flex items-center justify-between">
                                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Status:</span>
                                        <span className={`badge py-0.5 px-2 text-[10px] font-black uppercase tracking-wider rounded-md ${
                                          mealLog.compliance === 'full' ? 'bg-green-100 text-green-800' :
                                          mealLog.compliance === 'partial' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                                        }`}>
                                          {mealLog.compliance} Compliance
                                        </span>
                                      </div>
                                    );
                                  }
                                  return (
                                    <div className="space-y-2">
                                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Log adherence:</span>
                                      <div className="flex gap-1.5">
                                        <button
                                          onClick={() => logMeal.mutate({ engagementId, mealPlanId: activePlan._id, mealId: meal._id, compliance: 'full' })}
                                          disabled={logMeal.isPending}
                                          className="flex-1 py-1 px-2 text-[10px] font-bold rounded-lg border border-green-200 text-green-700 bg-green-50/50 hover:bg-green-50 transition-colors"
                                        >
                                          Full
                                        </button>
                                        <button
                                          onClick={() => logMeal.mutate({ engagementId, mealPlanId: activePlan._id, mealId: meal._id, compliance: 'partial' })}
                                          disabled={logMeal.isPending}
                                          className="flex-1 py-1 px-2 text-[10px] font-bold rounded-lg border border-amber-200 text-amber-700 bg-amber-50/50 hover:bg-amber-50 transition-colors"
                                        >
                                          Partial
                                        </button>
                                        <button
                                          onClick={() => logMeal.mutate({ engagementId, mealPlanId: activePlan._id, mealId: meal._id, compliance: 'skipped' })}
                                          disabled={logMeal.isPending}
                                          className="flex-1 py-1 px-2 text-[10px] font-bold rounded-lg border border-red-200 text-red-700 bg-red-50/50 hover:bg-red-50 transition-colors"
                                        >
                                          Skipped
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })()}
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-400 italic py-2 font-medium">No meal plan specified for this slot.</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {activePlan.notes && (
                <div className="border border-brand-100 bg-brand-50/40 rounded-2xl p-5 flex items-start gap-4 mt-6">
                  <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center shrink-0 text-brand-600">
                    <Info size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-brand-900 text-sm mb-1">Nutritionist's Notes</h4>
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
