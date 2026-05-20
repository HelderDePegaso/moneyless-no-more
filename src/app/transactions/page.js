'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  getTransactions, 
  saveTransactions, 
  getBudgets, 
  saveBudgets,
  initializeDB 
} from '../../services/db';
import { detectAllLeaks } from '../../services/leakDetector';
import { 
  Search, 
  Filter, 
  Plus, 
  Trash2, 
  UploadCloud, 
  ArrowUpRight, 
  ArrowDownRight, 
  CheckCircle,
  HelpCircle
} from 'lucide-react';

export default function Transactions() {
  const [mounted, setMounted] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [notification, setNotification] = useState('');

  // Form State
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('expense');
  const [category, setCategory] = useState('Alimentação');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Import State
  const [importText, setImportText] = useState('');
  const [showImportArea, setShowImportArea] = useState(false);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');

  const searchParams = useSearchParams();

  useEffect(() => {
    initializeDB();
    setTransactions(getTransactions());
    setBudgets(getBudgets());
    setMounted(true);

    // Abre formulário se vier com ?add=true na URL
    if (searchParams.get('add') === 'true') {
      setShowAddForm(true);
    }
  }, [searchParams]);

  const triggerNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 4000);
  };

  const updateBudgetSpending = (newTxs) => {
    const updatedBudgets = budgets.map(b => {
      const categorySpent = newTxs
        .filter(t => t.type === 'expense' && t.category === b.category)
        .reduce((acc, curr) => acc + curr.amount, 0);
      return { ...b, spent: categorySpent };
    });
    setBudgets(updatedBudgets);
    saveBudgets(updatedBudgets);
  };

  // Cadastra nova transação
  const handleAddTransaction = (e) => {
    e.preventDefault();
    if (!description || !amount) return;

    const newTx = {
      id: `t-${Date.now()}`,
      description,
      amount: parseFloat(amount),
      type,
      category: type === 'income' ? 'Salário' : category,
      date
    };

    const updated = [newTx, ...transactions];
    setTransactions(updated);
    saveTransactions(updated);
    updateBudgetSpending(updated);

    // Reset Form
    setDescription('');
    setAmount('');
    setShowAddForm(false);
    triggerNotification('Transação registada com sucesso!');
  };

  // Exclui transação
  const handleDeleteTransaction = (id) => {
    const updated = transactions.filter(t => t.id !== id);
    setTransactions(updated);
    saveTransactions(updated);
    updateBudgetSpending(updated);
    triggerNotification('Transação eliminada do registo.');
  };

  // Importador de transações inteligente (CSV/JSON Mock)
  const handleImportTransactions = () => {
    if (!importText.trim()) return;

    let importedCount = 0;
    let newTxs = [];

    try {
      if (importText.trim().startsWith('[')) {
        // Tentativa de importar via JSON
        const parsed = JSON.parse(importText);
        if (Array.isArray(parsed)) {
          newTxs = parsed.map((item, idx) => ({
            id: `t-imp-${Date.now()}-${idx}`,
            description: item.description || 'Transação Importada',
            amount: parseFloat(item.amount) || 0,
            type: item.type || 'expense',
            category: item.category || autoCategorize(item.description),
            date: item.date || new Date().toISOString().split('T')[0]
          }));
          importedCount = newTxs.length;
        }
      } else {
        // Tentativa de importar via CSV (Separado por vírgulas ou ponto-e-vírgula)
        const lines = importText.split('\n');
        lines.forEach((line, idx) => {
          if (!line.trim()) return;
          const parts = line.split(',');
          if (parts.length >= 3) {
            const desc = parts[1].replace(/"/g, '').trim();
            const val = parseFloat(parts[2].trim());
            const tType = parts[3] ? parts[3].trim().toLowerCase() : 'expense';
            
            newTxs.push({
              id: `t-imp-${Date.now()}-${idx}`,
              description: desc,
              amount: val,
              type: tType,
              category: parts[4] ? parts[4].replace(/"/g, '').trim() : autoCategorize(desc),
              date: parts[0].trim()
            });
            importedCount++;
          }
        });
      }

      if (importedCount > 0) {
        const updated = [...newTxs, ...transactions];
        setTransactions(updated);
        saveTransactions(updated);
        updateBudgetSpending(updated);
        
        setImportText('');
        setShowImportArea(false);
        triggerNotification(`${importedCount} transações importadas e auto-categorizadas!`);
      } else {
        triggerNotification('Nenhuma transação válida identificada.');
      }
    } catch (err) {
      triggerNotification('Erro ao processar os dados. Verifique a formatação.');
    }
  };

  // Algoritmo de auto-categorização inteligente por palavra-chave
  const autoCategorize = (desc) => {
    const text = desc.toLowerCase();
    if (text.includes('netflix') || text.includes('spotify') || text.includes('prime') || text.includes('hbo') || text.includes('adobe') || text.includes('disney')) {
      return 'Assinaturas';
    }
    if (text.includes('uber') || text.includes('taxi') || text.includes('combustivel') || text.includes('gasolina') || text.includes('metro') || text.includes('autocarro')) {
      return 'Transporte';
    }
    if (text.includes('supermercado') || text.includes('restaurante') || text.includes('kalu') || text.includes('burger') || text.includes('padaria') || text.includes('pizza') || text.includes('jantar')) {
      return 'Alimentação';
    }
    if (text.includes('cinema') || text.includes('teatro') || text.includes('show') || text.includes('concerto') || text.includes('museu') || text.includes('livro')) {
      return 'Lazer & Cultura';
    }
    if (text.includes('farmacia') || text.includes('medico') || text.includes('saude') || text.includes('clinica') || text.includes('cosmetico') || text.includes('spa')) {
      return 'Saúde & Beleza';
    }
    return 'Outros';
  };

  if (!mounted) return null;

  // Filtragem dinâmica das transações
  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = tx.description.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          tx.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || tx.type === filterType;
    const matchesCategory = filterCategory === 'all' || tx.category === filterCategory;
    return matchesSearch && matchesType && matchesCategory;
  });

  return (
    <div>
      {/* Notificação Toast */}
      {notification && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          backgroundColor: '#10b981',
          color: '#fff',
          padding: '1rem 1.5rem',
          borderRadius: '8px',
          boxShadow: '0 10px 25px rgba(16, 185, 129, 0.3)',
          display: 'flex',
          align-items: 'center',
          gap: '0.75rem',
          zIndex: 9999,
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <CheckCircle size={20} />
          <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>{notification}</span>
        </div>
      )}

      {/* Cabeçalho */}
      <header className="page-header">
        <div className="page-title">
          <h1>Registo de Transações</h1>
          <p>Gerencie as suas receitas e despesas, faça importações ou configure filtros de análise.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            className="btn btn-secondary" 
            onClick={() => {
              setShowImportArea(!showImportArea);
              setShowAddForm(false);
            }}
          >
            <UploadCloud size={16} /> Importar Dados
          </button>
          <button 
            className="btn btn-primary" 
            onClick={() => {
              setShowAddForm(!showAddForm);
              setShowImportArea(false);
            }}
          >
            <Plus size={16} /> Nova Transação
          </button>
        </div>
      </header>

      {/* Caixa de Importação Inteligente */}
      {showImportArea && (
        <section className="card" style={{ marginBottom: '2rem', animation: 'fadeIn 0.3s ease-out' }}>
          <h3 style={{ color: '#fff', marginBottom: '0.5rem' }}>Importador Inteligente de Extrato</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
            Cole o extrato das suas transações no formato CSV (ex: *Data,Descrição,Valor,Tipo,Categoria*) ou JSON. 
            O motor de regras do Fuga de Dinheiro fará a categorização automática dos gastos baseado nos nomes.
          </p>
          
          <div className="form-group">
            <textarea 
              className="input-control" 
              style={{ minHeight: '120px', fontFamily: 'monospace', fontSize: '0.8rem', resize: 'vertical' }}
              placeholder={`Exemplo CSV:
2026-05-20,Compra Netflix Assinatura,19.99,expense
2026-05-20,Uber Viagem Centro,15.50,expense
2026-05-19,Salario Mensal ISPTEC,1800.00,income,Salário`}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <button className="btn btn-secondary" onClick={() => setShowImportArea(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={handleImportTransactions}>Importar Lote</button>
          </div>
        </section>
      )}

      {/* Formulário de Adicionar Transação */}
      {showAddForm && (
        <section className="card" style={{ marginBottom: '2rem', animation: 'fadeIn 0.3s ease-out' }}>
          <h3 style={{ color: '#fff', marginBottom: '1.25rem' }}>Registar Nova Transação</h3>
          <form onSubmit={handleAddTransaction}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div className="form-group" style={{ marginBottom: '0' }}>
                <label>Descrição</label>
                <input 
                  type="text" 
                  className="input-control" 
                  placeholder="Ex: Almoço Restaurante" 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '0' }}>
                <label>Valor (€)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  className="input-control" 
                  placeholder="Ex: 24.50" 
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '0' }}>
                <label>Tipo de Lançamento</label>
                <select 
                  className="input-control" 
                  value={type} 
                  onChange={(e) => setType(e.target.value)}
                >
                  <option value="expense">Despesa (Débito)</option>
                  <option value="income">Receita (Crédito)</option>
                </select>
              </div>

              {type === 'expense' && (
                <div className="form-group" style={{ marginBottom: '0' }}>
                  <label>Categoria</label>
                  <select 
                    className="input-control" 
                    value={category} 
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="Alimentação">Alimentação</option>
                    <option value="Transporte">Transporte</option>
                    <option value="Lazer & Cultura">Lazer & Cultura</option>
                    <option value="Saúde & Beleza">Saúde & Beleza</option>
                    <option value="Assinaturas">Assinaturas</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>
              )}

              <div className="form-group" style={{ marginBottom: '0' }}>
                <label>Data</label>
                <input 
                  type="date" 
                  className="input-control" 
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowAddForm(false)}>Cancelar</button>
              <button type="submit" className="btn btn-primary">Adicionar Transação</button>
            </div>
          </form>
        </section>
      )}

      {/* Seção de Filtros e Busca */}
      <section className="card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem', alignItems: 'center' }}>
          
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
              <Search size={16} />
            </span>
            <input 
              type="text" 
              className="input-control" 
              style={{ paddingLeft: '2.5rem' }} 
              placeholder="Buscar por descrição ou categoria..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div>
            <select 
              className="input-control" 
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">Todos Lançamentos</option>
              <option value="income">Receitas (Créditos)</option>
              <option value="expense">Despesas (Débitos)</option>
            </select>
          </div>

          <div>
            <select 
              className="input-control" 
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="all">Todas Categorias</option>
              <option value="Alimentação">Alimentação</option>
              <option value="Transporte">Transporte</option>
              <option value="Lazer & Cultura">Lazer & Cultura</option>
              <option value="Saúde & Beleza">Saúde & Beleza</option>
              <option value="Assinaturas">Assinaturas</option>
              <option value="Outros">Outros</option>
            </select>
          </div>

        </div>
      </section>

      {/* Tabela de Transações */}
      <section className="card" style={{ padding: '0' }}>
        {filteredTransactions.length === 0 ? (
          <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Nenhuma transação encontrada para os filtros selecionados.
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Descrição</th>
                  <th>Tipo</th>
                  <th>Categoria</th>
                  <th style={{ textAlign: 'right' }}>Valor</th>
                  <th style={{ textAlign: 'center' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((tx) => (
                  <tr key={tx.id}>
                    <td style={{ color: 'var(--text-primary)' }}>{new Date(tx.date).toLocaleDateString('pt-PT')}</td>
                    <td style={{ fontWeight: '500', color: '#fff' }}>{tx.description}</td>
                    <td>
                      <span className={`badge ${tx.type}`}>
                        {tx.type === 'income' ? 'Receita' : 'Despesa'}
                      </span>
                    </td>
                    <td>
                      <span className="category-tag">
                        {tx.category}
                      </span>
                    </td>
                    <td style={{ 
                      textAlign: 'right', 
                      fontWeight: '600', 
                      color: tx.type === 'income' ? '#10b981' : '#f3f4f6' 
                    }}>
                      {tx.type === 'income' ? '+' : '-'} {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(tx.amount)}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button 
                        className="btn-icon" 
                        title="Apagar Lançamento"
                        onClick={() => handleDeleteTransaction(tx.id)}
                      >
                        <Trash2 size={16} style={{ color: 'var(--danger)' }} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
