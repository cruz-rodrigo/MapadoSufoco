import { Transaction, Category, TransactionType } from '../types';

/**
 * PARSER DE CSV BANCÁRIO (BR)
 */
export const parseCsvToTransactions = (csv: string, clientId: string): { txs: Transaction[]; from: string; to: string } => {
  const lines = csv.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length < 2) throw new Error('Arquivo sem linhas de dados.');

  // Simple heuristic for separator
  const firstLine = lines[0];
  const separator = (firstLine.match(/;/g) || []).length >= (firstLine.match(/,/g) || []).length ? ';' : ',';
  
  const header = firstLine.split(separator).map(h => h.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""));

  const dateIndex = header.findIndex(h => h.includes('data') || h.includes('date'));
  const descIndex = header.findIndex(h => h.includes('desc') || h.includes('hist') || h.includes('memo'));
  const valueIndex = header.findIndex(h => h.includes('valor') || h.includes('value') || h.includes('amount'));
  // Optional columns
  const typeIndex = header.findIndex(h => h.includes('tipo') || h.includes('d/c') || h.includes('op'));

  if (dateIndex === -1 || descIndex === -1 || valueIndex === -1) {
    throw new Error('Cabeçalho inválido. Colunas necessárias: Data, Descrição, Valor.');
  }

  const txs: Transaction[] = [];
  const timestamps: number[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(separator);
    if (cols.length < 3) continue;

    const rawDate = cols[dateIndex]?.trim();
    const rawDesc = cols[descIndex]?.trim();
    const rawVal = cols[valueIndex]?.trim();
    const rawType = typeIndex >= 0 ? cols[typeIndex]?.trim().toUpperCase() : '';

    if (!rawDesc || !rawVal) continue;

    // Parse Value: Handle BRL 1.000,00 vs US 1,000.00
    let cleanVal = rawVal.replace(/[R$\s]/g, '');
    const lastComma = cleanVal.lastIndexOf(',');
    const lastDot = cleanVal.lastIndexOf('.');

    if (lastComma > lastDot) {
        // BRL format: 1.234,56 -> 1234.56
        cleanVal = cleanVal.replace(/\./g, '').replace(',', '.');
    } else {
        // US format: 1,234.56 -> 1234.56
        cleanVal = cleanVal.replace(/,/g, '');
    }

    const numeric = parseFloat(cleanVal);
    if (isNaN(numeric)) continue;

    // Determine Type
    let type: TransactionType;
    if (rawType.includes('D') || rawType.includes('DEB') || rawType.includes('OUT')) {
        type = 'OUT';
    } else if (rawType.includes('C') || rawType.includes('CRED') || rawType.includes('IN')) {
        type = 'IN';
    } else {
        // Fallback to sign
        type = numeric < 0 ? 'OUT' : 'IN';
    }

    const absValue = Math.abs(numeric);

    // Parse Date
    let dateObj: Date;
    if (rawDate.match(/^\d{2}\/\d{2}\/\d{4}/)) { // DD/MM/YYYY
        const [d, m, y] = rawDate.split('/');
        dateObj = new Date(Number(y), Number(m) - 1, Number(d));
    } else {
        dateObj = new Date(rawDate);
    }
    
    if (isNaN(dateObj.getTime())) continue;

    const isoDate = dateObj.toISOString().split('T')[0];
    timestamps.push(dateObj.getTime());

    txs.push({
      id: `csv-${clientId}-${i}-${Date.now()}`,
      clientId,
      date: isoDate,
      description: rawDesc.replace(/^"|"$/g, ''),
      type,
      value: absValue,
      category: Category.UNCATEGORIZED,
      isAutoCategorized: false,
      nature: 'OPERATIONAL', // Default safe nature
    });
  }

  if (txs.length === 0) {
    throw new Error('Nenhuma linha válida encontrada.');
  }

  const min = Math.min(...timestamps);
  const max = Math.max(...timestamps);
  const from = new Date(min).toISOString().split('T')[0];
  const to = new Date(max).toISOString().split('T')[0];

  return { txs, from, to };
};

/**
 * SIMULAÇÃO DE PROJEÇÃO DINÂMICA
 * @param currentBalance Saldo inicial
 * @param dailyChange Resultado líquido diário (média)
 * @param daysToSimulate Horizonte de dias (ex: 30, 60, 90)
 */
export const simulateProjection = (
    currentBalance: number,
    dailyChange: number,
    daysToSimulate: number = 30
) => {
    const today = new Date();
    const daysArr: { day: number; date: string; balance: number }[] = [];
    let lowest = currentBalance;
    let breakDay: number | null = null;
    let runningBalance = currentBalance;
  
    for (let i = 1; i <= daysToSimulate; i++) {
      runningBalance += dailyChange;
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      
      if (runningBalance < lowest) lowest = runningBalance;
      if (runningBalance < 0 && breakDay === null) breakDay = i;
      
      // Para gráficos longos, podemos querer pular dias para não poluir, 
      // mas para arrays de dados puros vamos manter tudo por enquanto.
      daysArr.push({
        day: i,
        date: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        balance: runningBalance,
      });
    }
  
    return { days: daysArr, lowest, breakDay, finalBalance: runningBalance };
};