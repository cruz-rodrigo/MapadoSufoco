import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Client, Transaction, Debt, Category, ClientStatus } from '../types';
import { generateMockClients, generateMockDebts, generateMockTransactions } from '../constants';

interface DataContextType {
  clients: Client[];
  transactions: Transaction[];
  debts: Debt[];
  addClient: (client: Client) => void;
  updateClientStatus: (clientId: string, status: ClientStatus) => void;
  updateClientProjectionMeta: (clientId: string, risk: 'LOW' | 'MEDIUM' | 'HIGH') => void;
  addTransactions: (txs: Transaction[]) => void;
  updateTransactionCategory: (txId: string, category: Category) => void;
  bulkUpdateCategory: (txIds: string[], category: Category) => void;
  addDebt: (debt: Debt) => void;
  removeDebt: (debtId: string) => void;
  getTransactionsByClient: (clientId: string) => Transaction[];
  getDebtsByClient: (clientId: string) => Debt[];
  applyAutoClassification: (clientId: string) => void;
  resetApplication: () => void;
  loadDemoData: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const STORAGE_KEY_PREFIX = 'mapaSufoco.v1';
const STORAGE_KEYS = {
  clients: `${STORAGE_KEY_PREFIX}.clients`,
  transactions: `${STORAGE_KEY_PREFIX}.transactions`,
  debts: `${STORAGE_KEY_PREFIX}.debts`,
  schemaVersion: `${STORAGE_KEY_PREFIX}.schemaVersion`,
};
const CURRENT_SCHEMA_VERSION = 1;

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from LocalStorage on mount
  useEffect(() => {
    try {
      const version = localStorage.getItem(STORAGE_KEYS.schemaVersion);
      
      // Only hydrate if version matches, otherwise we might have breaking changes
      if (version && Number(version) === CURRENT_SCHEMA_VERSION) {
        const storedClients = localStorage.getItem(STORAGE_KEYS.clients);
        const storedTxs = localStorage.getItem(STORAGE_KEYS.transactions);
        const storedDebts = localStorage.getItem(STORAGE_KEYS.debts);

        if (storedClients) setClients(JSON.parse(storedClients));
        if (storedTxs) setTransactions(JSON.parse(storedTxs));
        if (storedDebts) setDebts(JSON.parse(storedDebts));
      } else {
        // Init version
        localStorage.setItem(STORAGE_KEYS.schemaVersion, String(CURRENT_SCHEMA_VERSION));
      }
      setIsLoaded(true);
    } catch (e) {
      console.error("Failed to load data from local storage", e);
      setIsLoaded(true);
    }
  }, []);

  // Persistence Effects
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

  // --- Logic Helpers ---

  const checkStatusUpgrade = (clientId: string, currentStatus: ClientStatus, hasTxs: boolean, hasDebts: boolean): ClientStatus => {
     // Basic Funnel Logic
     if (currentStatus === 'PROJECAO_CONCLUIDA') return 'PROJECAO_CONCLUIDA';
     
     if (hasDebts && currentStatus !== 'DIVIDAS_PREENCHIDAS') return 'DIVIDAS_PREENCHIDAS';
     
     // Check classification status
     const clientTxs = transactions.filter(t => t.clientId === clientId); // NOTE: This uses current state closure
     const uncategorized = clientTxs.filter(t => t.category === Category.UNCATEGORIZED);
     
     if (hasTxs && uncategorized.length === 0 && currentStatus === 'IMPORTADO') return 'CLASSIFICADO';
     
     return currentStatus;
  }

  // --- Actions ---

  const addClient = (client: Client) => {
    setClients(prev => [...prev, client]);
  };

  const updateClientStatus = (clientId: string, status: ClientStatus) => {
    setClients(prev => prev.map(c => c.id === clientId ? { ...c, status } : c));
  };

  const updateClientProjectionMeta = (clientId: string, risk: 'LOW' | 'MEDIUM' | 'HIGH') => {
    setClients(prev => prev.map(c => c.id === clientId ? { 
        ...c, 
        status: 'PROJECAO_CONCLUIDA',
        lastRiskLevel: risk,
        lastAnalysisAt: new Date().toISOString()
    } : c));
  };

  const addTransactions = (txs: Transaction[]) => {
    if (txs.length === 0) return;
    const clientId = txs[0].clientId;
    setTransactions(prev => [...prev, ...txs]);
    updateClientStatus(clientId, 'IMPORTADO');
  };

  const updateTransactionCategory = (txId: string, category: Category) => {
    setTransactions(prev => {
        const updated = prev.map(t => t.id === txId ? { ...t, category, isAutoCategorized: false } : t);
        
        // Check if all categorized for this client to upgrade status
        const tx = prev.find(t => t.id === txId);
        if (tx) {
            const clientTxs = updated.filter(t => t.clientId === tx.clientId);
            const pending = clientTxs.filter(t => t.category === Category.UNCATEGORIZED);
            
            if (pending.length === 0) {
                 // We need to trigger this update safely. 
                 // For simplicity in V1, we'll do it via the useEffect on the ClassificationView or here via setClients
                 setTimeout(() => updateClientStatus(tx.clientId, 'CLASSIFICADO'), 0);
            }
        }
        return updated;
    });
  };

  const bulkUpdateCategory = (txIds: string[], category: Category) => {
    setTransactions(prev => {
        const updated = prev.map(t => txIds.includes(t.id) ? { ...t, category, isAutoCategorized: false } : t);
        // Status update logic similar to above could be implemented
        return updated;
    });
  };

  const addDebt = (debt: Debt) => {
    setDebts(prev => [...prev, debt]);
    updateClientStatus(debt.clientId, 'DIVIDAS_PREENCHIDAS');
  };
  
  const removeDebt = (debtId: string) => {
    setDebts(prev => prev.filter(d => d.id !== debtId));
  }

  const getTransactionsByClient = (clientId: string) => {
    return transactions.filter(t => t.clientId === clientId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const getDebtsByClient = (clientId: string) => {
    return debts.filter(d => d.clientId === clientId);
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

      return { ...t, category: newCat, isAutoCategorized: newCat !== t.category };
    }));
  };

  const resetApplication = () => {
    setClients([]);
    setTransactions([]);
    setDebts([]);
    localStorage.removeItem(STORAGE_KEYS.clients);
    localStorage.removeItem(STORAGE_KEYS.transactions);
    localStorage.removeItem(STORAGE_KEYS.debts);
    localStorage.setItem(STORAGE_KEYS.schemaVersion, String(CURRENT_SCHEMA_VERSION));
  };

  const loadDemoData = () => {
    const mockClients = generateMockClients().map(c => ({
        ...c, 
        status: 'PROJECAO_CONCLUIDA' as ClientStatus,
        lastAnalysisAt: new Date().toISOString(),
        lastRiskLevel: 'HIGH' as const
    }));
    setClients(mockClients);
    if (mockClients.length > 0) {
        setTransactions(generateMockTransactions(mockClients[0].id));
        setDebts(generateMockDebts(mockClients[0].id));
    }
  }

  return (
    <DataContext.Provider value={{
      clients,
      transactions,
      debts,
      addClient,
      updateClientStatus,
      updateClientProjectionMeta,
      addTransactions,
      updateTransactionCategory,
      bulkUpdateCategory,
      addDebt,
      removeDebt,
      getTransactionsByClient,
      getDebtsByClient,
      applyAutoClassification,
      resetApplication,
      loadDemoData
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