import React, { useMemo, useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { Client, Category } from '../../types';
import { useData } from '../../context/DataContext';
import { formatCurrency } from '../../constants';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Layers, ArrowRight, ShieldAlert, PieChart as PieIcon, ArrowLeftRight, Coins } from 'lucide-react';

interface AnalysisViewProps {
  variant?: 'default' | 'report';
}

export const AnalysisView: React.FC<AnalysisViewProps> = ({ variant = 'default' }) => {
  const { client } = useOutletContext<{ client: Client }>();
  const { getTransactionsByClient, updateClientWorkingCapital } = useData();

  const transactions = getTransactionsByClient(client.id);

  // Capital de Giro State - Initialized from Client Data if available
  const [pmr, setPmr] = useState<number | ''>(client.workingCapitalData?.pmr ?? ''); // Prazo Médio Recebimento
  const [pmp, setPmp] = useState<number | ''>(client.workingCapitalData?.pmp ?? ''); // Prazo Médio Pagamento

  // Persist changes to Client Data (debounced)
  useEffect(() => {
    if (pmr !== '' && pmp !== '') {
        const handler = setTimeout(() => {
            updateClientWorkingCapital(client.id, { pmr: Number(pmr), pmp: Number(pmp) });
        }, 500);
        return () => clearTimeout(handler);
    }
  }, [pmr, pmp, client.id]);

  // Core Calculations & DFC Logic
  const analysis = useMemo(() => {
    if (transactions.length === 0) return null;

    const validTxs = transactions.filter(t => t.category !== Category.TRANSFER);
    
    // 1. DRE de Caixa Simplificada (Agregados)
    const totalIn = validTxs.filter(t => t.type === 'IN').reduce((s, t) => s + t.value, 0);
    const taxesOnSales = validTxs.filter(t => t.category === Category.COST_TAXES_SALES).reduce((s, t) => s + t.value, 0);
    const cogs = validTxs.filter(t => [Category.COST_GOODS, Category.COST_FREIGHT, Category.COST_COMMISSION].includes(t.category)).reduce((s, t) => s + t.value, 0);
    
    const grossMargin = totalIn - taxesOnSales - cogs;

    const opex = validTxs.filter(t => t.type === 'OUT' && t.nature === 'OPERATIONAL' && ![Category.COST_GOODS, Category.COST_TAXES_SALES, Category.COST_FREIGHT, Category.COST_COMMISSION].includes(t.category)).reduce((s, t) => s + t.value, 0);
    
    const operatingResult = grossMargin - opex;

    const financialExpenses = validTxs.filter(t => t.type === 'OUT' && t.nature === 'FINANCING').reduce((s, t) => s + t.value, 0);
    const investingFlow = validTxs.filter(t => t.type === 'OUT' && t.nature === 'INVESTING').reduce((s, t) => s + t.value, 0); 
    
    const netResult = operatingResult - financialExpenses - investingFlow;

    // 2. Fluxo por Natureza (Net)
    const calcNet = (nature: string) => validTxs.filter(t => t.nature === nature).reduce((acc, t) => acc + (t.type === 'IN' ? t.value : -t.value), 0);
    const flowOps = calcNet('OPERATIONAL');
    const flowInv = calcNet('INVESTING');
    const flowFin = calcNet('FINANCING');

    // 3. Mapa de Ralos (Top 5 Outflows)
    const totalOut = validTxs.filter(t => t.type === 'OUT').reduce((sum, t) => sum + t.value, 0);
    const categoryTotals: Record<string, number> = {};
    validTxs.filter(t => t.type === 'OUT').forEach(t => {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.value;
    });

    const categoryData = Object.entries(categoryTotals)
      .map(([name, value]) => ({ 
          name: name.split('(')[0].trim(),
          fullName: name,
          value, 
          percent: totalOut > 0 ? value / totalOut : 0
      }))
      .sort((a, b) => b.value - a.value);

    const drains = categoryData.slice(0, 5);
    const drainsConcentration = drains.reduce((acc, curr) => acc + curr.value, 0) / (totalOut || 1);

    // 4. Capital de Giro Calculation (Estimate)
    // Estimate daily averages based on total period (assuming 90 days if not specific, but using totalIn helps scaling)
    const dailyRevenue = totalIn / 90; 
    const dailyCogs = cogs / 90; // Using variable costs as proxy for purchases
    
    let cycleImpact = 0;
    let cycleGap = 0;

    if (pmr !== '' && pmp !== '') {
        cycleGap = Number(pmr) - Number(pmp);
        // Formula: (Receivables) - (Payables) roughly
        // Impact = (PMR * DailyRev) - (PMP * DailyCOGS)
        cycleImpact = (Number(pmr) * dailyRevenue) - (Number(pmp) * dailyCogs);
    }

    return { 
        dre: { totalIn, taxesOnSales, cogs, grossMargin, opex, operatingResult, financialExpenses, netResult },
        flows: { flowOps, flowInv, flowFin },
        drains, drainsConcentration, totalOut, categoryData,
        wc: { dailyRevenue, dailyCogs, cycleGap, cycleImpact }
    };
  }, [transactions, pmr, pmp]);

  // Adjusted Palette for better contrast and professional look
  const COLORS = ['#ef4444', '#f97316', '#eab308', '#3b82f6', '#6366f1', '#8b5cf6', '#cbd5e1'];

  if (!analysis) return <div className="p-10 text-center text-slate-500">Sem dados para análise.</div>;

  // Layout Logic
  const containerClass = variant === 'report' 
    ? "grid grid-cols-1 md:grid-cols-2 gap-6" 
    : "grid grid-cols-1 lg:grid-cols-3 gap-6";

  const dreClass = variant === 'report' ? "md:col-span-2" : "";

  return (
    <div className="space-y-8">
      
      <div className={containerClass}>
        {/* COL 1: Mini DRE */}
        <div className={`bg-white rounded-xl border border-slate-200 shadow-sm p-8 ${dreClass}`}>
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                <Layers size={16} /> Diagnóstico de Caixa (DFC)
            </h3>
            
            {/* DRE Content */}
            <div className={`text-sm ${variant === 'report' ? 'grid grid-cols-2 gap-x-12 gap-y-4' : 'flex flex-col gap-4'}`}>
                {/* Left Column (Inputs) */}
                <div className="space-y-3">
                    <DRERow label="Receita Bruta" value={analysis.dre.totalIn} bold color="text-emerald-700" />
                    <DRERow label="(-) Impostos sobre Vendas" value={analysis.dre.taxesOnSales} color="text-rose-600" />
                    <DRERow label="(-) Custos Variáveis (CMV)" value={analysis.dre.cogs} color="text-rose-600" />
                    <div className="border-t border-slate-200 my-1"></div>
                    <DRERow label="(=) Margem de Contribuição" value={analysis.dre.grossMargin} bold />
                </div>
                
                {/* Right Column (Outputs & Result) */}
                <div className="space-y-3 flex flex-col h-full">
                    <DRERow label="(-) Despesas Operacionais (OpEx)" value={analysis.dre.opex} color="text-rose-600" />
                    <div className="border-t border-slate-200 my-1"></div>
                    <DRERow label="(=) Geração de Caixa Operacional" value={analysis.dre.operatingResult} bold />
                    <DRERow label="(-) Despesas Financeiras" value={analysis.dre.financialExpenses} color="text-amber-700" />
                    
                    {/* For non-report variant, result stays here. For report, it's moved to footer to ensure full width */}
                    {variant !== 'report' && (
                        <div className="mt-auto pt-4 border-t-2 border-slate-800">
                            <div className="flex justify-between items-end gap-2">
                                <span className="font-bold text-slate-900 text-sm whitespace-nowrap">(=) Resultado Líquido</span>
                                <span className={`font-bold text-lg whitespace-nowrap ${analysis.dre.netResult >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                                    {formatCurrency(analysis.dre.netResult)}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* FULL WIDTH FOOTER FOR REPORT (Prevents line wrapping) */}
            {variant === 'report' && (
                <div className="mt-6 pt-6 border-t-2 border-slate-900">
                    <div className="flex justify-between items-end">
                        <span className="font-bold text-slate-900 text-lg uppercase tracking-tight">(=) Resultado Líquido de Caixa</span>
                        <span className={`font-bold text-2xl font-serif ${analysis.dre.netResult >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                            {formatCurrency(analysis.dre.netResult)}
                        </span>
                    </div>
                </div>
            )}
        </div>

        {/* COL 2: Fluxos & Capital de Giro */}
        <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Fluxo por Natureza</h3>
                <div className="space-y-4">
                    <FlowCard label="Operacional" value={analysis.flows.flowOps} />
                    <FlowCard label="Investimentos" value={analysis.flows.flowInv} />
                    <FlowCard label="Financiamento" value={analysis.flows.flowFin} />
                </div>
            </div>

            <div className="bg-slate-50 rounded-xl border border-slate-200 p-6">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <ShieldAlert size={14} /> Capital de Giro (Ciclo)
                </h3>
                
                <div className="flex gap-3 mb-4">
                     <div className="flex-1">
                        <label className="text-[9px] font-bold uppercase text-slate-400 block mb-1">PMR (Recebimento)</label>
                        <div className="relative">
                            <input 
                                type="number" 
                                className="w-full bg-white border border-slate-300 rounded px-2 py-1.5 text-sm font-bold text-slate-700 outline-none focus:border-teal-500" 
                                placeholder="0" 
                                value={pmr}
                                onChange={(e) => setPmr(e.target.value === '' ? '' : Number(e.target.value))}
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">dias</span>
                        </div>
                     </div>
                     <div className="flex-1">
                        <label className="text-[9px] font-bold uppercase text-slate-400 block mb-1">PMP (Pagamento)</label>
                        <div className="relative">
                            <input 
                                type="number" 
                                className="w-full bg-white border border-slate-300 rounded px-2 py-1.5 text-sm font-bold text-slate-700 outline-none focus:border-teal-500" 
                                placeholder="0" 
                                value={pmp}
                                onChange={(e) => setPmp(e.target.value === '' ? '' : Number(e.target.value))}
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">dias</span>
                        </div>
                     </div>
                </div>

                {/* Calculation Result */}
                {(pmr !== '' && pmp !== '') && (
                    <div className="animate-in fade-in slide-in-from-top-2 pt-3 border-t border-slate-200">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-xs text-slate-500 font-medium">Ciclo Financeiro:</span>
                            <span className={`text-sm font-bold ${analysis.wc.cycleGap > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                {analysis.wc.cycleGap > 0 ? `+${analysis.wc.cycleGap} dias` : `${analysis.wc.cycleGap} dias`}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-slate-500 font-medium">Impacto no Caixa:</span>
                            <span className={`text-sm font-bold ${analysis.wc.cycleImpact > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                {analysis.wc.cycleImpact > 0 ? '-' : '+'}{formatCurrency(Math.abs(analysis.wc.cycleImpact))}
                            </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-2 leading-tight">
                            {analysis.wc.cycleImpact > 0 
                                ? "Você paga antes de receber. Esse valor fica 'preso' na operação." 
                                : "Você recebe antes de pagar. Sua operação financia o caixa."}
                        </p>
                    </div>
                )}
                {(pmr === '' || pmp === '') && (
                    <p className="text-[10px] text-slate-400 italic">Preencha os prazos médios para calcular a necessidade de capital.</p>
                )}
            </div>
        </div>

        {/* COL 3: Mapa de Ralos (Gráfico) */}
        <div className={`bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col ${variant === 'report' ? 'print:break-inside-avoid' : 'overflow-hidden'}`}>
             <div className="bg-slate-50 px-6 py-4 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <PieIcon size={18} /> Concentração de Saídas
                </h3>
                <p className="text-xs text-slate-500 mt-1">Principais categorias de consumo de caixa.</p>
             </div>
             
             {/* Chart Area */}
             <div className="flex-1 relative min-h-[220px] border-b border-slate-100 py-4">
                <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                        <Pie 
                            data={analysis.categoryData} 
                            cx="50%" 
                            cy="50%" 
                            innerRadius={50} 
                            outerRadius={80} 
                            dataKey="value"
                            paddingAngle={2}
                        >
                            {analysis.categoryData.map((e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} strokeWidth={1} />)}
                        </Pie>
                        <Tooltip 
                            formatter={(val: number) => formatCurrency(val)} 
                            contentStyle={{ fontSize: '12px', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                        />
                    </PieChart>
                </ResponsiveContainer>
                {/* Center Label for Total */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Total</span>
                    <span className="text-sm font-bold text-slate-900">{((analysis.drainsConcentration)*100).toFixed(0)}%</span>
                    <span className="text-[9px] text-slate-400">Top 5</span>
                </div>
             </div>

             {/* Custom List/Legend - Adjusted for Print */}
             <div className={`flex-1 p-4 space-y-3 ${variant === 'report' ? 'print:overflow-visible print:h-auto' : 'overflow-auto'}`}>
                 {analysis.drains.map((item, idx) => (
                     <div key={item.name} className="flex justify-between items-center text-sm group hover:bg-slate-50 p-1 rounded transition-colors">
                         <div className="flex items-center gap-3 truncate max-w-[170px]">
                            {/* Color Dot */}
                            <div 
                                className="w-3 h-3 rounded-full flex-shrink-0" 
                                style={{ backgroundColor: COLORS[idx % COLORS.length] }} 
                            />
                            {/* Show shortened name, but full name on hover */}
                            <span className="truncate text-slate-600 font-medium" title={item.fullName}>{item.name}</span>
                         </div>
                         <div className="text-right flex-shrink-0 ml-2">
                             <span className="font-bold text-slate-900 block text-xs">{formatCurrency(item.value)}</span>
                             <span className="text-[10px] text-slate-400 font-mono">{(item.percent * 100).toFixed(1)}%</span>
                         </div>
                     </div>
                 ))}
             </div>
             {variant !== 'report' && (
                 <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
                     <Link to={`/client/${client.id}/problem-tree`} className="text-xs font-bold text-teal-700 flex items-center justify-center gap-1 hover:underline">
                        Criar Plano de Ação <ArrowRight size={12} />
                     </Link>
                 </div>
             )}
        </div>
      </div>

       {/* Footer Glossary - Always shown now to satisfy Report requirements, AnalysisView handles layout */}
       <div className="mt-8 border-t border-slate-200 pt-6 text-slate-400 grid grid-cols-1 md:grid-cols-2 gap-8 text-xs leading-relaxed">
            <div>
                <strong className="block text-slate-500 mb-1 uppercase tracking-wider text-[10px]">CMV (Custo de Mercadoria Vendida)</strong>
                <p>Custos diretos relacionados à produção ou aquisição do que foi vendido. Inclui matéria-prima, produtos para revenda, impostos sobre nota fiscal, comissões e fretes de entrega.</p>
            </div>
            <div>
                <strong className="block text-slate-500 mb-1 uppercase tracking-wider text-[10px]">OpEx (Despesas Operacionais)</strong>
                <p>Gastos fixos necessários para manter a empresa funcionando, independente de vender ou não. Inclui aluguel, salários administrativos, pro-labore, contador, internet, software, etc.</p>
            </div>
       </div>
    </div>
  );
};

const DRERow = ({ label, value, bold, color, size }: any) => (
    <div className={`flex justify-between items-center ${bold ? 'font-bold' : 'font-medium'} ${color || 'text-slate-700'} ${size || 'text-sm'}`}>
        <span>{label}</span>
        <span>{formatCurrency(value)}</span>
    </div>
);

const FlowCard = ({ label, value }: any) => (
    <div className="flex justify-between items-center p-3 rounded-lg bg-slate-50 border border-slate-100">
        <span className="text-xs font-bold uppercase text-slate-500">{label}</span>
        <span className={`font-bold ${value >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{formatCurrency(value)}</span>
    </div>
);