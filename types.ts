export type TransactionType = 'IN' | 'OUT';

export enum Category {
  // Entradas
  SALES = 'Receitas de Venda',
  FINANCIAL_IN = 'Receitas Financeiras',
  OTHER_IN = 'Outras Entradas',
  // Saídas
  PAYROLL = 'Folha de Pagamento',
  TAXES_PAYROLL = 'Encargos s/ Folha',
  SUPPLIERS_CRITICAL = 'Fornecedores Críticos',
  SUPPLIERS_OTHER = 'Outros Fornecedores',
  TAXES = 'Tributos',
  RENT = 'Aluguel',
  MAINTENANCE = 'Manutenção',
  UTILITIES = 'Energia / Utilidades',
  BANK_FEES = 'Juros / Tarifas',
  DEBT_AMORTIZATION = 'Amortização de Dívida',
  OWNER_WITHDRAWAL = 'Retirada de Sócios',
  MARKETING = 'Marketing',
  LOGISTICS = 'Logística',
  OTHER_OUT = 'Outras Saídas',
  UNCATEGORIZED = 'A Classificar'
}

export type ClientStatus = 'SEM_DADOS' | 'IMPORTADO' | 'CLASSIFICADO' | 'DIVIDAS_PREENCHIDAS' | 'PROJECAO_CONCLUIDA';

export interface Client {
  id: string;
  name: string;
  sector: string;
  cnpj: string;
  contactName: string;
  contactRole?: string;
  createdAt: string;
  status: ClientStatus;
}

export interface Transaction {
  id: string;
  clientId: string;
  date: string;
  description: string;
  value: number; // Always positive magnitude
  type: TransactionType;
  category: Category;
  isAutoCategorized?: boolean;
}

export type DebtType = 'Empréstimo' | 'FIDC' | 'Fornecedor' | 'Cartão' | 'Outro';

export interface Debt {
  id: string;
  clientId: string;
  institution: string;
  type: DebtType;
  balance: number;
  monthlyRate: number; // percentage
  dueDate?: string;
  monthlyPayment?: number;
}

export interface CashRiskAnalysis {
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  projectedBalance30d: number;
  burnRate: number;
  daysRunway: number;
}