import { Link } from 'react-router-dom';
import { Dumbbell, ChefHat, Trophy, ArrowRight, CheckCircle, Sparkles, MessageSquare, Activity, Users, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

const features = [
  { icon: Trophy, title: 'Better proposals', desc: 'Compare tailored offers from fitness and nutrition professionals, with pricing and expertise shown clearly.' },
  { icon: Dumbbell, title: 'Coordinated plans', desc: 'Your trainer and nutritionist work from the same goals, progress and weekly check-ins.' },
  { icon: ChefHat, title: 'One shared workspace', desc: 'Workouts, meal plans, progress and conversations live together instead of across disconnected apps.' },
];

const steps = [
  { step: '01', title: 'Share your goal', desc: 'Describe the outcome you want, the support you need and your preferred budget.' },
  { step: '02', title: 'Choose your experts', desc: 'Compare proposals, experience and approach before making a confident decision.' },
  { step: '03', title: 'Move forward together', desc: 'Follow one coordinated plan with your trainer and nutritionist beside you.' },
];

const reveal = { hidden: { opacity: 0, y: 18 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/80 px-4 py-3 backdrop-blur-xl sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-emerald-300"><Dumbbell size={17} strokeWidth={2.5} /></span>
            <span className="text-xl font-black tracking-tight text-slate-950">Fit<span className="text-emerald-600">Bid</span></span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link to="/directory" className="hidden text-sm font-semibold text-slate-500 transition-colors hover:text-slate-900 sm:inline-block">Find professionals</Link>
            <Link to="/login" className="btn-secondary px-3.5 py-2 text-sm sm:px-4">Log in</Link>
            <Link to="/register" className="btn-primary px-3.5 py-2 text-sm shadow-glow-sm sm:px-4">Get started</Link>
          </div>
        </div>
      </header>

      <section className="noise-overlay relative overflow-hidden border-b border-slate-200/60 bg-mesh-animated px-5 py-16 sm:px-6 sm:py-24 lg:py-28">
        <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[1.02fr_.98fr] lg:gap-16">
          <div className="text-center lg:text-left">
            <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-white/80 px-3.5 py-1.5 text-xs font-bold text-emerald-700 shadow-sm backdrop-blur">
              <Sparkles size={12} /> Your complete wellness team, in one place
            </motion.div>
            <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-balance mb-6 text-[2.75rem] font-black leading-[1.02] tracking-[-0.045em] text-slate-950 sm:text-6xl lg:text-[4.3rem]">
              Build a healthier life with the <span className="text-gradient-hero font-black">right team.</span>
            </motion.h1>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mx-auto mb-9 max-w-2xl text-base font-medium leading-relaxed text-slate-500 sm:text-lg lg:mx-0 lg:max-w-xl">
              Share your goal, compare expert proposals, and bring your trainer and nutritionist together in one coordinated workspace.
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
              <Link to="/register" className="btn-primary px-8 py-3.5 text-base shadow-glow-md">Start your journey <ArrowRight size={18} /></Link>
              <Link to="/directory" className="btn-secondary px-8 py-3.5 text-base">Browse professionals</Link>
            </motion.div>
            <div className="mt-8 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs font-bold text-slate-500 lg:justify-start">
              {['Clear proposals', 'Verified roles', 'Shared progress'].map(item => <span key={item} className="flex items-center gap-1.5"><CheckCircle size={14} className="text-emerald-500" />{item}</span>)}
            </div>
          </div>

          <motion.div initial={{ opacity: 0, y: 24, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.7, delay: 0.2 }} className="relative mx-auto w-full max-w-xl">
            <div className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-br from-emerald-300/25 via-cyan-200/10 to-violet-300/20 blur-2xl" />
            <div className="relative overflow-hidden rounded-[1.75rem] border border-white/80 bg-white/90 p-3 shadow-[0_35px_90px_-30px_rgba(15,23,42,.32)] backdrop-blur-xl sm:p-4">
              <div className="rounded-[1.25rem] bg-slate-950 p-5 text-white sm:p-6">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-emerald-300">Active program</p><h3 className="mt-1 text-base font-extrabold sm:text-lg">Strength & nutrition reset</h3></div>
                  <span className="shrink-0 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-bold text-emerald-300">Week 4 of 12</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full w-1/3 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-300" /></div>
                <div className="mt-5 grid grid-cols-3 gap-2.5">
                  {[['12', 'Workouts', Activity], ['4', 'Check-ins', CheckCircle], ['-3.2kg', 'Progress', TrendingUp]].map(([value, label, Icon]) => (
                    <div key={label} className="rounded-xl border border-white/[.08] bg-white/[.05] p-3"><Icon size={15} className="mb-2 text-emerald-300" /><div className="text-base font-black">{value}</div><div className="text-[9px] font-semibold text-slate-400">{label}</div></div>
                  ))}
                </div>
              </div>
              <div className="grid gap-3 p-2 pt-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                  <div className="mb-3 flex items-center gap-2 text-xs font-extrabold text-slate-900"><Users size={15} className="text-emerald-600" /> Your wellness team</div>
                  <div className="flex -space-x-2"><span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-emerald-100 text-xs font-black text-emerald-700">J</span><span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-cyan-100 text-xs font-black text-cyan-700">A</span><span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-violet-100 text-xs font-black text-violet-700">D</span></div>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                  <div className="mb-3 flex items-center gap-2 text-xs font-extrabold text-slate-900"><MessageSquare size={15} className="text-emerald-600" /> Team conversation</div>
                  <p className="text-[11px] font-medium leading-relaxed text-slate-500">Your plan is aligned and ready for the week.</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 sm:py-24">
        <div className="mb-12 text-center sm:mb-16">
          <span className="text-xs font-black uppercase tracking-[.2em] text-emerald-600">Why FitBid</span>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Everything works better together</h2>
          <p className="mx-auto mt-3 max-w-xl font-medium leading-relaxed text-slate-500">Choose the right professionals, then give the whole team one clear view of your journey.</p>
        </div>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} transition={{ staggerChildren: 0.1 }} className="grid gap-5 md:grid-cols-3">
          {features.map(({ icon: Icon, title, desc }, index) => (
            <motion.div key={title} variants={reveal} className="card-interactive group bg-white p-7 sm:p-8">
              <div className="mb-6 flex items-center justify-between"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 transition-colors group-hover:bg-emerald-100"><Icon size={23} /></span><span className="text-xs font-black text-slate-200">0{index + 1}</span></div>
              <h3 className="mb-3 text-xl font-extrabold text-slate-950">{title}</h3><p className="text-sm font-medium leading-relaxed text-slate-500">{desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      <section className="border-y border-slate-200/70 bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-14 max-w-2xl"><span className="text-xs font-black uppercase tracking-[.2em] text-emerald-600">How it works</span><h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">From goal to real progress</h2></div>
          <div className="grid gap-8 md:grid-cols-3">
            {steps.map(({ step, title, desc }) => <div key={step} className="relative border-t border-slate-200 pt-6"><span className="absolute -top-3 left-0 bg-white pr-3 text-sm font-black text-emerald-600">{step}</span><h3 className="mb-2 text-lg font-extrabold text-slate-950">{title}</h3><p className="text-sm font-medium leading-relaxed text-slate-500">{desc}</p></div>)}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 sm:py-24">
        <div className="relative overflow-hidden rounded-[2rem] bg-slate-950 px-6 py-14 text-center text-white shadow-2xl sm:px-12 sm:py-16">
          <div className="absolute -left-20 -top-24 h-64 w-64 rounded-full bg-emerald-400/20 blur-3xl" /><div className="absolute -bottom-28 right-0 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />
          <div className="relative mx-auto max-w-2xl"><p className="mb-3 text-xs font-black uppercase tracking-[.2em] text-emerald-300">Your next chapter</p><h2 className="text-3xl font-black tracking-tight sm:text-5xl">A stronger plan starts with the right people.</h2><p className="mx-auto mb-8 mt-5 max-w-xl font-medium leading-relaxed text-slate-400">Create your request today and start comparing personalized proposals from FitBid professionals.</p><Link to="/register" className="inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-7 py-3.5 font-extrabold text-slate-950 transition-all hover:-translate-y-0.5 hover:bg-emerald-300">Get started free <ArrowRight size={18} /></Link></div>
        </div>
      </section>

      <footer className="border-t border-slate-200/70 bg-white py-8 text-sm font-medium text-slate-400">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 sm:flex-row"><div className="font-black text-slate-900">Fit<span className="text-emerald-600">Bid</span></div><div>© {new Date().getFullYear()} FitBid. Built for better wellness teams.</div><div className="flex gap-4 text-xs"><Link to="/directory" className="hover:text-slate-900">Directory</Link><Link to="/login" className="hover:text-slate-900">Log in</Link></div></div>
      </footer>
    </div>
  );
}
