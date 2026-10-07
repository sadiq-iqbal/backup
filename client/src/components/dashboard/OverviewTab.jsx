import { format, differenceInDays } from 'date-fns';
import {
  Scale, Target, Calendar, Activity, Users, AlertCircle, CheckCircle,
  UserPlus, MessageSquare, ClipboardList, Dumbbell, Utensils, TrendingUp,
} from 'lucide-react';
import { motion } from 'framer-motion';

const BMI_COLORS = { 
  underweight: 'text-blue-600 bg-blue-50', 
  normal: 'text-green-600 bg-green-50', 
  overweight: 'text-yellow-600 bg-yellow-50', 
  obese: 'text-red-600 bg-red-50' 
};

export default function OverviewTab({ data, user, onNavigate }) {
  const { engagement, latestWorkoutPlan, latestMealPlan, recentProgress, pendingCheckIn, weeklySummary = {} } = data;

  const daysLeft = engagement.endDate ? differenceInDays(new Date(engagement.endDate), new Date()) : null;
  const totalDays = Math.max(1, (engagement.durationWeeks || 0) * 7);
  const daysElapsed = daysLeft !== null ? Math.max(0, totalDays - daysLeft) : 0;
  const progressPercent = daysLeft !== null ? Math.max(0, Math.min(100, (daysElapsed / totalDays) * 100)) : 0;
  const todayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][new Date().getDay()];
  const todaysWorkout = latestWorkoutPlan?.days?.find((day) => day.dayOfWeek === todayName);
  const todaysMeals = latestMealPlan?.meals?.filter((meal) => meal.dayOfWeek === todayName) || [];
  const workoutPercent = weeklySummary.workoutsScheduled
    ? Math.round((weeklySummary.workoutsCompleted / weeklySummary.workoutsScheduled) * 100)
    : null;
  const requiredRoles = [
    engagement.post?.needsTrainer && 'trainer',
    engagement.post?.needsNutritionist && 'nutritionist',
  ].filter(Boolean);
  const missingRoles = requiredRoles.filter((role) => !engagement[role]);
  const teamComplete = requiredRoles.length > 0 && missingRoles.length === 0;
  const teamMembers = [engagement.client, engagement.trainer, engagement.nutritionist].filter(Boolean);
  const actionsByRole = {
    client: [
      { key: 'progress', label: 'Log Progress', detail: 'Add weight and wellbeing updates', icon: TrendingUp },
      { key: 'checkins', label: pendingCheckIn ? 'Complete Check-in' : 'View Check-ins', detail: pendingCheckIn ? `Week ${pendingCheckIn.weekNumber} is waiting` : 'Review weekly feedback', icon: ClipboardList },
      { key: 'messages', label: 'Open Team Chat', detail: 'Message your complete support team', icon: MessageSquare },
    ],
    trainer: [
      { key: 'workouts', label: 'Workout Plans', detail: latestWorkoutPlan ? `Continue week ${latestWorkoutPlan.weekNumber}` : 'Create the first workout plan', icon: Dumbbell },
      { key: 'progress', label: 'Review Progress', detail: 'See client results and add guidance', icon: TrendingUp },
      { key: 'messages', label: 'Open Team Chat', detail: 'Coordinate with client and nutritionist', icon: MessageSquare },
    ],
    nutritionist: [
      { key: 'meals', label: 'Meal Plans', detail: latestMealPlan ? `Continue week ${latestMealPlan.weekNumber}` : 'Create the first meal plan', icon: Utensils },
      { key: 'progress', label: 'Review Progress', detail: 'Check adherence and client results', icon: TrendingUp },
      { key: 'messages', label: 'Open Team Chat', detail: 'Coordinate with client and trainer', icon: MessageSquare },
    ],
  };
  const nextActions = actionsByRole[user?.role] || actionsByRole.client;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 12 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(330px,.85fr)] xl:items-stretch">
      {/* Engagement timeline */}
      <div className="card relative overflow-hidden xl:h-full">
        <div className="absolute inset-0 bg-mesh opacity-[0.02] pointer-events-none" />
        <h2 className="font-bold text-gray-950 tracking-tight text-lg mb-4 flex items-center gap-2">
          <Calendar size={18} className="text-brand-600" />
          Engagement Timeline
        </h2>
        <div className="grid grid-cols-3 gap-6 text-sm">
          <div>
            <div className="text-gray-400 font-semibold uppercase tracking-wider text-[10px] mb-1">Started</div>
            <div className="font-bold text-gray-900">{format(new Date(engagement.startDate || engagement.createdAt), 'MMM d, yyyy')}</div>
          </div>
          <div>
            <div className="text-gray-400 font-semibold uppercase tracking-wider text-[10px] mb-1">Ends</div>
            <div className="font-bold text-gray-900">{engagement.endDate ? format(new Date(engagement.endDate), 'MMM d, yyyy') : '—'}</div>
          </div>
          <div>
            <div className="text-gray-400 font-semibold uppercase tracking-wider text-[10px] mb-1">Days remaining</div>
            <div className={`font-black text-xl ${daysLeft !== null && daysLeft <= 7 ? 'text-red-600' : 'text-brand-600'}`}>
              {daysLeft !== null ? `${daysLeft}d` : '—'}
            </div>
          </div>
        </div>
        
        {daysLeft !== null && (
          <div className="mt-5">
            <div className="flex justify-between text-xs font-semibold text-gray-400 mb-1.5">
              <span>{Math.round(progressPercent)}% of program time elapsed</span>
              <span>{daysLeft} days left</span>
            </div>
            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-brand-600 to-emerald-500 rounded-full"
              />
            </div>
          </div>
        )}
      </div>

      {/* Quick stats */}
      <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
        <div className="card-interactive flex items-center gap-4 p-5">
          <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center shrink-0">
            <Activity className="text-green-600" size={22} />
          </div>
          <div>
            <div className="text-lg font-black text-gray-950">
              {weeklySummary.workoutsScheduled ? `${weeklySummary.workoutsCompleted}/${weeklySummary.workoutsScheduled}` : '—'}
            </div>
            <div className="text-xs text-gray-500 font-semibold">Workouts completed · Week {weeklySummary.currentWeek || 1}</div>
          </div>
        </div>

        <div className="card-interactive flex items-center gap-4 p-5">
          <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center shrink-0">
            <Target className="text-orange-600" size={22} />
          </div>
          <div>
            <div className="text-lg font-black text-gray-950">
              {weeklySummary.mealAdherencePercent !== null && weeklySummary.mealAdherencePercent !== undefined ? `${weeklySummary.mealAdherencePercent}%` : '—'}
            </div>
            <div className="text-xs text-gray-500 font-semibold">Meal adherence · {weeklySummary.mealsLogged || 0}/{weeklySummary.mealsScheduled || 0} logged</div>
          </div>
        </div>

        <div className="card-interactive flex items-center gap-4 p-5">
          <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center shrink-0">
            <Scale className="text-purple-600" size={22} />
          </div>
          <div>
            <div className="text-lg font-black text-gray-950">
              {recentProgress ? `${recentProgress.weightKg} kg` : '—'}
            </div>
            <div className="text-xs text-gray-500 font-semibold">Latest Logged Weight</div>
          </div>
        </div>
      </div>
      </div>

      {/* This week */}
      <div className="card overflow-hidden p-0">
        <div className="flex flex-col justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:px-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[.18em] text-emerald-600">Week {weeklySummary.currentWeek || 1}</p>
            <h2 className="section-title mt-1">Today’s plan</h2>
          </div>
          <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
            <span className="capitalize">{format(new Date(), 'EEEE, MMM d')}</span>
            {workoutPercent !== null && <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">{workoutPercent}% workouts done</span>}
          </div>
        </div>
        <div className="grid lg:grid-cols-2">
          <button type="button" onClick={() => onNavigate?.('workouts')} className="group p-5 text-left transition-colors hover:bg-emerald-50/30 sm:p-6 lg:border-r lg:border-slate-100">
            <div className="mb-4 flex items-center justify-between"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><Dumbbell size={19} /></span><span className="text-xs font-bold text-emerald-600">Open workouts →</span></div>
            {todaysWorkout ? (
              <><h3 className="font-extrabold capitalize text-slate-900">{todaysWorkout.isRestDay ? 'Recovery day' : todaysWorkout.focusArea || 'Today’s workout'}</h3><p className="mt-1 text-sm font-medium text-slate-500">{todaysWorkout.isRestDay ? 'Rest, recover and prepare for the next session.' : `${todaysWorkout.exercises?.length || 0} exercises · ${todaysWorkout.durationMinutes || 45} minutes`}</p></>
            ) : (
              <><h3 className="font-extrabold text-slate-900">No workout scheduled today</h3><p className="mt-1 text-sm font-medium text-slate-500">Use the time for recovery or review the rest of your week.</p></>
            )}
          </button>
          <button type="button" onClick={() => onNavigate?.('meals')} className="group border-t border-slate-100 p-5 text-left transition-colors hover:bg-orange-50/30 sm:p-6 lg:border-t-0">
            <div className="mb-4 flex items-center justify-between"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600"><Utensils size={19} /></span><span className="text-xs font-bold text-orange-600">Open meal plan →</span></div>
            {latestMealPlan ? (
              <><h3 className="font-extrabold text-slate-900">{todaysMeals.length} meals planned today</h3><p className="mt-1 text-sm font-medium text-slate-500">{latestMealPlan.dailyCalories ? `${latestMealPlan.dailyCalories} kcal` : 'Calorie target pending'}{latestMealPlan.proteinG ? ` · ${latestMealPlan.proteinG}g protein` : ''}{latestMealPlan.carbsG ? ` · ${latestMealPlan.carbsG}g carbs` : ''}</p></>
            ) : (
              <><h3 className="font-extrabold text-slate-900">Meal plan not assigned yet</h3><p className="mt-1 text-sm font-medium text-slate-500">Your nutritionist can add the plan for this week.</p></>
            )}
          </button>
        </div>
      </div>

      {/* Role-aware shortcuts */}
      <div className="card">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="font-bold text-gray-950 tracking-tight text-lg">Next Actions</h2>
            <p className="text-xs text-gray-500 font-medium mt-0.5">Shortcuts based on your role in this team.</p>
          </div>
          <span className="badge-blue capitalize font-bold">{user?.role}</span>
        </div>
        <div className="grid sm:grid-cols-3 gap-3">
          {nextActions.map(({ key, label, detail, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => onNavigate?.(key)}
              className="group text-left p-4 rounded-2xl border border-gray-100 bg-gray-50/60 hover:bg-white hover:border-brand-200 hover:shadow-card-hover transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              <div className="w-9 h-9 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-brand-600 mb-3 group-hover:bg-brand-50 group-hover:border-brand-100 transition-colors">
                <Icon size={17} />
              </div>
              <div className="font-bold text-gray-900 text-sm group-hover:text-brand-700 transition-colors">{label}</div>
              <div className="text-xs text-gray-500 font-medium mt-1 leading-relaxed">{detail}</div>
            </button>
          ))}
        </div>
      </div>

      {pendingCheckIn && (
        <div className="border border-amber-200 bg-amber-50/60 rounded-2xl p-5 flex items-start gap-4 shadow-sm">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
            <AlertCircle size={20} className="text-amber-600" />
          </div>
          <div>
            <h4 className="font-bold text-amber-900 text-sm mb-1">Week {pendingCheckIn.weekNumber} check-in is ready</h4>
            <p className="text-xs text-amber-700 font-medium leading-relaxed">
              Your professional team has assigned a new weekly check-in. Navigate to the <strong>Check-ins</strong> tab above to fill it out.
            </p>
          </div>
        </div>
      )}

      {teamComplete ? (
        <div className="border border-emerald-200 bg-emerald-50/70 rounded-2xl p-5 flex items-start gap-4 shadow-sm">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
            <CheckCircle size={20} className="text-emerald-600" />
          </div>
          <div>
            <h4 className="font-bold text-emerald-900 text-sm mb-1">Your complete support team is ready</h4>
            <p className="text-xs text-emerald-700 font-medium leading-relaxed">
              All required roles are filled. The team now shares this workspace, plans, progress, check-ins, and team chat.
            </p>
          </div>
        </div>
      ) : missingRoles.length > 0 && (
        <div className="border border-blue-200 bg-blue-50/60 rounded-2xl p-5 flex items-start gap-4 shadow-sm">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
            <UserPlus size={20} className="text-blue-600" />
          </div>
          <div>
            <h4 className="font-bold text-blue-900 text-sm mb-1">Team formation in progress</h4>
            <p className="text-xs text-blue-700 font-medium leading-relaxed capitalize">
              Still waiting for: {missingRoles.join(' and ')}. The current team can begin collaborating now.
            </p>
          </div>
        </div>
      )}

      {/* Team */}
      <div className="card">
        <h2 className="font-bold text-gray-950 tracking-tight text-lg mb-4 flex items-center gap-2">
          <Users size={18} className="text-brand-600" />
          Your FitBid Team
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {teamMembers.map(member => (
            <div key={member._id} className="flex items-center gap-4 p-4 border border-gray-100 rounded-2xl bg-gray-50/50">
              <div className="w-12 h-12 rounded-full ring-2 ring-brand-100 bg-brand-100 flex items-center justify-center text-brand-700 font-bold shrink-0 overflow-hidden shadow-sm">
                {member.avatar ? (
                  <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                ) : (
                  member.name?.charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <div className="font-bold text-gray-900 text-sm">{member.name}</div>
                <div className="text-xs font-semibold text-gray-400 capitalize mt-0.5 tracking-wide">{member.role}</div>
              </div>
            </div>
          ))}
          {missingRoles.map((role) => (
            <div key={role} className="flex items-center gap-4 p-4 border border-dashed border-gray-200 rounded-2xl bg-gray-50/30">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 shrink-0">
                <UserPlus size={20} />
              </div>
              <div>
                <div className="font-bold text-gray-600 text-sm capitalize">Awaiting {role}</div>
                <div className="text-xs font-semibold text-gray-400 mt-0.5">Open role</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
