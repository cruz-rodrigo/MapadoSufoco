import React, { useState, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Client, Category, Transaction } from '../../types';
import { useData } from '../../context/DataContext';
import { formatCurrency, INFLOW_CATEGORIES, OUTFLOW_CATEGORIES } from '../../constants';
import { Wand2, AlertTriangle, Check, ArrowDown, ArrowUp, Filter, CheckSquare, Square, Layers } from 'lucide-react';

export const ClassificationView = () => {
  const { client } = useOutletContext<{ client: Client }>();
  const { getTransactionsByClient, updateTransactionCategory, applyAutoClassification, bulkUpdateCategory, updateClientStatus } = useData();
  
  const transactions = getTransactionsByClient(client.id);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filterType, setFilterType] = useState<'ALL' | 'PENDING' | 'DONE'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Filtering Logic
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = 
        filterType === 'ALL' ? true :
        filterType === 'PENDING' ? t.category === Category.UNCATEGORIZED :
        t.category !== Category.UNCATEGORIZED;
      return matchesSearch && matchesType;
    });
  }, [transactions, searchTerm, filterType]);

  // Stats
  const uncategorizedCount = transactions.filter(t => t.category === Category.UNCATEGORIZED).length;
  const progress = Math.round(((transactions.length - uncategorizedCount) / transactions.length) * 100) || 0;

  // Effects
  React.useEffect(() => {
    if (progress === 100 && transactions.length > 0) {
      updateClientStatus(client.id, 'CLASSIFICADO');
    }
  }, [progress, client.id, transactions.length]);

  // Handlers
  const handleAutoClassify = () => {
    applyAutoClassification(client.id);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredTransactions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredTransactions.map(t => t.id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const handleBulkUpdate = (category: string) => {
    if (!category) return;
    bulkUpdateCategory(Array.from(selectedIds), category as Category);
    setSelectedIds(new Set());
  };

  return (
    <div className="flex flex-col h-[calc(100vh-220px)]">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 bg-white p-6 rounded-xl shadow-sm border border-slate-200 gap-4">
        <div className="flex-1">
          <h2 className="text-lg font-bold text-slate-900">Classificação de Lançamentos</h2>
          <div className="flex items-center gap-3 mt-2">
             <div className="w-full max-w-md h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
               <div className="h-full bg-teal-500 transition-all duration-700 ease-out shadow-[0_0_10px_rgba(20,184,166,0.5)]" style={{ width: `${progress}%` }}></div>
             </div>
             <span className="text-sm font-bold text-slate-700">{progress}%</span>
          </div>
        </div>
        
        <div className="flex gap-3">
          {uncategorizedCount > 0 && (
             <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-800 rounded-lg text-sm font-bold border border-amber-100 shadow-sm animate-pulse">
               <AlertTriangle size={16} />
               {uncategorizedCount} Pendentes
             </div>
          )}
          <button 
            onClick={handleAutoClassify}
            className="flex items-center gap-2 px-5 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 text-sm font-bold transition-colors shadow-sm"
          >
            <Wand2 size={16} />
            IA Sugerir
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="p-3 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center gap-4 justify-between">
           <div className="flex items-center gap-2">
              <button 
                onClick={() => setFilterType('ALL')}
                className={`px-3 py-1.5 rounded text-xs font-bold transition-colors ${filterType === 'ALL' ? 'bg-slate-800 text-white' : 'bg-white border border-slate-300 text-slate-600'}`}
              >
                Todos
              </button>
              <button 
                onClick={() => setFilterType('PENDING')}
                className={`px-3 py-1.5 rounded text-xs font-bold transition-colors ${filterType === 'PENDING' ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-white border border-slate-300 text-slate-600'}`}
              >
                Pendentes
              </button>
              <div className="h-6 w-px bg-slate-300 mx-2"></div>
              <input 
                type="text" 
                placeholder="Buscar na descrição..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="px-3 py-1.5 rounded text-xs border border-slate-300 w-48 outline-none focus:border-teal-500"
              />
           </div>

           {selectedIds.size > 0 && (
             <div className="flex items-center gap-2 animate-in slide-in-from-right-5 fade-in">
               <span className="text-xs font-bold text-slate-500">{selectedIds.size} selecionados</span>
               <div className="flex items-center gap-1 bg-white border border-teal-200 rounded-lg px-2 py-1 shadow-sm">
                 <Layers size={14} className="text-teal-600" />
                 <select 
                    className="text-xs font-bold text-teal-700 bg-transparent outline-none cursor-pointer"
                    onChange={(e) => handleBulkUpdate(e.target.value)}
                    value=""
                 >
                   <option value="" disabled>Aplicar em massa...</option>
                   <optgroup label="Saídas">
                     {OUTFLOW_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                   </optgroup>
                   <optgroup label="Entradas">
                     {INFLOW_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                   </optgroup>
                 </select>
               </div>
             </div>
           )}
        </div>
        
        <div className="overflow-auto flex-1 scrollbar-thin scrollbar-thumb-slate-300">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="p-4 w-10 text-center">
                  <button onClick={toggleSelectAll} className="text-slate-400 hover:text-slate-600">
                    {selectedIds.size > 0 && selectedIds.size === filteredTransactions.length ? <CheckSquare size={18} /> : <Square size={18} />}
                  </button>
                </th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-32">Data</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Descrição do Extrato</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right w-32">Valor (R$)</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-64">Categoria Definida</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.map(tx => (
                <TransactionRow 
                  key={tx.id} 
                  transaction={tx} 
                  isSelected={selectedIds.has(tx.id)}
                  onToggle={() => toggleSelectOne(tx.id)}
                  onUpdate={(cat) => updateTransactionCategory(tx.id, cat)} 
                />
              ))}
              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-slate-400">
                    Nenhum lançamento encontrado para os filtros atuais.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const TransactionRow: React.FC<{ 
  transaction: Transaction, 
  isSelected: boolean,
  onToggle: () => void,
  onUpdate: (c: Category) => void 
}> = ({ transaction, isSelected, onToggle, onUpdate }) => {
  const isPending = transaction.category === Category.UNCATEGORIZED;
  const categories = transaction.type === 'IN' ? INFLOW_CATEGORIES : OUTFLOW_CATEGORIES;

  return (
    <tr className={`hover:bg-slate-50 transition-colors group ${isPending ? 'bg-amber-50/30' : ''} ${isSelected ? 'bg-teal-50/50' : ''}`}>
      <td className="p-4 text-center">
         <button onClick={onToggle} className={`${isSelected ? 'text-teal-600' : 'text-slate-300 group-hover:text-slate-400'}`}>
            {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
         </button>
      </td>
      <td className="p-4 text-sm text-slate-600 whitespace-nowrap font-mono">
        {new Date(transaction.date).toLocaleDateString('pt-BR')}
      </td>
      <td className="p-4 text-sm font-medium text-slate-800">
        <div className="flex items-center gap-2">
          {transaction.type === 'IN' ? (
             <div className="p-1 bg-emerald-100 text-emerald-600 rounded"><ArrowUp size={12} /></div>
          ) : (
             <div className="p-1 bg-rose-100 text-rose-600 rounded"><ArrowDown size={12} /></div>
          )}
          {transaction.description}
          {transaction.isAutoCategorized && (
            <span className="text-[10px] px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded border border-indigo-200 font-bold uppercase" title="Categorizado automaticamente">Auto</span>
          )}
        </div>
      </td>
      <td className={`p-4 text-sm text-right font-mono font-bold ${transaction.type === 'IN' ? 'text-emerald-600' : 'text-rose-600'}`}>
        {transaction.type === 'OUT' ? '-' : '+'}{formatCurrency(transaction.value)}
      </td>
      <td className="p-4">
        <select 
          value={transaction.category}
          onChange={(e) => onUpdate(e.target.value as Category)}
          className={`
            w-full text-sm border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500 transition-all cursor-pointer shadow-sm
            ${isPending 
                ? 'border-amber-300 text-amber-800 bg-white font-bold ring-2 ring-amber-100' 
                : 'border-slate-200 text-slate-700 bg-slate-50/50 group-hover:bg-white'}
          `}
        >
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </td>
    </tr>
  );
};