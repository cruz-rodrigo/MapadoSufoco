import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, FileText, PieChart, TrendingUp, Settings, LogOut, ShieldCheck } from 'lucide-react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path ? 'bg-slate-800 text-teal-400 border-r-4 border-teal-500' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50';
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Sidebar - Premium Navy Look */}
      <aside className="w-72 bg-slate-900 text-slate-300 flex flex-col shadow-2xl print:hidden z-20">
        <div className="p-8 border-b border-slate-800">
          <h1 className="text-xl font-bold text-white flex items-center gap-3 tracking-tight">
            <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-teal-900/50">
              <TrendingUp size={18} strokeWidth={3} />
            </div>
            <div className="flex flex-col">
              <span>Cruz Capital</span>
              <span className="text-[10px] text-slate-400 font-normal uppercase tracking-wider">Engenharia Financeira</span>
            </div>
          </h1>
        </div>

        <nav className="flex-1 overflow-y-auto py-6">
          <p className="px-6 mb-2 text-xs font-bold text-slate-500 uppercase tracking-widest">Menu Principal</p>
          <ul className="space-y-1">
            <li>
              <Link to="/" className={`flex items-center gap-3 px-6 py-3 text-sm font-medium transition-all ${isActive('/')}`}>
                <LayoutDashboard size={18} />
                Carteira de Clientes
              </Link>
            </li>
          </ul>

          <p className="px-6 mt-8 mb-2 text-xs font-bold text-slate-500 uppercase tracking-widest">Sistema</p>
          <ul className="space-y-1">
             <li>
              <button className={`w-full flex items-center gap-3 px-6 py-3 text-sm font-medium transition-all text-slate-400 hover:text-slate-200 hover:bg-slate-800/50`}>
                <Users size={18} />
                Gestão de Acessos
              </button>
            </li>
            <li>
              <button className={`w-full flex items-center gap-3 px-6 py-3 text-sm font-medium transition-all text-slate-400 hover:text-slate-200 hover:bg-slate-800/50`}>
                <Settings size={18} />
                Configurações
              </button>
            </li>
          </ul>
        </nav>

        <div className="p-6 bg-slate-950 border-t border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-teal-500 font-bold text-sm shadow-inner">
              RC
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">Rodrigo Cruz</p>
              <p className="text-xs text-slate-500 truncate">Consultor Sênior</p>
            </div>
            <LogOut size={16} className="text-slate-500 cursor-pointer hover:text-white transition-colors" />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50/50">
        <div className="flex-1 overflow-auto p-6 md:p-10 scrollbar-thin scrollbar-thumb-slate-300">
          {children}
        </div>
      </main>
    </div>
  );
};