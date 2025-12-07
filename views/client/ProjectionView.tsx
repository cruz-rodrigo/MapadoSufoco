import React, { useMemo, useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Client } from '../../types';
import { useData } from '../../context/DataContext';
import { formatCurrency } from '../../constants';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, AreaChart, Area } from 'recharts';
import { ShieldCheck, AlertOctagon, ShieldAlert, TrendingUp, TrendingDown, Activity, ThermometerSun, AlertTriangle, Layers, Flame, CheckCircle } from 'lucide-react';

type ScenarioType = 'REALIST' | 'OPTIMIST' | 'PESSIMIST';

export const ProjectionView = () => {
  const { client } = useOutletContext<{ client: Client }>();
  // Use raw data arrays for stable memoization
  const { transactions: allTransactions, debts: allDebts, updateClientProjectionMeta } = useData();
  const [scenario, setScenario] = useState<ScenarioType>('REALIST');

  // Stable transaction list
  const transactions = useMemo(() => 
    allTransactions
      .filter(t => t.clientId === client.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
  [allTransactions, client.id]);

  // Stable debt list
  const debts = useMemo(() => 
    allDebts.filter(d => d.clientId === client.id),
  [allDebts, client.id]);

  // Projection Logic
  const projection = useMemo(() => {
    // 1. Calculate History Range (Real days)
    if (transactions.length === 0) return null;

    const dates = transactions.map(t => new Date(t.date).getTime());
    const minDate = Math.min(...dates);
    const maxDate = Math.max(...dates);
    // Add 1 to avoid division by zero or single day weirdness
    const historyDays = Math.max(1, Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24)) + 1);

    // 2. Calculate Base Daily Averages (Realized)
    const totalInRealized = transactions.filter(t => t.type === 'IN').reduce((acc, t) => acc + t.value, 0);
    const totalOutRealized = transactions.filter(t => t.type === 'OUT').reduce((acc, t) => acc + t.value, 0);
    
    const dailyInBase = totalInRealized / historyDays;
    const dailyOutBase = totalOutRealized / historyDays;

    // 3. Identify Fixed Monthly Debt Costs
    const monthlyDebtCost = debts.reduce((acc, d) => acc + (d.monthlyPayment || 0), 0);
    const dailyDebtCost = monthlyDebtCost / 30;

    // 4. Scenario Adjustments (The "What If")
    let inMultiplier = 1;
    let outMultiplier = 1;

    if (scenario === 'OPTIMIST') {
        // Effort to increase sales by 10% and cut OpEx by 15%
        inMultiplier = 1.10;
        outMultiplier = 0.85; 
    } else if (scenario === 'PESSIMIST') {
        // Sales drop 20%, Expenses stay same
        inMultiplier = 0.80;
        outMultiplier = 1.0; 
    }

    const projectedDailyIn = dailyInBase * inMultiplier;
    const projectedDailyOut = dailyOutBase * outMultiplier;

    // Effective Daily Cash Flow = (In - Out) - Debt Service
    const effectiveDailyChange = (projectedDailyIn - projectedDailyOut) - dailyDebtCost;
    
    // Burn Rate Calculation (Only Outflows + Debt)
    const dailyBurnRate = projectedDailyOut + dailyDebtCost;

    // 5. Simulate 30 Days
    // Start Balance: Using Total Net as proxy for current cash (simplified).
    // In a real app, we'd ask for "Current Bank Balance".
    const startBalance = Math.max(5000, totalInRealized - totalOutRealized); 
    let currentBalance = startBalance;
    
    const days = [];
    let lowestBalance = currentBalance;
    const today = new Date();
    let ruptureDate = null;
    let breakEvenDay = null;

    for (let i = 1; i <= 30; i++) {
      currentBalance += effectiveDailyChange;
      
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      
      if (currentBalance < 0 && !ruptureDate) {
        ruptureDate = date.toLocaleDateString('pt-BR');
        breakEvenDay = i;
      }

      if (currentBalance < lowestBalance) lowestBalance = currentBalance;

      days.push({
        day: i,
        date: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        balance: currentBalance,
        zero: 0 // Reference line for AreaChart
      });
    }

    // Risk Assessment Logic
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    if (ruptureDate) {
        riskLevel = 'HIGH';
    } else if (lowestBalance < (monthlyDebtCost * 1.5)) {
        riskLevel = 'MEDIUM'; 
    }

    return { 
        days, 
        riskLevel, 
        lowestBalance, 
        effectiveDailyChange, 
        ruptureDate, 
        historyDays, 
        breakEvenDay, 
        startBalance, 
        dailyBurnRate 
    };
  }, [transactions, debts, scenario]);

  // Update Status & Risk Effect
  useEffect(() => {
    if (projection && client.status !== 'PROJECAO_CONCLUIDA' && scenario === 'REALIST') {
        updateClientProjectionMeta(client.id, projection.riskLevel);
    }
  }, [client.id, client.status, projection, updateClientProjectionMeta, scenario]);

  if (!projection) return <div className="p-10 text-center text-slate-500">Sem dados suficientes para projeção.</div>;

  const riskColor = {
    LOW: 'text-emerald-800 bg-emerald-50 border-emerald-200',
    MEDIUM: 'text-amber-800 bg-amber-50 border-amber-200',
    HIGH: 'text-rose-800 bg-rose-50 border-rose-200'
  }[projection.riskLevel];

  const RiskIcon = {
    LOW: ShieldCheck,
    MEDIUM: ShieldAlert,
    HIGH: AlertOctagon
  }[projection.riskLevel];

  const scenarioLabels = {
      'REALIST': 'REALISTA (BASE HISTÓRICA)',
      'OPTIMIST': 'OTIMISTA (AJUSTE EFICIÊNCIA)',
      'PESSIMIST': 'ESTRESSE (QUEDA VENDAS)'
  };

  return (
    <div className="space-y-6">
       {/* Scenario Controls - Hidden buttons in Print, Show Text Label in Print */}
       <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm print:border-none print:shadow-none print:p-0 print:mb-4">
          <div className="flex items-center gap-2">
             <Layers className="text-slate-400 print:text-slate-800" size={20} />
             <span className="text-sm font-bold text-slate-700 uppercase tracking-wide print:text-slate-900">Seletor de Cenário</span>
          </div>
          
          {/* Controls for Screen */}
          <div className="flex bg-slate-100 p-1 rounded-lg print:hidden">
             <button 
               onClick={() => setScenario('REALIST')}
               className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${scenario === 'REALIST' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
             >
               Realista
             </button>
             <button 
               onClick={() => setScenario('OPTIMIST')}
               className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${scenario === 'OPTIMIST' ? 'bg-emerald-100 text-emerald-800 shadow-sm' : 'text-slate-500 hover:text-emerald-600'}`}
             >
               Otimista
             </button>
             <button 
               onClick={() => setScenario('PESSIMIST')}
               className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${scenario === 'PESSIMIST' ? 'bg-rose-100 text-rose-800 shadow-sm' : 'text-slate-500 hover:text-rose-600'}`}
             >
               Estresse
             </button>
          </div>

          {/* Static Stamp for Print - "Carimbo de Aprovação" Style */}
          <div className="hidden print:flex items-center gap-2 border-2 border-slate-800 px-3 py-1 rounded uppercase tracking-widest font-bold text-[10px] text-slate-900 opacity-80">
              <CheckCircle size={12} />
              Cenário Utilizado: {scenarioLabels[scenario]}
          </div>
       </div>

       {/* CFO Dashboard - War Room Style */}
       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         {/* 1. Cash Runway / Risk */}
         <div className={`p-5 rounded-xl border flex flex-col justify-between ${riskColor} shadow-sm relative overflow-hidden print:border-2`}>
           <div className="flex justify-between items-start z-10">
             <div>
               <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1">Diagnóstico de Solvência</p>
               <h2 className="text-2xl font-bold flex items-center gap-2">
                 {projection.riskLevel === 'HIGH' ? 'CRÍTICO' : projection.riskLevel === 'MEDIUM' ? 'ALERTA' : 'ESTÁVEL'}
               </h2>
             </div>
             <RiskIcon size={24} className="opacity-80" />
           </div>
           
           <div className="mt-4 z-10">
              {projection.ruptureDate ? (
                  <div className="bg-white/60 rounded p-2 text-sm font-medium backdrop-blur-sm border border-black/5">
                     <span className="block text-[10px] uppercase font-bold text-rose-800">Ruptura Prevista</span>
                     <span className="text-lg font-bold text-rose-700">{projection.ruptureDate}</span>
                     <span className="text-xs text-rose-600 block">Fôlego de {projection.breakEvenDay} dias</span>
                  </div>
              ) : (
                  <div className="bg-white/60 rounded p-2 text-sm font-medium backdrop-blur-sm border border-black/5">
                     <span className="block text-[10px] uppercase font-bold text-emerald-800">Fôlego Financeiro</span>
                     <span className="text-lg font-bold text-emerald-700">+30 Dias</span>
                     <span className="text-xs text-emerald-600 block">Caixa positivo no período</span>
                  </div>
              )}
           </div>
         </div>
         
         {/* 2. Burn Rate (Translated) */}
         <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between group print:border-2 print:border-slate-300">
            <div>
               <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-rose-50 text-rose-600 rounded-md">
                    <Flame size={18} />
                  </div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Consumo Diário de Caixa</p>
               </div>
               <p className="text-2xl font-bold text-slate-900">{formatCurrency(projection.dailyBurnRate)}</p>
               <p className="text-xs text-slate-400 mt-1">Custo por dia para manter a empresa</p>
            </div>
            <div className="mt-3 text-xs bg-slate-50 p-2 rounded text-slate-600 print:bg-white print:border print:border-slate-100">
               Meta mínima diária de faturamento para cobrir custos e dívidas.
            </div>
         </div>

         {/* 3. Projected Result */}
         <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between print:border-2 print:border-slate-300">
            <div>
               <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-blue-50 text-blue-600 rounded-md">
                    <Activity size={18} />
                  </div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Saldo Final (30d)</p>
               </div>
               <p className={`text-2xl font-bold ${projection.days[29].balance < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                   {formatCurrency(projection.days[29].balance)}
               </p>
               <p className="text-xs text-slate-400 mt-1">Projeção linear baseada no cenário</p>
            </div>
            {projection.effectiveDailyChange < 0 ? (
                 <div className="mt-3 text-xs bg-rose-50 text-rose-700 p-2 rounded font-medium flex items-center gap-1">
                    <TrendingDown size={14} />
                    Déficit de {formatCurrency(Math.abs(projection.effectiveDailyChange))}/dia
                 </div>
            ) : (
                 <div className="mt-3 text-xs bg-emerald-50 text-emerald-700 p-2 rounded font-medium flex items-center gap-1">
                    <TrendingUp size={14} />
                    Superávit de {formatCurrency(projection.effectiveDailyChange)}/dia
                 </div>
            )}
         </div>
       </div>

       {/* Chart */}
       <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-[500px] flex flex-col relative overflow-hidden print:h-[350px] print:border-none print:shadow-none print:p-0">
         <div className="flex justify-between items-center mb-6 z-10 relative print:mb-2">
            <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <TrendingUp size={20} className="text-slate-400" />
                    Tendência de Caixa (30 Dias)
                </h3>
            </div>
         </div>
         
         <div className="flex-1 w-full min-h-0 z-10">
           <ResponsiveContainer width="100%" height="100%">
             <AreaChart data={projection.days} margin={{ top: 20, right: 10, left: 10, bottom: 0 }}>
               <defs>
                  <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={projection.riskLevel === 'HIGH' ? '#f43f5e' : '#14b8a6'} stopOpacity={0.2}/>
                    <stop offset="95%" stopColor={projection.riskLevel === 'HIGH' ? '#f43f5e' : '#14b8a6'} stopOpacity={0}/>
                  </linearGradient>
               </defs>
               <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
               <XAxis 
                  dataKey="date" 
                  stroke="#94a3b8" 
                  tick={{fontSize: 10, fill: '#64748b', fontWeight: 500}} 
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                  minTickGap={30}
               />
               <YAxis 
                  stroke="#94a3b8" 
                  tick={{fontSize: 10, fill: '#64748b', fontWeight: 500}} 
                  tickFormatter={(val) => `R$${val/1000}k`} 
                  tickLine={false}
                  axisLine={false}
                  dx={-10}
               />
               <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), 'Saldo']}
                  contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', padding: '8px 12px' }}
                  itemStyle={{ color: '#fff', fontSize: '13px', fontWeight: 600 }}
                  labelStyle={{ color: '#94a3b8', marginBottom: '4px', fontSize: '11px' }}
                  cursor={{ stroke: '#cbd5e1', strokeWidth: 1 }}
               />
               <ReferenceLine 
                  y={0} 
                  stroke="#0f172a" 
                  strokeWidth={1} 
                  strokeOpacity={0.2}
               />
               
               {projection.ruptureDate && (
                   <ReferenceLine 
                      x={projection.ruptureDate.substring(0, 5)} 
                      stroke="#f43f5e"
                      strokeDasharray="3 3"
                   />
               )}

               <Area 
                 type="monotone" 
                 dataKey="balance" 
                 stroke={projection.riskLevel === 'HIGH' ? '#e11d48' : '#0d9488'} 
                 fillOpacity={1} 
                 fill="url(#colorBalance)" 
                 strokeWidth={3}
                 activeDot={{ r: 6, strokeWidth: 0 }}
                 isAnimationActive={true}
                 animationDuration={1000}
               />
             </AreaChart>
           </ResponsiveContainer>
         </div>
       </div>

       {/* CFO Insight Box */}
       {projection.riskLevel === 'HIGH' && (
           <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl flex items-start gap-3 animate-in slide-in-from-bottom-2 print:border-rose-300 print:bg-white">
              <AlertTriangle className="text-rose-600 mt-1 shrink-0" size={20} />
              <div>
                  <h4 className="text-sm font-bold text-rose-800 uppercase tracking-wide">Ponto de Atenção Imediata</h4>
                  <p className="text-sm text-rose-700 mt-1 leading-relaxed">
                      Sua empresa tem apenas <strong>{projection.breakEvenDay} dias</strong> de caixa. 
                      Recomendação: 1) Renegociar os prazos das dívidas listadas; 2) Antecipar recebíveis (clientes); 3) Cortar custos fixos não essenciais imediatamente. 
                  </p>
              </div>
           </div>
       )}
    </div>
  );
};