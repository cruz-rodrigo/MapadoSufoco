import { Category, Client, Transaction, Debt } from './types';

// Organized for Dropdowns (Simple list for Bulk actions, but UI should group them)
export const INFLOW_CATEGORIES = [
  Category.REV_SALES,
  Category.REV_FINANCIAL,
  Category.REV_ASSET_SALE,
  Category.REV_LOAN,
  Category.REV_CAPITAL,
  Category.TRANSFER,
  Category.OTHER_IN
];

export const OUTFLOW_CATEGORIES = [
  // Variable
  Category.COST_GOODS,
  Category.COST_TAXES_SALES,
  Category.COST_FREIGHT,
  Category.COST_COMMISSION,
  Category.COST_MARKETING_PERFORMANCE,
  // Fixed
  Category.EXP_PAYROLL,
  Category.EXP_PAYROLL_TAXES,
  Category.EXP_BENEFITS,
  Category.EXP_OCCUPANCY,
  Category.EXP_UTILITIES,
  Category.EXP_PRO_SERVICES,
  Category.EXP_SOFTWARE,
  Category.EXP_MAINTENANCE,
  Category.EXP_GENERAL_ADMIN,
  Category.EXP_TRAVEL,
  // Financial
  Category.EXP_BANK_FEES,
  Category.EXP_LOAN_INTEREST,
  Category.EXP_TAXES_PROFIT,
  // Non-Operating
  Category.OUT_DEBT_AMORTIZATION,
  Category.OUT_CAPEX,
  Category.OUT_WITHDRAWAL,
  Category.TRANSFER,
  Category.OTHER_OUT,
  Category.UNCATEGORIZED
];

// Grouping helper for UI - THIS IS THE "SEXY" PART FOR UX
export const CATEGORY_GROUPS = {
  INFLOW: {
    'Receitas Operacionais (Vendas)': [Category.REV_SALES],
    'Outras Entradas / Financeiro': [Category.REV_FINANCIAL, Category.REV_ASSET_SALE, Category.REV_LOAN, Category.REV_CAPITAL, Category.OTHER_IN],
    'Movimentação Interna': [Category.TRANSFER]
  },
  OUTFLOW: {
    'Custos Variáveis (CMV - Atrelado à Venda)': [Category.COST_GOODS, Category.COST_TAXES_SALES, Category.COST_FREIGHT, Category.COST_COMMISSION, Category.COST_MARKETING_PERFORMANCE],
    'Despesas Fixas (OpEx - Custo de Existir)': [Category.EXP_PAYROLL, Category.EXP_PAYROLL_TAXES, Category.EXP_BENEFITS, Category.EXP_OCCUPANCY, Category.EXP_UTILITIES, Category.EXP_PRO_SERVICES, Category.EXP_SOFTWARE, Category.EXP_MAINTENANCE, Category.EXP_GENERAL_ADMIN, Category.EXP_TRAVEL],
    'Despesas Financeiras (Bancos/Juros)': [Category.EXP_BANK_FEES, Category.EXP_LOAN_INTEREST, Category.EXP_TAXES_PROFIT],
    'Não Operacional / Investimentos': [Category.OUT_DEBT_AMORTIZATION, Category.OUT_CAPEX, Category.OUT_WITHDRAWAL, Category.OTHER_OUT],
    'Movimentação Interna': [Category.TRANSFER]
  }
};

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
    documentType: 'CNPJ',
    cnpj: '12.345.678/0001-90',
    contactName: 'Sr. Roberto',
    contactRole: 'Sócio Proprietário',
    createdAt: new Date().toISOString(),
    status: 'PROJECAO_CONCLUIDA'
  },
  {
    id: '2',
    name: 'Consultório Dr. André',
    sector: 'Profissional Liberal / Pessoa Física',
    documentType: 'CPF',
    cnpj: '123.456.789-00',
    contactName: 'André',
    contactRole: 'Médico',
    createdAt: new Date().toISOString(),
    status: 'PROJECAO_CONCLUIDA'
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
        category: Category.REV_SALES
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
        category: Category.EXP_PAYROLL
      });
       transactions.push({
        id: `t-out-tax-pay-${i}`,
        clientId,
        date: dateStr,
        description: 'DARF PREVIDENCIARIO',
        value: 4500,
        type: 'OUT',
        category: Category.EXP_PAYROLL_TAXES
      });
    }

    // Suppliers (COGS)
    if (i % 7 === 2) {
      transactions.push({
        id: `t-out-supp-${i}`,
        clientId,
        date: dateStr,
        description: 'FORNECEDOR MATERIA PRIMA',
        value: 3200 + Math.random() * 1000,
        type: 'OUT',
        category: Category.COST_GOODS
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
      category: Category.COST_FREIGHT
    });
    
    // "Ralo" - Hidden drain simulation
    if (i % 10 === 0) {
       transactions.push({
        id: `t-out-drain-${i}`,
        clientId,
        date: dateStr,
        description: 'ASSINATURA SOFTWARE DESCONHECIDO',
        value: 850,
        type: 'OUT',
        category: Category.EXP_SOFTWARE // Needs classification check usually
      });
    }
  }
  return transactions;
};