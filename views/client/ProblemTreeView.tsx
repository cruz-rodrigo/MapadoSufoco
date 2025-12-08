import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Client, ActionItem } from '../../types';
import { useData } from '../../context/DataContext';
import { Plus, Trash2, TrendingUp, TrendingDown, Sparkles, Loader2, BrainCircuit, Paperclip, FileImage } from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";

const IMPACT_LABELS: Record<string, string> = {
    LOW: 'BAIXO',
    MEDIUM: 'MÉDIO',
    HIGH: 'ALTO'
};

const IMPACT_COLORS: Record<string, string> = {
    LOW: 'text-emerald-600 border-emerald-200 bg-emerald-50',
    MEDIUM: 'text-amber-600 border-amber-200 bg-amber-50',
    HIGH: 'text-rose-600 border-rose-200 bg-rose-50'
};

export const ProblemTreeView = () => {
  const { client } = useOutletContext<{ client: Client }>();
  const { actions, addAction, removeAction, getTransactionsByClient, getDebtsByClient } = useData();
  
  const clientActions = actions.filter(a => a.clientId === client.id);
  
  const revenueActions = clientActions.filter(a => a.actionType === 'REV');
  const costActions = clientActions.filter(a => a.actionType === 'COST');

  const [newCostAction, setNewCostAction] = useState({ title: '', impact: 'MEDIUM' as const, horizon: 'CURTO' as const });
  const [newRevAction, setNewRevAction] = useState({ title: '', impact: 'MEDIUM' as const, horizon: 'CURTO' as const });
  
  // AI State
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [userContext, setUserContext] = useState('');
  const [attachedImage, setAttachedImage] = useState<string | null>(null);

  const handleAdd = (type: 'REV' | 'COST') => {
      const state = type === 'COST' ? newCostAction : newRevAction;
      const setter = type === 'COST' ? setNewCostAction : setNewRevAction;

      if (!state.title) return;
      
      addAction({
          id: Date.now().toString(),
          clientId: client.id,
          actionType: type,
          title: state.title,
          impact: state.impact,
          horizon: state.horizon,
          description: type === 'REV' ? 'Ação de Receita Manual' : 'Ação de Corte Manual'
      });
      setter({ title: '', impact: 'MEDIUM', horizon: 'CURTO' });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onload = (ev) => {
              setAttachedImage(ev.target?.result as string);
          };
          reader.readAsDataURL(file);
      }
  };

  const handleGenerateInsights = async () => {
    setIsAiLoading(true);
    setAiSuggestions([]);
    
    try {
      const txs = getTransactionsByClient(client.id);
      const debts = getDebtsByClient(client.id);
      
      // Calculate summary for context
      const totalIn = txs.filter(t => t.type === 'IN').reduce((sum, t) => sum + t.value, 0);
      const totalOut = txs.filter(t => t.type === 'OUT').reduce((sum, t) => sum + t.value, 0);
      const debtTotal = debts.reduce((sum, d) => sum + d.balance, 0);
      const topDrains = txs
        .filter(t => t.type === 'OUT')
        .reduce((acc, t) => {
            acc[t.category] = (acc[t.category] || 0) + t.value;
            return acc;
        }, {} as Record<string, number>);
      
      const top3Drains = Object.entries(topDrains)
        .sort((a, b) => (b[1] as number) - (a[1] as number))
        .slice(0, 3)
        .map(([cat, val]) => `${cat}: R$ ${(val as number).toFixed(0)}`)
        .join(', ');

      const promptContext = `
        Contexto do Usuário: "${userContext || 'Nenhum contexto adicional informado.'}"
        
        Empresa: ${client.name} (Setor: ${client.sector}).
        Resumo Financeiro (Últimos 90 dias):
        - Entradas Totais: R$ ${totalIn.toFixed(0)}
        - Saídas Totais: R$ ${totalOut.toFixed(0)}
        - Resultado: R$ ${(totalIn - totalOut).toFixed(0)}
        - Dívida Total Bancária: R$ ${debtTotal.toFixed(0)}
        
        Principais Ralos (Maiores despesas): ${top3Drains}.
      `;

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Prepare Parts
      const parts: any[] = [
        {
            text: `Atue como um Consultor de Turnaround Sênior da 'Cruz Capital'. Analise os dados desta empresa e sugira 4 ações táticas de alto impacto para sair do sufoco.
            
            ${promptContext}
            
            IMPORTANTE:
            1. Analise também a imagem em anexo, se houver (pode ser um DRE, balancete ou anotação).
            2. Você DEVE sugerir tanto cortes de custos quanto AUMENTO DE RECEITA. É obrigatório ter pelo menos 1 sugestão de Receita (REV).
            3. Seja específico e prático.

            Retorne APENAS um JSON array.`
        }
      ];

      if (attachedImage) {
          const base64Data = attachedImage.split(',')[1];
          parts.push({
              inlineData: {
                  mimeType: 'image/jpeg', // Assuming jpeg/png mostly
                  data: base64Data
              }
          });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
             type: Type.ARRAY,
             items: {
               type: Type.OBJECT,
               properties: {
                 title: { type: Type.STRING, description: "Título curto da ação" },
                 description: { type: Type.STRING, description: "Explicação tática" },
                 impact: { type: Type.STRING, enum: ["LOW", "MEDIUM", "HIGH"] },
                 horizon: { type: Type.STRING, enum: ["CURTO", "MEDIO", "LONGO"] },
                 type: { type: Type.STRING, enum: ["COST", "REV"], description: "COST para corte, REV para receita" }
               },
               required: ["title", "description", "impact", "horizon", "type"]
             }
          }
        }
      });
      
      const json = JSON.parse(response.text || "[]");
      setAiSuggestions(json);

    } catch (error) {
      console.error("AI Error:", error);
      alert("Erro ao gerar insights. Verifique a conexão ou a imagem enviada.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const acceptSuggestion = (s: any) => {
      addAction({
          id: Date.now().toString() + Math.random(),
          clientId: client.id,
          actionType: s.type, 
          title: s.title,
          description: s.description,
          impact: s.impact,
          horizon: s.horizon
      });
      setAiSuggestions(prev => prev.filter(item => item !== s));
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="text-center max-w-3xl mx-auto">
         <h2 className="text-2xl font-serif font-bold text-slate-900">Árvore de Soluções</h2>
         <p className="text-slate-500 mt-2">Estruture o plano de turnaround atacando as duas alavancas principais.</p>
         
         <div className="mt-8 bg-white p-6 rounded-xl border border-indigo-100 shadow-sm">
             <div className="text-left mb-4">
                 <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Contexto Adicional (Opcional)</label>
                 <textarea 
                    className="w-full border border-slate-200 rounded p-3 text-sm focus:ring-2 focus:ring-indigo-100 outline-none" 
                    placeholder="Ex: Estamos renegociando com o fornecedor X; temos estoque parado..."
                    rows={2}
                    value={userContext}
                    onChange={e => setUserContext(e.target.value)}
                 />
                 <div className="mt-2 flex items-center gap-4">
                     <label className="flex items-center gap-2 text-xs font-bold text-slate-500 cursor-pointer hover:text-indigo-600 transition-colors">
                         <Paperclip size={14} /> Anexar Imagem (Relatório/DRE)
                         <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                     </label>
                     {attachedImage && (
                         <span className="text-xs text-emerald-600 flex items-center gap-1 font-medium bg-emerald-50 px-2 py-1 rounded">
                             <FileImage size={12} /> Imagem carregada
                             <button onClick={() => setAttachedImage(null)} className="ml-2 hover:text-emerald-800">x</button>
                         </span>
                     )}
                 </div>
             </div>
             
             <button 
                onClick={handleGenerateInsights}
                disabled={isAiLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-bold shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
                {isAiLoading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
                {isAiLoading ? 'Consultor IA Analisando...' : 'Consultor IA: Gerar Plano Tático'}
            </button>
         </div>

         {/* AI Suggestions Panel */}
         {aiSuggestions.length > 0 && (
             <div className="mt-8 bg-indigo-50 border border-indigo-100 rounded-xl p-6 text-left animate-in slide-in-from-top-4">
                 <h3 className="text-sm font-bold text-indigo-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <BrainCircuit size={18} /> Sugestões Estratégicas
                 </h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {aiSuggestions.map((s, idx) => (
                         <div key={idx} className="bg-white p-4 rounded-lg border border-indigo-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                             <div>
                                 <div className="flex justify-between items-start mb-2">
                                     <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${s.type === 'COST' ? 'bg-rose-50 text-rose-700 border-rose-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'}`}>
                                         {s.type === 'COST' ? 'Corte de Gasto' : 'Aumento de Receita'}
                                     </span>
                                     <span className="text-[10px] font-bold text-slate-400">{s.horizon}</span>
                                 </div>
                                 <p className="font-bold text-slate-800 text-sm">{s.title}</p>
                                 <p className="text-xs text-slate-500 mt-1 leading-relaxed">{s.description}</p>
                             </div>
                             <button 
                                onClick={() => acceptSuggestion(s)}
                                className="mt-3 w-full py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-800 text-xs font-bold rounded flex items-center justify-center gap-2 transition-colors"
                             >
                                <Plus size={14} /> Adicionar ao Plano
                             </button>
                         </div>
                     ))}
                 </div>
             </div>
         )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
         
         {/* LEFT: COSTS */}
         <div className="bg-white p-6 rounded-xl border border-rose-200 shadow-sm relative flex flex-col h-full">
             <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-rose-100 text-rose-800 px-4 py-1 rounded-full text-xs font-bold border border-rose-200 flex items-center gap-2">
                 <TrendingDown size={14} /> REDUZIR GASTOS
             </div>
             
             <div className="mt-4 space-y-3 flex-1">
                 {costActions.map(a => (
                     <ActionCard key={a.id} action={a} onDelete={() => removeAction(a.id)} />
                 ))}
                 {costActions.length === 0 && <p className="text-center text-sm text-slate-400 py-4 italic">Nenhuma ação mapeada.</p>}
             </div>

             <div className="mt-6 pt-4 border-t border-slate-100">
                 <input 
                    className="w-full border border-slate-200 rounded p-2 text-sm mb-2" 
                    placeholder="Nova ação de corte..." 
                    value={newCostAction.title}
                    onChange={e => setNewCostAction({...newCostAction, title: e.target.value})}
                 />
                 <div className="flex gap-2 mb-2">
                     <select 
                        className="flex-1 border border-slate-200 rounded p-2 text-xs"
                        value={newCostAction.impact}
                        onChange={e => setNewCostAction({...newCostAction, impact: e.target.value as any})}
                     >
                        <option value="LOW">Impacto Baixo</option>
                        <option value="MEDIUM">Impacto Médio</option>
                        <option value="HIGH">Impacto Alto</option>
                     </select>
                     <select 
                        className="flex-1 border border-slate-200 rounded p-2 text-xs"
                        value={newCostAction.horizon}
                        onChange={e => setNewCostAction({...newCostAction, horizon: e.target.value as any})}
                     >
                        <option value="CURTO">Curto Prazo</option>
                        <option value="MEDIO">Médio Prazo</option>
                        <option value="LONGO">Longo Prazo</option>
                     </select>
                 </div>
                 <button onClick={() => handleAdd('COST')} className="w-full py-2 bg-rose-600 text-white rounded font-bold text-xs hover:bg-rose-700 uppercase">Adicionar Corte</button>
             </div>
         </div>

         {/* RIGHT: REVENUE */}
         <div className="bg-white p-6 rounded-xl border border-emerald-200 shadow-sm relative flex flex-col h-full">
             <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-emerald-100 text-emerald-800 px-4 py-1 rounded-full text-xs font-bold border border-emerald-200 flex items-center gap-2">
                 <TrendingUp size={14} /> AUMENTAR RECEITA
             </div>

             <div className="mt-4 space-y-3 flex-1">
                 {revenueActions.map(a => (
                     <ActionCard key={a.id} action={a} onDelete={() => removeAction(a.id)} />
                 ))}
                 {revenueActions.length === 0 && <p className="text-center text-sm text-slate-400 py-4 italic">Nenhuma ação mapeada.</p>}
             </div>
             
             <div className="mt-6 pt-4 border-t border-slate-100">
                 <input 
                    className="w-full border border-slate-200 rounded p-2 text-sm mb-2" 
                    placeholder="Nova iniciativa de receita..." 
                    value={newRevAction.title}
                    onChange={e => setNewRevAction({...newRevAction, title: e.target.value})}
                 />
                 <div className="flex gap-2 mb-2">
                     <select 
                        className="flex-1 border border-slate-200 rounded p-2 text-xs"
                        value={newRevAction.impact}
                        onChange={e => setNewRevAction({...newRevAction, impact: e.target.value as any})}
                     >
                        <option value="LOW">Impacto Baixo</option>
                        <option value="MEDIUM">Impacto Médio</option>
                        <option value="HIGH">Impacto Alto</option>
                     </select>
                     <select 
                        className="flex-1 border border-slate-200 rounded p-2 text-xs"
                        value={newRevAction.horizon}
                        onChange={e => setNewRevAction({...newRevAction, horizon: e.target.value as any})}
                     >
                        <option value="CURTO">Curto Prazo</option>
                        <option value="MEDIO">Médio Prazo</option>
                        <option value="LONGO">Longo Prazo</option>
                     </select>
                 </div>
                 <button onClick={() => handleAdd('REV')} className="w-full py-2 bg-emerald-600 text-white rounded font-bold text-xs hover:bg-emerald-700 uppercase">Adicionar Receita</button>
             </div>
         </div>

      </div>
    </div>
  );
};

const ActionCard: React.FC<{ action: ActionItem, onDelete: () => void }> = ({ action, onDelete }) => (
    <div className="bg-slate-50 p-3 rounded border border-slate-200 flex justify-between items-start group animate-in fade-in">
        <div>
            <p className="text-sm font-bold text-slate-800">{action.title}</p>
            {action.description && <p className="text-xs text-slate-500 mt-1">{action.description}</p>}
            <div className="flex gap-2 mt-2">
                <span className="text-[10px] uppercase font-bold text-slate-500 bg-white px-1.5 rounded border border-slate-200">{action.horizon}</span>
                <span className={`text-[10px] uppercase font-bold px-1.5 rounded border ${IMPACT_COLORS[action.impact]}`}>
                    {IMPACT_LABELS[action.impact]} IMPACTO
                </span>
            </div>
        </div>
        <button onClick={onDelete} className="text-slate-300 hover:text-rose-500"><Trash2 size={14} /></button>
    </div>
);