import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { Plus, Search, Building2, ChevronRight, AlertOctagon, X, BadgeCheck, ArrowUpRight, PlayCircle, Trash2 } from 'lucide-react';
import { Client, ClientStatus, ClientDocumentType, RiskLevel } from '../types';

const statusLabel: Record<ClientStatus, string> = {
  SEM_DADOS: 'Novo Cadastro',
  IMPORTADO: 'Dados Importados',
  CLASSIFICADO: 'Classificado',
  DIVIDAS_PREENCHIDAS: 'Dívidas Mapeadas',
  PROJECAO_CONCLUIDA: 'Diagnóstico Pronto',
};

const statusClass: Record<ClientStatus, string> = {
  SEM_DADOS: 'bg-slate-100 text-slate-600 border-slate-200',
  IMPORTADO: 'bg-blue-50 text-blue-700 border-blue-200',
  CLASSIFICADO: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  DIVIDAS_PREENCHIDAS: 'bg-amber-50 text-amber-700 border-amber-200',
  PROJECAO_CONCLUIDA: 'bg-teal-50 text-teal-800 border-teal-200',
};

const riskLabel: Record<RiskLevel, string> = {
  LOW: 'Baixo Risco',
  MEDIUM: 'Risco Médio',
  HIGH: 'Alto Risco',
};

const riskClass: Record<RiskLevel, string> = {
  LOW: 'text-emerald-700 bg-emerald-50/50 border-emerald-100',
  MEDIUM: 'text-amber-700 bg-amber-50/50 border-amber-100',
  HIGH: 'text-rose-700 bg-rose-50/50 border-rose-100',
};

export const Dashboard = () => {
  const { clients, addClient, resetAll, loadDemoData } = useData();
  const navigate = useNavigate();
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form States
  const [formData, setFormData] = useState<{
    name: string;
    documentType: ClientDocumentType;
    documentId: string;
    sector: string;
    customSector: string;
    contactName: string;
    role: string;
    customRole: string;
  }>({
    name: '',
    documentType: 'CNPJ',
    documentId: '',
    sector: 'Indústria Metalúrgica',
    customSector: '',
    contactName: '',
    role: 'Sócio / Proprietário',
    customRole: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'documentId' && formData.documentType !== 'ESTRANGEIRA') {
        const numericValue = value.replace(/\D/g, ''); 
        const maxLength = formData.documentType === 'CNPJ' ? 14 : 11;
        if (numericValue.length <= maxLength) {
            setFormData(prev => ({ ...prev, [name]: numericValue }));
        }
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    const finalSector = formData.sector === 'Outros' ? formData.customSector : formData.sector;
    const finalRole = formData.role === 'Outros' ? formData.customRole : formData.role;

    const newClient: Client = {
      id: Math.random().toString(36).substr(2, 9),
      name: formData.name,
      documentType: formData.documentType,
      cnpj: formData.documentId, 
      sector: finalSector || 'Não Informado',
      contactName: formData.contactName,
      contactRole: finalRole || 'Não Informado',
      createdAt: new Date().toISOString(),
      status: 'SEM_DADOS'
    };
    addClient(newClient);
    setFormData({ name: '', documentType: 'CNPJ', documentId: '', sector: 'Indústria Metalúrgica', customSector: '', contactName: '', role: 'Sócio / Proprietário', customRole: '' });
    setShowNewClientModal(false);
    navigate(`/client/${newClient.id}`);
  };

  const handleReset = () => {
    if (window.confirm("ATENÇÃO: Isso apagará TODOS os dados salvos neste navegador. Continuar?")) {
      resetAll();
    }
  };

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.cnpj.includes(searchTerm)
  );

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700 pb-20">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 pb-8">
        <div>
          <h1 className="text-4xl font-serif font-bold text-slate-900 tracking-tight mb-2">Carteira de Clientes</h1>
          <p className="text-slate-500 font-light text-lg">Gestão estratégica de diagnósticos e solvência corporativa.</p>
        </div>
        <div className="flex gap-4">
          {clients.length === 0 && (
             <button onClick={loadDemoData} className="bg-white border border-slate-200 hover:border-slate-300 text-slate-600 px-5 py-3 rounded-lg flex items-center gap-2 transition-all shadow-sm font-medium text-sm tracking-wide">
              <PlayCircle size={16} /> CARREGAR DEMO
            </button>
          )}
          <button onClick={() => setShowNewClientModal(true)} className="bg-[#0f172a] hover:bg-slate-800 text-white px-8 py-3 rounded-lg flex items-center gap-2 transition-all shadow-xl hover:shadow-2xl font-bold tracking-wide text-sm">
            <Plus size={18} /> NOVO CLIENTE
          </button>
        </div>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] flex flex-col justify-between h-32 relative overflow-hidden">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] z-10">Carteira Ativa</p>
          <div className="flex items-end gap-2 z-10">
             <p className="text-4xl font-serif font-bold text-slate-900">{clients.length}</p>
             <span className="text-sm text-slate-400 mb-1.5 font-medium">Empresas</span>
          </div>
        </div>
        <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] flex flex-col justify-between h-32 relative overflow-hidden">
          <p className="text-xs font-bold text-teal-600/80 uppercase tracking-[0.2em] z-10">Diagnósticos Concluídos</p>
          <div className="flex items-end gap-2 z-10">
             <p className="text-4xl font-serif font-bold text-teal-900">{clients.filter(c => c.status === 'PROJECAO_CONCLUIDA').length}</p>
             <span className="text-sm text-teal-600/60 mb-1.5 font-medium">Finalizados</span>
          </div>
        </div>
        <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] flex flex-col justify-between h-32 relative overflow-hidden">
          <p className="text-xs font-bold text-indigo-600/80 uppercase tracking-[0.2em] z-10">Em Processamento</p>
          <div className="flex items-end gap-2 z-10">
             <p className="text-4xl font-serif font-bold text-indigo-900">{clients.filter(c => c.status !== 'PROJECAO_CONCLUIDA').length}</p>
             <span className="text-sm text-indigo-600/60 mb-1.5 font-medium">Em Análise</span>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative group max-w-2xl">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-600 transition-colors" size={20} />
        <input 
          type="text" 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por nome ou documento..." 
          className="w-full pl-14 pr-4 py-4 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-500/10 focus:border-teal-500 text-slate-700 shadow-sm transition-all"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50/80 border-b border-slate-200">
            <tr>
              <th className="px-8 py-5 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Cliente</th>
              <th className="px-8 py-5 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
              <th className="px-8 py-5 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Risco</th>
              <th className="px-8 py-5 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Última Atualização</th>
              <th className="px-8 py-5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredClients.map((client) => (
              <tr 
                key={client.id} 
                onClick={() => navigate(`/client/${client.id}`)}
                className="hover:bg-slate-50/50 cursor-pointer transition-all group"
              >
                <td className="px-8 py-6">
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 rounded-xl bg-[#0f172a] flex items-center justify-center text-white font-serif font-bold text-xl shadow-md">
                      {client.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-base group-hover:text-teal-700 transition-colors">{client.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-slate-500 font-mono tracking-wide">{client.documentType}: {client.cnpj}</span>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold border uppercase tracking-wide shadow-sm ${statusClass[client.status]}`}>
                    {statusLabel[client.status]}
                  </span>
                </td>
                <td className="px-8 py-6">
                   {client.lastRiskLevel ? (
                      <span className={`px-3 py-1 rounded border text-[10px] font-bold tracking-widest ${riskClass[client.lastRiskLevel]}`}>
                        {riskLabel[client.lastRiskLevel]}
                      </span>
                   ) : (
                      <span className="text-xs text-slate-400 italic">--</span>
                   )}
                </td>
                <td className="px-8 py-6">
                  <span className="text-sm text-slate-500 font-medium">
                    {client.lastAnalysisAt ? new Date(client.lastAnalysisAt).toLocaleDateString('pt-BR') : '---'}
                  </span>
                </td>
                <td className="px-8 py-6 text-right">
                  <ArrowUpRight size={20} className="text-slate-300 ml-auto" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-center mt-12 pb-10">
          <button 
              onClick={handleReset}
              className="text-slate-400 hover:text-rose-600 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-rose-50 px-4 py-2 rounded transition-all"
          >
              <Trash2 size={12} /> Resetar dados deste navegador
          </button>
      </div>

      {/* Modal - Novo Cliente */}
      {showNewClientModal && (
        <div className="fixed inset-0 bg-[#0f172a]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
              <div>
                <h2 className="text-2xl font-serif font-bold text-slate-900">Novo Cliente</h2>
                <p className="text-sm text-slate-500 mt-1 font-light">Cadastro inicial para abertura de dossiê.</p>
              </div>
              <button onClick={() => setShowNewClientModal(false)} className="text-slate-400 hover:text-slate-700 p-2 hover:bg-slate-100 rounded-full">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateClient} className="p-8 overflow-y-auto">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Razão Social / Nome</label>
                  <input name="name" value={formData.name} onChange={handleInputChange} autoFocus type="text" required placeholder="Ex: Indústria Metalúrgica AçoForte" className="w-full border border-slate-200 rounded-lg px-4 py-3.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 font-medium text-lg" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                     <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Tipo</label>
                     <select name="documentType" value={formData.documentType} onChange={handleInputChange} className="w-full border border-slate-200 rounded-lg px-4 py-3 text-slate-700 bg-white">
                         <option value="CNPJ">CNPJ</option>
                         <option value="CPF">CPF</option>
                         <option value="ESTRANGEIRA">Internacional</option>
                     </select>
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Documento</label>
                    <input name="documentId" value={formData.documentId} onChange={handleInputChange} type="text" placeholder="Apenas números..." className="w-full border border-slate-200 rounded-lg px-4 py-3 text-slate-900 font-mono" />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-slate-100">
                <button type="button" onClick={() => setShowNewClientModal(false)} className="px-6 py-3 text-slate-500 hover:bg-slate-50 rounded-lg font-bold text-sm">CANCELAR</button>
                <button type="submit" disabled={!formData.name} className="px-8 py-3 bg-[#0f172a] text-white rounded-lg hover:bg-slate-800 font-bold text-sm disabled:opacity-50">CONFIRMAR</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};