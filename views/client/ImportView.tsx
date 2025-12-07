import React, { useState, useRef } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { Client, Category, Transaction, TransactionType } from '../../types';
import { UploadCloud, FileSpreadsheet, CheckCircle, AlertTriangle, PlayCircle, RefreshCw, Info, Plus } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { formatCurrency } from '../../constants';

export const ImportView = () => {
  const { client } = useOutletContext<{ client: Client }>();
  const { addTransactions } = useData();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [stats, setStats] = useState({ count: 0, minDate: '', maxDate: '', totalIn: 0, totalOut: 0 });
  const [error, setError] = useState<string | null>(null);

  // Helper: Mock Data
  const handleMockData = () => {
    setIsProcessing(true);
    setTimeout(() => {
      const today = new Date();
      const newTxs = Array.from({ length: 45 }).map((_, i) => ({
        id: `mock-${Date.now()}-${i}`,
        clientId: client.id,
        date: new Date(today.getTime() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        description: i % 3 === 0 ? `PAGAMENTO FORNECEDOR ${i}` : `RECEBIMENTO CLIENTE ${i}`,
        value: Math.floor(Math.random() * 5000) + 100,
        type: i % 3 === 0 ? 'OUT' as const : 'IN' as const,
        category: Category.UNCATEGORIZED
      }));
      
      addTransactions(newTxs);
      finishProcess(newTxs);
    }, 800);
  };

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
        const transactions = parseCSV(text, client.id);
        
        if (transactions.length === 0) {
          throw new Error('Nenhuma transação válida identificada. Verifique o layout (Data; Descrição; Valor).');
        }

        addTransactions(transactions);
        finishProcess(transactions);

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
    reader.readAsText(file, 'utf-8'); // Main encoding for Brazil usually works with utf-8 or windows-1252. Ideally detect.
  };

  // --- Robust CSV Parser Engine ---
  const parseCSV = (csvText: string, clientId: string): Transaction[] => {
    const lines = csvText.split(/\r?\n/).filter(l => l.trim().length > 0);
    if (lines.length < 2) throw new Error('O arquivo parece vazio ou tem apenas o cabeçalho.');

    // 1. Detect Delimiter (semicolon or comma) based on first valid lines
    const firstLine = lines[0];
    const semicolonCount = (firstLine.match(/;/g) || []).length;
    const commaCount = (firstLine.match(/,/g) || []).length;
    const separator = semicolonCount >= commaCount ? ';' : ',';

    // 2. Identify Headers Dynamically
    const headers = firstLine.split(separator).map(h => 
        h.trim().toLowerCase()
         .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove accents for detection
    );

    const map = {
        date: headers.findIndex(h => h.includes('data') || h.includes('date') || h.includes('dt')),
        desc: headers.findIndex(h => h.includes('desc') || h.includes('hist') || h.includes('memo') || h.includes('lanç') || h.includes('lanc')),
        val: headers.findIndex(h => h.includes('valor') || h.includes('value') || h.includes('amount') || h.includes('saldo') === false), // Exclude 'saldo' column if ambiguous
        type: headers.findIndex(h => h.includes('tipo') || h.includes('type') || h.includes('d/c') || h.includes('op')),
    };

    if (map.date === -1 || map.desc === -1 || map.val === -1) {
        throw new Error(`Colunas obrigatórias não encontradas. Detectado: ${headers.join(', ')}. Necessário: Data, Descrição e Valor.`);
    }

    const result: Transaction[] = [];

    // 3. Process Rows
    // Start from index 1 (assuming 0 is header). 
    // If header detection failed to find specific keywords but structure looks like data, we might need heuristic, but let's stick to header mapping for safety.
    
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;

        // Handle quotes if CSV is complex (basic split for now, robust enough for standard bank exports)
        const cols = line.split(separator).map(c => c.trim().replace(/^"|"$/g, ''));

        // Skip malformed lines
        if (cols.length <= Math.max(map.date, map.desc, map.val)) continue;

        const rawDate = cols[map.date];
        const desc = cols[map.desc];
        const rawVal = cols[map.val];
        const rawType = map.type !== -1 ? cols[map.type] : '';

        if (!rawDate || !desc || !rawVal) continue;

        // A. Parse Date
        let isoDate = '';
        if (rawDate.match(/^\d{2}\/\d{2}\/\d{4}/)) { // DD/MM/YYYY
            const [d, m, y] = rawDate.split('/');
            isoDate = `${y}-${m}-${d}`;
        } else if (rawDate.match(/^\d{4}-\d{2}-\d{2}/)) { // YYYY-MM-DD
            isoDate = rawDate;
        } else {
            continue; // Skip invalid dates
        }

        // B. Parse Value (Handle BRL 1.000,00 vs US 1,000.00)
        let cleanVal = rawVal.replace(/[R$\s]/g, '');
        // Heuristic: if comma exists and is after the last dot (or no dot), assume comma is decimal
        // Most Brazilian bank exports use 1.000,00 or 1000,00
        const lastComma = cleanVal.lastIndexOf(',');
        const lastDot = cleanVal.lastIndexOf('.');

        if (lastComma > lastDot) {
            // It's likely BRL: remove dots (thousands), replace comma with dot
            cleanVal = cleanVal.replace(/\./g, '').replace(',', '.');
        } else {
            // It's likely US: remove commas
            cleanVal = cleanVal.replace(/,/g, '');
        }

        let value = parseFloat(cleanVal);
        if (isNaN(value)) continue;

        // C. Determine Type (IN vs OUT)
        // Logic:
        // 1. If explicit Type column exists, use it (checking aliases).
        // 2. If no Type column, use the sign of the value.
        
        let type: TransactionType = 'OUT'; // Default unsafe
        let isExplicitType = false;

        if (rawType) {
            const normalizedType = rawType.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // DEBITO, CREDITO
            
            if (['C', 'CR', 'CREDITO', 'CRED', 'ENTRADA', 'RECEBIMENTO', 'DEP'].some(k => normalizedType.includes(k))) {
                type = 'IN';
                isExplicitType = true;
            } else if (['D', 'DB', 'DEBITO', 'DEB', 'SAIDA', 'PAGAMENTO', 'RET'].some(k => normalizedType.includes(k))) {
                type = 'OUT';
                isExplicitType = true;
            }
        }

        if (!isExplicitType) {
            // Fallback to value sign
            if (value < 0) {
                type = 'OUT';
            } else {
                // Warning: Some banks export "Payment 100.00". Without type col, this defaults to IN. 
                // But usually without type col, outflows are negative.
                type = 'IN'; 
            }
        }

        // D. Finalize
        result.push({
            id: `csv-${Date.now()}-${i}`,
            clientId,
            date: isoDate,
            description: desc,
            type: type,
            value: Math.abs(value), // Always store positive magnitude
            category: Category.UNCATEGORIZED,
            isAutoCategorized: false
        });
    }

    return result;
  };

  const finishProcess = (txs: Transaction[]) => {
    // Stats for UI
    const dates = txs.map(t => t.date).sort();
    const totalIn = txs.filter(t => t.type === 'IN').reduce((acc, t) => acc + t.value, 0);
    const totalOut = txs.filter(t => t.type === 'OUT').reduce((acc, t) => acc + t.value, 0);

    setStats({
      count: txs.length,
      minDate: dates[0] || '-',
      maxDate: dates[dates.length - 1] || '-',
      totalIn,
      totalOut
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
              Arraste seu arquivo <strong>.CSV</strong> ou <strong>.TXT</strong>.<br/>
              <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded mt-2 inline-block">
                Colunas detectadas automaticamente: Data, Descrição, Valor, (Tipo)
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
                    <span className="text-sm text-slate-400">Suporte a Itaú, Bradesco, Santander, Inter, etc.</span>
                  </div>
                </div>
              )}
            </div>
            
            <div className="mt-8 pt-6 border-t border-slate-100">
               <p className="text-xs text-slate-400 mb-4">
                 Dica: Você pode importar múltiplos arquivos para um mesmo cliente (ex: extratos de bancos diferentes). Os dados serão unificados.
               </p>
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
            
            <div className="bg-slate-50 rounded-lg p-4 max-w-sm mx-auto mb-8 border border-slate-200">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-slate-500 uppercase">Lançamentos</span>
                    <span className="text-sm font-bold text-slate-900">{stats.count}</span>
                </div>
                <div className="flex justify-between items-center mb-2 text-emerald-700">
                    <span className="text-xs font-bold uppercase">Total Entradas</span>
                    <span className="text-sm font-bold">{formatCurrency(stats.totalIn)}</span>
                </div>
                <div className="flex justify-between items-center text-rose-700">
                    <span className="text-xs font-bold uppercase">Total Saídas</span>
                    <span className="text-sm font-bold">{formatCurrency(stats.totalOut)}</span>
                </div>
            </div>
            
            <div className="text-xs text-slate-400 mb-8">
               Período: {new Date(stats.minDate).toLocaleDateString('pt-BR')} a {new Date(stats.maxDate).toLocaleDateString('pt-BR')}
            </div>

            {stats.totalOut === 0 && (
                <div className="bg-amber-50 text-amber-800 p-3 rounded text-sm mb-6 flex items-start gap-2 text-left">
                    <Info className="shrink-0 mt-0.5" size={16} />
                    <p>Atenção: Nenhuma saída foi identificada. Verifique se o CSV possui coluna de "Tipo" (D/C) ou valores negativos.</p>
                </div>
            )}
            
            <div className="flex justify-center gap-4">
              <button 
                onClick={() => { setUploadComplete(false); setStats({count:0, minDate:'', maxDate:'', totalIn:0, totalOut:0}); setError(null); }}
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