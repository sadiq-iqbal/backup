import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar, { MobileNavigation } from './Sidebar';
import { useAuth } from '../../context/AuthContext';

export default function Layout() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 py-8">
          <Outlet />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 bg-app-shell">
        <Navbar />
        <main className="flex-1 overflow-auto px-4 pb-28 pt-5 sm:px-6 sm:pt-7 md:pb-8 xl:px-10">
          <div className="mx-auto w-full max-w-[1440px]">
            <Outlet />
          </div>
        </main>
        <MobileNavigation />
      </div>
    </div>
  );
}
