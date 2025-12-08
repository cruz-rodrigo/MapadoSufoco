import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Client, Debt, DebtType } from '../../types';
import { useData } from '../../context/DataContext';
import { formatCurrency, formatPercent, formatCurrencyCompact } from '../../constants';
import { Plus, Trash2, Wallet, Percent, Calendar, AlertTriangle } from 'lucide-react';

export const DebtsView = () => {
  const { client } = useOutletContext<{ client: Client }>();
  const { debts, addDebt } = useData();
  const clientDebts = debts.filter(d => d.clientId === client.id);

  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
    setError(null);

    // Validation
    if (!newDebt.balance || newDebt.balance <= 0) {
      setError("O saldo devedor deve ser maior que zero.");
      return;
    }
    if (newDebt.monthlyPayment && newDebt.monthlyPayment < 0) {
        setError("O valor da parcela não pode ser negativo.");
        return;
    }

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
    <div className="space-y-8">
      {/* Summary Cards - Premium Style */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print:grid print:grid-cols-3 print:gap-4">
        <SummaryCard 
            icon={<Wallet size={24} />} 
            label="Passivo Total" 
            value={formatCurrencyCompact(totalDebt)}
            title={formatCurrency(totalDebt)}
        />
        <SummaryCard 
            icon={<Percent size={24} />} 
            label="Custo Médio (a.m.)" 
            value={formatPercent(avgRate)} 
        />
        <SummaryCard 
            icon={<Calendar size={24} />} 
            label="Serviço Mensal (PMT)" 
            value={formatCurrency(totalMonthlyPayment)} 
        />
      </div>

      {/* Action Header */}
      <div className="flex justify-between items-end border-b border-slate-200 pb-4 no-print">
        <div>
            <h2 className="text-xl font-serif font-bold text-slate-900">Estrutura de Capital de Terceiros</h2>
            <p className="text-sm text-slate-500 mt-1">Mapeamento de dívidas bancárias e não-operacionais.</p>
        </div>
        <button 
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-6 py-2.5 bg-[#0f172a] text-white rounded-lg hover:bg-slate-800 text-sm font-bold transition-all shadow-md hover:shadow-lg"
        >
          <Plus size={16} /> ADICIONAR DÍVIDA
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-slate-50 p-8 rounded-2xl border border-slate-200 animate-in fade-in slide-in-from-top-4 shadow-inner">
          <h3 className="text-sm font-bold text-slate-900 mb-6 uppercase tracking-widest border-b border-slate-200 pb-2">Nova Dívida / Passivo</h3>
          
          {error && (
             <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2">
               <AlertTriangle size={16} />
               {error}
             </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="space-y-2">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest">Instituição Financeira</label>
              <input type="text" required className="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 outline-none transition-all font-medium" placeholder="Ex: Banco do Brasil" 
                value={newDebt.institution || ''} onChange={e => setNewDebt({...newDebt, institution: e.target.value})} />
            </div>
            
            <div className="space-y-2">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest">Modalidade</label>
              <div className="relative">
                <select className="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 outline-none bg-white appearance-none cursor-pointer"
                    value={newDebt.type} onChange={e => setNewDebt({...newDebt, type: e.target.value as DebtType})}>
                    <option>Empréstimo</option>
                    <option>FIDC</option>
                    <option>Fornecedor</option>
                    <option>Cartão</option>
                    <option value="Outro">Outro (Especificar)</option>
                </select>
              </div>
            </div>

            {newDebt.type === 'Outro' && (
              <div className="space-y-2 animate-in fade-in">
                <label className="block text-[11px] font-bold text-teal-700 uppercase tracking-widest">Especifique o Tipo</label>
                <input type="text" required className="w-full border border-teal-200 bg-teal-50/30 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none" placeholder="Ex: Refis" 
                  value={newDebt.customType || ''} onChange={e => setNewDebt({...newDebt, customType: e.target.value})} />
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest">Saldo Devedor (R$)</label>
              <input 
                type="number" 
                min="0.01"
                step="0.01"
                required 
                className="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 outline-none font-mono" 
                value={newDebt.balance || ''} 
                onChange={e => setNewDebt({...newDebt, balance: parseFloat(e.target.value)})} 
              />
            </div>
            <div className="space-y-2">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest">Taxa (% a.m.)</label>
              <input type="number" step="0.01" className="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 outline-none font-mono" 
                value={newDebt.monthlyRate || ''} onChange={e => setNewDebt({...newDebt, monthlyRate: parseFloat(e.target.value)})} />
            </div>
            <div className="space-y-2">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest">Parcela Mensal (R$)</label>
              <input 
                type="number" 
                min="0"
                step="0.01"
                className="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 outline-none font-mono" 
                value={newDebt.monthlyPayment || ''} 
                onChange={e => setNewDebt({...newDebt, monthlyPayment: parseFloat(e.target.value)})} 
              />
            </div>
            <div className="space-y-2">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest">Vencimento (Opcional)</label>
              <input type="date" className="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 outline-none" 
                value={newDebt.dueDate || ''} onChange={e => setNewDebt({...newDebt, dueDate: e.target.value})} />
            </div>
          </div>
          <div className="flex justify-end gap-4 pt-6 border-t border-slate-200">
            <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors">CANCELAR</button>
            <button type="submit" className="px-8 py-2.5 text-sm font-bold bg-[#0f172a] text-white rounded-lg hover:bg-slate-800 transition-colors shadow-md">SALVAR</button>
          </div>
        </form>
      )}

      {/* Debt Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left print:text-[10px] print:leading-tight">
          <thead className="bg-slate-50/80 border-b border-slate-200 print:bg-white print:border-slate-300">
            <tr>
              <th className="px-6 py-5 text-[11px] font-bold text-slate-500 uppercase tracking-widest print:px-2 print:py-2">Instituição</th>
              <th className="px-6 py-5 text-[11px] font-bold text-slate-500 uppercase tracking-widest print:px-2 print:py-2">Modalidade</th>
              <th className="px-6 py-5 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-right print:px-2 print:py-2">Saldo Devedor</th>
              <th className="px-6 py-5 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-right print:px-2 print:py-2">Taxa (a.m.)</th>
              <th className="px-6 py-5 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-right print:px-2 print:py-2">Parcela (PMT)</th>
              <th className="px-6 py-5 text-[11px] font-bold text-slate-500 uppercase tracking-widest print:px-2 print:py-2">Vencimento Final</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm print:text-[10px] print:divide-slate-200">
            {clientDebts.map(debt => (
              <tr key={debt.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-bold text-slate-900 print:px-2 print:py-2 print:break-words">{debt.institution}</td>
                <td className="px-6 py-4 text-slate-600 print:px-2 print:py-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200 print:bg-transparent print:p-0 print:border-0 print:text-[10px]">
                    {debt.type}
                  </span>
                </td>
                <td className="px-6 py-4 text-right font-serif font-bold text-slate-900 text-base print:px-2 print:py-2 print:text-[10px]">{formatCurrency(debt.balance)}</td>
                <td className="px-6 py-4 text-right font-mono text-slate-500 print:px-2 print:py-2">{debt.monthlyRate.toFixed(2)}%</td>
                <td className="px-6 py-4 text-right font-serif text-slate-700 print:px-2 print:py-2">{formatCurrency(debt.monthlyPayment || 0)}</td>
                <td className="px-6 py-4 text-slate-400 font-mono text-xs print:px-2 print:py-2">{debt.dueDate ? new Date(debt.dueDate).toLocaleDateString('pt-BR') : '---'}</td>
              </tr>
            ))}
            {clientDebts.length === 0 && (
              <tr>
                <td colSpan={6} className="p-12 text-center text-slate-400 italic">Nenhuma dívida cadastrada para este cliente.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const SummaryCard = ({ icon, label, value, title }: any) => (
    <div className="bg-white p-6 rounded-xl shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] border border-slate-100 flex items-center gap-5 print:border print:border-slate-300 print:shadow-none print:p-3 print:gap-3">
        <div className="p-3 bg-slate-50 text-slate-600 rounded-lg border border-slate-100 print:p-1">{icon}</div>
        <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-2xl font-serif font-bold text-slate-900 print:text-base" title={title}>{value}</p>
        </div>
    </div>
);