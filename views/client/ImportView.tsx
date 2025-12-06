import React, { useState, useRef } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { Client, Category, Transaction, TransactionType } from '../../types';
import { UploadCloud, FileSpreadsheet, CheckCircle, AlertCircle, RefreshCw, AlertTriangle, PlayCircle } from 'lucide-react';
import { useData } from '../../context/DataContext';

export const ImportView = () => {
  const { client } = useOutletContext<{ client: Client }>();
  const { addTransactions, updateClientStatus } = useData();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [stats, setStats] = useState({ count: 0, minDate: '', maxDate: '' });
  const [error, setError] = useState<string | null>(null);

  const handleMockData = () => {
    setIsProcessing(true);
    setTimeout(() => {
      // Logic from legacy mock
      const today = new Date();
      const newTxs = Array.from({ length: 30 }).map((_, i) => ({
        id: `mock-${Date.now()}-${i}`,
        clientId: client.id,
        date: new Date(today.getTime() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        description: i % 2 === 0 ? `COMPRA FORNECEDOR ${i}` : `RECEBIMENTO CLIENTE ${i}`,
        value: Math.floor(Math.random() * 5000) + 100,
        type: i % 2 === 0 ? 'OUT' as const : 'IN' as const,
        category: Category.UNCATEGORIZED
      }));
      
      addTransactions(newTxs);
      updateClientStatus(client.id, 'IMPORTADO');
      finishProcess(newTxs);
    }, 1000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setError('Por favor, envie apenas arquivos CSV.');
      return;
    }

    setError(null);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const transactions = parseCSV(text, client.id);
        
        if (transactions.length === 0) {
          throw new Error('Nenhuma transação válida encontrada ou cabeçalho incorreto.');
        }

        addTransactions(transactions);
        updateClientStatus(client.id, 'IMPORTADO');
        finishProcess(transactions);

      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Erro ao processar arquivo.');
        setIsProcessing(false);
      }
    };
    reader.onerror = () => {
      setError('Erro ao ler o arquivo.');
      setIsProcessing(false);
    };
    reader.readAsText(file);
  };

  const parseCSV = (csvText: string, clientId: string): Transaction[] => {
    const lines = csvText.split(/\r?\n/);
    const result: Transaction[] = [];
    
    // Find header line
    const headerIndex = lines.findIndex(l => {
      const lower = l.toLowerCase();
      return lower.includes('date') && lower.includes('description') && lower.includes('value');
    });

    if (headerIndex === -1) {
      throw new Error('Formato inválido. Cabeçalho obrigatório: date;description;type;value');
    }

    const separator = lines[headerIndex].includes(';') ? ';' : ',';

    for (let i = headerIndex + 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const cols = line.split(separator);
      // Basic safeguard for columns length
      if (cols.length < 3) continue;

      // Extract based on position assuming date, description, type, value order or similar
      // Better implementation would map header names to indices. 
      // For v1, let's assume standard layout: date;description;type;value
      
      let [dateRaw, desc, typeRaw, valRaw] = cols;
      
      // Clean up quotes
      dateRaw = dateRaw?.replace(/"/g, '').trim();
      desc = desc?.replace(/"/g, '').trim();
      typeRaw = typeRaw?.replace(/"/g, '').trim();
      valRaw = valRaw?.replace(/"/g, '').trim();

      if (!dateRaw || !valRaw) continue;

      // Date Parsing (handle DD/MM/YYYY or YYYY-MM-DD)
      let isoDate = '';
      if (dateRaw.includes('/')) {
        const [d, m, y] = dateRaw.split('/');
        isoDate = `${y}-${m}-${d}`; // Simple reformat to ISO
      } else {
        isoDate = dateRaw; // Assume ISO
      }

      // Value Parsing
      // Handle "1.000,00" or "1000.00"
      let value = 0;
      let cleanVal = valRaw.replace(/[R$\s]/g, '');
      if (cleanVal.includes(',') && cleanVal.includes('.')) {
         // Brazilian format 1.000,00 -> remove dot, replace comma with dot
         cleanVal = cleanVal.replace(/\./g, '').replace(',', '.');
      } else if (cleanVal.includes(',')) {
         cleanVal = cleanVal.replace(',', '.');
      }
      value = parseFloat(cleanVal);
      
      if (isNaN(value)) continue;

      // Type Inference
      let type: TransactionType = 'OUT';
      if (typeRaw) {
        if (typeRaw.toUpperCase() === 'IN' || typeRaw.toUpperCase() === 'ENTRADA') type = 'IN';
        else if (typeRaw.toUpperCase() === 'OUT' || typeRaw.toUpperCase() === 'SAIDA') type = 'OUT';
      } else {
        // Infer from sign
        type = value >= 0 ? 'IN' : 'OUT';
      }

      // Ensure magnitude is positive
      value = Math.abs(value);

      result.push({
        id: `csv-${Date.now()}-${i}`,
        clientId,
        date: isoDate,
        description: desc || 'Sem descrição',
        type,
        value,
        category: Category.UNCATEGORIZED,
        isAutoCategorized: false
      });
    }

    return result;
  };

  const finishProcess = (txs: Transaction[]) => {
    // Calc stats
    const dates = txs.map(t => t.date).sort();
    setStats({
      count: txs.length,
      minDate: dates[0] || '-',
      maxDate: dates[dates.length - 1] || '-'
    });
    setIsProcessing(false);
    setUploadComplete(true);
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
              Arraste seu arquivo CSV ou clique para selecionar. <br/>
              <span className="text-xs text-slate-400">Formato esperado: date; description; type; value</span>
            </p>
            
            {error && (
              <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-lg text-sm flex items-center justify-center gap-2">
                <AlertTriangle size={16} />
                {error}
              </div>
            )}

            <input 
              type="file" 
              accept=".csv" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleFileChange} 
            />
            
            <div 
              className={`
                border-2 border-dashed rounded-xl p-12 transition-all cursor-pointer group
                ${isProcessing ? 'border-teal-500 bg-teal-50 pointer-events-none' : 'border-slate-300 hover:border-teal-500 hover:bg-slate-50'}
              `} 
              onClick={() => !isProcessing && fileInputRef.current?.click()}
            >
              {isProcessing ? (
                <div className="flex flex-col items-center">
                  <RefreshCw className="animate-spin text-teal-600 mb-4" size={32} />
                  <span className="text-lg font-bold text-teal-800">Processando dados...</span>
                  <span className="text-sm text-teal-600 mt-1">Normalizando CSV e identificando datas.</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <FileSpreadsheet className="text-slate-400 group-hover:text-teal-600 transition-colors" size={40} />
                  <div>
                    <span className="text-lg font-bold text-teal-700 block">Clique para selecionar CSV</span>
                    <span className="text-sm text-slate-400">ou use dados de exemplo abaixo</span>
                  </div>
                </div>
              )}
            </div>
            
            <div className="mt-8 pt-6 border-t border-slate-100">
               <button 
                  onClick={handleMockData}
                  disabled={isProcessing}
                  className="text-slate-500 text-sm font-bold hover:text-slate-800 flex items-center justify-center gap-2 mx-auto"
                >
                 <PlayCircle size={16} /> Usar dados de exemplo (Demo)
               </button>
            </div>
          </>
        ) : (
          <div className="py-8 animate-in fade-in zoom-in duration-300">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={40} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Importação Concluída</h2>
            <div className="text-slate-500 mb-8 space-y-1">
              <p>{stats.count} lançamentos foram ingeridos.</p>
              <p className="text-xs font-mono bg-slate-100 inline-block px-2 py-1 rounded">Período: {new Date(stats.minDate).toLocaleDateString('pt-BR')} até {new Date(stats.maxDate).toLocaleDateString('pt-BR')}</p>
            </div>
            
            <div className="flex justify-center gap-4">
              <button 
                onClick={() => { setUploadComplete(false); setStats({count:0, minDate:'', maxDate:''}); }}
                className="px-6 py-3 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
              >
                Importar outro
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