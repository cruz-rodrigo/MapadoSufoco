import React, { useMemo, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Client } from '../../types';
import { useData } from '../../context/DataContext';
import { formatCurrency } from '../../constants';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, AreaChart, Area } from 'recharts';
import { ShieldCheck, AlertOctagon, ShieldAlert, TrendingUp, Info } from 'lucide-react';

export const ProjectionView = () => {
  const { client } = useOutletContext<{ client: Client }>();
  // Use raw data arrays for stable memoization
  const { transactions: allTransactions, debts: allDebts, updateClientStatus } = useData();

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
    const historyDays = Math.max(1, Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24)) + 1);

    // 2. Calculate Daily Net Average
    const totalNet = transactions.reduce((acc, t) => acc + (t.type === 'IN' ? t.value : -t.value), 0);
    const dailyAvgCashGen = totalNet / historyDays;

    // 3. Identify Fixed Monthly Debt Costs
    const monthlyDebtCost = debts.reduce((acc, d) => acc + (d.monthlyPayment || 0), 0);
    const dailyDebtCost = monthlyDebtCost / 30;

    // 4. Adjusted Daily Result
    const effectiveDailyChange = dailyAvgCashGen - dailyDebtCost;

    // 5. Simulate 30 Days
    // Start Balance: For v1, we use max(10000, totalNet) as a starting proxy if real balance isn't tracked
    let currentBalance = Math.max(10000, totalNet); 
    
    const days = [];
    let lowestBalance = currentBalance;
    const today = new Date();
    let ruptureDate = null;

    for (let i = 1; i <= 30; i++) {
      currentBalance += effectiveDailyChange;
      
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      
      if (currentBalance < 0 && !ruptureDate) {
        ruptureDate = date.toLocaleDateString('pt-BR');
      }

      if (currentBalance < lowestBalance) lowestBalance = currentBalance;

      days.push({
        day: i,
        date: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        balance: currentBalance,
      });
    }

    // Risk Assessment
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    if (ruptureDate) riskLevel = 'HIGH';
    else if (lowestBalance < (monthlyDebtCost * 1.5)) riskLevel = 'MEDIUM'; 

    return { days, riskLevel, lowestBalance, effectiveDailyChange, ruptureDate, historyDays };
  }, [transactions, debts]);

  // Update Status effect - SAFEGUARDED
  useEffect(() => {
    if (projection && client.status !== 'PROJECAO_CONCLUIDA') {
        updateClientStatus(client.id, 'PROJECAO_CONCLUIDA');
    }
  }, [client.id, client.status, projection, updateClientStatus]);

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

  return (
    <div className="space-y-6">
       {/* Explanation Box */}
       <div className="flex items-start gap-3 bg-blue-50 text-blue-800 p-4 rounded-lg text-sm border border-blue-100">
         <Info size={18} className="mt-0.5 shrink-0" />
         <div>
           <p className="font-bold">Metodologia de Projeção Linear (30 Dias)</p>
           <p className="opacity-90 mt-1">
             Baseado em {projection.historyDays} dias de histórico importado. <br/>
             Variação Diária Projetada: <span className="font-mono font-bold">{formatCurrency(projection.effectiveDailyChange)}/dia</span> (Geração Operacional - Serviço da Dívida).
           </p>
         </div>
       </div>

       <div className="flex flex-col md:flex-row gap-6">
         {/* Risk Header */}
         <div className={`flex-1 p-6 rounded-xl border flex items-start gap-4 ${riskColor} shadow-sm`}>
           <div className="p-3 bg-white/60 rounded-lg shadow-sm">
             <RiskIcon size={32} />
           </div>
           <div>
             <h2 className="text-xl font-bold mb-1">
               Risco de Caixa: {projection.riskLevel === 'HIGH' ? 'ALTO' : projection.riskLevel === 'MEDIUM' ? 'MÉDIO' : 'BAIXO'}
             </h2>
             <p className="opacity-90 max-w-xl text-sm leading-relaxed font-medium">
               {projection.riskLevel === 'HIGH' 
                 ? `ATENÇÃO: Ruptura de caixa (Dia do Sufoco) projetada para ${projection.ruptureDate}.` 
                 : projection.riskLevel === 'MEDIUM'
                 ? 'O caixa termina positivo, mas com margem apertada em relação ao custo da dívida.'
                 : 'O caixa apresenta tendência saudável e cobre as obrigações financeiras.'}
             </p>
           </div>
         </div>
         
         {/* Key Metric */}
         <div className="w-full md:w-64 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
           <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Pior Cenário (30d)</p>
           <p className={`text-2xl font-bold ${projection.lowestBalance < 0 ? 'text-rose-600' : 'text-slate-900'}`}>
             {formatCurrency(projection.lowestBalance)}
           </p>
           <p className="text-xs text-slate-400 mt-2">Saldo mínimo projetado</p>
         </div>
       </div>

       {/* Chart */}
       <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-[500px] flex flex-col">
         <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp size={20} className="text-slate-400" />
                Curva de Tendência de Saldo (Linear)
            </h3>
            <div className="flex items-center gap-6 text-xs font-bold uppercase tracking-wide text-slate-500">
                <span className="flex items-center gap-2"><span className="w-3 h-3 bg-teal-500 rounded-sm"></span> Saldo Projetado</span>
                <span className="flex items-center gap-2"><span className="w-3 h-3 border-b-2 border-rose-400 border-dashed"></span> Ponto de Ruptura (0)</span>
            </div>
         </div>
         
         <div className="flex-1 w-full min-h-0">
           <ResponsiveContainer width="100%" height="100%">
             <AreaChart data={projection.days} margin={{ top: 20, right: 60, left: 10, bottom: 30 }}>
               <defs>
                  <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={projection.riskLevel === 'HIGH' ? '#f43f5e' : '#14b8a6'} stopOpacity={0.15}/>
                    <stop offset="95%" stopColor={projection.riskLevel === 'HIGH' ? '#f43f5e' : '#14b8a6'} stopOpacity={0}/>
                  </linearGradient>
               </defs>
               <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
               <XAxis 
                  dataKey="date" 
                  stroke="#94a3b8" 
                  tick={{fontSize: 11, fill: '#64748b', fontWeight: 500}} 
                  tickLine={false}
                  axisLine={false}
                  dy={15}
                  minTickGap={30}
               />
               <YAxis 
                  stroke="#94a3b8" 
                  tick={{fontSize: 11, fill: '#64748b', fontWeight: 500}} 
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
                  stroke="#fb7185" 
                  strokeDasharray="4 4" 
                  strokeWidth={1.5} 
                  label={{ 
                    position: 'insideBottomRight', 
                    value: 'RUPTURA', 
                    fill: '#fb7185', 
                    fontSize: 10, 
                    fontWeight: 700,
                    dy: -10,
                    dx: 50
                  }} 
                />
               <Area 
                 type="monotone" 
                 dataKey="balance" 
                 stroke={projection.riskLevel === 'HIGH' ? '#f43f5e' : '#0d9488'} 
                 fillOpacity={1} 
                 fill="url(#colorBalance)" 
                 strokeWidth={2.5}
                 activeDot={{ r: 6, strokeWidth: 0 }}
                 isAnimationActive={false}
               />
             </AreaChart>
           </ResponsiveContainer>
         </div>
       </div>
    </div>
  );
};