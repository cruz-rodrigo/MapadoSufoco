import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { Plus, Search, Building2, ChevronRight, AlertOctagon, CheckCircle2, X, Briefcase, User, Hash, Wallet, BadgeCheck } from 'lucide-react';
import { Client } from '../types';

export const Dashboard = () => {
  const { clients, addClient } = useData();
  const navigate = useNavigate();
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  
  // Form States
  const [formData, setFormData] = useState({
    name: '',
    cnpj: '',
    sector: 'Indústria Metalúrgica', // Default
    customSector: '',
    contactName: '',
    role: 'Sócio / Proprietário',
    customRole: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Logic for "Others" fields
    const finalSector = formData.sector === 'Outros' ? formData.customSector : formData.sector;
    const finalRole = formData.role === 'Outros' ? formData.customRole : formData.role;

    const newClient: Client = {
      id: Math.random().toString(36).substr(2, 9),
      name: formData.name,
      sector: finalSector || 'Não Informado',
      cnpj: formData.cnpj,
      contactName: formData.contactName,
      contactRole: finalRole || 'Não Informado',
      createdAt: new Date().toISOString()
    };
    addClient(newClient);
    
    // Reset form
    setFormData({ 
      name: '', 
      cnpj: '', 
      sector: 'Indústria Metalúrgica', 
      customSector: '',
      contactName: '',
      role: 'Sócio / Proprietário',
      customRole: ''
    });
    
    setShowNewClientModal(false);
    navigate(`/client/${newClient.id}`);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Carteira de Clientes</h1>
          <p className="text-slate-500 mt-2 text-lg font-light">Gestão de diagnósticos e monitoramento de risco de caixa.</p>
        </div>
        <button 
          onClick={() => setShowNewClientModal(true)}
          className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-all shadow-lg hover:shadow-xl font-medium tracking-wide"
        >
          <Plus size={20} />
          Novo Cliente
        </button>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Carteira Ativa</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">{clients.length}</p>
          </div>
          <div className="p-3 bg-slate-50 text-slate-600 rounded-lg border border-slate-100">
            <Building2 size={24} />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Diagnósticos (Mês)</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">12</p>
          </div>
          <div className="p-3 bg-teal-50 text-teal-600 rounded-lg border border-teal-100">
            <Briefcase size={24} />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Risco Crítico</p>
            <p className="text-3xl font-bold text-rose-600 mt-2">2</p>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-lg border border-rose-100">
            <AlertOctagon size={24} />
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-600 transition-colors" size={20} />
        <input 
          type="text" 
          placeholder="Filtrar por nome, CNPJ ou setor..." 
          className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-700 shadow-sm transition-all"
        />
      </div>

      {/* Clients List Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Empresa</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Setor / CNPJ</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Última Análise</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Risco</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {clients.map((client, idx) => (
              <tr 
                key={client.id} 
                onClick={() => navigate(`/client/${client.id}`)}
                className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
              >
                <td className="px-6 py-5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 font-bold text-lg shadow-sm border border-slate-200">
                      {client.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-base">{client.name}</p>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <User size={10} /> {client.contactName} {client.contactRole ? `(${client.contactRole})` : ''}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-slate-700">{client.sector}</span>
                    <span className="text-xs text-slate-400 font-mono mt-0.5">{client.cnpj || '---'}</span>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-wide">
                    Em Progresso
                  </span>
                </td>
                <td className="px-6 py-5 text-sm text-slate-500 font-mono">
                  {new Date(client.createdAt).toLocaleDateString('pt-BR')}
                </td>
                <td className="px-6 py-5">
                  {idx % 2 === 0 ? (
                    <div className="flex items-center gap-2 text-rose-700 text-xs font-bold bg-rose-50 px-3 py-1.5 rounded-md w-fit border border-rose-100 uppercase tracking-wide">
                      <AlertOctagon size={14} /> ALTO
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold bg-emerald-50 px-3 py-1.5 rounded-md w-fit border border-emerald-100 uppercase tracking-wide">
                      <CheckCircle2 size={14} /> BAIXO
                    </div>
                  )}
                </td>
                <td className="px-6 py-5 text-right">
                  <div className="w-8 h-8 rounded-full bg-transparent group-hover:bg-white group-hover:shadow-sm flex items-center justify-center text-slate-300 group-hover:text-teal-600 transition-all ml-auto">
                    <ChevronRight size={20} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {clients.length === 0 && (
          <div className="p-16 text-center text-slate-400 flex flex-col items-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
               <Building2 size={32} className="opacity-50" />
            </div>
            <p className="text-lg font-medium text-slate-600">Sua carteira está vazia.</p>
            <p className="text-sm mt-1 mb-6">Cadastre o primeiro cliente para iniciar um diagnóstico.</p>
            <button 
              onClick={() => setShowNewClientModal(true)}
              className="text-teal-600 font-bold hover:text-teal-700 hover:underline"
            >
              Cadastrar agora
            </button>
          </div>
        )}
      </div>

      {/* Enhanced Modal */}
      {showNewClientModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Novo Cliente</h2>
                <p className="text-sm text-slate-500 mt-1">Dados cadastrais para diagnóstico e contrato.</p>
              </div>
              <button onClick={() => setShowNewClientModal(false)} className="text-slate-400 hover:text-slate-700 transition-colors p-1 hover:bg-slate-200 rounded-full">
                <X size={20} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateClient} className="p-8 overflow-y-auto">
              <div className="space-y-6">
                
                {/* Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                    <Building2 size={14} /> Razão Social / Fantasia
                  </label>
                  <input 
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    autoFocus
                    type="text" 
                    required
                    placeholder="Ex: Indústria Metalúrgica AçoForte"
                    className="w-full border border-slate-300 rounded-lg px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all font-medium"
                  />
                </div>

                {/* Grid for CNPJ & Sector */}
                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                      <Hash size={14} /> CNPJ
                    </label>
                    <input 
                      name="cnpj"
                      value={formData.cnpj}
                      onChange={handleInputChange}
                      type="text" 
                      placeholder="00.000.000/0001-00"
                      className="w-full border border-slate-300 rounded-lg px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all font-mono text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                      <Briefcase size={14} /> Setor de Atuação
                    </label>
                    <div className="relative">
                      <select 
                        name="sector"
                        value={formData.sector}
                        onChange={handleInputChange}
                        className="w-full border border-slate-300 rounded-lg px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all appearance-none bg-white cursor-pointer"
                      >
                        <option>Indústria Metalúrgica</option>
                        <option>Indústria Plástica</option>
                        <option>Indústria Alimentícia</option>
                        <option>Serviços de Engenharia</option>
                        <option>Logística / Transportes</option>
                        <option>Varejo Técnico</option>
                        <option value="Outros">Outros (Especificar)</option>
                      </select>
                      <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-slate-400 pointer-events-none" size={16} />
                    </div>
                  </div>
                </div>

                {/* Custom Sector Input - Conditional */}
                {formData.sector === 'Outros' && (
                   <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2">
                    <label className="text-xs font-bold text-teal-600 uppercase tracking-wide">
                      Especifique o Setor
                    </label>
                    <input 
                      name="customSector"
                      value={formData.customSector}
                      onChange={handleInputChange}
                      type="text" 
                      placeholder="Ex: Galvanoplastia de Precisão"
                      className="w-full border border-teal-200 bg-teal-50/30 rounded-lg px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all"
                    />
                  </div>
                )}

                <div className="border-t border-slate-100 my-4"></div>

                {/* Contact Info */}
                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                      <User size={14} /> Nome do Contato
                    </label>
                    <input 
                      name="contactName"
                      value={formData.contactName}
                      onChange={handleInputChange}
                      type="text" 
                      placeholder="Ex: Roberto da Silva"
                      className="w-full border border-slate-300 rounded-lg px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all"
                    />
                  </div>
                   <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                      <BadgeCheck size={14} /> Cargo / Função
                    </label>
                    <div className="relative">
                      <select 
                        name="role"
                        value={formData.role}
                        onChange={handleInputChange}
                        className="w-full border border-slate-300 rounded-lg px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all appearance-none bg-white cursor-pointer"
                      >
                        <option>Sócio / Proprietário</option>
                        <option>Diretor Geral (CEO)</option>
                        <option>Diretor Financeiro (CFO)</option>
                        <option>Gerente Administrativo</option>
                        <option>Gerente Industrial</option>
                        <option>Consultor Externo</option>
                        <option value="Outros">Outros (Especificar)</option>
                      </select>
                      <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-slate-400 pointer-events-none" size={16} />
                    </div>
                  </div>
                </div>

                {/* Custom Role Input - Conditional */}
                {formData.role === 'Outros' && (
                   <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2">
                    <label className="text-xs font-bold text-teal-600 uppercase tracking-wide">
                      Especifique o Cargo
                    </label>
                    <input 
                      name="customRole"
                      value={formData.customRole}
                      onChange={handleInputChange}
                      type="text" 
                      placeholder="Ex: Controller"
                      className="w-full border border-teal-200 bg-teal-50/30 rounded-lg px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all"
                    />
                  </div>
                )}

              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-slate-100">
                <button 
                  type="button"
                  onClick={() => setShowNewClientModal(false)}
                  className="px-6 py-2.5 text-slate-600 hover:bg-slate-100 rounded-lg font-bold text-sm transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={!formData.name}
                  className="px-8 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-bold text-sm transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cadastrar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
