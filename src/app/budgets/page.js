'use client';

import { useState, useEffect } from 'react';
import {
  getBudgets,
  saveBudgets,
  getGoals,
  saveGoals,
  initializeDB
} from '../../services/db';
import {
  PiggyBank,
  TrendingUp,
  AlertOctagon,
  DollarSign,
  ChevronRight,
  Plus,
  Coins,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export default function Budgets() {
  const [mounted, setMounted] = useState(false);
  const [budgets, setBudgets] = useState([]);
  const [goals, setGoals] = useState([]);
  const [editingBudgetId, setEditingBudgetId] = useState(null);
  const [newLimit, setNewLimit] = useState('');
  const [notification, setNotification] = useState('');

  // Simulação de Depósito em Metas
  const [depositAmount, setDepositAmount] = useState('');
  const [selectedGoalId, setSelectedGoalId] = useState('');
  const [showGoalForm, setShowGoalForm] = useState(false);

  useEffect(() => {
    initializeDB();
    setBudgets(getBudgets());
    setGoals(getGoals());
    setMounted(true);
  }, []);

  const triggerNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 4000);
  };

  // Atualizar Limite do Orçamento
  const handleUpdateLimit = (id) => {
    if (!newLimit || isNaN(newLimit)) return;

    const updated = budgets.map(b => {
      if (b.id === id) {
        return { ...b, limit: parseFloat(newLimit) };
      }
      return b;
    });

    setBudgets(updated);
    saveBudgets(updated);
    setEditingBudgetId(null);
    setNewLimit('');
    triggerNotification('Teto de orçamento reajustado!');
  };

  // Simular depósito na meta
  const handleDepositGoal = (e) => {
    e.preventDefault();
    if (!selectedGoalId || !depositAmount || isNaN(depositAmount)) return;

    const updated = goals.map(g => {
      if (g.id === selectedGoalId) {
        const val = parseFloat(depositAmount);
        const nextVal = Math.min(g.target, g.current + val);
        return { ...g, current: nextVal };
      }
      return g;
    });

    setGoals(updated);
    saveGoals(updated);

    const goal = goals.find(g => g.id === selectedGoalId);
    setDepositAmount('');
    setShowGoalForm(false);
    triggerNotification(`Poupança adicionada! Depositou kz${depositAmount} na meta "${goal.name}".`);
  };

  if (!mounted) return null;

  return (
    <div>
      {/* Toast Notification */}
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
          <CheckCircle2 size={20} />
          <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>{notification}</span>
        </div>
      )
      }

      {/* Cabeçalho */}
      <header className="page-header">
        <div className="page-title">
          <h1>Orçamentos e Metas Financeiras</h1>
          <p>Defina tetos de gastos por categoria para evitar vazamentos e acompanhe suas metas de poupança.</p>
        </div>
        <div>
          <button
            className="btn btn-primary"
            onClick={() => {
              if (goals.length > 0) {
                setSelectedGoalId(goals[0].id);
              }
              setShowGoalForm(!showGoalForm);
            }}
          >
            <Coins size={16} /> Alimentar Poupança
          </button>
        </div>
      </header>

      {/* Pop-up Formulário de Poupança */}
      {
        showGoalForm && (
          <section className="card" style={{ marginBottom: '2rem', animation: 'fadeIn 0.3s ease-out' }}>
            <h3 style={{ color: '#fff', marginBottom: '1.25rem' }}>Simulador de Depósito de Poupança</h3>
            <form onSubmit={handleDepositGoal}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div className="form-group" style={{ marginBottom: '0' }}>
                  <label>Selecione a Meta</label>
                  <select
                    className="input-control"
                    value={selectedGoalId}
                    onChange={(e) => setSelectedGoalId(e.target.value)}
                  >
                    {goals.map(g => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: '0' }}>
                  <label>Valor do Depósito (kz)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="input-control"
                    placeholder="Ex: 50.00"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowGoalForm(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Adicionar Dinheiro</button>
              </div>
            </form>
          </section>
        )
      }

      {/* Grid Principal: Orçamentos à esquerda, Metas à direita */}
      <section style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '1.5rem' }}>

        {/* Controle de Orçamentos */}
        <div className="card">
          <h3 style={{ color: '#fff', marginBottom: '1.5rem' }}>Auditoria de Limites Mensais</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {budgets.map(budget => {
              const percent = Math.round((budget.spent / budget.limit) * 100);
              const isOver = budget.spent > budget.limit;
              const isNear = budget.spent > budget.limit * 0.85 && budget.spent <= budget.limit;

              let progressColor = 'success';
              if (isOver) progressColor = 'danger';
              else if (isNear) progressColor = 'warning';

              return (
                <div key={budget.id} style={{
                  padding: '1rem',
                  backgroundColor: 'rgba(255,255,255,0.01)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)'
                }}>
                  <div style={{ display: 'flex', justifySpace: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontWeight: '600', color: '#fff' }}>{budget.category}</span>
                      {isOver && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.7rem', color: 'var(--danger)', backgroundColor: 'var(--danger-glow)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                          <AlertOctagon size={10} /> Estourado em kz{Math.abs(budget.spent - budget.limit).toFixed(2)}
                        </span>
                      )}
                      {isNear && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.7rem', color: 'var(--warning)', backgroundColor: 'var(--warning-glow)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                          <AlertTriangle size={10} /> Limite próximo
                        </span>
                      )}
                    </div>

                    {/* Exibição e Formulário de Limite */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {editingBudgetId === budget.id ? (
                        <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                          <input
                            type="number"
                            className="input-control"
                            style={{ width: '80px', padding: '0.2rem 0.5rem', height: '28px', fontSize: '0.8rem' }}
                            placeholder={budget.limit}
                            value={newLimit}
                            onChange={(e) => setNewLimit(e.target.value)}
                          />
                          <button
                            className="btn btn-primary"
                            style={{ padding: '0.2rem 0.5rem', height: '28px', fontSize: '0.75rem' }}
                            onClick={() => handleUpdateLimit(budget.id)}
                          >
                            Salvar
                          </button>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '0.2rem 0.5rem', height: '28px', fontSize: '0.75rem' }}
                            onClick={() => setEditingBudgetId(null)}
                          >
                            X
                          </button>
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.85rem' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>kz{budget.spent.toFixed(2)}</span>
                          <span style={{ color: 'var(--text-muted)' }}> de </span>
                          <span style={{ color: '#fff', fontWeight: '600' }}>kz{budget.limit.toFixed(2)}</span>
                          <button
                            className="btn-icon"
                            style={{ marginLeft: '0.5rem', padding: '0.2rem' }}
                            onClick={() => {
                              setEditingBudgetId(budget.id);
                              setNewLimit(budget.limit.toString());
                            }}
                          >
                            ✏️
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Barra de Progresso Customizada */}
                  <div className="progress-bar-container">
                    <div
                      className={`progress-bar-fill ${progressColor}`}
                      style={{ width: `${Math.min(100, percent)}%` }}
                    ></div>
                  </div>

                  <div style={{ display: 'flex', justifySpace: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <span>Consumido: {percent}%</span>
                    <span>Disponível: kz{Math.max(0, budget.limit - budget.spent).toFixed(2)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Metas de Poupança */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ color: '#fff', marginBottom: '1.5rem' }}>Metas de Economia</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', flexGrow: 1 }}>
            {goals.map(goal => {
              const progressPercent = Math.round((goal.current / goal.target) * 100);
              return (
                <div key={goal.id} className="goal-card" style={{
                  padding: '1rem',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)'
                }}>
                  <div className="goal-header">
                    <span style={{ fontWeight: '600', color: '#fff' }}>{goal.name}</span>
                    <span className="goal-values">
                      kz{goal.current} <span style={{ color: 'var(--text-muted)' }}>/ kz{goal.target}</span>
                    </span>
                  </div>

                  {/* Barra de Progresso Customizada */}
                  <div className="progress-bar-container" style={{ height: '6px' }}>
                    <div
                      className="progress-bar-fill success"
                      style={{ width: `${progressPercent}%`, background: 'linear-gradient(90deg, var(--success), var(--info))' }}
                    ></div>
                  </div>

                  <div style={{ display: 'flex', justifySpace: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                    <span>Progresso: {progressPercent}%</span>
                    <span>Prazo: {new Date(goal.deadline).toLocaleDateString('pt-PT')}</span>
                  </div>
                </div>
              );
            })}

            <div style={{
              marginTop: 'auto',
              padding: '1.25rem',
              border: '1px dashed var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'rgba(255,255,255,0.01)',
              textAlign: 'center'
            }}>
              <PiggyBank size={32} style={{ color: 'var(--primary)', marginBottom: '0.5rem', opacity: '0.7' }} />
              <h4 style={{ color: '#fff', fontSize: '0.9rem', marginBottom: '0.25rem' }}>Economize Automático</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Cada fuga de dinheiro corrigida adiciona potencial de investimento imediato para as suas metas!</p>
            </div>

          </div>
        </div>

      </section>

      {/* Estilos adicionais */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div >
  );
}
