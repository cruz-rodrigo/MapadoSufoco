
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Client, Transaction, Debt, Category, ClientStatus, RiskLevel, ActionItem, ProjectionData, WorkingCapitalData } from '../types';
import { generateMockClients, generateMockDebts, generateMockTransactions, CATEGORY_NATURE } from '../constants';

const STORAGE_PREFIX = 'mapaSufoco.v1';
const STORAGE_KEYS = {
  clients: `${STORAGE_PREFIX}.clients`,
  transactions: `${STORAGE_PREFIX}.transactions`,
  debts: `${STORAGE_PREFIX}.debts`,
  actions: `${STORAGE_PREFIX}.actions`,
  schemaVersion: `${STORAGE_PREFIX}.schemaVersion`,
};
const CURRENT_SCHEMA_VERSION = 1;

interface DataContextType {
  clients: Client[];
  transactions: Transaction[];
  debts: Debt[];
  actions: ActionItem[];
  
  addClient: (client: Client) => void;
  updateClientStatus: (clientId: string, overrideStatus?: ClientStatus) => void;
  updateClientProjectionMeta: (clientId: string, risk: RiskLevel) => void;
  updateClientProjectionData: (clientId: string, data: ProjectionData) => void;
  updateClientWorkingCapital: (clientId: string, data: WorkingCapitalData) => void;
  updateClientNotes: (clientId: string, notes: string) => void;
  
  addTransactions: (txs: Transaction[]) => void;
  updateTransactionCategory: (txId: string, category: Category) => void;
  bulkUpdateCategory: (txIds: string[], category: Category) => void;
  applyAutoClassification: (clientId: string) => void;
  
  addDebt: (debt: Debt) => void;
  removeDebt: (debtId: string) => void;
  
  addAction: (action: ActionItem) => void;
  removeAction: (actionId: string) => void;
  
  getTransactionsByClient: (clientId: string) => Transaction[];
  getDebtsByClient: (clientId: string) => Debt[];
  getActionsByClient: (clientId: string) => ActionItem[];
  
  resetAll: () => void;
  loadDemoData: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // 1. HYDRATION
  useEffect(() => {
    try {
      const version = localStorage.getItem(STORAGE_KEYS.schemaVersion);
      
      if (version && Number(version) === CURRENT_SCHEMA_VERSION) {
        const storedClients = localStorage.getItem(STORAGE_KEYS.clients);
        const storedTxs = localStorage.getItem(STORAGE_KEYS.transactions);
        const storedDebts = localStorage.getItem(STORAGE_KEYS.debts);
        const storedActions = localStorage.getItem(STORAGE_KEYS.actions);

        if (storedClients) setClients(JSON.parse(storedClients));
        if (storedTxs) setTransactions(JSON.parse(storedTxs));
        if (storedDebts) setDebts(JSON.parse(storedDebts));
        if (storedActions) setActions(JSON.parse(storedActions));
      } else {
        // First Run or Breaking Change
        Object.values(STORAGE_KEYS).forEach(k => localStorage.removeItem(k));
        localStorage.setItem(STORAGE_KEYS.schemaVersion, String(CURRENT_SCHEMA_VERSION));
      }
      setIsLoaded(true);
    } catch (e) {
      console.error("Storage Error", e);
      setIsLoaded(true);
    }
  }, []);

  // 2. PERSISTENCE
  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem(STORAGE_KEYS.clients, JSON.stringify(clients));
  }, [clients, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem(STORAGE_KEYS.transactions, JSON.stringify(transactions));
  }, [transactions, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem(STORAGE_KEYS.debts, JSON.stringify(debts));
  }, [debts, isLoaded]);
  
  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem(STORAGE_KEYS.actions, JSON.stringify(actions));
  }, [actions, isLoaded]);

  // 3. LOGIC HELPERS
  const recomputeClientStatus = (clientId: string): ClientStatus => {
    const clientTx = transactions.filter(t => t.clientId === clientId);
    const clientDebts = debts.filter(d => d.clientId === clientId);

    if (clientTx.length === 0 && clientDebts.length === 0) return 'SEM_DADOS';

    const hasImported = clientTx.length > 0;
    const hasUncategorized = clientTx.some(t => t.category === Category.UNCATEGORIZED);
    const hasDebts = clientDebts.length > 0;
    
    // Strict rule: If uncategorized, force IMPORTADO status, do not allow 'PROJECAO_CONCLUIDA'
    if (hasImported && hasUncategorized) return 'IMPORTADO';

    // Check projection status (preserved if set AND clean data)
    const client = clients.find(c => c.id === clientId);
    if (client?.status === 'PROJECAO_CONCLUIDA') return 'PROJECAO_CONCLUIDA';

    if (hasImported && !hasUncategorized && !hasDebts) return 'CLASSIFICADO';
    if (hasImported && !hasUncategorized && hasDebts) return 'DIVIDAS_PREENCHIDAS';

    return 'SEM_DADOS';
  };

  const updateClientStatus = (clientId: string, overrideStatus?: ClientStatus) => {
    setClients(prev => prev.map(c => {
        if (c.id !== clientId) return c;
        const newStatus = overrideStatus ?? recomputeClientStatus(clientId);
        return { ...c, status: newStatus };
    }));
  };

  const updateClientProjectionMeta = (clientId: string, risk: RiskLevel) => {
    setClients(prev => prev.map(c => c.id === clientId ? { 
        ...c, 
        status: 'PROJECAO_CONCLUIDA',
        lastRiskLevel: risk,
        lastAnalysisAt: new Date().toISOString()
    } : c));
  };

  const updateClientProjectionData = (clientId: string, data: ProjectionData) => {
    setClients(prev => prev.map(c => c.id === clientId ? {
        ...c,
        projectionData: data
    } : c));
  };

  const updateClientWorkingCapital = (clientId: string, data: WorkingCapitalData) => {
    setClients(prev => prev.map(c => c.id === clientId ? {
        ...c,
        workingCapitalData: data
    } : c));
  };

  const updateClientNotes = (clientId: string, notes: string) => {
    setClients(prev => prev.map(c => c.id === clientId ? { ...c, reportNotes: notes } : c));
  };

  // 4. ACTIONS
  const addClient = (client: Client) => {
    setClients(prev => [...prev, client]);
  };

  const addTransactions = (txs: Transaction[]) => {
    if (txs.length === 0) return;
    const clientId = txs[0].clientId;
    setTransactions(prev => [...prev, ...txs]);
    updateClientStatus(clientId, 'IMPORTADO');
  };

  const updateTransactionCategory = (txId: string, category: Category) => {
    setTransactions(prev => {
        const updated = prev.map(t => {
            if (t.id !== txId) return t;
            return { 
                ...t, 
                category, 
                nature: CATEGORY_NATURE[category], 
                isAutoCategorized: false 
            };
        });
        
        // Optimistic status check
        const tx = prev.find(t => t.id === txId);
        if (tx) {
           const clientTxs = updated.filter(t => t.clientId === tx.clientId);
           const pending = clientTxs.filter(t => t.category === Category.UNCATEGORIZED);
           // Delay to allow state update
           if (pending.length === 0) {
                // If clean, we might need to upgrade status, but let's be careful
                // Use default recompute logic via timeout
                setTimeout(() => updateClientStatus(tx.clientId), 0);
           }
        }
        return updated;
    });
  };

  const bulkUpdateCategory = (txIds: string[], category: Category) => {
    setTransactions(prev => prev.map(t => {
        if (!txIds.includes(t.id)) return t;
        return {
            ...t,
            category,
            nature: CATEGORY_NATURE[category],
            isAutoCategorized: false
        };
    }));
    const sampleId = txIds[0];
    if (sampleId) {
        const tx = transactions.find(t => t.id === sampleId);
        if (tx) setTimeout(() => updateClientStatus(tx.clientId), 500);
    }
  };

  const applyAutoClassification = (clientId: string) => {
    setTransactions(prev => prev.map(t => {
      if (t.clientId !== clientId) return t;
      if (t.category !== Category.UNCATEGORIZED) return t; 
      
      let newCat = t.category;
      const desc = t.description.toUpperCase();

      if (desc.includes('FOLHA') || desc.includes('SALARIO') || desc.includes('PAGAMENTO')) newCat = Category.EXP_PAYROLL;
      else if (desc.includes('POSTO') || desc.includes('GASOLINA') || desc.includes('COMBUSTIVEL')) newCat = Category.COST_FREIGHT;
      else if (desc.includes('ENERGIA') || desc.includes('LUZ') || desc.includes('AGUA') || desc.includes('INTERNET')) newCat = Category.EXP_UTILITIES;
      else if (desc.includes('ALUGUEL') || desc.includes('CONDOMINIO')) newCat = Category.EXP_OCCUPANCY;
      else if (desc.includes('IMPOSTO') || desc.includes('DAS') || desc.includes('DARF')) newCat = Category.COST_TAXES_SALES;
      else if (desc.includes('FORNECEDOR')) newCat = Category.COST_GOODS;
      else if (desc.includes('EMPRESTIMO') || desc.includes('FINANCIAMENTO')) newCat = Category.OUT_DEBT_AMORTIZATION;
      else if (desc.includes('TARIFA') || desc.includes('IOF') || desc.includes('CESTA')) newCat = Category.EXP_BANK_FEES;
      else if (desc.includes('RECEBIMENTO') || desc.includes('PIX RECEBIDO') || desc.includes('TED RECEBIDA')) newCat = Category.REV_SALES;

      return { 
          ...t, 
          category: newCat, 
          nature: CATEGORY_NATURE[newCat], 
          isAutoCategorized: newCat !== t.category 
      };
    }));
  };

  const addDebt = (debt: Debt) => {
    setDebts(prev => [...prev, debt]);
    updateClientStatus(debt.clientId, 'DIVIDAS_PREENCHIDAS');
  };
  
  const removeDebt = (debtId: string) => {
    setDebts(prev => prev.filter(d => d.id !== debtId));
  };

  const addAction = (action: ActionItem) => {
    setActions(prev => [...prev, action]);
  };

  const removeAction = (actionId: string) => {
    setActions(prev => prev.filter(a => a.id !== actionId));
  };

  const getTransactionsByClient = (clientId: string) => transactions.filter(t => t.clientId === clientId);
  const getDebtsByClient = (clientId: string) => debts.filter(d => d.clientId === clientId);
  const getActionsByClient = (clientId: string) => actions.filter(a => a.clientId === clientId);

  const resetAll = () => {
    setClients([]);
    setTransactions([]);
    setDebts([]);
    setActions([]);
    Object.values(STORAGE_KEYS).forEach(k => localStorage.removeItem(k));
    localStorage.setItem(STORAGE_KEYS.schemaVersion, String(CURRENT_SCHEMA_VERSION));
  };

  const loadDemoData = () => {
    const mockClients = generateMockClients(); 
    // Force status to something lower if we want to force classification step
    // But since mocks have uncategorized items (drain), logic will handle it on next update
    const clientId = mockClients[0].id;
    const mockTxs = generateMockTransactions(clientId);
    const mockDebts = generateMockDebts(clientId);
    
    setClients(mockClients);
    setTransactions(mockTxs);
    setDebts(mockDebts);
    
    setActions([{
        id: 'act-1', clientId, actionType: 'COST', title: 'Renegociar Banco do Brasil', description: 'Pedir carência de 6 meses', impact: 'HIGH', horizon: 'CURTO'
    }]);

    // Force check status immediately after load to ensure UI reflects data reality
    setTimeout(() => {
        setClients(prev => prev.map(c => {
             const hasUncat = mockTxs.some(t => t.category === Category.UNCATEGORIZED);
             if (c.id === clientId && hasUncat) {
                 return { ...c, status: 'IMPORTADO' };
             }
             return c;
        }));
    }, 100);
  };

  return (
    <DataContext.Provider value={{
      clients, transactions, debts, actions,
      addClient, updateClientStatus, updateClientProjectionMeta, updateClientProjectionData, updateClientWorkingCapital, updateClientNotes,
      addTransactions, updateTransactionCategory, bulkUpdateCategory, applyAutoClassification,
      addDebt, removeDebt,
      addAction, removeAction,
      getTransactionsByClient, getDebtsByClient, getActionsByClient,
      resetAll, loadDemoData
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within DataProvider');
  return context;
};
