import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { Client } from '../../types';
import { AnalysisView } from './AnalysisView';
import { ProjectionView } from './ProjectionView';
import { Printer, TrendingUp, Building2, CalendarDays } from 'lucide-react';
import { DebtsView } from './DebtsView';

export const ReportView = () => {
  const { client } = useOutletContext<{ client: Client }>();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-5xl mx-auto pb-20">
      {/* Non-printable controls */}
      <div className="mb-8 flex justify-between items-center bg-white p-6 rounded-xl border border-slate-200 shadow-sm print:hidden">
        <div>
          <h2 className="font-bold text-slate-900 text-lg">Relatório Executivo (A4)</h2>
          <p className="text-slate-500 text-sm mt-1">Diagramação otimizada para impressão.</p>
        </div>
        <button 
          onClick={handlePrint}
          className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 shadow-lg transition-all"
        >
          <Printer size={20} />
          Imprimir / Salvar PDF
        </button>
      </div>

      {/* Printable Area - Optimized for A4 Portrait */}
      <div className="bg-white p-12 shadow-sm print:shadow-none print:p-0 space-y-8 max-w-[210mm] mx-auto min-h-[297mm] relative" id="printable-report">
        
        {/* Report Header */}
        <header className="border-b-4 border-slate-900 pb-6 mb-8 print:mb-4 print:pb-4">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
               <div className="w-14 h-14 bg-slate-900 text-white flex items-center justify-center rounded-lg shadow-sm print:shadow-none">
                  <TrendingUp size={28} />
               </div>
               <div>
                  <h1 className="text-2xl font-bold text-slate-900 uppercase tracking-tight leading-none">Diagnóstico Financeiro</h1>
                  <p className="text-slate-500 font-medium text-sm mt-1">Engenharia de Lucratividade • Cruz Capital</p>
               </div>
            </div>
            <div className="text-right">
              <h2 className="text-xl font-bold text-slate-900 leading-tight">{client.name}</h2>
              <div className="flex items-center justify-end gap-2 text-slate-500 text-xs mt-1 font-mono">
                <span>{client.sector}</span>
                <span>•</span>
                <span>{new Date().toLocaleDateString('pt-BR')}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Section 1: Executive Analysis */}
        <section className="avoid-break">
          <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-2">
             <span className="flex items-center justify-center w-6 h-6 rounded bg-slate-900 text-white font-bold text-xs print:bg-slate-900 print:text-white">1</span>
             <h2 className="text-lg font-bold text-slate-900 uppercase tracking-tight">Análise de Caixa & Ralos</h2>
          </div>
          {/* Container for Analysis View - Removed background for cleaner print */}
          <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 print:bg-transparent print:border-none print:p-0">
             <AnalysisView />
          </div>
        </section>

        {/* Section 2: Debts */}
        <section className="mt-6 avoid-break">
          <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-2">
             <span className="flex items-center justify-center w-6 h-6 rounded bg-slate-900 text-white font-bold text-xs print:bg-slate-900 print:text-white">2</span>
             <h2 className="text-lg font-bold text-slate-900 uppercase tracking-tight">Estrutura de Dívida</h2>
          </div>
          <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 print:bg-transparent print:border-none print:p-0">
            <DebtsView />
          </div>
        </section>

        <div className="page-break"></div>

        {/* Section 3: Risk Projection (New Page) */}
        <section className="mt-8 avoid-break">
           <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-2">
             <span className="flex items-center justify-center w-6 h-6 rounded bg-slate-900 text-white font-bold text-xs print:bg-slate-900 print:text-white">3</span>
             <h2 className="text-lg font-bold text-slate-900 uppercase tracking-tight">Risco & Projeção (30 Dias)</h2>
          </div>
          <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 print:bg-transparent print:border-none print:p-0">
            <ProjectionView />
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t border-slate-200 text-center">
          <p className="text-[10px] text-slate-400 font-mono uppercase tracking-widest mb-1">
            Relatório gerado automaticamente pelo sistema Mapa do Sufoco
          </p>
          <p className="text-[10px] text-slate-300 font-mono">
             Confidencial • {client.name} • {new Date().getFullYear()}
          </p>
        </footer>
      </div>
    </div>
  );
};