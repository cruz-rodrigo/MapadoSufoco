import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, FileText, PieChart, TrendingUp, Settings, LogOut, ShieldCheck } from 'lucide-react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path 
        ? 'bg-[#1e293b] text-teal-400 border-r-[3px] border-teal-500 shadow-inner' 
        : 'text-slate-400 hover:text-slate-200 hover:bg-[#1e293b]/50';
  };

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden font-sans">
      {/* Sidebar - Premium Navy Look */}
      <aside className="w-72 bg-[#0f172a] text-slate-300 flex flex-col shadow-2xl print:hidden z-20">
        <div className="p-8 border-b border-slate-800/50">
          <h1 className="text-xl font-bold text-white flex items-center gap-3 tracking-tight">
            <div className="w-10 h-10 bg-gradient-to-br from-teal-600 to-teal-800 rounded-xl flex items-center justify-center text-white shadow-lg shadow-teal-900/50 border border-teal-500/30">
              <TrendingUp size={20} strokeWidth={2.5} />
            </div>
            <div className="flex flex-col">
              <span className="font-serif tracking-wide text-lg">Cruz Capital</span>
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.2em]">Boutique M&A</span>
            </div>
          </h1>
        </div>

        <nav className="flex-1 overflow-y-auto py-8">
          <p className="px-8 mb-3 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Principal</p>
          <ul className="space-y-1">
            <li>
              <Link to="/" className={`flex items-center gap-3 px-8 py-3.5 text-sm font-medium transition-all ${isActive('/')}`}>
                <LayoutDashboard size={18} />
                Carteira de Clientes
              </Link>
            </li>
          </ul>

          <p className="px-8 mt-10 mb-3 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Administrativo</p>
          <ul className="space-y-1">
             <li>
              <button className={`w-full flex items-center gap-3 px-8 py-3.5 text-sm font-medium transition-all text-slate-400 hover:text-slate-200 hover:bg-[#1e293b]/50`}>
                <Users size={18} />
                Gestão de Acessos
              </button>
            </li>
            <li>
              <button className={`w-full flex items-center gap-3 px-8 py-3.5 text-sm font-medium transition-all text-slate-400 hover:text-slate-200 hover:bg-[#1e293b]/50`}>
                <Settings size={18} />
                Configurações do Sistema
              </button>
            </li>
          </ul>
        </nav>

        <div className="p-6 bg-[#020617] border-t border-slate-800">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-teal-500 font-bold text-sm shadow-inner">
              RC
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">Rodrigo Cruz</p>
              <p className="text-[10px] text-slate-500 truncate uppercase tracking-wider">Sócio Diretor</p>
            </div>
            <LogOut size={16} className="text-slate-600 cursor-pointer hover:text-white transition-colors" />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#f8fafc]">
        <div className="flex-1 overflow-auto p-6 md:p-12 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
          {children}
        </div>
      </main>
    </div>
  );
};