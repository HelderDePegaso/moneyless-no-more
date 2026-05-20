// Motor de regras de detecção de fugas de dinheiro (Vazamentos Financeiros)
// Analisa transações, orçamentos e assinaturas para identificar perdas financeiras.

export const detectAllLeaks = (transactions, budgets, subscriptions) => {
  const leaks = [];

  // 1. Detecção de Cobranças Duplicadas
  const duplicates = detectDuplicates(transactions);
  duplicates.forEach(dup => {
    leaks.push({
      id: `leak-dup-${dup.tx1.id}-${dup.tx2.id}`,
      type: 'duplicate',
      title: 'Cobrança Duplicada Detectada',
      description: `Identificamos duas cobranças idênticas de ${formatCurrency(dup.tx1.amount)} em "${dup.tx1.description}" no dia ${formatDate(dup.tx1.date)}. Pode ser um erro de processamento do cartão.`,
      severity: 'high',
      savingPotential: dup.tx2.amount,
      category: dup.tx1.category,
      affectedIds: [dup.tx1.id, dup.tx2.id],
      suggestion: 'Contacte o seu banco ou o comerciante para contestar este lançamento duplicado.'
    });
  });

  // 2. Detecção de Assinaturas Inativas ou Subutilizadas
  subscriptions.forEach(sub => {
    if (sub.active) {
      if (sub.status === 'inativo') {
        leaks.push({
          id: `leak-sub-inactive-${sub.id}`,
          type: 'subscription_inactive',
          title: `Assinatura Inativa: ${sub.name}`,
          description: `Você está pagando ${formatCurrency(sub.amount)}/mês por uma assinatura que não utiliza desde ${formatDate(sub.lastUsed)}.`,
          severity: 'medium',
          savingPotential: sub.amount,
          category: 'Assinaturas',
          affectedIds: [sub.id],
          suggestion: `Cancele a assinatura do ${sub.name} para economizar ${formatCurrency(sub.amount * 12)} por ano.`
        });
      } else if (sub.status === 'alerta') {
        leaks.push({
          id: `leak-sub-alert-${sub.id}`,
          type: 'subscription_rare',
          title: `Assinatura Subutilizada: ${sub.name}`,
          description: `A assinatura do ${sub.name} (${formatCurrency(sub.amount)}/mês) apresenta raros registros de utilização. Vale a pena reavaliar o custo-benefício.`,
          severity: 'low',
          savingPotential: sub.amount * 0.5, // Potencial de 50% ou cancelamento
          category: 'Assinaturas',
          affectedIds: [sub.id],
          suggestion: 'Avalie se há planos mais baratos ou se pode partilhar a conta com familiares.'
        });
      }
    }
  });

  // 3. Detecção de Estouro de Orçamento
  budgets.forEach(budget => {
    const spent = budget.spent;
    const limit = budget.limit;
    if (spent > limit) {
      const overrun = spent - limit;
      leaks.push({
        id: `leak-budget-over-${budget.id}`,
        type: 'budget_overrun',
        title: `Orçamento Estourado: ${budget.category}`,
        description: `Os seus gastos em "${budget.category}" atingiram ${formatCurrency(spent)}, ultrapassando o limite definido de ${formatCurrency(limit)} por ${formatCurrency(overrun)}.`,
        severity: 'high',
        savingPotential: overrun,
        category: budget.category,
        affectedIds: [budget.id],
        suggestion: `Reduza gastos supérfluos nesta categoria nos próximos dias ou ajuste o seu teto de orçamento.`
      });
    } else if (spent > limit * 0.85) {
      const remaining = limit - spent;
      leaks.push({
        id: `leak-budget-warning-${budget.id}`,
        type: 'budget_warning',
        title: `Aviso de Orçamento: ${budget.category}`,
        description: `Você já consumiu ${Math.round((spent/limit)*100)}% do orçamento de "${budget.category}". Restam apenas ${formatCurrency(remaining)} disponíveis para o mês.`,
        severity: 'low',
        savingPotential: 0,
        category: budget.category,
        affectedIds: [budget.id],
        suggestion: 'Planeie as suas próximas compras com cautela nesta categoria.'
      });
    }
  });

  // 4. Detecção de Taxas Bancárias / Tarifas Ocultas Acumuladas
  const feeTx = transactions.filter(t => 
    t.type === 'expense' && 
    (t.description.toLowerCase().includes('tarifa') || 
     t.description.toLowerCase().includes('taxa multa') || 
     t.description.toLowerCase().includes('comissão mult'))
  );
  
  if (feeTx.length > 0) {
    const totalFees = feeTx.reduce((acc, curr) => acc + curr.amount, 0);
    if (totalFees > 10) {
      leaks.push({
        id: 'leak-fees',
        type: 'bank_fees',
        title: 'Vazamento por Taxas Bancárias',
        description: `Este mês você já pagou ${formatCurrency(totalFees)} em tarifas de conta ou de saques em multibancos. Ao ano, isso representa ${formatCurrency(totalFees * 12)} jogados fora!`,
        severity: 'medium',
        savingPotential: totalFees,
        category: 'Outros',
        affectedIds: feeTx.map(t => t.id),
        suggestion: 'Fale com o seu gestor de conta para isenção de tarifas ou mude para uma conta digital sem taxas de manutenção.'
      });
    }
  }

  // 5. Gastos por Impulso (Picos de gastos avulsos fora do padrão)
  const nonSubExpenses = transactions.filter(t => t.type === 'expense' && t.category !== 'Assinaturas');
  if (nonSubExpenses.length > 0) {
    const sum = nonSubExpenses.reduce((acc, curr) => acc + curr.amount, 0);
    const avg = sum / nonSubExpenses.length;
    
    nonSubExpenses.forEach(tx => {
      // Se um gasto avulso for maior que 4 vezes a média e maior que 80
      if (tx.amount > avg * 3.5 && tx.amount > 80) {
        leaks.push({
          id: `leak-impulse-${tx.id}`,
          type: 'impulse_spend',
          title: `Gasto Atípico / Impulso: ${tx.description}`,
          description: `O gasto de ${formatCurrency(tx.amount)} em "${tx.description}" destoa totalmente da sua média de transações diárias (${formatCurrency(avg)}).`,
          severity: 'medium',
          savingPotential: tx.amount * 0.3, // Estima 30% de economia se evitado
          category: tx.category,
          affectedIds: [tx.id],
          suggestion: 'Aplique a "regra das 24 horas" antes de fazer compras de grande valor para evitar compras impulsivas.'
        });
      }
    });
  }

  return leaks;
};

// Auxiliar para detectar cobranças duplicadas (valores iguais, mesma categoria, mesmo dia ou diferença de até 2 dias)
const detectDuplicates = (transactions) => {
  const expenses = transactions.filter(t => t.type === 'expense');
  const duplicates = [];
  const checked = new Set();

  for (let i = 0; i < expenses.length; i++) {
    for (let j = i + 1; j < expenses.length; j++) {
      const tx1 = expenses[i];
      const tx2 = expenses[j];

      // Ignora se for a mesma transação
      if (tx1.id === tx2.id) continue;

      // Verifica similaridade
      const isSameAmount = tx1.amount === tx2.amount;
      const isSameCategory = tx1.category === tx2.category;
      
      // Limpa os nomes para comparar sem números de cartões ou datas
      const desc1 = cleanDescription(tx1.description);
      const desc2 = cleanDescription(tx2.description);
      const isSameDesc = desc1 === desc2 || desc1.includes(desc2) || desc2.includes(desc1);

      if (isSameAmount && isSameCategory && isSameDesc) {
        const d1 = new Date(tx1.date);
        const d2 = new Date(tx2.date);
        const diffTime = Math.abs(d2 - d1);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // Se ocorreu no mesmo dia ou no máximo com 2 dias de diferença
        if (diffDays <= 2) {
          const key = [tx1.id, tx2.id].sort().join('-');
          if (!checked.has(key)) {
            checked.add(key);
            duplicates.push({ tx1, tx2 });
          }
        }
      }
    }
  }

  return duplicates;
};

const cleanDescription = (desc) => {
  return desc.toLowerCase()
    .replace(/(compra|debito|pagamento|online|multibanco|ltd|inc)\s*/gi, '')
    .trim();
};

const formatCurrency = (val) => {
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(val);
};

const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' });
};
