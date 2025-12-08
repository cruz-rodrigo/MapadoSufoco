import { Category, Client, Transaction, Debt, CashFlowNature } from './types';

// Organized for Dropdowns
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

// Grouping helper for UI
export const CATEGORY_GROUPS = {
  INFLOW: {
    'Receitas Operacionais (Vendas)': [Category.REV_SALES],
    'Outras Entradas / Financeiro': [Category.REV_FINANCIAL, Category.REV_ASSET_SALE, Category.REV_LOAN, Category.REV_CAPITAL, Category.OTHER_IN],
    'Movimentação Interna': [Category.TRANSFER]
  },
  OUTFLOW: {
    'Custos Variáveis (CMV)': [Category.COST_GOODS, Category.COST_TAXES_SALES, Category.COST_FREIGHT, Category.COST_COMMISSION, Category.COST_MARKETING_PERFORMANCE],
    'Despesas Fixas (OpEx)': [Category.EXP_PAYROLL, Category.EXP_PAYROLL_TAXES, Category.EXP_BENEFITS, Category.EXP_OCCUPANCY, Category.EXP_UTILITIES, Category.EXP_PRO_SERVICES, Category.EXP_SOFTWARE, Category.EXP_MAINTENANCE, Category.EXP_GENERAL_ADMIN, Category.EXP_TRAVEL],
    'Despesas Financeiras': [Category.EXP_BANK_FEES, Category.EXP_LOAN_INTEREST, Category.EXP_TAXES_PROFIT],
    'Não Operacional / Investimentos': [Category.OUT_DEBT_AMORTIZATION, Category.OUT_CAPEX, Category.OUT_WITHDRAWAL, Category.OTHER_OUT],
    'Movimentação Interna': [Category.TRANSFER]
  }
};

export const CATEGORY_NATURE: Record<Category, CashFlowNature> = {
  // ENTRADAS
  [Category.REV_SALES]: 'OPERATIONAL',
  [Category.REV_ASSET_SALE]: 'INVESTING',
  [Category.REV_FINANCIAL]: 'FINANCING',
  [Category.REV_LOAN]: 'FINANCING',
  [Category.REV_CAPITAL]: 'FINANCING',
  [Category.OTHER_IN]: 'OPERATIONAL',
  
  // SAÍDAS
  [Category.COST_GOODS]: 'OPERATIONAL',
  [Category.COST_TAXES_SALES]: 'OPERATIONAL',
  [Category.COST_COMMISSION]: 'OPERATIONAL',
  [Category.COST_FREIGHT]: 'OPERATIONAL',
  [Category.COST_MARKETING_PERFORMANCE]: 'OPERATIONAL',
  [Category.EXP_PAYROLL]: 'OPERATIONAL',
  [Category.EXP_PAYROLL_TAXES]: 'OPERATIONAL',
  [Category.EXP_BENEFITS]: 'OPERATIONAL',
  [Category.EXP_PRO_SERVICES]: 'OPERATIONAL',
  [Category.EXP_OCCUPANCY]: 'OPERATIONAL',
  [Category.EXP_UTILITIES]: 'OPERATIONAL',
  [Category.EXP_SOFTWARE]: 'OPERATIONAL',
  [Category.EXP_MAINTENANCE]: 'OPERATIONAL',
  [Category.EXP_GENERAL_ADMIN]: 'OPERATIONAL',
  [Category.EXP_TRAVEL]: 'OPERATIONAL',
  
  [Category.EXP_BANK_FEES]: 'FINANCING',
  [Category.EXP_LOAN_INTEREST]: 'FINANCING',
  [Category.EXP_TAXES_PROFIT]: 'OPERATIONAL',
  
  [Category.OUT_DEBT_AMORTIZATION]: 'FINANCING',
  [Category.OUT_CAPEX]: 'INVESTING',
  [Category.OUT_WITHDRAWAL]: 'FINANCING',
  [Category.OTHER_OUT]: 'OPERATIONAL',
  
  [Category.TRANSFER]: 'OPERATIONAL', // Neutro, mas default
  [Category.UNCATEGORIZED]: 'OPERATIONAL'
};

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const formatCurrencyCompact = (value: number) => {
  if (value === 0) return formatCurrency(0);
  
  const absVal = Math.abs(value);
  const isNegative = value < 0;

  // Se for menor que 10k, mostra normal para precisão
  if (absVal < 10000) return formatCurrency(value);

  // Formata para k ou M
  let formatted = '';
  if (absVal < 1000000) {
    // Ex: 195.000 -> 195k
    formatted = (absVal / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + 'k';
  } else {
    // Ex: 1.500.000 -> 1.5M
    formatted = (absVal / 1000000).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + 'M';
  }

  return `${isNegative ? '-' : ''}R$ ${formatted}`;
};

export const formatPercent = (value: number) => {
  return `${value.toFixed(2)}%`;
};

// Mock Data Generators (Updated signatures for manual usage)
export const generateMockClients = (): Client[] => [
  {
    id: 'demo-1',
    name: 'Indústria Metalúrgica AçoForte',
    sector: 'Indústria Metalúrgica',
    documentType: 'CNPJ',
    cnpj: '12.345.678/0001-90',
    contactName: 'Sr. Roberto',
    contactRole: 'Sócio Proprietário',
    createdAt: new Date().toISOString(),
    status: 'PROJECAO_CONCLUIDA',
    lastRiskLevel: 'HIGH',
    lastAnalysisAt: new Date().toISOString()
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
        category: Category.REV_SALES,
        nature: CATEGORY_NATURE[Category.REV_SALES],
        isAutoCategorized: true
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
        category: Category.EXP_PAYROLL,
        nature: CATEGORY_NATURE[Category.EXP_PAYROLL],
        isAutoCategorized: true
      });
       transactions.push({
        id: `t-out-tax-pay-${i}`,
        clientId,
        date: dateStr,
        description: 'DARF PREVIDENCIARIO',
        value: 4500,
        type: 'OUT',
        category: Category.EXP_PAYROLL_TAXES,
        nature: CATEGORY_NATURE[Category.EXP_PAYROLL_TAXES],
        isAutoCategorized: true
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
        category: Category.COST_GOODS,
        nature: CATEGORY_NATURE[Category.COST_GOODS],
        isAutoCategorized: true
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
      category: Category.COST_FREIGHT,
      nature: CATEGORY_NATURE[Category.COST_FREIGHT],
      isAutoCategorized: true
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
        category: Category.UNCATEGORIZED,
        nature: 'OPERATIONAL',
        isAutoCategorized: false
      });
    }
  }
  return transactions;
};