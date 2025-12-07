import React, { useMemo } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { Client } from '../../types';
import { useData } from '../../context/DataContext';
import { formatCurrency } from '../../constants';
import { PieChart, Upload, ArrowRight, ShieldAlert, CreditCard, TrendingUp, TrendingDown, FileText, CalendarDays, Activity } from 'lucide-react';

export const Overview = () => {
  const { client } = useOutletContext<{ client: Client }>();
  const { getTransactionsByClient, getDebtsByClient } = useData();
  const navigate = useNavigate();

  const transactions = getTransactionsByClient(client.id);
  const debts = getDebtsByClient(client.id);

  // Quick Stats
  const stats = useMemo(() => {
    const totalIn = transactions.filter(t => t.type === 'IN').reduce((sum, t) => sum + t.value, 0);
    const totalOut = transactions.filter(t => t.type === 'OUT').reduce((sum, t) => sum + t.value, 0);
    const net = totalIn - totalOut;
    const totalDebt = debts.reduce((sum, d) => sum + d.balance, 0);
    
    // Calculate date range
    let daysRange = 0;
    if (transactions.length > 0) {
      const dates = transactions.map(t => new Date(t.date).getTime());
      const minDate = Math.min(...dates);
      const maxDate = Math.max(...dates);
      const diffTime = Math.abs(maxDate - minDate);
      daysRange = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // inclusive
    }

    return { totalIn, totalOut, net, totalDebt, daysRange };
  }, [transactions, debts]);

  // Determine Risk Level (Simple Mock Logic)
  const riskLevel = stats.net < 0 ? 'ALTO' : stats.net < 10000 ? 'MÉDIO' : 'BAIXO';
  const riskConfig = {
    'ALTO': { color: 'bg-[#fef2f2] text-rose-900 border-rose-100', iconColor: 'text-rose-600', desc: 'Atenção Crítica Necessária' },
    'MÉDIO': { color: 'bg-[#fffbeb] text-amber-900 border-amber-100', iconColor: 'text-amber-600', desc: 'Requer Monitoramento' },
    'BAIXO': { color: 'bg-[#ecfdf5] text-emerald-900 border-emerald-100', iconColor: 'text-emerald-600', desc: 'Situação Estável' }
  }[riskLevel];

  const hasData = transactions.length > 0;

  return (
    <div className="space-y-8 pb-10">
      {/* Top Banner Status - Financial Style */}
      <div className={`p-8 rounded-xl border flex items-center justify-between ${riskConfig.color} shadow-sm relative overflow-hidden`}>
        <div className="absolute right-0 top-0 opacity-5 pointer-events-none transform translate-x-10 -translate-y-5">
            <Activity size={200} />
        </div>
        
        <div className="flex items-center gap-6 relative z-10">
          <div className={`p-4 bg-white/80 rounded-full backdrop-blur-sm shadow-sm ${riskConfig.iconColor}`}>
             <ShieldAlert size={32} />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] opacity-80 mb-1">Classificação de Risco de Caixa</p>
            <h2 className="text-3xl font-serif font-bold tracking-tight">{riskLevel}</h2>
            <p className="text-sm font-medium opacity-80 mt-1">{riskConfig.desc}</p>
          </div>
        </div>
        <div className="text-right hidden md:block relative z-10">
          <p className="text-lg font-serif font-bold">{transactions.length} Lançamentos</p>
          <div className="flex items-center justify-end gap-2 text-xs opacity-70 mt-1 uppercase tracking-wider font-bold">
             <CalendarDays size={14} />
             <span>Histórico de {stats.daysRange} dias</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Financial Summary */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
             <h3 className="text-xl font-serif font-bold text-slate-900 flex items-center gap-3">
               <TrendingUp size={24} className="text-slate-400" />
               Performance Financeira
             </h3>
             {hasData && (
               <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-3 py-1 rounded-full border border-slate-200 uppercase tracking-widest">
                 Base Realizada
               </span>
             )}
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
             {/* Cards */}
             <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] hover:border-emerald-200 transition-colors group">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Entradas
                </p>
                <p className="text-3xl font-serif font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">{formatCurrency(stats.totalIn)}</p>
             </div>
             
             <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] hover:border-rose-200 transition-colors group">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span> Saídas
                </p>
                <p className="text-3xl font-serif font-bold text-slate-900 group-hover:text-rose-700 transition-colors">{formatCurrency(stats.totalOut)}</p>
             </div>
             
             <div className={`bg-white p-8 rounded-xl border shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] transition-colors group ${stats.net >= 0 ? 'border-emerald-100 bg-emerald-50/10' : 'border-rose-100 bg-rose-50/10'}`}>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Resultado Líquido</p>
                <p className={`text-3xl font-serif font-bold ${stats.net >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {formatCurrency(stats.net)}
                </p>
             </div>
             
             <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] group">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Passivo Total (Dívida)</p>
                <p className="text-3xl font-serif font-bold text-slate-900">{formatCurrency(stats.totalDebt)}</p>
             </div>
          </div>

          {!hasData && (
            <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-12 text-center">
              <p className="text-slate-500 mb-6 font-medium">Ainda não há dados financeiros importados para este cliente.</p>
              <button 
                onClick={() => navigate('import')}
                className="bg-[#0f172a] text-white px-8 py-3 rounded-lg font-bold text-sm tracking-wide hover:bg-slate-800 transition-colors shadow-lg"
              >
                INICIAR IMPORTAÇÃO
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Actions & Shortcuts */}
        <div className="space-y-6">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-3 pb-4 border-b border-slate-200 font-serif uppercase tracking-wider text-sm">
            Navegação Rápida
          </h3>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
            <ActionRow 
                icon={<Upload size={18} />} 
                title="Importar Extratos" 
                desc="Processamento de dados bancários"
                color="text-slate-600 bg-slate-100"
                onClick={() => navigate('import')}
            />
             <ActionRow 
                icon={<CreditCard size={18} />} 
                title="Estrutura de Capital" 
                desc="Gestão de Passivos e Dívidas"
                color="text-indigo-600 bg-indigo-50"
                onClick={() => navigate('debts')}
            />
             <ActionRow 
                icon={<TrendingDown size={18} />} 
                title="Mapa de Ralos (DFC)" 
                desc="Análise de eficiência de caixa"
                color="text-rose-600 bg-rose-50"
                onClick={() => navigate('analysis')}
            />
             <ActionRow 
                icon={<FileText size={18} />} 
                title="Dossiê Executivo" 
                desc="Gerar relatório em PDF"
                color="text-teal-600 bg-teal-50"
                onClick={() => navigate('report')}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const ActionRow = ({ icon, title, desc, color, onClick }: any) => (
    <button onClick={onClick} className="w-full text-left p-5 hover:bg-slate-50 transition-colors flex items-center justify-between group">
        <div className="flex items-center gap-4">
        <div className={`p-2.5 rounded-lg transition-colors ${color}`}>{icon}</div>
        <div>
            <p className="font-bold text-slate-900 text-sm">{title}</p>
            <p className="text-xs text-slate-500">{desc}</p>
        </div>
        </div>
        <ArrowRight size={16} className="text-slate-300 group-hover:text-slate-800 transition-colors" />
    </button>
);