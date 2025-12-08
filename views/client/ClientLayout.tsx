import React, { useMemo } from 'react';
import { Outlet, useParams, Link, useLocation } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { Upload, ListFilter, CreditCard, PieChart, TrendingUp, FileText, ArrowLeft, LayoutGrid, Sprout, BarChart3 } from 'lucide-react';

export const ClientLayout = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const { clients } = useData();
  const location = useLocation();
  
  const client = useMemo(() => clients.find(c => c.id === clientId), [clients, clientId]);

  if (!client) return <div className="text-center p-10 text-slate-500">Cliente não encontrado.</div>;

  const tabs = [
    { path: '', label: 'Visão Geral', icon: <LayoutGrid size={18} /> },
    { path: 'import', label: 'Importação', icon: <Upload size={18} /> },
    { path: 'classification', label: 'Classificação', icon: <ListFilter size={18} /> },
    { path: 'debts', label: 'Dívidas', icon: <CreditCard size={18} /> },
    { path: 'analysis', label: 'Diagnóstico de Caixa', icon: <PieChart size={18} /> },
    { path: 'cashflow', label: 'Fluxo de Caixa', icon: <BarChart3 size={18} /> },
    { path: 'problem-tree', label: 'Plano de Ação', icon: <Sprout size={18} /> },
    { path: 'projection', label: 'Projeção (Sufoco)', icon: <TrendingUp size={18} /> },
    { path: 'report', label: 'Dossiê PDF', icon: <FileText size={18} /> },
  ];

  return (
    <div className="flex flex-col h-full max-w-7xl mx-auto w-full">
      {/* Client Header */}
      <div className="flex flex-col gap-6 mb-8 print:hidden">
        <Link to="/" className="text-slate-400 hover:text-slate-800 flex items-center gap-2 text-sm font-medium transition-colors w-fit">
          <ArrowLeft size={16} /> Voltar para Carteira
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
             <div className="w-16 h-16 rounded-xl bg-slate-900 flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-slate-200 font-serif">
               {client.name.charAt(0)}
             </div>
             <div>
               <h1 className="text-3xl font-bold text-slate-900 tracking-tight font-serif">{client.name}</h1>
               <div className="flex items-center gap-3 mt-1">
                 <span className="text-sm text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded border border-slate-200">{client.sector}</span>
                 <span className="text-sm text-slate-400 font-mono">ID: {client.id.toUpperCase().substring(0,8)}</span>
               </div>
             </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 mb-8 overflow-x-auto print:hidden">
        <nav className="flex space-x-1 min-w-max">
          {tabs.map((tab) => {
            const fullPath = tab.path ? `/client/${clientId}/${tab.path}` : `/client/${clientId}`;
            const isRoot = tab.path === '';
            const isActive = isRoot 
              ? location.pathname === `/client/${clientId}` || location.pathname === `/client/${clientId}/`
              : location.pathname.includes(tab.path);
            
            return (
              <Link
                key={tab.path}
                to={fullPath}
                className={`
                  flex items-center gap-2 px-4 py-3 border-b-2 text-sm font-bold transition-all
                  ${isActive 
                    ? 'border-teal-600 text-teal-700 bg-teal-50/50' 
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'}
                `}
              >
                {tab.icon}
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex-1 overflow-auto animate-in fade-in duration-300">
        <Outlet context={{ client }} />
      </div>
    </div>
  );
};