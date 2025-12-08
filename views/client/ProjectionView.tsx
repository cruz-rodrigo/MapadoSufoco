import React, { useMemo, useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Client, RiskLevel } from '../../types';
import { useData } from '../../context/DataContext';
import { formatCurrency, CATEGORY_GROUPS } from '../../constants';
import { simulateProjection } from '../../utils/financeHelpers';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { ShieldCheck, AlertOctagon, ShieldAlert, TrendingUp, Info, Calculator, CalendarClock, Target, Landmark, HelpCircle, ArrowRight, History } from 'lucide-react';

// --- CURRENCY INPUT COMPONENT (CLEAN STYLE) ---
const MoneyInput = ({ value, onChange, className, placeholder, autoFocus, readOnly }: { value: number, onChange?: (val: number) => void, className?: string, placeholder?: string, autoFocus?: boolean, readOnly?: boolean }) => {
  const [displayStr, setDisplayStr] = useState('');

  useEffect(() => {
    if (value === undefined || isNaN(value)) setDisplayStr('');
    else setDisplayStr(value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (readOnly || !onChange) return;
    const rawDigits = e.target.value.replace(/\D/g, '');
    const numberValue = Number(rawDigits) / 100;
    onChange(numberValue);
  };

  return (
    <input 
        type="text" 
        value={displayStr}
        onChange={handleChange}
        placeholder={placeholder}
        className={className}
        autoFocus={autoFocus}
        readOnly={readOnly}
    />
  );
};

interface ProjectionViewProps {
    variant?: 'default' | 'report';
}

export const ProjectionView: React.FC<ProjectionViewProps> = ({ variant = 'default' }) => {
  const { client } = useOutletContext<{ client: Client }>();
  const { transactions, debts, updateClientProjectionMeta, updateClientProjectionData } = useData();
  
  // -- PROJECTION STATE --
  const [horizonDays, setHorizonDays] = useState<number>(client.projectionData?.horizonDays || 30); 
  
  const [projValues, setProjValues] = useState({
      revenue: client.projectionData?.revenue ?? 0,
      variableCost: client.projectionData?.variableCost ?? 0,
      fixedCost: client.projectionData?.fixedCost ?? 0,
      financialCost: client.projectionData?.financialCost ?? 0,
      investments: client.projectionData?.investments ?? 0,
      initialBalance: client.projectionData?.initialBalance ?? 0,
      fundraising: client.projectionData?.fundraising ?? 0
  });
  
  const [historicalStats, setHistoricalStats] = useState({ marginPct: 0, varCostRatio: 0 });
  const [isInitialized, setIsInitialized] = useState(!!client.projectionData);

  // Stable Lists
  const clientTxs = useMemo(() => transactions.filter(t => t.clientId === client.id), [transactions, client.id]);
  const clientDebts = useMemo(() => debts.filter(d => d.clientId === client.id), [debts, client.id]);

  const round2 = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100;

  // 1. Calculate Historical Averages (IF no persisted data or first run)
  useEffect(() => {
    // Only calculate history defaults if we haven't initialized from saved data
    if (clientTxs.length > 0 && (!isInitialized || !client.projectionData)) {
        const dates = clientTxs.map(t => new Date(t.date).getTime());
        const maxDate = new Date(Math.max(...dates));
        const ninetyDaysAgo = new Date(maxDate);
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

        const recentTxs = clientTxs.filter(t => new Date(t.date) >= ninetyDaysAgo);
        
        const sumByCats = (cats: string[]) => recentTxs
            .filter(t => cats.includes(t.category))
            .reduce((acc, t) => acc + t.value, 0);

        const totalRevenue = sumByCats([...CATEGORY_GROUPS.INFLOW['Receitas Operacionais (Vendas)'], ...CATEGORY_GROUPS.INFLOW['Outras Entradas / Financeiro']]);
        const totalVariable = sumByCats(CATEGORY_GROUPS.OUTFLOW['Custos Variáveis (CMV)']);
        const totalFixed = sumByCats(CATEGORY_GROUPS.OUTFLOW['Despesas Fixas (OpEx)']);
        const totalFinancial = sumByCats(CATEGORY_GROUPS.OUTFLOW['Despesas Financeiras']);
        const totalInvestments = sumByCats(CATEGORY_GROUPS.OUTFLOW['Não Operacional / Investimentos']);

        const committedDebtMonthly = clientDebts.reduce((acc, d) => acc + (d.monthlyPayment || 0), 0);
        
        const avgRev = totalRevenue / 3;
        const avgVar = totalVariable / 3;
        const avgFix = totalFixed / 3;
        const avgFin = Math.max(totalFinancial / 3, committedDebtMonthly);
        const avgInv = totalInvestments / 3;

        const histMargin = avgRev > 0 ? ((avgRev - avgVar) / avgRev) * 100 : 0;
        const histVarRatio = avgRev > 0 ? (avgVar / avgRev) : 0;

        const allIn = clientTxs.filter(t => t.type === 'IN').reduce((a,t) => a + t.value, 0);
        const allOut = clientTxs.filter(t => t.type === 'OUT').reduce((a,t) => a + t.value, 0);
        const estimatedBalance = Math.max(0, allIn - allOut);

        // If we don't have persisted data, use history
        if (!client.projectionData) {
            setProjValues({
                revenue: round2(avgRev),
                variableCost: round2(avgVar),
                fixedCost: round2(avgFix),
                financialCost: round2(avgFin),
                investments: round2(avgInv),
                initialBalance: round2(estimatedBalance),
                fundraising: 0
            });
        }
        
        setHistoricalStats({ marginPct: histMargin, varCostRatio: histVarRatio });
        setIsInitialized(true);
    }
  }, [clientTxs, clientDebts, isInitialized, client.projectionData]);

  // 2. Persist Changes to Context (So ReportView can see it)
  useEffect(() => {
     if (isInitialized && variant !== 'report') {
         const handler = setTimeout(() => {
             updateClientProjectionData(client.id, {
                 ...projValues,
                 horizonDays,
                 updatedAt: new Date().toISOString()
             });
         }, 800); // Debounce saves
         return () => clearTimeout(handler);
     }
  }, [projValues, horizonDays, isInitialized, variant, client.id]);


  // 3. Dynamic Time Base Logic
  const timeBase = useMemo(() => {
    if (horizonDays === 1) return { label: 'no Dia', factor: 1/30 };
    if (horizonDays === 7) return { label: 'na Semana', factor: 7/30 };
    return { label: 'no Mês', factor: 1 };
  }, [horizonDays]);

  const getDisplayVal = (monthlyVal: number) => monthlyVal * timeBase.factor;

  // Smart Setter: Updates proportional values if needed
  const setFromDisplayVal = (field: keyof typeof projValues, displayVal: number) => {
      const monthlyVal = displayVal / timeBase.factor;
      
      setProjValues(prev => {
          const newState = { ...prev, [field]: monthlyVal };
          
          // Proportional Logic: If Revenue Changes, update Variable Cost based on CURRENT Margin %
          if (field === 'revenue' && prev.revenue > 0) {
              const currentMarginRatio = (prev.revenue - prev.variableCost) / prev.revenue;
              // Apply this ratio to the new revenue to maintain the CURRENT assumption
              const newVariableCost = monthlyVal * (1 - currentMarginRatio);
              newState.variableCost = newVariableCost;
          }
          // If Variable Cost Changes, we allow margin to change (Freedom of choice)

          return newState;
      });
  };

  // 4. Analytical Logic
  const analysis = useMemo(() => {
    const vals = projValues;

    // Derived DRE
    const margin = vals.revenue - vals.variableCost;
    const marginPercent = vals.revenue > 0 ? (margin / vals.revenue) * 100 : 0;
    
    const operationalResult = margin - vals.fixedCost;
    const netResultMonthly = operationalResult - vals.financialCost - vals.investments;
    
    const dailyBurnRate = netResultMonthly / 30;
    const isBurning = dailyBurnRate < 0;

    // Liquidity Logic (Survival ONLY)
    const effectiveStartingBalance = vals.initialBalance + vals.fundraising;

    // Break-Even Analysis (Operational Only - Not affected by fundraising)
    const totalFixedObligations = vals.fixedCost + vals.financialCost + vals.investments;
    const marginRatio = vals.revenue > 0 ? (margin / vals.revenue) : 0;
    const breakEvenRevenue = marginRatio > 0 ? totalFixedObligations / marginRatio : 0;
    const revenueGap = breakEvenRevenue - vals.revenue;

    // Simulation
    const sim = simulateProjection(effectiveStartingBalance, dailyBurnRate, horizonDays);

    // Risk
    let riskLevel: RiskLevel = 'LOW';
    if (sim.breakDay !== null) riskLevel = 'HIGH';
    else if (isBurning && effectiveStartingBalance < Math.abs(dailyBurnRate * 60)) riskLevel = 'MEDIUM';

    // Calculate Suggested Variable Cost based on History
    const suggestedVariableCostDisplay = getDisplayVal(vals.revenue * historicalStats.varCostRatio);

    return { 
        ...sim, 
        riskLevel, 
        dailyBurnRate,
        netResultMonthly,
        margin,
        marginPercent,
        breakEvenRevenue,
        revenueGap,
        isBurning,
        effectiveStartingBalance,
        suggestedVariableCostDisplay
    };
  }, [projValues, horizonDays, historicalStats]);

  // Update Metadata
  useEffect(() => {
    if (analysis) {
        updateClientProjectionMeta(client.id, analysis.riskLevel);
    }
  }, [client.id, analysis?.riskLevel]);

  // Chart Data preparation
  const chartData = analysis.days.map(d => ({
      ...d,
      netResult: analysis.dailyBurnRate
  }));

  if (!isInitialized && clientTxs.length === 0) return <div className="p-10 text-center text-slate-500">Importe dados financeiros primeiro para habilitar a projeção.</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
       
       {/* Header & Controls - Hidden in Report Mode to look clean */}
       {variant !== 'report' ? (
           <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
               <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 border-b border-slate-100 pb-6">
                    <div>
                        <h2 className="text-xl font-serif font-bold text-slate-900 flex items-center gap-2">
                            <Calculator size={24} className="text-slate-400" />
                            Simulador Estratégico
                        </h2>
                        <p className="text-slate-500 text-sm mt-1">
                            Ajuste as premissas operacionais e veja o impacto na sobrevida do caixa.
                        </p>
                    </div>
                    
                    <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
                        <CalendarClock size={18} className="text-slate-500" />
                        <select 
                            value={horizonDays}
                            onChange={(e) => setHorizonDays(Number(e.target.value))}
                            className="bg-transparent text-sm font-bold text-slate-700 outline-none cursor-pointer"
                        >
                            <option value={1}>Projetar 1 Dia</option>
                            <option value={7}>Projetar 1 Semana</option>
                            <option value={30}>Projetar 1 Mês</option>
                            <option value={60}>Projetar 2 Meses</option>
                            <option value={90}>Projetar 3 Meses</option>
                            <option value={180}>Projetar 6 Meses</option>
                        </select>
                    </div>
               </div>

               {/* Liquidity Inputs */}
               <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div>
                        <label className="text-xs font-bold uppercase text-slate-400 mb-2 block">Saldo em Conta (Hoje)</label>
                        <div className="relative group">
                            <span className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-400 font-serif text-lg group-focus-within:text-slate-800 transition-colors">R$</span>
                            <MoneyInput 
                                value={projValues.initialBalance}
                                onChange={val => setProjValues(prev => ({ ...prev, initialBalance: val }))}
                                className="w-full pl-8 py-2 bg-transparent border-b border-slate-200 font-serif font-bold text-2xl text-slate-900 focus:border-slate-900 outline-none transition-all placeholder-slate-200"
                                placeholder="0,00"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold uppercase text-indigo-600 mb-2 flex items-center gap-2">
                            Injeção de Liquidez (Pontual) <span className="bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded text-[9px]">Extra</span>
                        </label>
                        <div className="relative group">
                            <span className="absolute left-0 top-1/2 -translate-y-1/2 text-indigo-300 font-serif text-lg group-focus-within:text-indigo-600 transition-colors">R$</span>
                            <MoneyInput 
                                value={projValues.fundraising}
                                onChange={val => setProjValues(prev => ({ ...prev, fundraising: val }))}
                                className="w-full pl-8 py-2 bg-transparent border-b border-indigo-100 font-serif font-bold text-2xl text-indigo-600 focus:border-indigo-600 outline-none transition-all placeholder-indigo-50"
                                placeholder="0,00"
                            />
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">Empréstimos, Venda de Ativos ou Aportes.</p>
                    </div>

                    <div className="bg-slate-50 rounded-lg border border-slate-200 p-4 flex flex-col justify-center">
                        <span className="text-xs font-bold uppercase text-slate-500 mb-1">Disponibilidade Total de Partida</span>
                        <span className="text-2xl font-serif font-bold text-slate-800">
                            {formatCurrency(analysis.effectiveStartingBalance)}
                        </span>
                        <span className="text-[10px] text-slate-400">Saldo + Injeção</span>
                    </div>
               </div>
           </div>
       ) : (
           // Report Mode: Simplified Summary of Liquidity
           <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex justify-between items-center mb-6">
               <div>
                   <p className="text-[10px] font-bold uppercase text-slate-500">Premissas de Liquidez</p>
                   <p className="text-sm font-medium text-slate-700">Saldo Inicial + Injeções (Empréstimos/Aportes)</p>
               </div>
               <div className="text-right">
                   <p className="text-[10px] font-bold uppercase text-slate-500">Caixa de Partida</p>
                   <p className="text-xl font-serif font-bold text-slate-900">{formatCurrency(analysis.effectiveStartingBalance)}</p>
               </div>
           </div>
       )}

       {/* Main Simulation Area */}
       <div className={`grid grid-cols-1 ${variant === 'report' ? 'print:grid-cols-2 gap-4' : 'lg:grid-cols-2 gap-8'}`}>
          
          {/* LEFT: Operational Inputs / Table */}
          <div className={`bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden ${variant === 'report' ? 'h-auto' : ''}`}>
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                  <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wide">Fluxo Projetado</h3>
                  {variant !== 'report' && <span className="text-[10px] font-bold text-slate-400 uppercase bg-white border border-slate-200 px-2 py-1 rounded">Editável</span>}
              </div>
              
              <div className={variant === 'report' ? 'p-0' : 'p-6 space-y-6'}>
                  {variant === 'report' ? (
                      // REPORT MODE: Clean Table Layout
                      <table className="w-full text-xs">
                          <tbody className="divide-y divide-slate-100">
                              <tr className="bg-white">
                                  <td className="p-3 font-bold text-slate-600">1. Receita Bruta / Entradas</td>
                                  <td className="p-3 text-right font-bold text-emerald-700">{formatCurrency(getDisplayVal(projValues.revenue))}</td>
                              </tr>
                              <tr className="bg-white">
                                  <td className="p-3 text-slate-500">(-) Custos Variáveis</td>
                                  <td className="p-3 text-right text-rose-700">{formatCurrency(getDisplayVal(projValues.variableCost))}</td>
                              </tr>
                              <tr className="bg-slate-50">
                                  <td className="p-3 font-bold text-slate-800">(=) Margem de Contribuição</td>
                                  <td className="p-3 text-right font-bold text-slate-800">{formatCurrency(getDisplayVal(analysis.margin))}</td>
                              </tr>
                              <tr className="bg-white">
                                  <td className="p-3 text-slate-500">(-) Despesas Fixas (OpEx)</td>
                                  <td className="p-3 text-right text-rose-700">{formatCurrency(getDisplayVal(projValues.fixedCost))}</td>
                              </tr>
                              <tr className="bg-white">
                                  <td className="p-3 text-slate-500">(-) Despesas Financeiras</td>
                                  <td className="p-3 text-right text-rose-700">{formatCurrency(getDisplayVal(projValues.financialCost))}</td>
                              </tr>
                              <tr className="bg-white">
                                  <td className="p-3 text-slate-500">(-) Outros / Investimentos</td>
                                  <td className="p-3 text-right text-slate-700">{formatCurrency(getDisplayVal(projValues.investments))}</td>
                              </tr>
                          </tbody>
                      </table>
                  ) : (
                      // INTERACTIVE MODE: Big Inputs
                      <>
                        <div className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-serif font-bold text-sm">1</div>
                            <div className="flex-1">
                                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Receita Bruta / Entradas</label>
                                <MoneyInput 
                                    value={getDisplayVal(projValues.revenue)}
                                    onChange={val => setFromDisplayVal('revenue', val)}
                                    className="w-full py-2 border-b border-slate-200 text-lg font-bold text-emerald-700 focus:border-emerald-600 outline-none transition-all"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-serif font-bold text-sm">2</div>
                            <div className="flex-1">
                                <div className="flex justify-between items-center mb-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase block">(-) Custos Variáveis (CMV/Impostos)</label>
                                    <div className="text-[10px] text-slate-400 flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                                        <span>Sugestão:</span>
                                        <span className="font-bold text-slate-600">{formatCurrency(analysis.suggestedVariableCostDisplay)}</span>
                                    </div>
                                </div>
                                <MoneyInput 
                                    value={getDisplayVal(projValues.variableCost)}
                                    onChange={val => setFromDisplayVal('variableCost', val)}
                                    className="w-full py-2 border-b border-slate-200 text-lg font-bold text-rose-700 focus:border-rose-600 outline-none transition-all"
                                />
                            </div>
                        </div>

                        {/* Margin Result */}
                        <div className="ml-12 p-3 bg-slate-50 rounded border-l-4 border-slate-300">
                            <div className="flex justify-between items-end">
                                <span className="text-xs font-bold uppercase text-slate-500">(=) Margem de Contribuição</span>
                                <div className="text-right">
                                    <span className="block font-bold text-slate-800">{formatCurrency(getDisplayVal(analysis.margin))}</span>
                                    <div className="flex justify-end items-center gap-2">
                                        <span className="text-xs text-slate-500 font-mono">{analysis.marginPercent.toFixed(1)}%</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-serif font-bold text-sm">3</div>
                            <div className="flex-1">
                                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">(-) Despesas Fixas (OpEx)</label>
                                <MoneyInput 
                                    value={getDisplayVal(projValues.fixedCost)}
                                    onChange={val => setFromDisplayVal('fixedCost', val)}
                                    className="w-full py-2 border-b border-slate-200 text-lg font-bold text-rose-700 focus:border-rose-600 outline-none transition-all"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-serif font-bold text-sm">4</div>
                            <div className="flex-1">
                                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">(-) Despesas Financeiras</label>
                                <MoneyInput 
                                    value={getDisplayVal(projValues.financialCost)}
                                    onChange={val => setFromDisplayVal('financialCost', val)}
                                    className="w-full py-2 border-b border-slate-200 text-lg font-bold text-rose-700 focus:border-rose-600 outline-none transition-all"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-serif font-bold text-sm">5</div>
                            <div className="flex-1">
                                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">(-) Outros / Investimentos</label>
                                <MoneyInput 
                                    value={getDisplayVal(projValues.investments)}
                                    onChange={val => setFromDisplayVal('investments', val)}
                                    className="w-full py-2 border-b border-slate-200 text-lg font-bold text-slate-700 focus:border-slate-400 outline-none transition-all"
                                />
                            </div>
                        </div>
                      </>
                  )}
              </div>
          </div>

          {/* RIGHT: Results & Chart */}
          <div className="flex flex-col gap-6">
              
              {/* Result Card */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col justify-center min-h-[160px]">
                   <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Geração de Caixa Operacional {timeBase.label}</h3>
                   
                   <div className="flex items-baseline gap-3 mb-2">
                       <span className={`text-4xl font-serif font-bold ${analysis.netResultMonthly >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                           {formatCurrency(getDisplayVal(analysis.netResultMonthly))}
                       </span>
                   </div>
                   
                   <p className="text-sm text-slate-500 leading-relaxed border-t border-slate-100 pt-3 mt-2">
                       Isso representa uma {analysis.netResultMonthly >= 0 ? 'geração' : 'queima'} diária de <strong>{formatCurrency(Math.abs(analysis.dailyBurnRate))}</strong>. 
                   </p>
              </div>

              {/* Survival Chart */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex-1 print:h-[300px]">
                   <div className="flex justify-between items-center mb-4">
                       <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                           <TrendingUp size={14} /> Projeção de Sobrevivência ({horizonDays} Dias)
                       </h3>
                   </div>
                   <div className="h-[200px] w-full print:h-[220px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={chartData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="date" tick={{fontSize: 9}} axisLine={false} tickLine={false} interval={Math.ceil(chartData.length / 7)} />
                            <YAxis yAxisId="left" tick={{fontSize: 9}} axisLine={false} tickLine={false} tickFormatter={(v) => `${v/1000}k`} />
                            <Tooltip formatter={(v: number) => formatCurrency(v)} labelStyle={{color: '#334155', fontWeight: 'bold'}} />
                            <ReferenceLine y={0} yAxisId="left" stroke="#000" strokeOpacity={0.1} />
                            <Line yAxisId="left" type="monotone" dataKey="balance" name="Saldo Projetado" stroke={analysis.riskLevel === 'HIGH' ? '#e11d48' : '#059669'} strokeWidth={2} dot={false} />
                            </ComposedChart>
                        </ResponsiveContainer>
                   </div>
                   <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-500">Dias de Fôlego Estimados:</span>
                        <span className={`text-lg font-serif font-bold ${analysis.riskLevel === 'HIGH' ? 'text-rose-700' : 'text-emerald-700'}`}>
                            {analysis.breakDay ? `${analysis.breakDay} Dias` : `+${horizonDays} Dias`}
                        </span>
                   </div>
              </div>
          </div>
       </div>
    </div>
  );
};