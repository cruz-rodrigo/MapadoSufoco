
export type TransactionType = 'IN' | 'OUT';

export enum Category {
  // --- ENTRADAS (INFLOW) ---
  REV_SALES = 'Receita de Vendas / Serviços',
  REV_ASSET_SALE = 'Venda de Ativo Imobilizado',
  REV_FINANCIAL = 'Rendimentos Financeiros',
  REV_LOAN = 'Empréstimo Obtido (Entrada)',
  REV_CAPITAL = 'Aporte de Capital',
  OTHER_IN = 'Outras Entradas',

  // --- SAÍDAS (OUTFLOW) ---
  COST_GOODS = 'Fornecedores (Matéria-Prima/Produtos)',
  COST_TAXES_SALES = 'Impostos s/ Venda (Simples/ICMS/ISS)',
  COST_COMMISSION = 'Comissões de Venda',
  COST_FREIGHT = 'Fretes / Logística de Entrega',
  COST_MARKETING_PERFORMANCE = 'Marketing de Performance (Ads)',

  EXP_PAYROLL = 'Folha de Pagamento (Salários)',
  EXP_PAYROLL_TAXES = 'Encargos Trabalhistas (FGTS/INSS)',
  EXP_BENEFITS = 'Benefícios (VR/VT/Saúde)',
  EXP_PRO_SERVICES = 'Serviços de Terceiros e Consultorias',
  EXP_OCCUPANCY = 'Ocupação (Aluguel/Cond/IPTU)',
  EXP_UTILITIES = 'Utilidades (Energia/Água/Tel/Internet)',
  EXP_SOFTWARE = 'Software / Licenças / TI',
  EXP_MAINTENANCE = 'Manutenção e Conservação',
  EXP_GENERAL_ADMIN = 'Despesas Administrativas / Escritório',
  EXP_TRAVEL = 'Viagens e Representações',

  EXP_BANK_FEES = 'Tarifas Bancárias',
  EXP_LOAN_INTEREST = 'Juros de Empréstimos/Mora',
  EXP_TAXES_PROFIT = 'Impostos s/ Lucro (IRPJ/CSLL)',

  OUT_DEBT_AMORTIZATION = 'Amortização de Principal (Dívida)',
  OUT_CAPEX = 'Investimentos (Capex/Equipamentos)',
  OUT_WITHDRAWAL = 'Retirada de Sócios (Lucros)',
  OTHER_OUT = 'Outras Saídas',

  // --- NEUTRO ---
  TRANSFER = 'Transferência entre Contas',
  UNCATEGORIZED = 'A Classificar'
}

export type ClientDocumentType = 'CNPJ' | 'CPF' | 'ESTRANGEIRA';

export type ClientStatus = 
  | 'SEM_DADOS' 
  | 'IMPORTADO' 
  | 'CLASSIFICADO' 
  | 'DIVIDAS_PREENCHIDAS' 
  | 'PROJECAO_CONCLUIDA';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export type CashFlowNature = 'OPERATIONAL' | 'INVESTING' | 'FINANCING';

export interface ProjectionData {
  revenue: number;
  variableCost: number;
  fixedCost: number;
  financialCost: number;
  investments: number;
  initialBalance: number;
  fundraising: number;
  horizonDays: number;
  updatedAt: string;
}

export interface WorkingCapitalData {
  pmr: number;
  pmp: number;
}

export interface Client {
  id: string;
  name: string;
  sector: string;
  documentType: ClientDocumentType;
  cnpj: string; 
  contactName: string;
  contactRole?: string;
  createdAt: string;
  
  status: ClientStatus;
  lastRiskLevel?: RiskLevel;
  lastAnalysisAt?: string; // ISO
  reportNotes?: string; // Parecer do consultor persistido
  
  // Persisted Projection State
  projectionData?: ProjectionData;
  workingCapitalData?: WorkingCapitalData;
}

export interface Transaction {
  id: string;
  clientId: string;
  date: string; // ISO YYYY-MM-DD
  description: string;
  value: number; // Always positive magnitude
  type: TransactionType;
  category: Category;
  isAutoCategorized?: boolean;
  nature?: CashFlowNature;
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

export interface ActionItem {
  id: string;
  clientId: string;
  actionType: 'REV' | 'COST'; // Explicit field to fix classification bug
  relatedCategory?: Category;
  title: string;
  description?: string;
  impact: 'LOW' | 'MEDIUM' | 'HIGH';
  horizon: 'CURTO' | 'MEDIO' | 'LONGO';
}
