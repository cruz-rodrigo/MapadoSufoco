import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Client, Transaction, Debt, Category } from '../types';
import { generateMockClients, generateMockDebts, generateMockTransactions } from '../constants';

interface DataContextType {
  clients: Client[];
  transactions: Transaction[];
  debts: Debt[];
  addClient: (client: Client) => void;
  addTransactions: (txs: Transaction[]) => void;
  updateTransactionCategory: (txId: string, category: Category) => void;
  addDebt: (debt: Debt) => void;
  getTransactionsByClient: (clientId: string) => Transaction[];
  getDebtsByClient: (clientId: string) => Debt[];
  applyAutoClassification: (clientId: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);

  // Load initial mock data
  useEffect(() => {
    const initialClients = generateMockClients();
    setClients(initialClients);
    
    // Generate data for the first client for demo purposes
    if (initialClients.length > 0) {
      const demoClientId = initialClients[0].id;
      setTransactions(generateMockTransactions(demoClientId));
      setDebts(generateMockDebts(demoClientId));
    }
  }, []);

  const addClient = (client: Client) => {
    setClients(prev => [...prev, client]);
  };

  const addTransactions = (txs: Transaction[]) => {
    setTransactions(prev => [...prev, ...txs]);
  };

  const updateTransactionCategory = (txId: string, category: Category) => {
    setTransactions(prev => prev.map(t => t.id === txId ? { ...t, category } : t));
  };

  const addDebt = (debt: Debt) => {
    setDebts(prev => [...prev, debt]);
  };

  const getTransactionsByClient = (clientId: string) => {
    return transactions.filter(t => t.clientId === clientId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const getDebtsByClient = (clientId: string) => {
    return debts.filter(d => d.clientId === clientId);
  };

  const applyAutoClassification = (clientId: string) => {
    setTransactions(prev => prev.map(t => {
      if (t.clientId !== clientId) return t;
      
      let newCat = t.category;
      const desc = t.description.toUpperCase();

      if (desc.includes('FOLHA') || desc.includes('SALARIO')) newCat = Category.PAYROLL;
      else if (desc.includes('POSTO') || desc.includes('GASOLINA')) newCat = Category.LOGISTICS;
      else if (desc.includes('ENERGIA') || desc.includes('LUZ')) newCat = Category.UTILITIES;
      else if (desc.includes('ALUGUEL')) newCat = Category.RENT;
      else if (desc.includes('IMPOSTO') || desc.includes('DAS')) newCat = Category.TAXES;

      return { ...t, category: newCat, isAutoCategorized: newCat !== t.category };
    }));
  };

  return (
    <DataContext.Provider value={{
      clients,
      transactions,
      debts,
      addClient,
      addTransactions,
      updateTransactionCategory,
      addDebt,
      getTransactionsByClient,
      getDebtsByClient,
      applyAutoClassification
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