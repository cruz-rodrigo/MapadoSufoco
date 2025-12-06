import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Client, Debt, DebtType } from '../../types';
import { useData } from '../../context/DataContext';
import { formatCurrency, formatPercent } from '../../constants';
import { Plus, Trash2, Landmark, Wallet, Percent, Calendar } from 'lucide-react';

export const DebtsView = () => {
  const { client } = useOutletContext<{ client: Client }>();
  const { debts, addDebt } = useData();
  const clientDebts = debts.filter(d => d.clientId === client.id);

  const [showForm, setShowForm] = useState(false);
  const [newDebt, setNewDebt] = useState<Partial<Debt> & { customType?: string }>({ 
    type: 'Empréstimo', 
    balance: 0, 
    monthlyRate: 0, 
    monthlyPayment: 0,
    customType: ''
  });

  const totalDebt = clientDebts.reduce((acc, curr) => acc + curr.balance, 0);
  const totalMonthlyPayment = clientDebts.reduce((acc, curr) => acc + (curr.monthlyPayment || 0), 0);
  
  // Weighted Average Cost of Debt
  const avgRate = totalDebt > 0 
    ? clientDebts.reduce((acc, curr) => acc + (curr.balance * curr.monthlyRate), 0) / totalDebt
    : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newDebt.institution && newDebt.balance) {
      // Logic for "Other" type
      const finalType = newDebt.type === 'Outro' ? (newDebt.customType || 'Outro') : newDebt.type;

      addDebt({
        id: Date.now().toString(),
        clientId: client.id,
        institution: newDebt.institution,
        type: finalType as DebtType,
        balance: Number(newDebt.balance),
        monthlyRate: Number(newDebt.monthlyRate),
        monthlyPayment: Number(newDebt.monthlyPayment),
        dueDate: newDebt.dueDate
      });
      setShowForm(false);
      setNewDebt({ type: 'Empréstimo', balance: 0, monthlyRate: 0, monthlyPayment: 0, customType: '' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards - Force Grid in Print */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:grid print:grid-cols-3 print:gap-4">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4 print:border print:border-slate-300 print:shadow-none print:p-3">
          <div className="p-3 bg-slate-100 text-slate-700 rounded-lg border border-slate-200"><Wallet size={24} /></div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Passivo Total</p>
            <p className="text-xl font-bold text-slate-900 print:text-lg">{formatCurrency(totalDebt)}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4 print:border print:border-slate-300 print:shadow-none print:p-3">
          <div className="p-3 bg-slate-100 text-slate-700 rounded-lg border border-slate-200"><Percent size={24} /></div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Custo Médio (a.m.)</p>
            <p className="text-xl font-bold text-slate-900 print:text-lg">{formatPercent(avgRate)}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4 print:border print:border-slate-300 print:shadow-none print:p-3">
          <div className="p-3 bg-slate-100 text-slate-700 rounded-lg border border-slate-200"><Calendar size={24} /></div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Serviço da Dívida (PMT)</p>
            <p className="text-xl font-bold text-slate-900 print:text-lg">{formatCurrency(totalMonthlyPayment)}</p>
          </div>
        </div>
      </div>

      {/* Action Header */}
      <div className="flex justify-between items-center no-print">
        <h2 className="text-lg font-bold text-slate-900">Estrutura de Capital de Terceiros</h2>
        <button 
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 text-sm font-bold transition-all shadow-sm"
        >
          <Plus size={16} /> Adicionar Dívida
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-slate-50 p-6 rounded-xl border border-slate-200 animate-in fade-in slide-in-from-top-4 shadow-inner">
          <h3 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider">Nova Dívida / Passivo</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 uppercase">Instituição</label>
              <input type="text" required className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-slate-400 outline-none" placeholder="Ex: Banco do Brasil" 
                value={newDebt.institution || ''} onChange={e => setNewDebt({...newDebt, institution: e.target.value})} />
            </div>
            
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 uppercase">Tipo</label>
              <select className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-slate-400 outline-none bg-white"
                value={newDebt.type} onChange={e => setNewDebt({...newDebt, type: e.target.value as DebtType})}>
                <option>Empréstimo</option>
                <option>FIDC</option>
                <option>Fornecedor</option>
                <option>Cartão</option>
                <option value="Outro">Outro (Especificar)</option>
              </select>
            </div>

            {newDebt.type === 'Outro' && (
              <div className="space-y-1.5 animate-in fade-in">
                <label className="block text-xs font-bold text-teal-600 uppercase">Especifique o Tipo</label>
                <input type="text" required className="w-full border border-teal-200 bg-teal-50/50 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-400 outline-none" placeholder="Ex: Refis" 
                  value={newDebt.customType || ''} onChange={e => setNewDebt({...newDebt, customType: e.target.value})} />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 uppercase">Saldo Devedor (R$)</label>
              <input type="number" required className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-slate-400 outline-none" 
                value={newDebt.balance || ''} onChange={e => setNewDebt({...newDebt, balance: parseFloat(e.target.value)})} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 uppercase">Taxa (% a.m.)</label>
              <input type="number" step="0.01" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-slate-400 outline-none" 
                value={newDebt.monthlyRate || ''} onChange={e => setNewDebt({...newDebt, monthlyRate: parseFloat(e.target.value)})} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 uppercase">Parcela Mensal (R$)</label>
              <input type="number" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-slate-400 outline-none" 
                value={newDebt.monthlyPayment || ''} onChange={e => setNewDebt({...newDebt, monthlyPayment: parseFloat(e.target.value)})} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 uppercase">Vencimento (Opcional)</label>
              <input type="date" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-slate-400 outline-none" 
                value={newDebt.dueDate || ''} onChange={e => setNewDebt({...newDebt, dueDate: e.target.value})} />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">Cancelar</button>
            <button type="submit" className="px-6 py-2 text-sm font-bold bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors shadow-sm">Salvar Dívida</button>
          </div>
        </form>
      )}

      {/* Debt Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left print:text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 print:bg-white print:border-slate-300">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider print:px-2 print:py-2">Instituição</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider print:px-2 print:py-2">Tipo</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right print:px-2 print:py-2">Saldo</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right print:px-2 print:py-2">Taxa</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right print:px-2 print:py-2">Parcela</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider print:px-2 print:py-2">Vencimento</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm print:text-xs print:divide-slate-200">
            {clientDebts.map(debt => (
              <tr key={debt.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-bold text-slate-900 print:px-2 print:py-2">{debt.institution}</td>
                <td className="px-6 py-4 text-slate-600 print:px-2 print:py-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 print:bg-transparent print:p-0 print:border-0">
                    {debt.type}
                  </span>
                </td>
                <td className="px-6 py-4 text-right font-mono font-bold text-slate-700 print:px-2 print:py-2">{formatCurrency(debt.balance)}</td>
                <td className="px-6 py-4 text-right font-mono text-slate-500 print:px-2 print:py-2">{debt.monthlyRate.toFixed(2)}%</td>
                <td className="px-6 py-4 text-right font-mono text-slate-600 print:px-2 print:py-2">{formatCurrency(debt.monthlyPayment || 0)}</td>
                <td className="px-6 py-4 text-slate-500 print:px-2 print:py-2">{debt.dueDate ? new Date(debt.dueDate).toLocaleDateString('pt-BR') : '-'}</td>
              </tr>
            ))}
            {clientDebts.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-400 italic">Nenhuma dívida cadastrada.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};