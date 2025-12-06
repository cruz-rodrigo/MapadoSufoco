import React, { useMemo } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { Client } from '../../types';
import { useData } from '../../context/DataContext';
import { formatCurrency } from '../../constants';
import { PieChart, Upload, ArrowRight, ShieldAlert, CreditCard, TrendingUp, TrendingDown, FileText, CalendarDays } from 'lucide-react';

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
  const riskColors = {
    'ALTO': 'bg-rose-50 text-rose-700 border-rose-200',
    'MÉDIO': 'bg-amber-50 text-amber-700 border-amber-200',
    'BAIXO': 'bg-emerald-50 text-emerald-700 border-emerald-200'
  }[riskLevel];

  const hasData = transactions.length > 0;

  return (
    <div className="space-y-8">
      {/* Top Banner Status */}
      <div className={`p-6 rounded-xl border flex items-center justify-between ${riskColors} shadow-sm`}>
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/60 rounded-full backdrop-blur-sm">
             <ShieldAlert size={28} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider opacity-80">Nível de Risco Calculado</p>
            <h2 className="text-2xl font-bold">{riskLevel}</h2>
          </div>
        </div>
        <div className="text-right hidden md:block">
          <p className="text-sm font-medium">Baseado em {transactions.length} transações analisadas</p>
          <div className="flex items-center justify-end gap-1 text-xs opacity-75 mt-0.5">
             <CalendarDays size={12} />
             <span>Período de {stats.daysRange} dias detectado</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Financial Summary */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
             <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
               <TrendingUp size={20} className="text-slate-500" />
               Resumo Financeiro
             </h3>
             {hasData && (
               <span className="text-xs font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded border border-slate-200">
                 Base: {stats.daysRange} Dias de Histórico
               </span>
             )}
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             {/* Cards */}
             <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-sm font-medium text-slate-500 mb-1">Entradas Totais</p>
                <p className="text-2xl font-bold text-emerald-600">{formatCurrency(stats.totalIn)}</p>
             </div>
             <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-sm font-medium text-slate-500 mb-1">Saídas Totais</p>
                <p className="text-2xl font-bold text-rose-600">{formatCurrency(stats.totalOut)}</p>
             </div>
             <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-sm font-medium text-slate-500 mb-1">Resultado Líquido</p>
                <p className={`text-2xl font-bold ${stats.net >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {formatCurrency(stats.net)}
                </p>
             </div>
             <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-sm font-medium text-slate-500 mb-1">Passivo/Dívida Total</p>
                <p className="text-2xl font-bold text-slate-900">{formatCurrency(stats.totalDebt)}</p>
             </div>
          </div>

          {!hasData && (
            <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-8 text-center">
              <p className="text-slate-500 mb-4">Ainda não há dados financeiros importados para este cliente.</p>
              <button 
                onClick={() => navigate('import')}
                className="bg-slate-900 text-white px-6 py-2 rounded-lg font-medium hover:bg-slate-800 transition-colors"
              >
                Iniciar Importação
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Actions & Shortcuts */}
        <div className="space-y-6">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <PieChart size={20} className="text-slate-500" />
            Ações Rápidas
          </h3>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
            <button onClick={() => navigate('import')} className="w-full text-left p-4 hover:bg-slate-50 transition-colors flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 text-slate-600 rounded-lg group-hover:bg-slate-200 transition-colors"><Upload size={18} /></div>
                <div>
                  <p className="font-bold text-slate-900 text-sm">Importar Extratos</p>
                  <p className="text-xs text-slate-500">Adicionar novos dados bancários</p>
                </div>
              </div>
              <ArrowRight size={16} className="text-slate-300 group-hover:text-slate-600 transition-colors" />
            </button>

            <button onClick={() => navigate('debts')} className="w-full text-left p-4 hover:bg-slate-50 transition-colors flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-rose-50 text-rose-600 rounded-lg group-hover:bg-rose-100 transition-colors"><CreditCard size={18} /></div>
                <div>
                  <p className="font-bold text-slate-900 text-sm">Registrar Dívidas</p>
                  <p className="text-xs text-slate-500">Gerenciar passivos e empréstimos</p>
                </div>
              </div>
              <ArrowRight size={16} className="text-slate-300 group-hover:text-rose-600 transition-colors" />
            </button>

            <button onClick={() => navigate('analysis')} className="w-full text-left p-4 hover:bg-slate-50 transition-colors flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-teal-50 text-teal-600 rounded-lg group-hover:bg-teal-100 transition-colors"><PieChart size={18} /></div>
                <div>
                  <p className="font-bold text-slate-900 text-sm">Ver Mapa do Sufoco</p>
                  <p className="text-xs text-slate-500">Análise de Ralos de Caixa</p>
                </div>
              </div>
              <ArrowRight size={16} className="text-slate-300 group-hover:text-teal-600 transition-colors" />
            </button>
            
            <button onClick={() => navigate('report')} className="w-full text-left p-4 hover:bg-slate-50 transition-colors flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 text-slate-600 rounded-lg group-hover:bg-slate-200 transition-colors"><FileText size={18} /></div>
                <div>
                  <p className="font-bold text-slate-900 text-sm">Gerar Relatório PDF</p>
                  <p className="text-xs text-slate-500">Exportar diagnóstico completo</p>
                </div>
              </div>
              <ArrowRight size={16} className="text-slate-300 group-hover:text-slate-600 transition-colors" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
