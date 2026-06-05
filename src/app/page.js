'use client';

import { useState, useEffect } from 'react';
import {
  getTransactions,
  getBudgets,
  getSubscriptions,
  saveTransactions,
  saveSubscriptions,
  initializeDB
} from '../services/db';
import { detectAllLeaks } from '../services/leakDetector';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  Sparkles,
  TrendingDown,
  CheckCircle,
  Clock,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';

export default function Dashboard() {
  const [mounted, setMounted] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [activeLeaks, setActiveLeaks] = useState([]);
  const [notification, setNotification] = useState('');

  // Carregar dados iniciais e motor de regras
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

  const triggerNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 4000);
  };

  // Handler para resolver vazamento de cobrança duplicada (deletar a transação duplicada)
  const resolveDuplicate = (txIdToKeep, txIdToDelete) => {
    const updated = transactions.filter(t => t.id !== txIdToDelete);
    setTransactions(updated);
    saveTransactions(updated);

    // Atualiza vazamentos
    const leaks = detectAllLeaks(updated, budgets, subscriptions);
    setActiveLeaks(leaks);
    triggerNotification('Cobrança duplicada resolvida! Transação excluída com sucesso.');
  };

  // Handler para cancelar assinatura inativa
  const resolveCancelSubscription = (subId) => {
    const updated = subscriptions.map(s => {
      if (s.id === subId) {
        return { ...s, active: false };
      }
      return s;
    });
    setSubscriptions(updated);
    saveSubscriptions(updated);

    // Atualiza transações para refletir que a cobrança foi cessada
    const currentSub = subscriptions.find(s => s.id === subId);
    const updatedTx = transactions.filter(t => t.description !== `Debito ${currentSub.name}` && t.description !== currentSub.name);
    setTransactions(updatedTx);
    saveTransactions(updatedTx);

    // Atualiza vazamentos
    const leaks = detectAllLeaks(updatedTx, budgets, updated);
    setActiveLeaks(leaks);
    triggerNotification(`Assinatura do ${currentSub.name} cancelada! Economia imediata garantida.`);
  };

  if (!mounted) return null;

  // Cálculos financeiros
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const currentBalance = totalIncome - totalExpense;

  // Economia Potencial Total
  const totalSavingPotential = activeLeaks.reduce((acc, curr) => acc + curr.savingPotential, 0);

  // Recentes (Top 5)
  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  // Dados para o Gráfico de Categorias (Agrupamento)
  const expenseByCategory = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
      return acc;
    }, {});

  const totalExpenseForChart = Object.values(expenseByCategory).reduce((a, b) => a + b, 0);

  // Cores do Gráfico
  const categoryColors = {
    'Alimentação': '#ef4444',     // Vermelho
    'Transporte': '#3b82f6',      // Azul
    'Lazer & Cultura': '#f59e0b', // Âmbar
    'Saúde & Beleza': '#10b981',  // Verde
    'Assinaturas': '#8b5cf6',     // Roxo
    'Outros': '#6b7280'           // Cinza
  };

  // Cálculo dos ângulos do Donut Chart (SVG)
  let cumulativePercent = 0;
  const donutSlices = Object.entries(expenseByCategory).map(([category, amount]) => {
    const percent = amount / totalExpenseForChart;
    const startPercent = cumulativePercent;
    cumulativePercent += percent;
    return {
      category,
      amount,
      percent,
      startPercent,
      color: categoryColors[category] || '#6b7280'
    };
  });

  return (
    <div style={{ position: 'relative' }}>
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
          alignItems: 'center',
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
          <h1>Olá, Suzana Neto</h1>
          <p>Esta é a auditoria de saúde financeira e análise de **Fuga de Dinheiro**.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link href="/transactions" className="btn btn-secondary">
            <Clock size={16} /> Ver Histórico
          </Link>
          <Link href="/transactions?add=true" className="btn btn-primary">
            <Sparkles size={16} /> Nova Transação
          </Link>
        </div>
      </header>

      {/* Grid de Estatísticas Rápidas */}
      <section className="stats-grid">
        <div className="card stat-card">
          <div className="stat-info">
            <p>Saldo Geral</p>
            <h2 style={{ color: currentBalance >= 0 ? '#10b981' : '#ef4444' }}>
              {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'AOA' }).format(currentBalance)}
            </h2>
          </div>
          <div className="stat-icon success" style={{ backgroundColor: currentBalance >= 0 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)' }}>
            <Wallet size={24} />
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-info">
            <p>Receita Mensal</p>
            <h2 style={{ color: '#10b981' }}>
              {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'AOA' }).format(totalIncome)}
            </h2>
          </div>
          <div className="stat-icon success">
            <ArrowUpRight size={24} />
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-info">
            <p>Despesas Acumuladas</p>
            <h2 style={{ color: '#ef4444' }}>
              {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'AOA' }).format(totalExpense)}
            </h2>
          </div>
          <div className="stat-icon danger">
            <ArrowDownRight size={24} />
          </div>
        </div>

        <div className="card stat-card" style={{ border: activeLeaks.length > 0 ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid var(--border-color)' }}>
          <div className="stat-info">
            <p>Fugas de Dinheiro</p>
            <h2 style={{ color: activeLeaks.length > 0 ? '#ef4444' : '#10b981' }}>
              {activeLeaks.filter(l => l.severity === 'high' || l.severity === 'medium').length} Ativas
            </h2>
          </div>
          <div className="stat-icon danger" style={{ backgroundColor: activeLeaks.length > 0 ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)', color: activeLeaks.length > 0 ? '#ef4444' : '#10b981' }}>
            <AlertTriangle size={24} />
          </div>
        </div>
      </section>

      {/* DETETOR DE FUGAS DE DINHEIRO (DESTAQUE) */}
      <section className="leak-detector-section">
        <div className="leak-detector-header">
          <div className="pulse-dot"></div>
          <h2>Detector de Fugas de Dinheiro Activo</h2>
          <span style={{ fontSize: '0.8rem', backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 'bold', marginLeft: 'auto' }}>
            Economia Potencial: {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'AOA' }).format(totalSavingPotential)}/mês
          </span>
        </div>

        {activeLeaks.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem', border: '1px dashed #10b981' }}>
            <CheckCircle size={44} style={{ color: '#10b981', marginBottom: '1rem' }} />
            <h3 style={{ color: '#fff', marginBottom: '0.5rem' }}>Parabéns! Nenhuma fuga de dinheiro detectada.</h3>
            <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>A sua saúde financeira está excelente. Continue monitorando os seus gastos!</p>
          </div>
        ) : (
          <div className="leak-grid">
            {activeLeaks.map(leak => (
              <div key={leak.id} className={`card leak-card ${leak.severity}`}>
                <div>
                  <div className="leak-header">
                    <span className={`leak-tag ${leak.severity}`}>{leak.type.replace('_', ' ')}</span>
                    {leak.savingPotential > 0 && (
                      <span className="leak-potential">
                        <TrendingDown size={14} /> Poupe {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'AOA' }).format(leak.savingPotential)}
                      </span>
                    )}
                  </div>
                  <h3>{leak.title}</h3>
                  <p>{leak.description}</p>
                </div>

                <div className="leak-footer">
                  <span className="leak-suggestion">{leak.suggestion}</span>
                  {leak.type === 'duplicate' && (
                    <button
                      className="btn btn-danger"
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                      onClick={() => resolveDuplicate(leak.affectedIds[0], leak.affectedIds[1])}
                    >
                      Excluir Duplicada
                    </button>
                  )}
                  {(leak.type === 'subscription_inactive' || leak.type === 'subscription_rare') && (
                    <button
                      className="btn btn-danger"
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                      onClick={() => resolveCancelSubscription(leak.affectedIds[0])}
                    >
                      Cancelar Serviço
                    </button>
                  )}
                  {leak.type.includes('budget') && (
                    <Link
                      href="/budgets"
                      className="btn btn-secondary"
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                    >
                      Ajustar Orçamento
                    </Link>
                  )}
                  {leak.type === 'bank_fees' && (
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                      onClick={() => triggerNotification('Envie um email para o seu gerente solicitando estorno das taxas acumuladas.')}
                    >
                      Ver Modelo E-mail
                    </button>
                  )}
                  {leak.type === 'impulse_spend' && (
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                      onClick={() => triggerNotification('Gasto marcado sob observação.')}
                    >
                      Entendido
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
        }
      </section >

      {/* DASHBOARD GRID - GRÁFICOS & LISTA RECENTE */}
      < section className="dashboard-grid" >
        {/* Gráfico de Categorias */}
        < div className="card" >
          <h3 style={{ marginBottom: '1.5rem', color: '#fff' }}>Despesas por Categoria</h3>
          {
            totalExpenseForChart === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem' }}>
                Nenhum gasto registado neste mês.
              </div>
            ) : (
              <div className="chart-container">
                {/* Donut Chart SVG Premium */}
                <svg viewBox="0 0 42 42" className="chart-svg" style={{ width: '180px', height: '180px', transform: 'rotate(-90deg)' }}>
                  <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="var(--bg-secondary)" strokeWidth="4"></circle>
                  {donutSlices.map((slice, idx) => {
                    const strokeDasharray = `${slice.percent * 100} ${100 - (slice.percent * 100)}`;
                    const strokeDashoffset = 100 - (slice.startPercent * 100);
                    return (
                      <circle
                        key={idx}
                        cx="21"
                        cy="21"
                        r="15.915"
                        fill="transparent"
                        stroke={slice.color}
                        strokeWidth="4"
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                        style={{ transition: 'stroke-dasharray 0.5s ease' }}
                      />
                    );
                  })}
                </svg>

                <div className="chart-legend">
                  {donutSlices.map((slice, idx) => (
                    <div key={idx} className="legend-item">
                      <div className="legend-color" style={{ backgroundColor: slice.color }}></div>
                      <span style={{ flexGrow: 1 }}>{slice.category}</span>
                      <span style={{ fontWeight: '600', color: '#fff' }}>
                        {Math.round(slice.percent * 100)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )
          }
        </div >

        {/* Transações Recentes */}
        < div className="card" >
          <div style={{ display: 'flex', justifySpace: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ color: '#fff', flexGrow: 1 }}>Transações Recentes</h3>
            <Link href="/transactions" style={{ fontSize: '0.8rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              Ver todas <ArrowRight size={14} />
            </Link>
          </div>

          <div className="table-container" style={{ marginTop: '0' }}>
            <table style={{ width: '100%' }}>
              <tbody>
                {recentTransactions.map((tx) => (
                  <tr key={tx.id}>
                    <td style={{ padding: '0.75rem 0', borderBottom: '1px solid rgba(255, 255, 255, 0.03)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ color: '#fff', fontWeight: '500', fontSize: '0.85rem' }}>{tx.description}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(tx.date).toLocaleDateString('pt-PT')}</span>
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem 0', borderBottom: '1px solid rgba(255, 255, 255, 0.03)', textAlign: 'right' }}>
                      <span style={{
                        fontWeight: '600',
                        fontSize: '0.85rem',
                        color: tx.type === 'income' ? '#10b981' : '#f3f4f6'
                      }}>
                        {tx.type === 'income' ? '+' : '-'} {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'AOA' }).format(tx.amount)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div >
      </section >

      {/* CSS extra para animações de fade in e transições suaves */}
      < style jsx global > {`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style >
    </div >
  );
}
