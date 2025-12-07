import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Client } from '../../types';
import { AnalysisView } from './AnalysisView';
import { ProjectionView } from './ProjectionView';
import { DebtsView } from './DebtsView';
import { Printer, TrendingUp, FileSignature, Target, PlusCircle, Lightbulb, Check, ShieldCheck } from 'lucide-react';

export const ReportView = () => {
  const { client } = useOutletContext<{ client: Client }>();
  const [consultantName, setConsultantName] = useState('Rodrigo Cruz');
  
  const [actionPlan, setActionPlan] = useState<string>(
    "DIRETRIZES ESTRATÉGICAS - CURTO PRAZO\n\n" +
    "1. RENEGOCIAÇÃO IMEDIATA\n" +
    "   Iniciar contato com Banco do Brasil para alongamento do perfil da dívida. Meta: Solicitar carência (standstill) de 6 meses.\n\n" +
    "2. CORTE DE CUSTOS (CHOQUE DE GESTÃO)\n" +
    "   Reduzir despesas com Serviços de Terceiros e Marketing em 20% imediatamente para estancar a queima de caixa.\n\n" +
    "3. GESTÃO DE CAIXA\n" +
    "   Antecipar recebíveis apenas para cobrir o déficit da semana 2, evitando taxas excessivas de antecipação.\n\n" +
    "4. OPERACIONAL\n" +
    "   Revisar precificação dos produtos da Categoria A para melhorar a margem de contribuição."
  );

  const handlePrint = () => {
    window.print();
  };

  const suggestions = [
    {
        label: "Aumentar Lucro / Receita",
        color: "text-emerald-800 bg-emerald-50 border-emerald-200",
        items: [
            "Reajustar preços conforme inflação (Repasse de Custos)",
            "Aumentar venda de produtos com maior margem (Mix)",
            "Explorar novos canais de vendas (Parcerias)",
            "Criar política de upsell para clientes atuais"
        ]
    },
    {
        label: "Reduzir Gastos Fixos",
        color: "text-amber-800 bg-amber-50 border-amber-200",
        items: [
            "Identificar e cortar gastos com maiores aumentos recentes",
            "Retirar gastos em marketing com baixo retorno (ROAS)",
            "Cancelar assinaturas e serviços pouco utilizados",
            "Renegociar aluguel e contratos de longo prazo"
        ]
    },
    {
        label: "Gestão de Caixa & Dívida",
        color: "text-indigo-800 bg-indigo-50 border-indigo-200",
        items: [
            "Solicitar carência (suspensão) de 6 meses nos empréstimos",
            "Vender ativos imobilizados ociosos para gerar caixa",
            "Alterar data de pagamento de fornecedores (Alongamento)",
            "Antecipar recebíveis pontualmente para cobrir rupturas"
        ]
    }
  ];

  const addSuggestion = (text: string) => {
      if (actionPlan.includes(text)) {
          return;
      }
      setActionPlan(prev => prev + `\n\n• ${text}`);
  };

  return (
    <div className="max-w-5xl mx-auto pb-20 font-sans text-slate-900">
      {/* Non-printable controls */}
      <div className="mb-8 flex justify-between items-center bg-white p-6 rounded-xl border border-slate-200 shadow-sm print:hidden">
        <div>
          <h2 className="font-bold text-slate-900 text-lg">Dossiê de Reestruturação</h2>
          <p className="text-slate-500 text-sm">Visualize o layout final abaixo. Clique em Imprimir para gerar o PDF.</p>
        </div>
        <button 
          onClick={handlePrint}
          className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-lg font-bold hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl transform active:scale-95"
        >
          <Printer size={18} />
          Imprimir / Salvar PDF
        </button>
      </div>

      {/* Printable Area - Simulate A4 Paper on Screen */}
      <div id="printable-report" className="bg-white shadow-2xl print:shadow-none max-w-[210mm] mx-auto min-h-[297mm] p-0 print:max-w-none print:mx-0 relative overflow-hidden">
        
        {/* Background Watermark (Discrete) */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.03] z-0 print:opacity-[0.02]">
             <TrendingUp size={600} />
        </div>

        {/* 0. Header Premium (Big 4 Style) */}
        <div className="relative z-10 bg-[#0f172a] text-white px-12 py-10 print:px-8 print:py-6">
          <div className="flex justify-between items-start border-b border-slate-700 pb-6 mb-6">
             <div className="flex items-center gap-3">
                <div className="p-2 bg-teal-600 rounded">
                    <TrendingUp size={24} className="text-white" />
                </div>
                <div>
                    <h1 className="text-xl font-bold tracking-[0.2em] uppercase text-slate-100">Cruz Capital</h1>
                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">Engenharia Financeira & Turnaround</p>
                </div>
             </div>
             <div className="text-right">
                <span className="text-[10px] font-bold bg-slate-800 text-teal-400 px-3 py-1 rounded border border-slate-700 uppercase tracking-widest flex items-center gap-1 justify-end ml-auto w-fit">
                   <ShieldCheck size={10} />
                   Estritamente Confidencial
                </span>
             </div>
          </div>
          
          <div>
            <h2 className="text-3xl font-serif font-bold text-white mb-2 tracking-tight">Relatório de Viabilidade & Plano de Ação</h2>
            <div className="flex justify-between items-end">
                <div>
                    <p className="text-slate-400 text-sm mb-1">Empresa Analisada:</p>
                    <p className="text-xl font-bold text-white">{client.name}</p>
                    <p className="text-xs text-slate-500 font-mono mt-1">{client.cnpj}</p>
                </div>
                <div className="text-right">
                    <p className="text-slate-400 text-sm mb-1">Data de Emissão:</p>
                    <p className="text-lg font-bold text-white">{new Date().toLocaleDateString('pt-BR')}</p>
                </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 px-12 py-8 print:px-8 print:py-6 space-y-10">

            {/* 1. Executive Summary */}
            <section className="print:break-inside-avoid">
            <div className="flex items-center gap-3 mb-4 border-b-2 border-slate-900 pb-2">
                <FileSignature size={22} className="text-slate-900" />
                <h3 className="text-xl font-bold text-slate-900 uppercase tracking-tight">1. Parecer do Especialista</h3>
            </div>
            
            {/* FORCE GRID COLS 3 IN PRINT */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 print:grid print:grid-cols-3">
                {/* Main Text Area - Span 2 */}
                <div className="md:col-span-2 print:col-span-2">
                    <div className="mb-2 flex items-center gap-2 text-slate-500">
                        <Target size={14} />
                        <span className="text-xs font-bold uppercase tracking-wider">Diretrizes Estratégicas</span>
                    </div>
                    
                    {/* Screen Version: Textarea */}
                    <textarea 
                        value={actionPlan}
                        onChange={(e) => setActionPlan(e.target.value)}
                        className="w-full min-h-[450px] p-5 text-sm leading-relaxed text-slate-800 bg-slate-50 border border-slate-200 rounded-sm outline-none focus:ring-1 focus:ring-slate-400 resize-none font-medium print:hidden shadow-inner font-serif"
                        placeholder="Descreva os passos críticos para a recuperação..."
                    />
                    
                    {/* Print Version: Clean Div */}
                    <div className="hidden print:block text-sm leading-7 text-justify text-slate-900 font-serif whitespace-pre-wrap">
                        {actionPlan}
                    </div>
                </div>

                {/* Sidebar Info - Span 1 */}
                <div className="space-y-6 print:col-span-1">
                    <div className="bg-slate-50 p-6 border border-slate-200 print:border-l-4 print:border-t-0 print:border-b-0 print:border-r-0 print:border-slate-300 print:bg-white print:pl-4 print:p-0">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Consultor Responsável</p>
                        
                        <input 
                            type="text" 
                            value={consultantName}
                            onChange={e => setConsultantName(e.target.value)}
                            className="block w-full bg-transparent font-bold text-slate-900 outline-none text-base placeholder:text-slate-400 print:hidden border-b border-slate-300 pb-1 mb-1"
                        />
                        <p className="hidden print:block font-bold text-slate-900 text-base mb-1">{consultantName}</p>
                        
                        <p className="text-xs text-slate-500 uppercase">Consultor Financeiro Sênior</p>
                        <p className="text-xs text-slate-500 mt-0.5">Cruz Capital</p>

                        <div className="mt-6 pt-4 border-t border-slate-200">
                            <p className="text-[10px] text-slate-400 italic leading-snug">
                            "A execução deste plano depende do comprometimento da gestão da empresa com as medidas aqui descritas."
                            </p>
                        </div>
                    </div>

                    <div className="print:hidden border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
                        <div className="bg-slate-100 px-4 py-3 border-b border-slate-200 flex items-center gap-2">
                            <Lightbulb size={16} className="text-amber-600" />
                            <span className="text-xs font-bold text-slate-700 uppercase">Sugestões de Ação</span>
                        </div>
                        
                        <div className="max-h-[300px] overflow-y-auto p-2 space-y-2 scrollbar-thin">
                            {suggestions.map((group) => (
                                <div key={group.label} className="mb-3 last:mb-0">
                                    <p className={`text-[10px] font-bold uppercase mb-1.5 px-2 py-0.5 rounded w-fit ${group.color}`}>{group.label}</p>
                                    <div className="space-y-0.5">
                                        {group.items.map(item => {
                                            const isAdded = actionPlan.includes(item);
                                            return (
                                                <button
                                                    key={item}
                                                    onClick={() => addSuggestion(item)}
                                                    disabled={isAdded}
                                                    className={`w-full text-left text-[11px] p-2 rounded flex items-start gap-2 transition-all ${isAdded ? 'opacity-40 cursor-not-allowed bg-slate-50' : 'hover:bg-blue-50 cursor-pointer text-slate-700'}`}
                                                >
                                                    {isAdded ? <Check size={12} className="mt-0.5 shrink-0 text-emerald-500" /> : <PlusCircle size={12} className="mt-0.5 shrink-0 text-slate-400" />}
                                                    <span className={isAdded ? 'line-through' : ''}>{item}</span>
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            </section>
            
            <div className="print:block h-px bg-slate-200 w-full my-8 print:my-4"></div>

            {/* 2. Diagnosis (Ralos) */}
            <section className="avoid-break print:break-inside-avoid">
                <div className="flex items-center gap-3 mb-6 border-b-2 border-slate-900 pb-2">
                    <span className="text-xl font-bold text-slate-900 uppercase tracking-tight">2. Diagnóstico de Caixa (DFC)</span>
                </div>
                <div className="print:mt-4">
                    <AnalysisView />
                </div>
            </section>

            <div className="print:block h-px bg-slate-200 w-full my-8 print:my-4"></div>

            {/* 3. Debts Structure */}
            <section className="avoid-break print:break-inside-avoid">
                <div className="flex items-center gap-3 mb-6 border-b-2 border-slate-900 pb-2">
                    <span className="text-xl font-bold text-slate-900 uppercase tracking-tight">3. Estrutura de Capital (Dívidas)</span>
                </div>
                <div className="print:mt-4">
                    <DebtsView />
                </div>
            </section>

            <div className="print:page-break"></div>

            {/* 4. Projection & Risk */}
            <section className="avoid-break print:mt-8 print:break-inside-avoid">
                <div className="flex items-center gap-3 mb-6 border-b-2 border-slate-900 pb-2">
                    <span className="text-xl font-bold text-slate-900 uppercase tracking-tight">4. Projeção de Solvência (30 Dias)</span>
                </div>
                <div className="print:mt-4">
                    <ProjectionView />
                </div>
            </section>

        </div>

        {/* Footer for Print */}
        <div className="hidden print:flex fixed bottom-0 left-0 w-full justify-between px-12 pb-6 text-[9px] text-slate-400 border-t border-slate-100 pt-2 bg-white z-20">
           <span>Cruz Capital • Engenharia Financeira</span>
           <span>Documento gerado em {new Date().toLocaleDateString('pt-BR')} • {client.name}</span>
           <span>Confidencial</span>
        </div>

      </div>
    </div>
  );
};