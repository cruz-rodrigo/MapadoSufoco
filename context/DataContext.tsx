import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Client, Transaction, Debt, Category, ClientStatus } from '../types';
import { generateMockClients, generateMockDebts, generateMockTransactions } from '../constants';

interface DataContextType {
  clients: Client[];
  transactions: Transaction[];
  debts: Debt[];
  addClient: (client: Client) => void;
  updateClientStatus: (clientId: string, status: ClientStatus) => void;
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

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from LocalStorage on mount
  useEffect(() => {
    try {
      const storedClients = localStorage.getItem(`${STORAGE_KEY_PREFIX}.clients`);
      const storedTxs = localStorage.getItem(`${STORAGE_KEY_PREFIX}.transactions`);
      const storedDebts = localStorage.getItem(`${STORAGE_KEY_PREFIX}.debts`);

      if (storedClients) setClients(JSON.parse(storedClients));
      if (storedTxs) setTransactions(JSON.parse(storedTxs));
      if (storedDebts) setDebts(JSON.parse(storedDebts));
      
      setIsLoaded(true);
    } catch (e) {
      console.error("Failed to load data from local storage", e);
      setIsLoaded(true);
    }
  }, []);

  // Save to LocalStorage whenever state changes (only after initial load)
  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem(`${STORAGE_KEY_PREFIX}.clients`, JSON.stringify(clients));
  }, [clients, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem(`${STORAGE_KEY_PREFIX}.transactions`, JSON.stringify(transactions));
  }, [transactions, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem(`${STORAGE_KEY_PREFIX}.debts`, JSON.stringify(debts));
  }, [debts, isLoaded]);

  const addClient = (client: Client) => {
    setClients(prev => [...prev, client]);
  };

  const updateClientStatus = (clientId: string, status: ClientStatus) => {
    setClients(prev => prev.map(c => c.id === clientId ? { ...c, status } : c));
  };

  const addTransactions = (txs: Transaction[]) => {
    setTransactions(prev => [...prev, ...txs]);
    // Automatically update status if it's the first import
    if (txs.length > 0) {
        updateClientStatus(txs[0].clientId, 'IMPORTADO');
    }
  };

  const updateTransactionCategory = (txId: string, category: Category) => {
    setTransactions(prev => prev.map(t => t.id === txId ? { ...t, category, isAutoCategorized: false } : t));
  };

  const bulkUpdateCategory = (txIds: string[], category: Category) => {
    setTransactions(prev => prev.map(t => txIds.includes(t.id) ? { ...t, category, isAutoCategorized: false } : t));
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
      if (t.category !== Category.UNCATEGORIZED) return t; // Skip already categorized
      
      let newCat = t.category;
      const desc = t.description.toUpperCase();

      if (desc.includes('FOLHA') || desc.includes('SALARIO') || desc.includes('PAGAMENTO')) newCat = Category.PAYROLL;
      else if (desc.includes('POSTO') || desc.includes('GASOLINA') || desc.includes('COMBUSTIVEL')) newCat = Category.LOGISTICS;
      else if (desc.includes('ENERGIA') || desc.includes('LUZ') || desc.includes('AGUA') || desc.includes('INTERNET')) newCat = Category.UTILITIES;
      else if (desc.includes('ALUGUEL') || desc.includes('CONDOMINIO')) newCat = Category.RENT;
      else if (desc.includes('IMPOSTO') || desc.includes('DAS') || desc.includes('DARF')) newCat = Category.TAXES;
      else if (desc.includes('FORNECEDOR')) newCat = Category.SUPPLIERS_OTHER;
      else if (desc.includes('EMPRESTIMO') || desc.includes('FINANCIAMENTO')) newCat = Category.DEBT_AMORTIZATION;
      else if (desc.includes('TARIFA') || desc.includes('IOF') || desc.includes('CESTA')) newCat = Category.BANK_FEES;
      else if (desc.includes('RECEBIMENTO') || desc.includes('PIX RECEBIDO') || desc.includes('TED RECEBIDA')) newCat = Category.SALES;

      return { ...t, category: newCat, isAutoCategorized: newCat !== t.category };
    }));
  };

  const resetApplication = () => {
    setClients([]);
    setTransactions([]);
    setDebts([]);
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}.clients`);
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}.transactions`);
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}.debts`);
  };

  const loadDemoData = () => {
    const mockClients = generateMockClients().map(c => ({...c, status: 'PROJECAO_CONCLUIDA' as ClientStatus}));
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