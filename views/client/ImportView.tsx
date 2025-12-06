import React, { useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { Client, Category } from '../../types';
import { UploadCloud, FileSpreadsheet, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { useData } from '../../context/DataContext';

export const ImportView = () => {
  const { client } = useOutletContext<{ client: Client }>();
  const { addTransactions } = useData();
  const navigate = useNavigate();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);

  // Mock processing logic
  const handleFileUpload = () => {
    setIsUploading(true);
    setTimeout(() => {
      // Simulate generated data from file
      const today = new Date();
      const newTxs = Array.from({ length: 15 }).map((_, i) => ({
        id: `imported-${Date.now()}-${i}`,
        clientId: client.id,
        date: new Date(today.setDate(today.getDate() - i)).toISOString().split('T')[0],
        description: i % 2 === 0 ? `COMPRA FORNECEDOR ${i}` : `RECEBIMENTO CLIENTE ${i}`,
        value: Math.floor(Math.random() * 5000) + 100,
        type: i % 2 === 0 ? 'OUT' as const : 'IN' as const,
        category: Category.UNCATEGORIZED
      }));
      
      addTransactions(newTxs);
      setIsUploading(false);
      setUploadComplete(true);
    }, 2000);
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
            <p className="text-slate-500 mb-8 max-w-md mx-auto">Arraste seus arquivos OFX, CSV ou XLS para iniciar o processamento dos dados financeiros.</p>
            
            <div 
              className={`
                border-2 border-dashed rounded-xl p-12 transition-all cursor-pointer group
                ${isUploading ? 'border-teal-500 bg-teal-50' : 'border-slate-300 hover:border-teal-500 hover:bg-slate-50'}
              `} 
              onClick={!isUploading ? handleFileUpload : undefined}
            >
              {isUploading ? (
                <div className="flex flex-col items-center">
                  <RefreshCw className="animate-spin text-teal-600 mb-4" size={32} />
                  <span className="text-lg font-bold text-teal-800">Processando dados...</span>
                  <span className="text-sm text-teal-600 mt-1">Normalizando descrições e identificando datas.</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <FileSpreadsheet className="text-slate-400 group-hover:text-teal-600 transition-colors" size={40} />
                  <div>
                    <span className="text-lg font-bold text-teal-700 block">Clique para selecionar</span>
                    <span className="text-sm text-slate-400">ou solte o arquivo aqui</span>
                  </div>
                </div>
              )}
            </div>
            
            <div className="mt-8 flex items-start gap-3 text-left bg-blue-50 p-4 rounded-lg text-sm text-blue-800 border border-blue-100">
              <AlertCircle size={20} className="mt-0.5 flex-shrink-0 text-blue-600" />
              <div>
                <p className="font-bold mb-1">Dica de Engenharia</p>
                <p className="opacity-90">Para um diagnóstico preciso (Mapa do Sufoco), recomendamos importar pelo menos <span className="font-bold">90 dias</span> de histórico. O sistema tentará categorizar automaticamente baseado em padrões passados.</p>
              </div>
            </div>
          </>
        ) : (
          <div className="py-8 animate-in fade-in zoom-in duration-300">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={40} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Importação Concluída com Sucesso</h2>
            <p className="text-slate-500 mb-8">15 lançamentos foram ingeridos e aguardam classificação.</p>
            
            <div className="flex justify-center gap-4">
              <button 
                onClick={() => setUploadComplete(false)}
                className="px-6 py-3 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
              >
                Importar outro arquivo
              </button>
              <button 
                onClick={() => navigate(`/client/${client.id}/classification`)}
                className="px-8 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 shadow-md font-bold transition-all"
              >
                Iniciar Classificação
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};