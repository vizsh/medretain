import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import GlobalSearch from './GlobalSearch';
import { ThemeToggle } from './ThemeProvider';
import { Hospital, LayoutDashboard, Users, Layers, MessageSquare, BarChart3, Search } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);

  // Global keyboard shortcut for search (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        setShowGlobalSearch(true);
      }
      if (event.key === 'Escape') {
        setShowGlobalSearch(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navItems = [
    {
      path: '/',
      label: 'Dashboard',
      icon: <LayoutDashboard size={20} />,
    },
    {
      path: '/patients',
      label: 'Patients',
      icon: <Users size={20} />,
    },
    {
      path: '/batches',
      label: 'Batches',
      icon: <Layers size={20} />,
    },
    {
      path: '/messages',
      label: 'Messages',
      icon: <MessageSquare size={20} />,
    },
    {
      path: '/analytics',
      label: 'Analytics',
      icon: <BarChart3 size={20} />,
    },
  ];

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-200">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900/50 border-r border-white/5 flex flex-col fixed h-screen overflow-y-auto backdrop-blur-xl z-20">
        {/* Logo */}
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center border border-blue-500/30">
              <Hospital className="text-blue-500 w-6 h-6" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              Tathya <span className="text-blue-500 text-sm font-medium">CRM</span>
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-3 space-y-1">
          {/* Quick Search Button */}
          <div className="px-3 mb-6">
            <button
              onClick={() => setShowGlobalSearch(true)}
              className="w-full group flex items-center justify-between px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all duration-200"
            >
              <div className="flex items-center gap-3 text-slate-400 group-hover:text-white">
                <Search size={18} />
                <span className="text-sm font-medium">Search Patients</span>
              </div>
              <kbd className="px-2 py-0.5 bg-slate-800 text-slate-500 rounded text-[10px] font-mono border border-white/5">
                ⌘K
              </kbd>
            </button>
          </div>

          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
                  ${isActive
                    ? 'bg-blue-600/10 text-white border border-blue-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'}
                `}
              >
                <span className={`${isActive ? 'text-blue-500' : 'text-current'} transition-colors`}>
                  {item.icon}
                </span>
                <span className="text-sm font-semibold">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Theme Toggle & Bottom Actions */}
        <div className="p-4 border-t border-white/5 space-y-4">
          <ThemeToggle />
          <div className="px-3 text-[10px] uppercase tracking-widest font-bold text-slate-600">
            System v2.0 - Production
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 flex-1 p-8 min-h-screen relative overflow-x-hidden">
        {/* Subtle background glow */}
        <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none -z-10" />
        <div className="fixed bottom-0 left-0 w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-[120px] pointer-events-none -z-10" />

        {children}
      </main>

      {/* Global Search Modal */}
      <GlobalSearch
        isOpen={showGlobalSearch}
        onClose={() => setShowGlobalSearch(false)}
      />
    </div>
  );
};

export default Layout;
