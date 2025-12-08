import React, { useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Client, Category } from '../../types';
import { AnalysisView } from './AnalysisView';
import { ProjectionView } from './ProjectionView';
import { DebtsView } from './DebtsView';
import { useData } from '../../context/DataContext';
import { Printer, TrendingUp, ShieldCheck, Wallet, AlertTriangle, FileText, ArrowDown, ArrowUp } from 'lucide-react';
import { formatCurrency, formatCurrencyCompact, CATEGORY_GROUPS } from '../../constants';

const IMPACT_TRANSLATION: Record<string, string> = {
  HIGH: 'ALTO',
  MEDIUM: 'MÉDIO',
  LOW: 'BAIXO'
};

const HORIZON_TRANSLATION: Record<string, string> = {
  CURTO: 'CURTO PRAZO',
  MEDIO: 'MÉDIO PRAZO',
  LONGO: 'LONGO PRAZO'
};

export const ReportView = () => {
  const { client } = useOutletContext<{ client: Client }>();
  const { actions, transactions, debts, updateClientNotes } = useData();
  
  const clientActions = actions.filter(a => a.clientId === client.id);
  const clientTxs = transactions.filter(t => t.clientId === client.id);
  const clientDebts = debts.filter(d => d.clientId === client.id);

  // --- EXECUTIVE SUMMARY CALCULATIONS ---
  const summary = useMemo(() => {
      const totalIn = clientTxs.filter(t => t.type === 'IN').reduce((a, b) => a + b.value, 0);
      const totalOut = clientTxs.filter(t => t.type === 'OUT').reduce((a, b) => a + b.value, 0);
      const estimatedBalance = Math.max(0, totalIn - totalOut); 
      const totalDebt = clientDebts.reduce((a, b) => a + b.balance, 0);
      
      return { totalIn, totalOut, estimatedBalance, totalDebt };
  }, [clientTxs, clientDebts]);

  // --- 3 MONTH COMPARATIVE LOGIC ---
  const last3MonthsData = useMemo(() => {
    const months: Record<string, any> = {};
    
    // Group
    clientTxs.forEach(t => {
        if (t.category === Category.UNCATEGORIZED || t.category === Category.TRANSFER) return;
        const key = t.date.substring(0, 7); // YYYY-MM
        if (!months[key]) {
            months[key] = { revenue: 0, variable: 0, fixed: 0, financial: 0, investments: 0 };
        }
        
        // Sum based on groups
        const cat = t.category;
        const val = t.value;

        if (CATEGORY_GROUPS.INFLOW['Receitas Operacionais (Vendas)'].includes(cat) || CATEGORY_GROUPS.INFLOW['Outras Entradas / Financeiro'].includes(cat)) {
            months[key].revenue += val;
        } else if (CATEGORY_GROUPS.OUTFLOW['Custos Variáveis (CMV)'].includes(cat)) {
            months[key].variable += val;
        } else if (CATEGORY_GROUPS.OUTFLOW['Despesas Fixas (OpEx)'].includes(cat)) {
            months[key].fixed += val;
        } else if (CATEGORY_GROUPS.OUTFLOW['Despesas Financeiras'].includes(cat)) {
            months[key].financial += val;
        } else if (CATEGORY_GROUPS.OUTFLOW['Não Operacional / Investimentos'].includes(cat)) {
            months[key].investments += val;
        }
    });

    // Sort and Take Last 3
    const sortedKeys = Object.keys(months).sort().reverse().slice(0, 3).reverse();
    
    return sortedKeys.map(key => {
        const d = months[key];
        const margin = d.revenue - d.variable;
        const opResult = margin - d.fixed;
        const netResult = opResult - d.financial - d.investments;
        
        // AV% Calculations
        const av_variable = d.revenue > 0 ? (d.variable / d.revenue) * 100 : 0;
        const av_fixed = d.revenue > 0 ? (d.fixed / d.revenue) * 100 : 0;
        const av_net = d.revenue > 0 ? (netResult / d.revenue) * 100 : 0;

        return {
            label: new Date(key + '-02').toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }).toUpperCase(),
            ...d,
            margin,
            opResult,
            netResult,
            av_variable,
            av_fixed,
            av_net
        };
    });
  }, [clientTxs]);

  const handlePrint = () => window.print();

  return (
    <div className="max-w-5xl mx-auto pb-20 font-sans text-slate-900">
      {/* Controls */}
      <div className="mb-8 flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-xl border border-slate-200 shadow-sm print:hidden gap-4">
        <div>
          <h2 className="font-bold text-slate-900 text-lg flex items-center gap-2">
             <FileText size={20} className="text-teal-600" />
             Dossiê de Diagnóstico & Reestruturação
          </h2>
          <p className="text-slate-500 text-sm">Gere o relatório completo para apresentar ao cliente ou bancos.</p>
        </div>
        <button onClick={handlePrint} className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-lg font-bold hover:bg-slate-800 shadow-lg transition-all w-full md:w-auto justify-center">
          <Printer size={18} /> GERAR PDF / IMPRIMIR
        </button>
      </div>

      {/* A4 Container */}
      <div id="printable-report" className="bg-white shadow-2xl print:shadow-none max-w-[210mm] mx-auto min-h-[297mm] p-0 relative overflow-hidden text-slate-900">
        
        {/* Header */}
        <div className="bg-[#0f172a] text-white px-10 py-10 print:px-8 print:py-8">
          <div className="flex justify-between items-start border-b border-slate-700 pb-6 mb-8">
             <div className="flex items-center gap-4">
                <div className="p-3 bg-teal-600 rounded-lg"><TrendingUp size={28} className="text-white" /></div>
                <div>
                    <h1 className="text-2xl font-bold tracking-[0.2em] uppercase text-slate-100 font-serif">Cruz Capital</h1>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Engenharia Financeira</p>
                </div>
             </div>
             <div className="text-right">
                <span className="text-[10px] font-bold bg-slate-800 text-teal-400 px-3 py-1.5 rounded border border-slate-700 uppercase tracking-widest flex items-center gap-2 justify-end ml-auto w-fit">
                   <ShieldCheck size={12} /> Documento Confidencial
                </span>
             </div>
          </div>
          <div>
            <h2 className="text-4xl font-serif font-bold text-white mb-6 tracking-tight">Laudo de Viabilidade Financeira</h2>
            <div className="flex justify-between items-end">
                <div>
                    <p className="text-slate-400 text-sm mb-1 uppercase tracking-wide font-bold">Empresa Analisada</p>
                    <p className="text-2xl font-bold text-white">{client.name}</p>
                    <p className="text-sm text-slate-500 font-mono mt-1">CNPJ: {client.cnpj} | Setor: {client.sector}</p>
                </div>
                <div className="text-right">
                    <p className="text-slate-400 text-sm mb-1 uppercase tracking-wide font-bold">Data de Emissão</p>
                    <p className="text-xl font-bold text-white">{new Date().toLocaleDateString('pt-BR')}</p>
                </div>
            </div>
          </div>
        </div>

        <div className="px-10 py-8 print:px-8 print:py-8 space-y-10">
            
            {/* 1. EXECUTIVE SUMMARY */}
            <section className="avoid-break">
                <SectionHeader number="1" title="Resumo Executivo" />
                
                {/* 2 Cols in Print for ample space */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 print:grid-cols-2 gap-4 mb-3">
                     <div className="p-4 rounded-xl border bg-slate-50 border-slate-200 flex flex-col justify-between h-28 print:h-auto print:py-5">
                        <div className="flex items-center gap-2 text-slate-500 mb-2">
                            <Wallet size={18} />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Caixa Estimado</span>
                        </div>
                        <p className="text-2xl font-serif font-bold text-slate-900 truncate whitespace-nowrap" title={formatCurrency(summary.estimatedBalance)}>
                          {formatCurrencyCompact(summary.estimatedBalance)}
                        </p>
                    </div>

                    {/* ENTRADAS / SAIDAS CARD - FIX FOR BREAKING TEXT */}
                    <div className="p-4 rounded-xl border bg-slate-50 border-slate-200 flex flex-col justify-center h-28 gap-3 print:h-auto print:py-5">
                         <div className="flex justify-between items-baseline w-full">
                             <div className="flex items-center gap-1.5 text-slate-500">
                                <ArrowUp size={14} className="text-emerald-500 shrink-0" />
                                <span className="text-[9px] font-bold uppercase tracking-widest shrink-0">Entradas</span>
                            </div>
                            <span className="text-sm font-bold text-emerald-700 whitespace-nowrap ml-2">{formatCurrencyCompact(summary.totalIn)}</span>
                         </div>
                         <div className="w-full h-px bg-slate-200"></div>
                         <div className="flex justify-between items-baseline w-full">
                            <div className="flex items-center gap-1.5 text-slate-500">
                                <ArrowDown size={14} className="text-rose-500 shrink-0" />
                                <span className="text-[9px] font-bold uppercase tracking-widest shrink-0">Saídas</span>
                            </div>
                            <span className="text-sm font-bold text-rose-700 whitespace-nowrap ml-2">{formatCurrencyCompact(summary.totalOut)}</span>
                         </div>
                    </div>

                    <div className={`p-4 rounded-xl border flex flex-col justify-between h-28 print:h-auto print:py-5 ${summary.totalDebt > 0 ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-200'}`}>
                        <div className="flex items-center gap-2 text-slate-500 mb-2">
                            <AlertTriangle size={18} />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Dívida Bancária</span>
                        </div>
                        <p className={`text-2xl font-serif font-bold truncate whitespace-nowrap ${summary.totalDebt > 0 ? 'text-rose-700' : 'text-slate-900'}`} title={formatCurrency(summary.totalDebt)}>
                          {formatCurrencyCompact(summary.totalDebt)}
                        </p>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col justify-between h-28 print:h-auto print:py-5">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Classificação de Risco</p>
                        <p className={`text-xl font-bold font-serif whitespace-nowrap ${client.lastRiskLevel === 'HIGH' ? 'text-rose-700' : client.lastRiskLevel === 'MEDIUM' ? 'text-amber-600' : 'text-emerald-700'}`}>
                            {client.lastRiskLevel === 'HIGH' ? 'ALTO RISCO' : client.lastRiskLevel === 'MEDIUM' ? 'RISCO MÉDIO' : 'BAIXO RISCO'}
                        </p>
                    </div>
                </div>
                <p className="text-[10px] text-slate-400 italic mt-2 leading-relaxed max-w-2xl">
                    * Os totais referem-se a todo o período de dados importados. O saldo de caixa é uma estimativa contábil. Valores abreviados (k/M) usados para facilitar a leitura.
                </p>
            </section>

            <div className="print:block h-px bg-slate-200 w-full my-6"></div>

            {/* 2. 3-MONTH COMPARATIVE */}
            <section className="avoid-break">
                <SectionHeader number="2" title="Performance Recente (Últimos 3 Meses)" />
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-xs text-left">
                        <thead className="bg-slate-100 border-b border-slate-200 text-[10px] text-slate-500 uppercase">
                            <tr>
                                <th className="p-3 font-bold tracking-wider">Indicador (DRE Gerencial)</th>
                                {last3MonthsData.map(m => (
                                    <th key={m.label} className="p-3 text-right font-bold w-28 border-l border-slate-200 bg-slate-50">{m.label}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            <tr className="hover:bg-slate-50">
                                <td className="p-3 pl-4 font-bold text-slate-700">1. Receita Bruta / Entradas</td>
                                {last3MonthsData.map((m, i) => (
                                    <td key={i} className="p-3 pr-4 text-right text-slate-700 border-l border-slate-200 font-mono">{formatCurrency(m.revenue)}</td>
                                ))}
                            </tr>
                            <tr className="hover:bg-slate-50">
                                <td className="p-3 pl-4 text-rose-700 text-[10px]">(-) Custos Variáveis</td>
                                {last3MonthsData.map((m, i) => (
                                    <td key={i} className="p-3 pr-4 text-right text-rose-700 text-[10px] border-l border-slate-200 font-mono">{formatCurrency(m.variable)}</td>
                                ))}
                            </tr>
                            
                            {/* VERTICAL ANALYSIS ROW: VARIABLE COST */}
                            <tr className="bg-slate-100 border-b border-slate-200">
                                <td className="p-2 pl-6 text-slate-500 text-[9px] font-bold italic">% Custos Variáveis</td>
                                {last3MonthsData.map((m, i) => (
                                    <td key={i} className="p-2 pr-4 text-right text-slate-500 text-[9px] font-bold border-l border-slate-200 font-mono">{m.av_variable.toFixed(1)}%</td>
                                ))}
                            </tr>

                            <tr className="bg-slate-50 font-bold hover:bg-slate-100">
                                <td className="p-3 pl-4 text-slate-800">2. (=) Margem de Contribuição</td>
                                {last3MonthsData.map((m, i) => (
                                    <td key={i} className="p-3 pr-4 text-right text-slate-800 border-l border-slate-200 font-mono">{formatCurrency(m.margin)}</td>
                                ))}
                            </tr>
                            <tr className="hover:bg-slate-50">
                                <td className="p-3 pl-4 text-rose-700 text-[10px]">(-) Despesas Fixas (OpEx)</td>
                                {last3MonthsData.map((m, i) => (
                                    <td key={i} className="p-3 pr-4 text-right text-rose-700 text-[10px] border-l border-slate-200 font-mono">{formatCurrency(m.fixed)}</td>
                                ))}
                            </tr>

                            {/* VERTICAL ANALYSIS ROW: FIXED COST */}
                            <tr className="bg-slate-100 border-b border-slate-200">
                                <td className="p-2 pl-6 text-slate-500 text-[9px] font-bold italic">% Despesas Fixas</td>
                                {last3MonthsData.map((m, i) => (
                                    <td key={i} className="p-2 pr-4 text-right text-slate-500 text-[9px] font-bold border-l border-slate-200 font-mono">{m.av_fixed.toFixed(1)}%</td>
                                ))}
                            </tr>

                            <tr className="bg-slate-50 font-bold hover:bg-slate-100">
                                <td className="p-3 pl-4 text-slate-800">3. (=) Geração de Caixa Operacional</td>
                                {last3MonthsData.map((m, i) => (
                                    <td key={i} className="p-3 pr-4 text-right text-slate-800 border-l border-slate-200 font-mono">{formatCurrency(m.opResult)}</td>
                                ))}
                            </tr>
                            <tr className="hover:bg-slate-50">
                                <td className="p-3 pl-4 text-amber-700 text-[10px]">(-) Serviço da Dívida / Investimentos</td>
                                {last3MonthsData.map((m, i) => (
                                    <td key={i} className="p-3 pr-4 text-right text-amber-700 text-[10px] border-l border-slate-200 font-mono">{formatCurrency(m.financial + m.investments)}</td>
                                ))}
                            </tr>
                            <tr className="bg-[#0f172a] text-white font-bold text-sm">
                                <td className="p-3 pl-4 whitespace-nowrap">4. (=) RESULTADO LÍQUIDO</td>
                                {last3MonthsData.map((m, i) => (
                                    <td key={i} className="p-3 pr-4 text-right border-l border-slate-700 font-mono tracking-tight whitespace-nowrap">{formatCurrency(m.netResult)}</td>
                                ))}
                            </tr>
                             {/* VERTICAL ANALYSIS ROW: NET MARGIN */}
                            <tr className="bg-slate-100">
                                <td className="p-2 pl-6 text-slate-500 text-[9px] font-bold italic">% Margem Líquida</td>
                                {last3MonthsData.map((m, i) => (
                                    <td key={i} className={`p-2 pr-4 text-right text-[9px] font-bold border-l border-slate-200 font-mono ${m.av_net >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{m.av_net.toFixed(1)}%</td>
                                ))}
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>
            
            <div className="print:page-break"></div>

            {/* 3. PROJECTION */}
            <section className="avoid-break mt-8">
                <SectionHeader number="3" title="Projeção | Sobrevida de Caixa" />
                <ProjectionView variant="report" />
            </section>

            <div className="print:block h-px bg-slate-200 w-full my-6"></div>

            {/* 4. DIAGNOSIS */}
            <section className="avoid-break">
                <SectionHeader number="4" title="Diagnóstico Financeiro (DFC)" />
                <AnalysisView variant="report" />
                {/* Glossary removed to avoid duplication. AnalysisView now handles it. */}
            </section>

            <div className="print:page-break"></div>

            {/* 5. DEBTS */}
            <section className="avoid-break mt-8">
                <SectionHeader number="5" title="Estrutura de Capital (Dívidas)" />
                <DebtsView />
            </section>

            <div className="print:block h-px bg-slate-200 w-full my-6"></div>

            {/* 6. ACTION PLAN */}
            <section className="avoid-break">
                <SectionHeader number="6" title="Plano de Ação Imediato" />
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="p-4 font-bold text-slate-500 text-xs uppercase tracking-wider">Ação Estratégica</th>
                                <th className="p-4 font-bold text-slate-500 text-xs uppercase tracking-wider w-32">Impacto</th>
                                <th className="p-4 font-bold text-slate-500 text-xs uppercase tracking-wider w-32">Horizonte</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {clientActions.map(action => (
                                <tr key={action.id} className="hover:bg-slate-50">
                                    <td className="p-4">
                                        <div className="flex items-center gap-2 mb-1">
                                            {action.actionType === 'REV' 
                                                ? <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold uppercase border border-emerald-200">Receita</span> 
                                                : <span className="text-[10px] bg-rose-100 text-rose-800 px-2 py-0.5 rounded font-bold uppercase border border-rose-200">Custo</span>
                                            }
                                            <p className="font-bold text-slate-900">{action.title}</p>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-1">{action.description}</p>
                                    </td>
                                    <td className="p-4">
                                        <span className="text-[10px] font-bold bg-slate-100 px-2 py-1 rounded border border-slate-200 uppercase text-slate-600">
                                            {IMPACT_TRANSLATION[action.impact] || action.impact}
                                        </span>
                                    </td>
                                    <td className="p-4 text-[10px] font-bold text-slate-500 uppercase">
                                        {HORIZON_TRANSLATION[action.horizon] || action.horizon}
                                    </td>
                                </tr>
                            ))}
                            {clientActions.length === 0 && <tr><td colSpan={3} className="p-8 text-center text-slate-400 italic">Nenhuma ação mapeada ainda.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </section>

             <div className="mt-8 p-6 bg-slate-50 border border-slate-200 rounded-xl avoid-break shadow-sm">
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <FileText size={16} /> Parecer do Consultor / Ações Urgentes
                </h4>
                <div className="print:hidden mb-2">
                    <textarea 
                        className="w-full h-40 p-4 border border-slate-300 rounded-lg text-sm text-slate-700 outline-none focus:ring-2 focus:ring-slate-200 transition-all resize-none shadow-inner"
                        placeholder="Digite aqui o parecer final e as recomendações urgentes. Este texto será impresso no relatório."
                        value={client.reportNotes || ''}
                        onChange={(e) => updateClientNotes(client.id, e.target.value)}
                    />
                    <p className="text-xs text-slate-400 mt-2 text-right italic">Alterações salvas automaticamente.</p>
                </div>
                {/* Print Version: Text only */}
                <div className="hidden print:block text-sm text-slate-700 whitespace-pre-wrap leading-relaxed font-serif text-justify">
                    {client.reportNotes || "Nenhum parecer registrado pelo consultor para este período."}
                </div>
            </div>
        </div>
        
        <div className="hidden print:flex fixed bottom-0 left-0 w-full justify-between px-10 pb-6 text-[10px] text-slate-400 border-t border-slate-100 pt-4 bg-white z-20">
           <span className="font-bold tracking-widest uppercase">Cruz Capital • Engenharia Financeira</span>
           <span>Documento gerado em {new Date().toLocaleDateString('pt-BR')} • Confidencial</span>
        </div>
      </div>
    </div>
  );
};

const SectionHeader = ({ number, title }: any) => (
    <div className="flex items-center gap-4 mb-6 border-b-2 border-slate-900 pb-3">
        <span className="w-10 h-10 flex items-center justify-center bg-slate-900 text-white font-serif font-bold text-xl rounded-lg shadow-md">{number}</span>
        <h3 className="text-2xl font-bold text-slate-900 uppercase tracking-tight">{title}</h3>
    </div>
);