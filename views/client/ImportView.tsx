import React, { useState, useRef } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { Client } from '../../types';
import { UploadCloud, FileSpreadsheet, CheckCircle, AlertTriangle, PlayCircle, RefreshCw, Plus, Info } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { parseCsvToTransactions } from '../../utils/financeHelpers';

export const ImportView = () => {
  const { client } = useOutletContext<{ client: Client }>();
  const { addTransactions, loadDemoData } = useData();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [stats, setStats] = useState({ count: 0, from: '', to: '' });
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv') && !file.name.toLowerCase().endsWith('.txt')) {
      setError('Por favor, envie arquivos CSV ou TXT (formato CSV).');
      return;
    }

    setError(null);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const { txs, from, to } = parseCsvToTransactions(text, client.id);
        
        addTransactions(txs);
        
        setStats({ count: txs.length, from, to });
        setIsProcessing(false);
        setUploadComplete(true);

      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Erro ao processar arquivo.');
        setIsProcessing(false);
      }
    };
    reader.onerror = () => {
      setError('Erro crítico de leitura do arquivo.');
      setIsProcessing(false);
    };
    reader.readAsText(file, 'utf-8');
  };

  const handleDemo = () => {
      loadDemoData(); // Load global demo data
      navigate('/'); // Go back to dashboard to see the demo client
  };

  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-10 text-center">
        {!uploadComplete ? (
          <>
            <div className="w-20 h-20 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-100 shadow-inner">
              <UploadCloud size={40} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Importar Extrato Bancário</h2>
            <p className="text-slate-500 mb-8 max-w-md mx-auto">
              Arraste seu arquivo <strong>.CSV</strong> ou <strong>.TXT</strong>.<br/>
              <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded mt-2 inline-block">
                Reconhece: Itaú, Bradesco, Santander, Inter, Nubank (formato CSV)
              </span>
            </p>
            
            {error && (
              <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-lg text-sm flex items-center justify-center gap-2 animate-in fade-in">
                <AlertTriangle size={16} />
                {error}
              </div>
            )}

            <input 
              type="file" 
              accept=".csv,.txt" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleFileChange} 
            />
            
            <div 
              className={`
                border-2 border-dashed rounded-xl p-12 transition-all cursor-pointer group select-none
                ${isProcessing ? 'border-teal-500 bg-teal-50 pointer-events-none' : 'border-slate-300 hover:border-teal-500 hover:bg-slate-50'}
              `} 
              onClick={() => !isProcessing && fileInputRef.current?.click()}
            >
              {isProcessing ? (
                <div className="flex flex-col items-center">
                  <RefreshCw className="animate-spin text-teal-600 mb-4" size={32} />
                  <span className="text-lg font-bold text-teal-800">Processando dados...</span>
                  <span className="text-sm text-teal-600 mt-1">Normalizando formatos e identificando D/C.</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <FileSpreadsheet className="text-slate-400 group-hover:text-teal-600 transition-colors" size={40} />
                  <div>
                    <span className="text-lg font-bold text-teal-700 block">Selecionar Arquivo</span>
                  </div>
                </div>
              )}
            </div>
            
            <div className="mt-8 pt-6 border-t border-slate-100">
               <button 
                  onClick={handleDemo}
                  disabled={isProcessing}
                  className="text-slate-500 text-sm font-bold hover:text-slate-800 flex items-center justify-center gap-2 mx-auto"
                >
                 <PlayCircle size={16} /> Carregar Demo Completa (Novo Cliente)
               </button>
            </div>
          </>
        ) : (
          <div className="py-8 animate-in fade-in zoom-in duration-300">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={40} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Importação Concluída</h2>
            
            <div className="bg-slate-50 rounded-lg p-4 max-w-sm mx-auto mb-8 border border-slate-200">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-slate-500 uppercase">Lançamentos</span>
                    <span className="text-sm font-bold text-slate-900">{stats.count}</span>
                </div>
                <div className="text-xs text-slate-400 mt-2 border-t border-slate-200 pt-2">
                   Período: {new Date(stats.from).toLocaleDateString('pt-BR')} a {new Date(stats.to).toLocaleDateString('pt-BR')}
                </div>
            </div>
            
            <div className="flex justify-center gap-4">
              <button 
                onClick={() => { setUploadComplete(false); setStats({count:0, from:'', to:''}); setError(null); }}
                className="px-6 py-3 text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <Plus size={16} /> Importar outro arquivo
              </button>
              <button 
                onClick={() => navigate(`/client/${client.id}/classification`)}
                className="px-8 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 shadow-md font-bold transition-all"
              >
                Ir para Classificação
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};