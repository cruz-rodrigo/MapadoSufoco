import { Category, Client, Transaction, Debt } from './types';

export const INFLOW_CATEGORIES = [
  Category.SALES,
  Category.FINANCIAL_IN,
  Category.OTHER_IN
];

export const OUTFLOW_CATEGORIES = [
  Category.PAYROLL,
  Category.TAXES_PAYROLL,
  Category.SUPPLIERS_CRITICAL,
  Category.SUPPLIERS_OTHER,
  Category.TAXES,
  Category.RENT,
  Category.MAINTENANCE,
  Category.UTILITIES,
  Category.BANK_FEES,
  Category.DEBT_AMORTIZATION,
  Category.OWNER_WITHDRAWAL,
  Category.MARKETING,
  Category.LOGISTICS,
  Category.OTHER_OUT,
  Category.UNCATEGORIZED
];

// Helper to format currency BRL
export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const formatPercent = (value: number) => {
  return `${value.toFixed(2)}%`;
};

// Mock Data Generators
export const generateMockClients = (): Client[] => [
  {
    id: '1',
    name: 'Indústria Metalúrgica AçoForte',
    sector: 'Indústria Metalúrgica',
    cnpj: '12.345.678/0001-90',
    contactName: 'Sr. Roberto',
    contactRole: 'Sócio Proprietário',
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Transportadora Veloz',
    sector: 'Logística / Transportes',
    cnpj: '98.765.432/0001-10',
    contactName: 'Dona Maria',
    contactRole: 'Diretora Financeira',
    createdAt: new Date().toISOString()
  }
];

export const generateMockDebts = (clientId: string): Debt[] => [
  {
    id: `d-${Math.random()}`,
    clientId,
    institution: 'Banco do Brasil',
    type: 'Empréstimo',
    balance: 150000,
    monthlyRate: 1.8,
    monthlyPayment: 5200,
    dueDate: '2026-12-01'
  },
  {
    id: `d-${Math.random()}`,
    clientId,
    institution: 'FIDC Credit',
    type: 'FIDC',
    balance: 45000,
    monthlyRate: 3.5,
    monthlyPayment: 0,
    dueDate: '2024-05-15'
  }
];

export const generateMockTransactions = (clientId: string): Transaction[] => {
  const transactions: Transaction[] = [];
  const now = new Date();
  
  // Generate 90 days of data
  for (let i = 0; i < 90; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    // Regular Income
    if (i % 30 === 5) {
      transactions.push({
        id: `t-in-${i}`,
        clientId,
        date: dateStr,
        description: 'FATURAMENTO MENSAL CLIENTE X',
        value: 45000 + Math.random() * 5000,
        type: 'IN',
        category: Category.SALES
      });
    }

    // Payroll
    if (i % 30 === 5) {
       transactions.push({
        id: `t-out-pay-${i}`,
        clientId,
        date: dateStr,
        description: 'FOLHA PAGAMENTO',
        value: 18000,
        type: 'OUT',
        category: Category.PAYROLL
      });
    }

    // Random Expenses
    transactions.push({
      id: `t-out-rnd-${i}`,
      clientId,
      date: dateStr,
      description: 'POSTO DE GASOLINA',
      value: 200 + Math.random() * 300,
      type: 'OUT',
      category: Category.LOGISTICS
    });
    
    // "Ralo" - Hidden drain simulation
    if (i % 7 === 0) {
       transactions.push({
        id: `t-out-drain-${i}`,
        clientId,
        date: dateStr,
        description: 'ASSINATURA SOFTWARE DESCONHECIDO',
        value: 850,
        type: 'OUT',
        category: Category.OTHER_OUT // Needs classification
      });
    }
  }
  return transactions;
};
