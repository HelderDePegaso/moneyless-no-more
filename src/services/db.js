// Banco de dados local baseado em LocalStorage com mock data realista
// Contém funções de CRUD para transações, orçamentos, assinaturas e metas.

const MOCK_BUDGETS = [
  { id: 'b1', category: 'Alimentação', limit: 250, spent: 285.50 }, // Estourado
  { id: 'b2', category: 'Transporte', limit: 120, spent: 98.20 },
  { id: 'b3', category: 'Lazer & Cultura', limit: 150, spent: 145.00 }, // Próximo ao limite
  { id: 'b4', category: 'Saúde & Beleza', limit: 100, spent: 35.00 },
  { id: 'b5', category: 'Assinaturas', limit: 80, spent: 74.95 },
  { id: 'b6', category: 'Outros', limit: 100, spent: 45.00 }
];

const MOCK_SUBSCRIPTIONS = [
  { id: 's1', name: 'Netflix Premium', amount: 19.99, period: 'mensal', category: 'Streaming', active: true, lastUsed: '2026-05-18', status: 'ativo' },
  { id: 's2', name: 'Spotify Family', amount: 14.99, period: 'mensal', category: 'Música', active: true, lastUsed: '2026-05-20', status: 'ativo' },
  { id: 's3', name: 'Adobe Creative Cloud', amount: 29.99, period: 'mensal', category: 'Design', active: true, lastUsed: '2026-03-10', status: 'inativo' }, // Vazamento: Não usado há meses!
  { id: 's4', name: 'Amazon Prime', amount: 9.99, period: 'mensal', category: 'Streaming', active: true, lastUsed: '2026-05-15', status: 'ativo' },
  { id: 's5', name: 'Academia Super Fit', amount: 25.00, period: 'mensal', category: 'Saúde', active: true, lastUsed: '2026-04-02', status: 'alerta' } // Vazamento: Pouco usado!
];

const MOCK_TRANSACTIONS = [
  // Receitas
  { id: 't0', description: 'Salário Mensal', amount: 1800.00, type: 'income', category: 'Salário', date: '2026-05-01' },
  { id: 't01', description: 'Freela UI Design', amount: 350.00, type: 'income', category: 'Extra', date: '2026-05-15' },
  
  // Despesas normais e com vazamento
  { id: 't1', description: 'Supermercado Luanda', amount: 120.50, type: 'expense', category: 'Alimentação', date: '2026-05-03' },
  { id: 't2', description: 'Restaurante Kalu', amount: 45.00, type: 'expense', category: 'Alimentação', date: '2026-05-05' },
  { id: 't3', description: 'Uber Viagem', amount: 12.50, type: 'expense', category: 'Transporte', date: '2026-05-08' },
  { id: 't4', description: 'Uber Viagem', amount: 12.50, type: 'expense', category: 'Transporte', date: '2026-05-08' }, // Vazamento: Cobrança Duplicada!
  
  { id: 't5', description: 'Farmácia Preço Baixo', amount: 35.00, type: 'expense', category: 'Saúde & Beleza', date: '2026-05-09' },
  
  // Assinaturas cobradas na conta de transações
  { id: 't6', description: 'Debito Netflix Premium', amount: 19.99, type: 'expense', category: 'Assinaturas', date: '2026-05-10' },
  { id: 't7', description: 'Debito Spotify Family', amount: 14.99, type: 'expense', category: 'Assinaturas', date: '2026-05-12' },
  { id: 't8', description: 'Debito Spotify Family', amount: 14.99, type: 'expense', category: 'Assinaturas', date: '2026-05-12' }, // Vazamento: Cobrança Duplicada de Assinatura!
  { id: 't9', description: 'Adobe Creative Cloud', amount: 29.99, type: 'expense', category: 'Assinaturas', date: '2026-05-14' },
  { id: 't10', description: 'Mensalidade Academia Super Fit', amount: 25.00, type: 'expense', category: 'Assinaturas', date: '2026-05-15' },
  
  { id: 't11', description: 'Jantar Gourmet Baía', amount: 120.00, type: 'expense', category: 'Alimentação', date: '2026-05-16' }, // Estourou o orçamento de Alimentação!
  { id: 't12', description: 'Cinema & Pipoca', amount: 25.00, type: 'expense', category: 'Lazer & Cultura', date: '2026-05-17' },
  
  // Taxas Bancárias ocultas
  { id: 't13', description: 'Tarifa Mensal Conta Corrente', amount: 6.50, type: 'expense', category: 'Outros', date: '2026-05-05' },
  { id: 't14', description: 'Tarifa Saque Multibanco', amount: 3.50, type: 'expense', category: 'Outros', date: '2026-05-11' },
  { id: 't15', description: 'Tarifa Saque Multibanco', amount: 3.50, type: 'expense', category: 'Outros', date: '2026-05-19' }, // Vazamento: Acumulado de tarifas
  
  // Gasto por impulso
  { id: 't16', description: 'Par de Tênis Edição Limitada', amount: 120.00, type: 'expense', category: 'Lazer & Cultura', date: '2026-05-18' } // Grande desvio do padrão
];

const MOCK_GOALS = [
  { id: 'g1', name: 'Reserva de Emergência', target: 3000, current: 850, deadline: '2026-12-31' },
  { id: 'g2', name: 'Viagem de Férias', target: 1200, current: 400, deadline: '2026-09-15' }
];

const isBrowser = () => typeof window !== 'undefined';

const getStorageItem = (key, fallback) => {
  if (!isBrowser()) return fallback;
  const item = localStorage.getItem(key);
  return item ? JSON.parse(item) : fallback;
};

const setStorageItem = (key, data) => {
  if (isBrowser()) {
    localStorage.setItem(key, JSON.stringify(data));
  }
};

export const getTransactions = () => getStorageItem('fuga_transactions', MOCK_TRANSACTIONS);
export const saveTransactions = (data) => setStorageItem('fuga_transactions', data);

export const getBudgets = () => getStorageItem('fuga_budgets', MOCK_BUDGETS);
export const saveBudgets = (data) => setStorageItem('fuga_budgets', data);

export const getSubscriptions = () => getStorageItem('fuga_subscriptions', MOCK_SUBSCRIPTIONS);
export const saveSubscriptions = (data) => setStorageItem('fuga_subscriptions', data);

export const getGoals = () => getStorageItem('fuga_goals', MOCK_GOALS);
export const saveGoals = (data) => setStorageItem('fuga_goals', data);

// Inicializa banco de dados com os mocks se estiver vazio
export const initializeDB = () => {
  if (!isBrowser()) return;
  if (!localStorage.getItem('fuga_transactions')) {
    localStorage.setItem('fuga_transactions', JSON.stringify(MOCK_TRANSACTIONS));
  }
  if (!localStorage.getItem('fuga_budgets')) {
    localStorage.setItem('fuga_budgets', JSON.stringify(MOCK_BUDGETS));
  }
  if (!localStorage.getItem('fuga_subscriptions')) {
    localStorage.setItem('fuga_subscriptions', JSON.stringify(MOCK_SUBSCRIPTIONS));
  }
  if (!localStorage.getItem('fuga_goals')) {
    localStorage.setItem('fuga_goals', JSON.stringify(MOCK_GOALS));
  }
};
