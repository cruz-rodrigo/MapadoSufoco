export type TransactionType = 'IN' | 'OUT';

export enum Category {
  // --- ENTRADAS (INFLOW) ---
  
  // Receita Operacional
  REV_SALES = 'Receita de Vendas / Serviços',
  REV_ASSET_SALE = 'Venda de Ativo Imobilizado',
  
  // Receita Não Operacional / Financeira
  REV_FINANCIAL = 'Rendimentos Financeiros',
  REV_LOAN = 'Empréstimo Obtido (Entrada)',
  REV_CAPITAL = 'Aporte de Capital',
  OTHER_IN = 'Outras Entradas',

  // --- SAÍDAS (OUTFLOW) ---

  // 1. Custos Variáveis (Afetam Margem de Contribuição)
  COST_GOODS = 'Fornecedores (Matéria-Prima/Produtos)',
  COST_TAXES_SALES = 'Impostos s/ Venda (Simples/ICMS/ISS)',
  COST_COMMISSION = 'Comissões de Venda',
  COST_FREIGHT = 'Fretes / Logística de Entrega',
  COST_MARKETING_PERFORMANCE = 'Marketing de Performance (Ads)',

  // 2. Despesas Fixas / Operacionais (OpEx)
  EXP_PAYROLL = 'Folha de Pagamento (Salários)',
  EXP_PAYROLL_TAXES = 'Encargos Trabalhistas (FGTS/INSS)',
  EXP_BENEFITS = 'Benefícios (VR/VT/Saúde)',
  EXP_PRO_SERVICES = 'Serviços de Terceiros (Contab/Jurídico)',
  EXP_OCCUPANCY = 'Ocupação (Aluguel/Cond/IPTU)',
  EXP_UTILITIES = 'Utilidades (Energia/Água/Tel/Internet)',
  EXP_SOFTWARE = 'Software / Licenças / TI',
  EXP_MAINTENANCE = 'Manutenção e Conservação',
  EXP_GENERAL_ADMIN = 'Despesas Administrativas / Escritório',
  EXP_TRAVEL = 'Viagens e Representações',

  // 3. Despesas Financeiras & Tributos s/ Lucro
  EXP_BANK_FEES = 'Tarifas Bancárias',
  EXP_LOAN_INTEREST = 'Juros de Empréstimos/Mora',
  EXP_TAXES_PROFIT = 'Impostos s/ Lucro (IRPJ/CSLL)',

  // 4. Saídas Não Operacionais / Investimentos
  OUT_DEBT_AMORTIZATION = 'Amortização de Principal (Dívida)',
  OUT_CAPEX = 'Investimentos (Capex/Equipamentos)',
  OUT_WITHDRAWAL = 'Retirada de Sócios (Lucros)',
  OTHER_OUT = 'Outras Saídas',

  // --- NEUTRO ---
  TRANSFER = 'Transferência entre Contas',
  UNCATEGORIZED = 'A Classificar'
}

export type ClientDocumentType = 'CNPJ' | 'CPF' | 'ESTRANGEIRA';

export type ClientStatus = 'SEM_DADOS' | 'IMPORTADO' | 'CLASSIFICADO' | 'DIVIDAS_PREENCHIDAS' | 'PROJECAO_CONCLUIDA';

export interface Client {
  id: string;
  name: string;
  sector: string;
  documentType: ClientDocumentType;
  cnpj: string; // Mantivemos o nome do campo para compatibilidade, mas armazena o ID do documento
  contactName: string;
  contactRole?: string;
  createdAt: string;
  status: ClientStatus;
  lastAnalysisAt?: string;
  lastRiskLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
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