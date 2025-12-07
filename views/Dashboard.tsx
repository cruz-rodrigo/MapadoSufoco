import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { Plus, Search, Building2, ChevronRight, AlertOctagon, X, Briefcase, User, PlayCircle, Globe, FileBadge, Check, Trash2, BadgeCheck, ArrowUpRight } from 'lucide-react';
import { Client, ClientStatus, ClientDocumentType } from '../types';

const StatusBadge = ({ status }: { status: ClientStatus }) => {
  const map: Record<ClientStatus, { label: string; color: string; dot: string }> = {
    'SEM_DADOS': { label: 'Novo Cadastro', color: 'bg-slate-100 text-slate-600 border-slate-200', dot: 'bg-slate-400' },
    'IMPORTADO': { label: 'Dados Importados', color: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
    'CLASSIFICADO': { label: 'Classificado', color: 'bg-indigo-50 text-indigo-700 border-indigo-200', dot: 'bg-indigo-500' },
    'DIVIDAS_PREENCHIDAS': { label: 'Dívidas Mapeadas', color: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
    'PROJECAO_CONCLUIDA': { label: 'Diagnóstico Pronto', color: 'bg-emerald-50 text-emerald-800 border-emerald-200', dot: 'bg-emerald-500' },
  };

  const config = map[status] || map['SEM_DADOS'];

  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-semibold border uppercase tracking-wide shadow-sm ${config.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`}></span>
      {config.label}
    </span>
  );
}

const RiskBadge = ({ level }: { level?: 'LOW' | 'MEDIUM' | 'HIGH' }) => {
    if (!level) return <span className="text-xs text-slate-400 font-medium tracking-wide">--</span>;
    const map = {
        LOW: { label: 'BAIXO RISCO', color: 'text-emerald-700 bg-emerald-50/50 border-emerald-100' },
        MEDIUM: { label: 'RISCO MÉDIO', color: 'text-amber-700 bg-amber-50/50 border-amber-100' },
        HIGH: { label: 'ALTO RISCO', color: 'text-rose-700 bg-rose-50/50 border-rose-100' },
    };
    return (
        <span className={`px-3 py-1 rounded border text-[10px] font-bold tracking-widest ${map[level].color}`}>
            {map[level].label}
        </span>
    );
}

export const Dashboard = () => {
  const { clients, addClient, resetApplication, loadDemoData } = useData();
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
    sector: 'Indústria Metalúrgica', // Default
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

  const isDocumentValid = () => {
     if (formData.documentType === 'CNPJ') return formData.documentId.length === 14;
     if (formData.documentType === 'CPF') return formData.documentId.length === 11;
     return formData.documentId.length > 3;
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
    setFormData({ 
      name: '', 
      documentType: 'CNPJ',
      documentId: '', 
      sector: 'Indústria Metalúrgica', 
      customSector: '',
      contactName: '',
      role: 'Sócio / Proprietário',
      customRole: ''
    });
    setShowNewClientModal(false);
    navigate(`/client/${newClient.id}`);
  };

  const handleReset = () => {
    if (window.confirm("ATENÇÃO: Isso apagará TODOS os clientes e dados locais deste navegador. Esta ação não pode ser desfeita. Tem certeza?")) {
      resetApplication();
    }
  };

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.cnpj.includes(searchTerm) || 
    c.sector.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700 pb-20">
      {/* Premium Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 pb-8">
        <div>
          <h1 className="text-4xl font-serif font-bold text-slate-900 tracking-tight mb-2">Carteira de Clientes</h1>
          <p className="text-slate-500 font-light text-lg">Gestão estratégica de diagnósticos e solvência corporativa.</p>
        </div>
        <div className="flex gap-4">
          {clients.length === 0 && (
             <button 
              onClick={loadDemoData}
              className="bg-white border border-slate-200 hover:border-slate-300 text-slate-600 px-5 py-3 rounded-lg flex items-center gap-2 transition-all shadow-sm font-medium text-sm tracking-wide"
            >
              <PlayCircle size={16} />
              CARREGAR DEMO
            </button>
          )}
          <button 
            onClick={() => setShowNewClientModal(true)}
            className="bg-[#0f172a] hover:bg-slate-800 text-white px-8 py-3 rounded-lg flex items-center gap-2 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-0.5 font-bold tracking-wide text-sm"
          >
            <Plus size={18} />
            NOVO CLIENTE
          </button>
        </div>
      </header>

      {/* Premium KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] flex flex-col justify-between h-32 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Building2 size={80} />
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] z-10">Carteira Ativa</p>
          <div className="flex items-end gap-2 z-10">
             <p className="text-4xl font-serif font-bold text-slate-900">{clients.length}</p>
             <span className="text-sm text-slate-400 mb-1.5 font-medium">Empresas</span>
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] flex flex-col justify-between h-32 relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-teal-600">
            <BadgeCheck size={80} />
          </div>
          <p className="text-xs font-bold text-teal-600/80 uppercase tracking-[0.2em] z-10">Diagnósticos Concluídos</p>
          <div className="flex items-end gap-2 z-10">
             <p className="text-4xl font-serif font-bold text-teal-900">{clients.filter(c => c.status === 'PROJECAO_CONCLUIDA').length}</p>
             <span className="text-sm text-teal-600/60 mb-1.5 font-medium">Finalizados</span>
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] flex flex-col justify-between h-32 relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-indigo-600">
            <AlertOctagon size={80} />
          </div>
          <p className="text-xs font-bold text-indigo-600/80 uppercase tracking-[0.2em] z-10">Em Processamento</p>
          <div className="flex items-end gap-2 z-10">
             <p className="text-4xl font-serif font-bold text-indigo-900">{clients.filter(c => c.status !== 'PROJECAO_CONCLUIDA').length}</p>
             <span className="text-sm text-indigo-600/60 mb-1.5 font-medium">Em Análise</span>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative group max-w-2xl">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-600 transition-colors" size={20} />
        <input 
          type="text" 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por nome, documento ou setor..." 
          className="w-full pl-14 pr-4 py-4 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-500/10 focus:border-teal-500 text-slate-700 shadow-sm transition-all placeholder:font-light"
        />
      </div>

      {/* Premium Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50/80 border-b border-slate-200">
            <tr>
              <th className="px-8 py-5 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Cliente / Razão Social</th>
              <th className="px-8 py-5 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Status do Processo</th>
              <th className="px-8 py-5 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Classificação de Risco</th>
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
                        <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                        <span className="text-xs text-slate-500 font-medium">{client.sector}</span>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <StatusBadge status={client.status} />
                </td>
                <td className="px-8 py-6">
                  <RiskBadge level={client.lastRiskLevel} />
                </td>
                <td className="px-8 py-6">
                  <span className="text-sm text-slate-500 font-medium">
                    {client.lastAnalysisAt ? new Date(client.lastAnalysisAt).toLocaleDateString('pt-BR') : '---'}
                  </span>
                </td>
                <td className="px-8 py-6 text-right">
                  <div className="w-10 h-10 rounded-full bg-transparent group-hover:bg-white group-hover:shadow-md border border-transparent group-hover:border-slate-100 flex items-center justify-center text-slate-300 group-hover:text-teal-600 transition-all ml-auto">
                    <ArrowUpRight size={20} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {clients.length === 0 && (
          <div className="p-20 text-center text-slate-400 flex flex-col items-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 border border-slate-100">
               <Building2 size={32} className="opacity-30" />
            </div>
            <p className="text-xl font-serif font-medium text-slate-700">Sua carteira está vazia</p>
            <p className="text-sm mt-2 mb-8 font-light max-w-md">Inicie um novo diagnóstico para visualizar os indicadores de risco e fluxo de caixa.</p>
            <div className="flex gap-4">
              <button 
                onClick={loadDemoData}
                className="px-6 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-bold transition-all"
              >
                Carregar Demonstração
              </button>
              <button 
                onClick={() => setShowNewClientModal(true)}
                className="px-6 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 text-sm font-bold transition-all shadow-lg shadow-teal-900/10"
              >
                Cadastrar Primeiro Cliente
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-center mt-12 pb-10">
        {clients.length > 0 && (
            <button 
                onClick={handleReset}
                className="text-slate-400 hover:text-rose-600 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-rose-50 px-4 py-2 rounded transition-all"
            >
                <Trash2 size={12} /> Limpar Base Local
            </button>
        )}
      </div>

      {/* Premium Modal */}
      {showNewClientModal && (
        <div className="fixed inset-0 bg-[#0f172a]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
              <div>
                <h2 className="text-2xl font-serif font-bold text-slate-900">Novo Cliente</h2>
                <p className="text-sm text-slate-500 mt-1 font-light">Cadastro inicial para abertura de dossiê.</p>
              </div>
              <button onClick={() => setShowNewClientModal(false)} className="text-slate-400 hover:text-slate-700 transition-colors p-2 hover:bg-slate-100 rounded-full">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateClient} className="p-8 overflow-y-auto">
              <div className="space-y-8">
                
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    Razão Social / Nome
                  </label>
                  <input 
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    autoFocus
                    type="text" 
                    required
                    placeholder="Ex: Indústria Metalúrgica AçoForte"
                    className="w-full border border-slate-200 rounded-lg px-4 py-3.5 text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all font-medium text-lg"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                     <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                       Documento
                     </label>
                     <div className="relative">
                       <select 
                         name="documentType"
                         value={formData.documentType}
                         onChange={handleInputChange}
                         className="w-full border border-slate-200 rounded-lg px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all appearance-none bg-slate-50/50 cursor-pointer font-medium"
                       >
                         <option value="CNPJ">CNPJ</option>
                         <option value="CPF">CPF</option>
                         <option value="ESTRANGEIRA">Internacional</option>
                       </select>
                       <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-slate-400 pointer-events-none" size={16} />
                     </div>
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                       Número do Documento
                    </label>
                    <div className="relative">
                        <input 
                          name="documentId"
                          value={formData.documentId}
                          onChange={handleInputChange}
                          type="text" 
                          placeholder="Digite apenas números..."
                          className={`w-full border rounded-lg px-4 py-3 text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 transition-all font-mono pr-10 ${isDocumentValid() ? 'border-emerald-500/50 focus:ring-emerald-500/20' : 'border-slate-200 focus:ring-slate-900/10 focus:border-slate-900'}`}
                        />
                        {isDocumentValid() && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600 pointer-events-none">
                                <Check size={18} />
                            </div>
                        )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                      Setor de Atuação
                    </label>
                    <div className="relative">
                      <select 
                        name="sector"
                        value={formData.sector}
                        onChange={handleInputChange}
                        className="w-full border border-slate-200 rounded-lg px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all appearance-none bg-slate-50/50 cursor-pointer"
                      >
                        <option>Indústria Metalúrgica</option>
                        <option>Indústria Plástica</option>
                        <option>Indústria Alimentícia</option>
                        <option>Serviços de Engenharia</option>
                        <option>Logística / Transportes</option>
                        <option>Varejo Técnico</option>
                        <option>Profissional Liberal / Pessoa Física</option>
                        <option value="Outros">Outros (Especificar)</option>
                      </select>
                      <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-slate-400 pointer-events-none" size={16} />
                    </div>
                </div>

                {formData.sector === 'Outros' && (
                   <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                    <label className="text-[11px] font-bold text-teal-700 uppercase tracking-widest">
                      Especificar Setor
                    </label>
                    <input 
                      name="customSector"
                      value={formData.customSector}
                      onChange={handleInputChange}
                      type="text" 
                      className="w-full border border-teal-200 bg-teal-50/30 rounded-lg px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all"
                    />
                  </div>
                )}

                <div className="border-t border-slate-100 my-4"></div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                      Nome do Contato
                    </label>
                    <input 
                      name="contactName"
                      value={formData.contactName}
                      onChange={handleInputChange}
                      type="text" 
                      className="w-full border border-slate-200 rounded-lg px-4 py-3 text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all"
                    />
                  </div>
                   <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                      Cargo / Função
                    </label>
                    <div className="relative">
                      <select 
                        name="role"
                        value={formData.role}
                        onChange={handleInputChange}
                        className="w-full border border-slate-200 rounded-lg px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all appearance-none bg-slate-50/50 cursor-pointer"
                      >
                        <option>Sócio / Proprietário</option>
                        <option>Diretor Geral (CEO)</option>
                        <option>Diretor Financeiro (CFO)</option>
                        <option>Gerente Administrativo</option>
                        <option>Consultor Externo</option>
                        <option value="Outros">Outros</option>
                      </select>
                      <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-slate-400 pointer-events-none" size={16} />
                    </div>
                  </div>
                </div>

              </div>

              <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-slate-100">
                <button 
                  type="button"
                  onClick={() => setShowNewClientModal(false)}
                  className="px-6 py-3 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-lg font-bold text-sm transition-colors tracking-wide"
                >
                  CANCELAR
                </button>
                <button 
                  type="submit"
                  disabled={!formData.name}
                  className="px-8 py-3 bg-[#0f172a] text-white rounded-lg hover:bg-slate-800 font-bold text-sm transition-all shadow-lg hover:shadow-xl tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  CONFIRMAR CADASTRO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};