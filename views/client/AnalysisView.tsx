import React, { useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Client, Category } from '../../types';
import { useData } from '../../context/DataContext';
import { formatCurrency } from '../../constants';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { AlertTriangle, TrendingDown, ArrowDown, ArrowUp, Zap, Layers, Briefcase, Landmark, Coins } from 'lucide-react';

export const AnalysisView = () => {
  const { client } = useOutletContext<{ client: Client }>();
  const { getTransactionsByClient } = useData();

  const transactions = getTransactionsByClient(client.id);

  // Core Calculations & DFC Logic
  const analysis = useMemo(() => {
    // 1. Exclude Internal Transfers
    const validTransactions = transactions.filter(t => t.category !== Category.TRANSFER);

    // 2. Base Totals
    const totalIn = validTransactions.filter(t => t.type === 'IN').reduce((sum, t) => sum + t.value, 0);
    const totalOut = validTransactions.filter(t => t.type === 'OUT').reduce((sum, t) => sum + t.value, 0);
    const net = totalIn - totalOut;

    // 3. DFC Gerencial (Categorização Macro)
    let flowOperating = 0;
    let flowInvesting = 0;
    let flowFinancing = 0;

    validTransactions.forEach(t => {
       const val = t.type === 'IN' ? t.value : -t.value;
       
       if ([Category.REV_ASSET_SALE, Category.OUT_CAPEX].includes(t.category)) {
           flowInvesting += val;
       } 
       else if ([Category.REV_LOAN, Category.REV_CAPITAL, Category.OUT_DEBT_AMORTIZATION, Category.OUT_WITHDRAWAL].includes(t.category)) {
           flowFinancing += val;
       } 
       else {
           flowOperating += val;
       }
    });

    const categoryTotals: Record<string, number> = {};
    validTransactions.filter(t => t.type === 'OUT').forEach(t => {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.value;
    });

    const categoryData = Object.entries(categoryTotals)
      .map(([name, value]) => ({ 
          name, 
          value,
          percent: totalOut > 0 ? value / totalOut : 0
      }))
      .sort((a, b) => b.value - a.value);

    // Filter logic: Top 5 + Material (>10%)
    const distinctDrains = categoryData.filter((item, index) => {
        const isTop5 = index < 5;
        const isMaterial = item.percent > 0.10; 
        return isTop5 || isMaterial;
    });

    const drainsTotal = distinctDrains.reduce((acc, curr) => acc + curr.value, 0);
    const drainsConcentration = totalOut > 0 ? drainsTotal / totalOut : 0;

    return { 
        totalIn, totalOut, net, 
        flowOperating, flowInvesting, flowFinancing,
        categoryData, drains: distinctDrains, drainsConcentration 
    };
  }, [transactions]);

  const COLORS = ['#e11d48', '#f59e0b', '#0f172a', '#334155', '#475569', '#64748b', '#94a3b8', '#cbd5e1'];

  if (transactions.length === 0) return <div className="p-10 text-center text-slate-500">Sem dados para análise.</div>;

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.6;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return percent > 0.03 ? (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight="bold" style={{ pointerEvents: 'none', textShadow: '0px 1px 2px rgba(0,0,0,0.5)' }}>
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    ) : null;
  };

  return (
    <div className="space-y-8">
      
      {/* 1. DFC GERENCIAL */}
      <section className="print:break-inside-avoid">
          <div className="flex items-center gap-2 mb-4 print:mb-2">
              <Layers size={20} className="text-slate-400" />
              <h2 className="text-lg font-bold text-slate-900">Demonstrativo de Fluxo de Caixa (Gerencial)</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 print:grid print:grid-cols-4 print:gap-3">
              {/* Cards (Keeping simplified structure for brevity, logic same as before) */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm print:border-slate-300 print:shadow-none print:p-3">
                  <p className="text-xs font-bold text-slate-500 uppercase">Fluxo Operacional</p>
                  <p className={`text-xl font-bold mt-1 ${analysis.flowOperating >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{formatCurrency(analysis.flowOperating)}</p>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm print:border-slate-300 print:shadow-none print:p-3">
                  <p className="text-xs font-bold text-slate-500 uppercase">Fluxo de Investimento</p>
                  <p className={`text-xl font-bold mt-1 ${analysis.flowInvesting >= 0 ? 'text-emerald-600' : 'text-amber-600'}`}>{formatCurrency(analysis.flowInvesting)}</p>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm print:border-slate-300 print:shadow-none print:p-3">
                  <p className="text-xs font-bold text-slate-500 uppercase">Fluxo de Financiamento</p>
                  <p className={`text-xl font-bold mt-1 ${analysis.flowFinancing >= 0 ? 'text-emerald-600' : 'text-slate-600'}`}>{formatCurrency(analysis.flowFinancing)}</p>
              </div>
               <div className={`p-5 rounded-xl border shadow-sm print:border-2 ${analysis.net >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
                   <p className="text-xs font-bold opacity-70 uppercase">Variação Líquida</p>
                   <p className={`text-2xl font-bold ${analysis.net >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{formatCurrency(analysis.net)}</p>
              </div>
          </div>
      </section>

      {/* 2. Análise Detalhada (Ralos) - FORCED GRID IN PRINT */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch print:grid print:grid-cols-[40%_60%] print:gap-6 print:items-start print:mt-4 print:break-inside-avoid">
        
        {/* Left: Chart */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col h-full print:border print:border-slate-200 print:shadow-none print:p-0 print:h-auto">
          <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2 print:mb-2 print:text-sm">
            Distribuição de Saídas
          </h3>
          <div className="flex-1 min-h-[300px] w-full relative print:h-[250px] print:min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analysis.categoryData}
                  cx="50%"
                  cy="45%" 
                  innerRadius={50}
                  outerRadius={80} 
                  paddingAngle={2}
                  dataKey="value"
                  labelLine={false}
                  label={CustomLabel}
                  stroke="none"
                  isAnimationActive={false}
                >
                  {analysis.categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Legend 
                  layout="horizontal" 
                  verticalAlign="bottom" 
                  align="center"
                  iconType="circle" 
                  wrapperStyle={{ fontSize: '10px', color: '#64748b', paddingTop: '10px', width: '100%' }} 
                  formatter={(value, entry: any) => {
                      const { payload } = entry;
                      const percent = (payload.value / analysis.totalOut) * 100;
                      const safeName = value.length > 20 ? value.substring(0, 20) + '..' : value;
                      return <span className="text-slate-600 font-medium ml-1 mr-2">{safeName} ({percent.toFixed(1)}%)</span>;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Drains List - REMOVE SCROLL IN PRINT */}
        <div className="bg-white rounded-xl border border-rose-200 shadow-sm overflow-hidden flex flex-col h-full print:border print:border-rose-200 print:shadow-none print:h-auto print:overflow-visible">
          <div className="bg-rose-50 px-6 py-4 border-b border-rose-100 flex items-center justify-between shrink-0 print:py-2 print:px-3">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-white rounded-lg text-rose-600 shadow-sm border border-rose-100">
                <TrendingDown size={18} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-base font-bold text-rose-950 print:text-xs">Mapa de Ralos do Sufoco</h3>
                <p className="text-[10px] text-rose-800 opacity-80 uppercase tracking-wide">
                    Onde o dinheiro está indo
                </p>
              </div>
            </div>
            <div className="text-right">
                <span className="text-[10px] block font-bold text-rose-400 uppercase">Concentração</span>
                <span className="text-lg font-bold text-rose-700 leading-none">
                    {(analysis.drainsConcentration * 100).toFixed(0)}%
                </span>
            </div>
          </div>
          
          {/* Important: overflow-auto on screen, overflow-visible on print */}
          <div className="divide-y divide-slate-100 flex-1 overflow-auto print:overflow-visible print:block">
            {analysis.drains.map((item, idx) => {
               const percentage = item.percent * 100;
               let badge = null;
               if (percentage > 15) {
                   badge = <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-100 text-rose-700 border border-rose-200 uppercase tracking-wider">Crítico</span>
               } else if (percentage > 10) {
                   badge = <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-700 border border-amber-200 uppercase tracking-wider">Alerta</span>
               }

               return (
                <div key={item.name} className="flex flex-col p-4 hover:bg-slate-50 transition-colors group print:p-2 print:break-inside-avoid">
                  <div className="flex items-start justify-between mb-2">
                     <div className="flex items-start gap-3">
                        <span className={`mt-0.5 w-5 h-5 flex-shrink-0 flex items-center justify-center font-bold rounded text-[10px] shadow-sm ${idx === 0 ? 'bg-rose-600 text-white' : 'bg-white border border-slate-200 text-slate-500'}`}>
                          {idx + 1}
                        </span>
                        <div>
                            <div className="flex items-center gap-2 mb-0.5">
                                <h4 className="font-bold text-slate-900 text-xs truncate max-w-[200px] print:max-w-none print:whitespace-normal">{item.name}</h4>
                                {badge}
                            </div>
                        </div>
                     </div>
                     <div className="text-right">
                        <p className="text-sm font-bold text-slate-900">{formatCurrency(item.value)}</p>
                        <p className="text-xs font-bold text-slate-500">{percentage.toFixed(1)}%</p>
                     </div>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden print:h-1">
                    <div 
                      className={`h-full rounded-full ${percentage > 15 ? 'bg-rose-500' : percentage > 10 ? 'bg-amber-500' : 'bg-slate-400'}`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="bg-slate-50 p-4 border-t border-slate-100 shrink-0 print:bg-white print:border-t-2 print:py-2 flex items-start gap-3 print:break-inside-avoid">
             <Zap size={16} className="text-amber-500 mt-0.5" />
             <p className="text-xs text-slate-600 leading-relaxed">
                 <span className="font-bold text-slate-800">Nota do Especialista:</span> As {analysis.drains.length} categorias acima consomem <strong>{(analysis.drainsConcentration * 100).toFixed(0)}%</strong> das saídas.
             </p>
          </div>
        </div>
      </section>
    </div>
  );
};