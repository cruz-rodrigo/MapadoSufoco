import React, { useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Client, Category, Transaction } from '../../types';
import { useData } from '../../context/DataContext';
import { formatCurrency, INFLOW_CATEGORIES, OUTFLOW_CATEGORIES } from '../../constants';
import { Wand2, AlertTriangle, Check, ArrowDown, ArrowUp, Filter } from 'lucide-react';

export const ClassificationView = () => {
  const { client } = useOutletContext<{ client: Client }>();
  const { getTransactionsByClient, updateTransactionCategory, applyAutoClassification } = useData();
  
  const transactions = getTransactionsByClient(client.id);

  // Stats
  const uncategorizedCount = transactions.filter(t => t.category === Category.UNCATEGORIZED).length;
  const progress = Math.round(((transactions.length - uncategorizedCount) / transactions.length) * 100) || 0;

  const handleAutoClassify = () => {
    applyAutoClassification(client.id);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-220px)]">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 bg-white p-6 rounded-xl shadow-sm border border-slate-200 gap-4">
        <div className="flex-1">
          <h2 className="text-lg font-bold text-slate-900">Classificação de Lançamentos</h2>
          <p className="text-sm text-slate-500 mb-4">Categorize as entradas e saídas para gerar o mapa.</p>
          
          <div className="flex items-center gap-3">
             <div className="w-full max-w-md h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
               <div className="h-full bg-teal-500 transition-all duration-700 ease-out shadow-[0_0_10px_rgba(20,184,166,0.5)]" style={{ width: `${progress}%` }}></div>
             </div>
             <span className="text-sm font-bold text-slate-700">{progress}%</span>
          </div>
        </div>
        
        <div className="flex gap-3">
          {uncategorizedCount > 0 && (
             <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-800 rounded-lg text-sm font-bold border border-amber-100 shadow-sm">
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

      {/* Table */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        {/* Filters */}
        <div className="p-3 border-b border-slate-200 bg-slate-50 flex gap-2">
            <button className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-300 rounded text-xs font-medium text-slate-600 hover:text-slate-900">
                <Filter size={12} /> Data: Todos
            </button>
            <button className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-300 rounded text-xs font-medium text-slate-600 hover:text-slate-900">
                Tipo: Todos
            </button>
        </div>
        
        <div className="overflow-auto flex-1 scrollbar-thin scrollbar-thumb-slate-300">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-32">Data</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Descrição do Extrato</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right w-32">Valor (R$)</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-64">Categoria Definida</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.map(tx => (
                <TransactionRow 
                  key={tx.id} 
                  transaction={tx} 
                  onUpdate={(cat) => updateTransactionCategory(tx.id, cat)} 
                />
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-slate-400">
                    Nenhum lançamento encontrado. Importe um extrato primeiro.
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

const TransactionRow: React.FC<{ transaction: Transaction, onUpdate: (c: Category) => void }> = ({ transaction, onUpdate }) => {
  const isPending = transaction.category === Category.UNCATEGORIZED;
  const categories = transaction.type === 'IN' ? INFLOW_CATEGORIES : OUTFLOW_CATEGORIES;

  return (
    <tr className={`hover:bg-slate-50 transition-colors group ${isPending ? 'bg-amber-50/40' : ''}`}>
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
                ? 'border-amber-300 text-amber-800 bg-white font-bold' 
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