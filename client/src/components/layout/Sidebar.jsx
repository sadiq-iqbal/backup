import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileText, PlusCircle, Users, Settings, ShieldCheck, Dumbbell, Rss } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';

export const navItems = {
  client: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', mobileLabel: 'Home' },
    { to: '/posts/new', icon: PlusCircle, label: 'Post a Request', mobileLabel: 'Post' },
    { to: '/posts', icon: FileText, label: 'My Posts', mobileLabel: 'Requests' },
    { to: '/feed', icon: Rss, label: 'Community Feed', mobileLabel: 'Feed' },
    { to: '/directory', icon: Users, label: 'Find Professionals', mobileLabel: 'Experts' },
    { to: '/settings', icon: Settings, label: 'Settings', hideOnMobile: true },
  ],
  trainer: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', mobileLabel: 'Home' },
    { to: '/posts', icon: FileText, label: 'Browse Requests', mobileLabel: 'Requests' },
    { to: '/feed', icon: Rss, label: 'Community Feed', mobileLabel: 'Feed' },
    { to: '/directory', icon: Users, label: 'Directory', mobileLabel: 'People' },
    { to: '/settings', icon: Settings, label: 'Settings', mobileLabel: 'Settings' },
  ],
  nutritionist: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', mobileLabel: 'Home' },
    { to: '/posts', icon: FileText, label: 'Browse Requests', mobileLabel: 'Requests' },
    { to: '/feed', icon: Rss, label: 'Community Feed', mobileLabel: 'Feed' },
    { to: '/directory', icon: Users, label: 'Directory', mobileLabel: 'People' },
    { to: '/settings', icon: Settings, label: 'Settings', mobileLabel: 'Settings' },
  ],
  admin: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', mobileLabel: 'Home' },
    { to: '/admin', icon: ShieldCheck, label: 'Admin Panel', mobileLabel: 'Admin' },
    { to: '/feed', icon: Rss, label: 'Community Feed', mobileLabel: 'Feed' },
    { to: '/directory', icon: Users, label: 'Directory', mobileLabel: 'People' },
    { to: '/settings', icon: Settings, label: 'Settings', mobileLabel: 'Settings' },
  ],
};

const roleLabels = {
  client: 'Client workspace',
  trainer: 'Trainer workspace',
  nutritionist: 'Nutrition workspace',
  admin: 'Administration',
};

export default function Sidebar() {
  const { user } = useAuth();
  const items = navItems[user?.role] || [];

  return (
    <aside className="relative z-40 hidden h-screen w-[264px] shrink-0 flex-col overflow-hidden border-r border-white/5 bg-slate-950 px-4 py-5 text-white md:sticky md:top-0 md:flex">
      <div className="pointer-events-none absolute -left-24 top-16 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 right-0 h-56 w-56 rounded-full bg-cyan-500/10 blur-3xl" />
      <NavLink to="/dashboard" className="relative mb-8 flex items-center gap-3 px-2">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-400 text-slate-950 shadow-[0_10px_30px_rgba(52,211,153,.25)]">
          <Dumbbell size={20} strokeWidth={2.5} />
        </span>
        <span>
          <span className="block text-xl font-black tracking-tight">FitBid</span>
          <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-300/80">Stronger together</span>
        </span>
      </NavLink>
      <div className="relative mb-4 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">{roleLabels[user?.role] || 'Workspace'}</div>
      <nav className="relative flex flex-1 flex-col gap-1.5">
        {items.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} className={({ isActive }) => `group relative flex items-center gap-3 overflow-hidden rounded-xl px-3.5 py-3 text-sm font-semibold transition-all duration-200 ${isActive ? 'text-white' : 'text-slate-400 hover:bg-white/[0.06] hover:text-white'}`}>
            {({ isActive }) => (
              <>
                {isActive && <motion.span layoutId="active-sidebar-indicator" className="absolute inset-0 rounded-xl border border-emerald-400/20 bg-emerald-400/10" transition={{ type: 'spring', stiffness: 350, damping: 30 }} />}
                <Icon size={18} className={`relative z-10 ${isActive ? 'text-emerald-300' : 'text-slate-500 group-hover:text-slate-300'}`} />
                <span className="relative z-10">{label}</span>
                {isActive && <span className="relative z-10 ml-auto h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_10px_rgba(110,231,183,.8)]" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="relative rounded-2xl border border-white/[0.08] bg-white/[0.04] p-3.5">
        <div className="mb-1 flex items-center gap-2 text-xs font-bold text-white"><span className="h-2 w-2 rounded-full bg-emerald-400" /> All systems ready</div>
        <p className="text-[11px] leading-relaxed text-slate-500">Your plans, bids and team messages stay in one place.</p>
      </div>
    </aside>
  );
}

export function MobileNavigation() {
  const { user } = useAuth();
  const items = (navItems[user?.role] || []).filter(item => !item.hideOnMobile).slice(0, 5);

  return (
    <nav className="mobile-safe-bottom fixed inset-x-3 bottom-3 z-40 flex items-center justify-around rounded-2xl border border-slate-200/80 bg-white/95 px-1.5 py-1.5 shadow-[0_18px_50px_rgba(15,23,42,.18)] backdrop-blur-xl md:hidden">
      {items.map(({ to, icon: Icon, mobileLabel, label }) => (
        <NavLink key={to} to={to} className={({ isActive }) => `relative flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-1 py-2 text-[10px] font-bold transition-colors ${isActive ? 'text-emerald-700' : 'text-slate-400'}`}>
          {({ isActive }) => (
            <>
              {isActive && <motion.span layoutId="mobile-nav-active" className="absolute inset-0 rounded-xl bg-emerald-50" />}
              <Icon size={19} className="relative z-10" strokeWidth={isActive ? 2.5 : 2} />
              <span className="relative z-10 max-w-full truncate">{mobileLabel || label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
