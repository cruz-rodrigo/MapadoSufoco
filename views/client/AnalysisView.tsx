import React, { useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Client, Category } from '../../types';
import { useData } from '../../context/DataContext';
import { formatCurrency, formatPercent } from '../../constants';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { AlertTriangle, TrendingDown, ArrowDown, ArrowUp, Info } from 'lucide-react';

export const AnalysisView = () => {
  const { client } = useOutletContext<{ client: Client }>();
  const { getTransactionsByClient } = useData();

  const transactions = getTransactionsByClient(client.id);

  // Core Calculations
  const analysis = useMemo(() => {
    const totalIn = transactions.filter(t => t.type === 'IN').reduce((sum, t) => sum + t.value, 0);
    const totalOut = transactions.filter(t => t.type === 'OUT').reduce((sum, t) => sum + t.value, 0);
    const net = totalIn - totalOut;

    // Calculate date range
    let daysRange = 0;
    if (transactions.length > 0) {
      const dates = transactions.map(t => new Date(t.date).getTime());
      const minDate = Math.min(...dates);
      const maxDate = Math.max(...dates);
      const diffTime = Math.abs(maxDate - minDate);
      daysRange = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // inclusive
    }

    // Group by Category
    const categoryTotals: Record<string, number> = {};
    transactions.filter(t => t.type === 'OUT').forEach(t => {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.value;
    });

    const categoryData = Object.entries(categoryTotals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // "Ralos" Logic: Top 5 categories
    const drains = categoryData.slice(0, 5);

    return { totalIn, totalOut, net, categoryData, drains, daysRange };
  }, [transactions]);

  // Premium Palette: 
  const COLORS = ['#e11d48', '#f59e0b', '#334155', '#475569', '#64748b', '#94a3b8', '#cbd5e1'];

  if (transactions.length === 0) return <div className="p-10 text-center text-slate-500">Sem dados para análise.</div>;

  // Improved Label Logic
  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const RADIAN = Math.PI / 180;
    // Calculate radius exactly in the middle of the donut ring
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
  
    // Only show label if slice is > 5% to prevent overlap/cutoff on tiny slices
    return percent > 0.05 ? (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor="middle" 
        dominantBaseline="central" 
        fontSize={10} 
        fontWeight="bold"
        style={{ pointerEvents: 'none', textShadow: 'none' }} 
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    ) : null;
  };

  return (
    <div className="space-y-6">
      
      {/* KPI Header Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print:grid print:grid-cols-3 print:gap-4">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden print:border print:border-slate-300 print:shadow-none print:p-3">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <ArrowUp size={40} className="text-emerald-600" />
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Entradas ({analysis.daysRange}d)</p>
          <p className="text-3xl font-bold text-emerald-600 mt-2 print:text-2xl">{formatCurrency(analysis.totalIn)}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden print:border print:border-slate-300 print:shadow-none print:p-3">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <ArrowDown size={40} className="text-rose-600" />
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Saídas ({analysis.daysRange}d)</p>
          <p className="text-3xl font-bold text-rose-600 mt-2 print:text-2xl">{formatCurrency(analysis.totalOut)}</p>
        </div>
        <div className={`bg-white p-6 rounded-xl border shadow-sm relative overflow-hidden print:border print:border-slate-300 print:shadow-none print:p-3 ${analysis.net < 0 ? 'border-rose-300 bg-rose-50/50' : 'border-slate-200'}`}>
           <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Saldo Líquido</p>
           <p className={`text-3xl font-bold mt-2 print:text-2xl ${analysis.net < 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
             {formatCurrency(analysis.net)}
           </p>
           {analysis.net < 0 && (
             <span className="inline-flex items-center gap-1 mt-2 text-xs font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded">
               <AlertTriangle size={12} /> QUEIMA DE CAIXA
             </span>
           )}
        </div>
      </div>

      {/* Main Analysis Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch print:grid print:grid-cols-[45%_55%] print:gap-4">
        
        {/* Left: Chart Container */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col h-full print:border print:border-slate-200 print:shadow-none print:p-0 print:h-auto">
          <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2 print:mb-2 print:text-sm">
            Distribuição de Saídas
          </h3>
          {/* Increased height for print to accommodate bottom legend */}
          <div className="flex-1 min-h-[300px] w-full relative print:h-[280px] print:min-h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analysis.categoryData}
                  cx="50%"
                  cy="45%" // Moved up slightly to make room for legend
                  innerRadius={30} 
                  outerRadius={65} 
                  paddingAngle={2}
                  dataKey="value"
                  labelLine={false}
                  label={CustomLabel}
                  isAnimationActive={false} // CRITICAL for PDF printing
                  stroke="none"
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
                  wrapperStyle={{ fontSize: '9px', color: '#64748b', paddingTop: '10px', width: '100%' }} 
                  formatter={(value, entry: any) => {
                      const { payload } = entry;
                      const percent = (payload.value / analysis.totalOut) * 100;
                      // Truncate long names for print legibility
                      const safeName = value.length > 15 ? value.substring(0, 15) + '..' : value;
                      return <span className="text-slate-600 font-medium ml-1 mr-2">{safeName} ({percent.toFixed(0)}%)</span>;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Drains List */}
        <div className="bg-white rounded-xl border border-rose-200 shadow-sm overflow-hidden flex flex-col h-full print:border print:border-rose-200 print:shadow-none print:h-auto">
          <div className="bg-rose-50 px-6 py-4 border-b border-rose-100 flex items-center justify-between shrink-0 print:py-2 print:px-3">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-white rounded-lg text-rose-600 shadow-sm border border-rose-100">
                <TrendingDown size={18} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-base font-bold text-rose-950 print:text-xs">Mapa de Ralos do Sufoco</h3>
              </div>
            </div>
            {/* Dynamic Label Count */}
            <span className="text-[10px] font-bold bg-white text-rose-700 px-2 py-0.5 rounded-full border border-rose-100 shadow-sm uppercase">
              TOP {analysis.drains.length}
            </span>
          </div>
          
          <div className="divide-y divide-slate-100 flex-1 overflow-auto print:overflow-visible">
            {analysis.drains.map((item, idx) => {
               const percentage = (item.value / analysis.totalOut) * 100;
               return (
                <div key={item.name} className="flex flex-col p-4 hover:bg-slate-50 transition-colors group print:p-2">
                  <div className="flex items-center justify-between mb-1">
                     <div className="flex items-center gap-3">
                        <span className={`w-5 h-5 flex-shrink-0 flex items-center justify-center font-bold rounded text-[10px] ${idx === 0 ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>
                          #{idx + 1}
                        </span>
                        <h4 className="font-bold text-slate-900 text-xs truncate max-w-[180px] print:max-w-[140px]">{item.name}</h4>
                     </div>
                     <div className="text-right">
                        <p className="text-xs font-bold text-slate-900">{formatCurrency(item.value)}</p>
                     </div>
                  </div>
                  
                  {/* Progress Bar & Percentage */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden print:border print:border-slate-100">
                        <div 
                          className={`h-full rounded-full ${idx === 0 ? 'bg-rose-500' : 'bg-slate-300'}`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-slate-500 w-8 text-right">{percentage.toFixed(1)}%</span>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="bg-slate-50 p-4 border-t border-slate-100 shrink-0 print:bg-white print:border-t-2 print:py-2">
             <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Observações</label>
             <textarea 
                className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-slate-500 outline-none text-slate-700 bg-white shadow-sm resize-none print:border-slate-200 placeholder:print:hidden"
                rows={3}
                placeholder="Insira notas sobre a análise de fluxo..."
             ></textarea>
          </div>
        </div>
      </div>
    </div>
  );
};