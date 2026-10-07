import { useState, useEffect, useRef } from 'react';
import { Search, X, ChevronRight, Dumbbell, Loader2, Check } from 'lucide-react';
import { searchExercisesByName, getExercisesByBodyPart, getAllBodyParts, getTopExercises } from '../services/exerciseApi';

const BODY_PARTS = ['back', 'cardio', 'chest', 'lower arms', 'lower legs', 'neck', 'shoulders', 'upper arms', 'upper legs', 'waist'];

function ExerciseCard({ exercise, selected, onClick }) {
  const [imgError, setImgError] = useState(false);

  return (
    <button
      type="button"
      onClick={() => onClick(exercise)}
      className={`relative text-left rounded-xl border-2 overflow-hidden transition-all duration-150 hover:shadow-md group ${
        selected ? 'border-brand-500 shadow-md ring-2 ring-brand-200' : 'border-gray-200 hover:border-brand-300'
      }`}
    >
      {selected && (
        <div className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full bg-brand-500 flex items-center justify-center shadow">
          <Check size={14} className="text-white" />
        </div>
      )}
      <div className="bg-gray-100 h-32 flex items-center justify-center overflow-hidden">
        {!imgError && exercise.gifUrl ? (
          <img
            src={exercise.gifUrl}
            alt={exercise.name}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <Dumbbell size={32} className="text-gray-300" />
        )}
      </div>
      <div className="p-2">
        <div className="text-xs font-semibold text-gray-800 capitalize line-clamp-2 leading-tight">{exercise.name}</div>
        <div className="flex gap-1 mt-1 flex-wrap">
          <span className="text-[10px] bg-brand-50 text-brand-700 px-1.5 py-0.5 rounded font-medium capitalize">{exercise.target}</span>
          <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded capitalize">{exercise.equipment}</span>
        </div>
      </div>
    </button>
  );
}

export default function ExerciseSearchModal({ onSelect, onClose, dayLabel }) {
  const [search, setSearch] = useState('');
  const [activeBodyPart, setActiveBodyPart] = useState('');
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [config, setConfig] = useState({ sets: 3, reps: '10', restSeconds: 60, notes: '' });
  const searchRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    searchRef.current?.focus();
    loadInitial();
  }, []);

  const loadInitial = async () => {
    setLoading(true);
    try {
      const data = await getTopExercises(20);
      setExercises(data);
    } catch {
      setExercises([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (val) => {
    setSearch(val);
    setActiveBodyPart('');
    clearTimeout(debounceRef.current);
    if (!val.trim()) { loadInitial(); return; }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await searchExercisesByName(val.trim());
        setExercises(data);
      } catch {
        setExercises([]);
      } finally {
        setLoading(false);
      }
    }, 500);
  };

  const handleBodyPart = async (bp) => {
    const next = bp === activeBodyPart ? '' : bp;
    setActiveBodyPart(next);
    setSearch('');
    if (!next) { loadInitial(); return; }
    setLoading(true);
    try {
      const data = await getExercisesByBodyPart(next, 20);
      setExercises(data);
    } catch {
      setExercises([]);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (!selected) return;
    onSelect({
      name: selected.name,
      exerciseDbId: selected.id,
      gifUrl: selected.gifUrl,
      target: selected.target,
      bodyPart: selected.bodyPart,
      equipment: selected.equipment,
      secondaryMuscles: selected.secondaryMuscles || [],
      instructions: selected.instructions || [],
      sets: Number(config.sets),
      reps: config.reps,
      restSeconds: Number(config.restSeconds),
      notes: config.notes,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Search Exercises</h2>
            {dayLabel && <p className="text-xs text-gray-500 mt-0.5">Adding to {dayLabel}</p>}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500">
            <X size={20} />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 py-3 border-b border-gray-100">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              ref={searchRef}
              className="input pl-9 w-full"
              placeholder="Search any exercise (e.g. bench press, squat…)"
              value={search}
              onChange={e => handleSearchChange(e.target.value)}
            />
          </div>
        </div>

        {/* Body part filter tabs */}
        <div className="px-5 py-2 border-b border-gray-100 overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            <button
              type="button"
              onClick={() => handleBodyPart('')}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors whitespace-nowrap ${!activeBodyPart ? 'bg-brand-600 text-white border-brand-600' : 'border-gray-200 text-gray-600 hover:border-brand-400'}`}
            >
              All
            </button>
            {BODY_PARTS.map(bp => (
              <button
                key={bp}
                type="button"
                onClick={() => handleBodyPart(bp)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors whitespace-nowrap capitalize ${activeBodyPart === bp ? 'bg-brand-600 text-white border-brand-600' : 'border-gray-200 text-gray-600 hover:border-brand-400'}`}
              >
                {bp}
              </button>
            ))}
          </div>
        </div>

        {/* Exercise grid */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="animate-spin text-brand-600" size={32} />
            </div>
          ) : exercises.length === 0 ? (
            <div className="text-center py-16">
              <Dumbbell size={40} className="text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">No exercises found. Try a different search.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {exercises.map(ex => (
                <ExerciseCard
                  key={ex.id}
                  exercise={ex}
                  selected={selected?.id === ex.id}
                  onClick={setSelected}
                />
              ))}
            </div>
          )}
        </div>

        {/* Config panel — appears when exercise is selected */}
        {selected && (
          <div className="border-t border-gray-100 px-5 py-4 bg-brand-50/40">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-200 shrink-0">
                <img src={selected.gifUrl} alt={selected.name} className="w-full h-full object-cover" />
              </div>
              <div>
                <div className="font-semibold text-sm text-gray-900 capitalize">{selected.name}</div>
                <div className="text-xs text-gray-500 capitalize">{selected.target} · {selected.bodyPart}</div>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-3 mb-3">
              <div>
                <label className="label text-xs">Sets</label>
                <input className="input py-1.5 text-sm" type="number" min="1" value={config.sets}
                  onChange={e => setConfig({ ...config, sets: e.target.value })} />
              </div>
              <div>
                <label className="label text-xs">Reps</label>
                <input className="input py-1.5 text-sm" placeholder="10" value={config.reps}
                  onChange={e => setConfig({ ...config, reps: e.target.value })} />
              </div>
              <div>
                <label className="label text-xs">Rest (s)</label>
                <input className="input py-1.5 text-sm" type="number" min="0" value={config.restSeconds}
                  onChange={e => setConfig({ ...config, restSeconds: e.target.value })} />
              </div>
              <div>
                <label className="label text-xs">Notes</label>
                <input className="input py-1.5 text-sm" placeholder="Optional" value={config.notes}
                  onChange={e => setConfig({ ...config, notes: e.target.value })} />
              </div>
            </div>
            <button
              type="button"
              onClick={handleConfirm}
              className="w-full btn-primary flex items-center justify-center gap-2"
            >
              <Check size={16} />
              Add to Plan
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
