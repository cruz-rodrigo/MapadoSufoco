import React, { useMemo, useState } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { Client, Category, Transaction } from '../../types';
import { useData } from '../../context/DataContext';
import { formatCurrency, CATEGORY_GROUPS } from '../../constants';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Calendar, BarChart3, Table2, ArrowRight, AlertTriangle, ArrowLeftRight, Search } from 'lucide-react';

export const CashFlowView = () => {
  const { client } = useOutletContext<{ client: Client }>();
  const { getTransactionsByClient } = useData();
  const transactions = getTransactionsByClient(client.id);

  // Filters State
  const [dateRange, setDateRange] = useState({ 
    start: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0], // Jan 1st current year
    end: new Date().toISOString().split('T')[0] // Today
  });
  const [viewMode, setViewMode] = useState<'CHART' | 'TABLE_AGGREGATE' | 'TABLE_MONTHLY'>('TABLE_AGGREGATE');
  const [chartGroupBy, setChartGroupBy] = useState<'DAY' | 'WEEK' | 'MONTH'>('MONTH');

  // 1. FILTER: By Date Range & Basic Validity
  const filteredTxs = useMemo(() => {
    const start = new Date(dateRange.start + 'T00:00:00');
    const end = new Date(dateRange.end + 'T23:59:59');

    return transactions.filter(t => {
        const d = new Date(t.date);
        return d >= start && d <= end && t.category !== Category.TRANSFER;
    });
  }, [transactions, dateRange]);

  const hasUncategorized = filteredTxs.some(t => t.category === Category.UNCATEGORIZED);

  // 2. AGGREGATE ANALYSIS (Total Period)
  const aggregateAnalysis = useMemo(() => {
    const totals: Record<string, number> = {};
    let totalIn = 0;

    filteredTxs.forEach(t => {
      // Exclude uncategorized from calc to avoid noise, but user is warned
      if (t.category === Category.UNCATEGORIZED) return;
      totals[t.category] = (totals[t.category] || 0) + t.value;
      if (t.type === 'IN') totalIn += t.value;
    });

    const buildRow = (cat: string) => ({
       category: cat,
       value: totals[cat] || 0,
       percent: totalIn > 0 ? (totals[cat] || 0) / totalIn * 100 : 0
    });

    // Helper to sum rows
    const sum = (rows: any[]) => rows.reduce((acc, r) => acc + r.value, 0);

    const revRows = [...CATEGORY_GROUPS.INFLOW['Receitas Operacionais (Vendas)'], ...CATEGORY_GROUPS.INFLOW['Outras Entradas / Financeiro']].map(buildRow);
    const costRows = CATEGORY_GROUPS.OUTFLOW['Custos Variáveis (CMV)'].map(buildRow);
    const fixedRows = CATEGORY_GROUPS.OUTFLOW['Despesas Fixas (OpEx)'].map(buildRow);
    const finRows = CATEGORY_GROUPS.OUTFLOW['Despesas Financeiras'].map(buildRow);
    const invRows = CATEGORY_GROUPS.OUTFLOW['Não Operacional / Investimentos'].map(buildRow);

    const totalRev = sum(revRows);
    const totalCost = sum(costRows);
    const margin = totalRev - totalCost;
    const totalFixed = sum(fixedRows);
    const opResult = margin - totalFixed;
    const totalFin = sum(finRows);
    const totalInv = sum(invRows);
    const netResult = opResult - totalFin - totalInv;

    return { 
        totalIn: totalRev, // Logic alignment: Total Inflow considered as Revenue Base
        revRows: revRows.filter(r => r.value > 0),
        costRows: costRows.filter(r => r.value > 0),
        fixedRows: fixedRows.filter(r => r.value > 0),
        finRows: finRows.filter(r => r.value > 0),
        invRows: invRows.filter(r => r.value > 0),
        totalCost, totalFixed, totalFin, totalInv, margin, opResult, netResult
    };
  }, [filteredTxs]);

  // 3. MONTHLY COMPARISON DATA
  const monthlyAnalysis = useMemo(() => {
    // Group txs by Month Key (YYYY-MM)
    const months: Record<string, Transaction[]> = {};
    filteredTxs.forEach(t => {
        if (t.category === Category.UNCATEGORIZED) return;
        const key = t.date.substring(0, 7); // YYYY-MM
        if (!months[key]) months[key] = [];
        months[key].push(t);
    });

    const sortedMonthKeys = Object.keys(months).sort();

    // Compute aggregate for each month
    const monthlyData = sortedMonthKeys.map(key => {
        const txs = months[key];
        let mTotalIn = 0;
        const mTotals: Record<string, number> = {};
        
        txs.forEach(t => {
            mTotals[t.category] = (mTotals[t.category] || 0) + t.value;
            if (t.type === 'IN') mTotalIn += t.value;
        });

        const getVal = (cats: string[]) => cats.reduce((acc, c) => acc + (mTotals[c] || 0), 0);

        const mCost = getVal(CATEGORY_GROUPS.OUTFLOW['Custos Variáveis (CMV)']);
        const mFixed = getVal(CATEGORY_GROUPS.OUTFLOW['Despesas Fixas (OpEx)']);
        const mFin = getVal(CATEGORY_GROUPS.OUTFLOW['Despesas Financeiras']);
        const mInv = getVal(CATEGORY_GROUPS.OUTFLOW['Não Operacional / Investimentos']);
        
        // Specific Revenue check
        const revCats = [...CATEGORY_GROUPS.INFLOW['Receitas Operacionais (Vendas)'], ...CATEGORY_GROUPS.INFLOW['Outras Entradas / Financeiro']];
        const mRevenue = getVal(revCats);

        return {
            key,
            label: new Date(key + '-02').toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
            revenue: mRevenue,
            costs: mCost,
            margin: mRevenue - mCost,
            fixed: mFixed,
            opResult: (mRevenue - mCost) - mFixed,
            financial: mFin,
            investments: mInv,
            net: ((mRevenue - mCost) - mFixed) - mFin - mInv,
            av_cost: mRevenue > 0 ? (mCost/mRevenue)*100 : 0,
            av_fixed: mRevenue > 0 ? (mFixed/mRevenue)*100 : 0,
            av_net: mRevenue > 0 ? ((((mRevenue - mCost) - mFixed) - mFin - mInv)/mRevenue)*100 : 0
        };
    });

    return monthlyData;
  }, [filteredTxs]);

  // 4. CHART DATA
  const chartData = useMemo(() => {
      const data: Record<string, { date: string; in: number; out: number }> = {};
      
      filteredTxs.forEach(t => {
          if (t.category === Category.UNCATEGORIZED) return;
          const dateObj = new Date(t.date);
          let key = '';
          let label = '';
          
          if (chartGroupBy === 'DAY') {
              key = t.date;
              label = dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
          } else if (chartGroupBy === 'WEEK') {
              const onejan = new Date(dateObj.getFullYear(), 0, 1);
              const week = Math.ceil((((dateObj.getTime() - onejan.getTime()) / 86400000) + onejan.getDay() + 1) / 7);
              key = `${dateObj.getFullYear()}-W${week}`;
              label = `Sem ${week}`;
          } else {
              key = t.date.substring(0, 7);
              label = dateObj.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
          }

          if (!data[key]) data[key] = { date: label, in: 0, out: 0 };
          if (t.type === 'IN') data[key].in += t.value;
          else data[key].out += t.value;
      });
      return Object.values(data).sort((a,b) => a.date.localeCompare(b.date));
  }, [filteredTxs, chartGroupBy]);


  return (
    <div className="space-y-6 pb-20">
       {/* Warning Banner */}
       {hasUncategorized && (
           <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-center justify-between animate-in slide-in-from-top-2">
               <div className="flex items-center gap-3">
                   <div className="p-2 bg-amber-100 text-amber-700 rounded-full"><AlertTriangle size={20} /></div>
                   <div>
                       <p className="font-bold text-amber-900">Atenção: Existem lançamentos pendentes de classificação!</p>
                       <p className="text-sm text-amber-700">O fluxo de caixa abaixo pode estar incompleto. Classifique os itens para ter precisão total.</p>
                   </div>
               </div>
               <Link to={`/client/${client.id}/classification`} className="px-4 py-2 bg-white border border-amber-300 text-amber-800 font-bold text-sm rounded hover:bg-amber-50 shadow-sm">
                   Resolver Pendências
               </Link>
           </div>
       )}

       {/* Controls */}
       <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2 text-slate-500 font-bold text-sm">
                <Calendar size={18} />
                <span>Intervalo:</span>
             </div>
             <div className="flex items-center gap-2">
                 <input 
                    type="date" 
                    value={dateRange.start}
                    onChange={e => setDateRange({...dateRange, start: e.target.value})}
                    className="border border-slate-300 rounded px-2 py-1.5 text-sm font-medium text-slate-700 outline-none focus:border-teal-500"
                 />
                 <span className="text-slate-400">-</span>
                 <input 
                    type="date" 
                    value={dateRange.end}
                    onChange={e => setDateRange({...dateRange, end: e.target.value})}
                    className="border border-slate-300 rounded px-2 py-1.5 text-sm font-medium text-slate-700 outline-none focus:border-teal-500"
                 />
             </div>
          </div>
          
          <div className="flex items-center gap-4">
             {viewMode === 'CHART' && (
                <div className="flex bg-slate-100 p-1 rounded-lg">
                   <FilterBtn label="Dia" active={chartGroupBy === 'DAY'} onClick={() => setChartGroupBy('DAY')} />
                   <FilterBtn label="Semana" active={chartGroupBy === 'WEEK'} onClick={() => setChartGroupBy('WEEK')} />
                   <FilterBtn label="Mês" active={chartGroupBy === 'MONTH'} onClick={() => setChartGroupBy('MONTH')} />
                </div>
             )}
             <div className="h-6 w-px bg-slate-300 mx-2 hidden md:block"></div>
             <div className="flex bg-slate-100 p-1 rounded-lg">
                <button onClick={() => setViewMode('TABLE_AGGREGATE')} title="Análise Vertical Total" className={`p-2 rounded-md transition-all ${viewMode === 'TABLE_AGGREGATE' ? 'bg-white shadow text-teal-700' : 'text-slate-400'}`}><Table2 size={18} /></button>
                <button onClick={() => setViewMode('TABLE_MONTHLY')} title="Comparativo Mês a Mês" className={`p-2 rounded-md transition-all ${viewMode === 'TABLE_MONTHLY' ? 'bg-white shadow text-teal-700' : 'text-slate-400'}`}><ArrowLeftRight size={18} /></button>
                <button onClick={() => setViewMode('CHART')} title="Gráfico" className={`p-2 rounded-md transition-all ${viewMode === 'CHART' ? 'bg-white shadow text-teal-700' : 'text-slate-400'}`}><BarChart3 size={18} /></button>
             </div>
          </div>
       </div>

       {/* View Content */}
       <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[500px]">
          
          {/* 1. CHART VIEW */}
          {viewMode === 'CHART' && (
              <div className="p-6 h-[500px]">
                 <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">Evolução de Entradas vs Saídas</h3>
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="date" tick={{fontSize: 10}} />
                      <YAxis tickFormatter={(val) => `R$${val/1000}k`} tick={{fontSize: 10}} />
                      <Tooltip formatter={(val: number) => formatCurrency(val)} />
                      <Legend />
                      <Bar dataKey="in" name="Entradas" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="out" name="Saídas" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                    </BarChart>
                 </ResponsiveContainer>
              </div>
          )}

          {/* 2. AGGREGATE TABLE VIEW */}
          {viewMode === 'TABLE_AGGREGATE' && (
              <div>
                  <div className="p-6 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">Caixa (Visão Consolidada)</h3>
                        <p className="text-sm text-slate-500">Período: {new Date(dateRange.start).toLocaleDateString('pt-BR')} a {new Date(dateRange.end).toLocaleDateString('pt-BR')}</p>
                      </div>
                      <div className="text-right">
                          <span className="text-xs font-bold uppercase text-slate-400">Resultado Líquido</span>
                          <p className={`text-xl font-bold ${aggregateAnalysis.netResult >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{formatCurrency(aggregateAnalysis.netResult)}</p>
                      </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="p-4 font-bold text-slate-500 uppercase tracking-wider w-2/3">Categoria</th>
                                <th className="p-4 font-bold text-slate-500 uppercase tracking-wider text-right">Valor (R$)</th>
                                <th className="p-4 font-bold text-slate-500 uppercase tracking-wider text-right">AV %</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            <SummaryRow label="1. RECEITA BRUTA" value={aggregateAnalysis.totalIn} percent={100} isHeader color="text-emerald-700" bg="bg-emerald-50" />
                            {aggregateAnalysis.revRows.map(r => <DetailRow key={r.category} label={r.category} value={r.value} percent={r.percent} />)}
                            
                            <SummaryRow label="2. (-) CUSTOS VARIÁVEIS" value={aggregateAnalysis.totalCost} percent={aggregateAnalysis.totalIn > 0 ? (aggregateAnalysis.totalCost/aggregateAnalysis.totalIn)*100 : 0} isHeader color="text-rose-700" />
                            {aggregateAnalysis.costRows.map(r => <DetailRow key={r.category} label={r.category} value={r.value} percent={r.percent} />)}

                            <SummaryRow label="3. (=) MARGEM DE CONTRIBUIÇÃO" value={aggregateAnalysis.margin} percent={aggregateAnalysis.totalIn > 0 ? (aggregateAnalysis.margin/aggregateAnalysis.totalIn)*100 : 0} isHeader bg="bg-slate-100" />

                            <SummaryRow label="4. (-) DESPESAS FIXAS" value={aggregateAnalysis.totalFixed} percent={aggregateAnalysis.totalIn > 0 ? (aggregateAnalysis.totalFixed/aggregateAnalysis.totalIn)*100 : 0} isHeader color="text-rose-700" />
                            {aggregateAnalysis.fixedRows.map(r => <DetailRow key={r.category} label={r.category} value={r.value} percent={r.percent} />)}

                            <SummaryRow label="5. (=) GERAÇÃO DE CAIXA OPERACIONAL" value={aggregateAnalysis.opResult} percent={aggregateAnalysis.totalIn > 0 ? (aggregateAnalysis.opResult/aggregateAnalysis.totalIn)*100 : 0} isHeader bg="bg-slate-100" />

                            <SummaryRow label="6. (-) DESPESAS FINANCEIRAS" value={aggregateAnalysis.totalFin} percent={aggregateAnalysis.totalIn > 0 ? (aggregateAnalysis.totalFin/aggregateAnalysis.totalIn)*100 : 0} isHeader color="text-amber-700" />
                            {aggregateAnalysis.finRows.map(r => <DetailRow key={r.category} label={r.category} value={r.value} percent={r.percent} />)}

                            <SummaryRow label="7. (-) OUTRAS SAÍDAS / INVESTIMENTOS" value={aggregateAnalysis.totalInv} percent={aggregateAnalysis.totalIn > 0 ? (aggregateAnalysis.totalInv/aggregateAnalysis.totalIn)*100 : 0} isHeader color="text-slate-500" />
                            {aggregateAnalysis.invRows.map(r => <DetailRow key={r.category} label={r.category} value={r.value} percent={r.percent} />)}

                            <SummaryRow label="8. (=) RESULTADO LÍQUIDO DE CAIXA" value={aggregateAnalysis.netResult} percent={aggregateAnalysis.totalIn > 0 ? (aggregateAnalysis.netResult/aggregateAnalysis.totalIn)*100 : 0} isHeader bg="bg-slate-900" color="text-white" />
                        </tbody>
                    </table>
                  </div>
              </div>
          )}

          {/* 3. MONTHLY COMPARISON TABLE */}
          {viewMode === 'TABLE_MONTHLY' && (
              <div>
                 <div className="p-6 border-b border-slate-200 bg-slate-50">
                    <h3 className="text-lg font-bold text-slate-900">Análise Comparativa (Mês a Mês)</h3>
                    <p className="text-sm text-slate-500">Evolução dos indicadores-chave lado a lado.</p>
                 </div>
                 <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="p-4 font-bold text-slate-500 uppercase tracking-wider sticky left-0 bg-slate-50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] z-10 w-64">Indicador</th>
                                {monthlyAnalysis.map(m => (
                                    <th key={m.key} className="p-4 font-bold text-slate-500 text-center border-l border-slate-200 min-w-[140px]">{m.label}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            <CompareRow label="1. Receita Bruta" data={monthlyAnalysis} field="revenue" color="text-emerald-700" bold />
                            <CompareRow label="2. (-) Custos Variáveis" data={monthlyAnalysis} field="costs" color="text-rose-600" />
                            <CompareRow label="3. (=) Margem Contrib." data={monthlyAnalysis} field="margin" bg="bg-slate-50" bold />
                            <CompareRow label="4. (-) Despesas Fixas" data={monthlyAnalysis} field="fixed" color="text-rose-600" />
                            <CompareRow label="5. (=) Geração Operacional" data={monthlyAnalysis} field="opResult" bg="bg-slate-50" bold />
                            <CompareRow label="6. (-) Financeiro/Invest" data={monthlyAnalysis} field="financial" color="text-amber-700" />
                            <CompareRow label="7. (=) Resultado Líquido" data={monthlyAnalysis} field="net" bg="bg-slate-900" color="text-white" bold />
                            
                            {/* Analysis Rows */}
                            <tr className="bg-slate-100/50">
                                <td className="p-4 text-xs font-bold text-slate-500 sticky left-0 bg-slate-100/50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] z-10">ANÁLISE VERTICAL (%)</td>
                                {monthlyAnalysis.map(m => <td key={m.key} className="p-4 bg-slate-100/50 border-l border-slate-200"></td>)}
                            </tr>
                            <CompareRow label="% Custos Variáveis" data={monthlyAnalysis} field="av_cost" isPercent />
                            <CompareRow label="% Despesas Fixas" data={monthlyAnalysis} field="av_fixed" isPercent />
                            <CompareRow label="% Margem Líquida" data={monthlyAnalysis} field="av_net" isPercent bold />
                        </tbody>
                    </table>
                 </div>
              </div>
          )}

       </div>
    </div>
  );
};

const FilterBtn = ({ label, active, onClick }: any) => (
    <button 
        onClick={onClick}
        className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${active ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
    >
        {label}
    </button>
);

const SummaryRow = ({ label, value, percent, isHeader, color, bg }: any) => (
    <tr className={`${bg || 'bg-slate-50'} border-y border-slate-200`}>
        <td className={`p-4 ${isHeader ? 'font-bold' : ''} ${color || 'text-slate-900'}`}>{label}</td>
        <td className={`p-4 text-right ${isHeader ? 'font-bold' : ''} ${color || 'text-slate-900'}`}>{formatCurrency(value)}</td>
        <td className={`p-4 text-right font-mono ${isHeader ? 'font-bold' : ''} ${color || 'text-slate-900'}`}>{percent.toFixed(1)}%</td>
    </tr>
);

const DetailRow = ({ label, value, percent }: any) => (
    <tr className="hover:bg-slate-50 group">
        <td className="p-4 pl-8 text-slate-600 text-xs flex items-center gap-2">
            <ArrowRight size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
            {label}
        </td>
        <td className="p-4 text-right text-slate-600 text-xs">{formatCurrency(value)}</td>
        <td className="p-4 text-right text-slate-400 text-xs font-mono">{percent.toFixed(1)}%</td>
    </tr>
);

const CompareRow = ({ label, data, field, color, bg, bold, isPercent }: any) => (
    <tr className={`${bg || 'bg-white'} hover:brightness-95 transition-all`}>
        <td className={`p-4 text-sm ${bold ? 'font-bold' : ''} ${color || 'text-slate-700'} sticky left-0 ${bg || 'bg-white'} shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] z-10`}>{label}</td>
        {data.map((m: any) => (
            <td key={m.key} className={`p-4 text-right border-l border-slate-200 text-sm ${bold ? 'font-bold' : ''} ${color || 'text-slate-700'} ${isPercent ? 'font-mono text-xs' : ''}`}>
                {isPercent ? `${m[field].toFixed(1)}%` : formatCurrency(m[field])}
            </td>
        ))}
    </tr>
);