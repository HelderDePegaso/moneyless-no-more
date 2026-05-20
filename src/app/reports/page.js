'use client';

import { useState, useEffect } from 'react';
import { 
  getTransactions, 
  getBudgets, 
  getSubscriptions, 
  initializeDB 
} from '../../services/db';
import { detectAllLeaks } from '../../services/leakDetector';
import { 
  TrendingUp, 
  TrendingDown, 
  Percent, 
  Award, 
  FileText, 
  Printer, 
  ArrowRight,
  TrendingUp as TrendIcon,
  HelpCircle,
  AlertTriangle
} from 'lucide-react';

export default function Reports() {
  const [mounted, setMounted] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [activeLeaks, setActiveLeaks] = useState([]);

  useEffect(() => {
    initializeDB();
    const tx = getTransactions();
    const bd = getBudgets();
    const sb = getSubscriptions();
    
    setTransactions(tx);
    setBudgets(bd);
    setSubscriptions(sb);
    setActiveLeaks(detectAllLeaks(tx, bd, sb));
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Filtrando despesas
  const expenses = transactions.filter(t => t.type === 'expense');
  const incomes = transactions.filter(t => t.type === 'income');

  const totalExpense = expenses.reduce((acc, curr) => acc + curr.amount, 0);
  const totalIncome = incomes.reduce((acc, curr) => acc + curr.amount, 0);

  // Média de gastos
  const avgExpenseValue = expenses.length > 0 ? (totalExpense / expenses.length).toFixed(2) : '0.00';

  // Taxa de Poupança (Eficiência)
  const savingsRate = totalIncome > 0 ? (((totalIncome - totalExpense) / totalIncome) * 100).toFixed(0) : 0;

  // Agrupando despesas por categoria para o ranking
  const expenseByCategory = expenses.reduce((acc, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
    return acc;
  }, {});

  // Ordenando as categorias por valor gasto (Ranking)
  const rankedCategories = Object.entries(expenseByCategory)
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);

  // Maior dreno financeiro
  const biggestDrain = rankedCategories.length > 0 ? rankedCategories[0] : { category: 'Nenhuma', amount: 0 };

  // Top 5 maiores gastos avulsos (excluindo salário)
  const topExpenses = [...expenses]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div className="printable-area">
      {/* Cabeçalho */}
      <header className="page-header no-print">
        <div className="page-title">
          <h1>Relatório de Análise e Auditoria</h1>
          <p>Exiba estatísticas consolidadas, rankings de consumo e gere a versão formal para impressão.</p>
        </div>
        <div>
          <button className="btn btn-primary" onClick={handlePrint}>
            <Printer size={16} /> Imprimir Relatório
          </button>
        </div>
      </header>

      {/* Título de Impressão Formal (Exibido apenas na impressão) */}
      <div className="print-only-header" style={{ display: 'none', marginBottom: '2rem' }}>
        <h1 style={{ textAlign: 'center', color: '#000', fontFamily: 'serif', fontSize: '2rem' }}>
          INSTITUTO SUPERIOR POLITÉCNICO METROPOLITANO DE ANGOLA
        </h1>
        <h2 style={{ textAlign: 'center', color: '#333', fontSize: '1.25rem', marginTop: '0.5rem', borderBottom: '2px solid #333', paddingBottom: '1rem' }}>
          Relatório de Auditoria de Custos - Sistema Fuga de Dinheiro
        </h2>
        <div style={{ display: 'flex', justifySpace: 'space-between', fontSize: '0.85rem', marginTop: '1rem', color: '#555' }}>
          <span>**Autor**: Equipa Projeto ISPTEC (Hélder Sebastião, Márcia Custódio, Suzana Neto)</span>
          <span>**Data**: {new Date().toLocaleDateString('pt-PT')}</span>
        </div>
      </div>

      {/* Grid Superior de Análise de Indicadores */}
      <section className="stats-grid" style={{ marginBottom: '2rem' }}>
        <div className="card stat-card">
          <div className="stat-info">
            <p>Média por Transação</p>
            <h2>€{avgExpenseValue}</h2>
          </div>
          <div className="stat-icon primary" style={{ backgroundColor: 'var(--primary-glow)', color: 'var(--primary)' }}>
            <TrendingDown size={24} />
          </div>
        </div>

        <div className="card stat-card" style={{ borderLeft: biggestDrain.amount > 0 ? '4px solid var(--danger)' : '1px solid var(--border-color)' }}>
          <div className="stat-info">
            <p>Maior Dreno Financeiro</p>
            <h2>{biggestDrain.category}</h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Acumulado: €{biggestDrain.amount.toFixed(2)}
            </span>
          </div>
          <div className="stat-icon danger">
            <AlertTriangle size={24} />
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-info">
            <p>Eficiência de Poupança</p>
            <h2 style={{ color: savingsRate >= 20 ? '#10b981' : '#f59e0b' }}>
              {savingsRate}%
            </h2>
          </div>
          <div className="stat-icon success" style={{ backgroundColor: savingsRate >= 20 ? 'var(--success-glow)' : 'var(--warning-glow)', color: savingsRate >= 20 ? 'var(--success)' : 'var(--warning)' }}>
            <Percent size={24} />
          </div>
        </div>
      </section>

      {/* Grid Intermediário: Ranking de Categorias e Top Despesas */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        
        {/* Ranking das Despesas por Categoria */}
        <div className="card">
          <h3 style={{ color: '#fff', marginBottom: '1.5rem' }}>Ranking de Despesas por Categoria</h3>

          {rankedCategories.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
              Sem despesas para catalogar.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {rankedCategories.map((item, idx) => {
                const percent = Math.round((item.amount / totalExpense) * 100);
                return (
                  <div key={idx}>
                    <div style={{ display: 'flex', justifySpace: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                      <span style={{ fontWeight: '500', color: '#fff' }}>
                        {idx + 1}. {item.category}
                      </span>
                      <span style={{ fontWeight: '600', color: 'var(--text-secondary)' }}>
                        €{item.amount.toFixed(2)} ({percent}%)
                      </span>
                    </div>

                    {/* Barra de Progresso Customizada para Representar a Proporção */}
                    <div className="progress-bar-container" style={{ height: '6px' }}>
                      <div 
                        className="progress-bar-fill primary"
                        style={{ width: `${percent}%`, background: 'linear-gradient(90deg, var(--primary), var(--info))' }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top 5 Maiores Despesas Avulsas */}
        <div className="card">
          <h3 style={{ color: '#fff', marginBottom: '1.5rem' }}>Top 5 Maiores Gastos Individuais</h3>

          {topExpenses.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
              Sem transações lançadas.
            </div>
          ) : (
            <div className="table-container" style={{ marginTop: '0' }}>
              <table style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Descrição</th>
                    <th>Categoria</th>
                    <th style={{ textAlign: 'right' }}>Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {topExpenses.map((tx) => (
                    <tr key={tx.id}>
                      <td style={{ color: '#fff', fontSize: '0.85rem', fontWeight: '500' }}>{tx.description}</td>
                      <td>
                        <span className="category-tag" style={{ fontSize: '0.7rem' }}>{tx.category}</span>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: '600', color: 'var(--danger)', fontSize: '0.85rem' }}>
                        - €{tx.amount.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </section>

      {/* Auditoria Ativa de Vazamentos Financeiros (Apenas no modo Impressão) */}
      <section className="print-only-leaks" style={{ display: 'none', marginBottom: '2rem' }}>
        <h3 style={{ borderBottom: '1px solid #333', paddingBottom: '0.5rem', marginBottom: '1rem', color: '#000' }}>
          Vazamentos Financeiros Identificados pelo Algoritmo
        </h3>
        {activeLeaks.length === 0 ? (
          <p style={{ color: 'green', fontSize: '0.9rem' }}>Nenhum vazamento identificado. Saúde financeira excelente.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #333' }}>
                <th style={{ textAlign: 'left', padding: '0.5rem', color: '#000' }}>Tipo</th>
                <th style={{ textAlign: 'left', padding: '0.5rem', color: '#000' }}>Vazamento</th>
                <th style={{ textAlign: 'right', padding: '0.5rem', color: '#000' }}>Economia Estimada</th>
              </tr>
            </thead>
            <tbody>
              {activeLeaks.map(leak => (
                <tr key={leak.id} style={{ borderBottom: '1px solid #ddd' }}>
                  <td style={{ padding: '0.5rem', color: '#333' }}>{leak.type}</td>
                  <td style={{ padding: '0.5rem', color: '#333' }}>
                    <strong>{leak.title}</strong>: {leak.description}
                  </td>
                  <td style={{ padding: '0.5rem', color: '#000', fontWeight: 'bold', textAlign: 'right' }}>
                    €{leak.savingPotential.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* CSS para suporte a impressão profissional e layout clean em papel */}
      <style jsx global>{`
        @media print {
          body {
            background: #fff !important;
            color: #000 !important;
            font-family: 'Times New Roman', serif !important;
          }
          .sidebar, .no-print, .btn, .btn-icon, .sidebar-footer {
            display: none !important;
          }
          .main-content {
            margin-left: 0 !important;
            padding: 0 !important;
            width: 100% !important;
          }
          .card {
            background: #fff !important;
            border: 1px solid #ccc !important;
            color: #000 !important;
            box-shadow: none !important;
            page-break-inside: avoid;
            margin-bottom: 1.5rem !important;
          }
          h3, td, th {
            color: #000 !important;
          }
          .progress-bar-container {
            background-color: #eee !important;
            border: 1px solid #aaa !important;
          }
          .progress-bar-fill {
            background-color: #555 !important;
          }
          .print-only-header, .print-only-leaks {
            display: block !important;
          }
          .category-tag {
            background-color: #f0f0f0 !important;
            border: 1px solid #ccc !important;
            color: #333 !important;
          }
        }
      `}</style>
    </div>
  );
}
