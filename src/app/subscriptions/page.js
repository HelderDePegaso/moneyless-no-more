'use client';

import { useState, useEffect } from 'react';
import { 
  getSubscriptions, 
  saveSubscriptions, 
  getTransactions, 
  saveTransactions,
  initializeDB 
} from '../../services/db';
import { detectAllLeaks } from '../../services/leakDetector';
import { 
  CreditCard, 
  AlertTriangle, 
  Calendar, 
  ShieldAlert, 
  CheckCircle,
  HelpCircle,
  Clock,
  CheckCircle2,
  Trash2,
  DollarSign
} from 'lucide-react';

export default function Subscriptions() {
  const [mounted, setMounted] = useState(false);
  const [subscriptions, setSubscriptions] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [notification, setNotification] = useState('');

  useEffect(() => {
    initializeDB();
    setSubscriptions(getSubscriptions());
    setTransactions(getTransactions());
    setMounted(true);
  }, []);

  const triggerNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 4000);
  };

  // Cancela/Desativa uma assinatura
  const handleToggleActive = (id, currentStatus) => {
    const updatedSub = subscriptions.map(s => {
      if (s.id === id) {
        return { ...s, active: !s.active };
      }
      return s;
    });

    setSubscriptions(updatedSub);
    saveSubscriptions(updatedSub);

    const sub = subscriptions.find(s => s.id === id);
    const wasActive = sub.active;

    // Se estiver cancelando, também removemos a cobrança mock recente das transações
    if (wasActive) {
      const updatedTx = transactions.filter(t => t.description !== `Debito ${sub.name}` && t.description !== sub.name);
      setTransactions(updatedTx);
      saveTransactions(updatedTx);
      triggerNotification(`Serviço ${sub.name} desativado com sucesso! Economia recalculada.`);
    } else {
      triggerNotification(`Serviço ${sub.name} reativado com sucesso!`);
    }
  };

  if (!mounted) return null;

  // Filtra as ativas e canceladas
  const activeSubs = subscriptions.filter(s => s.active);
  const inactiveSubs = subscriptions.filter(s => !s.active);

  // Custos acumulados
  const totalMonthlyCost = activeSubs.reduce((acc, curr) => acc + curr.amount, 0);
  const totalAnnualCost = totalMonthlyCost * 12;

  // Contagem de vazamentos de assinatura
  const leaksCount = activeSubs.filter(s => s.status === 'inativo' || s.status === 'alerta').length;

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
          align-items: 'center',
          gap: '0.75rem',
          zIndex: 9999,
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <CheckCircle2 size={20} />
          <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>{notification}</span>
        </div>
      )}

      {/* Cabeçalho */}
      <header className="page-header">
        <div className="page-title">
          <h1>Gestão de Assinaturas e Recorrências</h1>
          <p>Monitore os seus serviços recorrentes ativos, identifique assinaturas "fantasmas" ou subutilizadas.</p>
        </div>
      </header>

      {/* Grid Superior de Custos e Alertas */}
      <section className="stats-grid" style={{ marginBottom: '2rem' }}>
        <div className="card stat-card" style={{ borderLeft: '4px solid var(--primary)' }}>
          <div className="stat-info">
            <p>Custo Mensal Total</p>
            <h2>€{totalMonthlyCost.toFixed(2)}</h2>
          </div>
          <div className="stat-icon primary">
            <CreditCard size={24} />
          </div>
        </div>

        <div className="card stat-card" style={{ borderLeft: '4px solid var(--info)' }}>
          <div className="stat-info">
            <p>Custo Anual Projetado</p>
            <h2>€{totalAnnualCost.toFixed(2)}</h2>
          </div>
          <div className="stat-icon primary" style={{ backgroundColor: 'var(--info-glow)', color: 'var(--info)' }}>
            <Calendar size={24} />
          </div>
        </div>

        <div className="card stat-card" style={{ 
          borderLeft: leaksCount > 0 ? '4px solid var(--danger)' : '4px solid var(--success)', 
          border: leaksCount > 0 ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid var(--border-color)' 
        }}>
          <div className="stat-info">
            <p>Vazamentos de Assinatura</p>
            <h2 style={{ color: leaksCount > 0 ? '#ef4444' : '#10b981' }}>
              {leaksCount} Críticos
            </h2>
          </div>
          <div className="stat-icon danger" style={{ 
            backgroundColor: leaksCount > 0 ? 'var(--danger-glow)' : 'var(--success-glow)', 
            color: leaksCount > 0 ? 'var(--danger)' : 'var(--success)' 
          }}>
            <ShieldAlert size={24} />
          </div>
        </div>
      </section>

      {/* Auditoria de Assinaturas Ativas */}
      <section style={{ marginBottom: '2.5rem' }}>
        <h3 style={{ color: '#fff', marginBottom: '1.25rem' }}>Serviços Ativos em Auditoria</h3>
        
        {activeSubs.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            Nenhuma assinatura ativa registada.
          </div>
        ) : (
          <div className="sub-grid">
            {activeSubs.map(sub => {
              const isLeak = sub.status === 'inativo' || sub.status === 'alerta';
              return (
                <div key={sub.id} className={`card sub-card ${isLeak ? 'leak' : ''}`}>
                  <div style={{ display: 'flex', justifySpace: 'space-between', alignItems: 'flex-start' }}>
                    <div className="sub-avatar">
                      {sub.name.charAt(0)}
                    </div>
                    {isLeak && (
                      <span className="badge expense" style={{ fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                        <AlertTriangle size={10} /> {sub.status === 'inativo' ? 'Inativo' : 'Pouco Usado'}
                      </span>
                    )}
                  </div>

                  <h3 style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '0.25rem' }}>{sub.name}</h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.75rem' }}>
                    Categoria: {sub.category}
                  </span>

                  <div style={{ margin: '1rem 0', padding: '0.75rem', backgroundColor: 'rgba(0,0,0,0.15)', borderRadius: '6px' }}>
                    <div style={{ display: 'flex', justifySpace: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Preço:</span>
                      <span style={{ color: '#fff', fontWeight: '600' }}>€{sub.amount} / {sub.period}</span>
                    </div>
                    <div style={{ display: 'flex', justifySpace: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <span>Último uso:</span>
                      <span>{new Date(sub.lastUsed).toLocaleDateString('pt-PT')}</span>
                    </div>
                  </div>

                  {isLeak && (
                    <div style={{ 
                      fontSize: '0.75rem', 
                      color: sub.status === 'inativo' ? 'var(--danger)' : 'var(--warning)', 
                      backgroundColor: sub.status === 'inativo' ? 'var(--danger-glow)' : 'var(--warning-glow)',
                      padding: '0.5rem', 
                      borderRadius: '4px',
                      marginBottom: '1rem',
                      lineHeight: '1.3'
                    }}>
                      {sub.status === 'inativo' 
                        ? 'Vazamento Crítico! Não há acessos a este serviço nos últimos 30 dias.' 
                        : 'Alerta! O seu histórico mostra pouca utilização deste serviço.'}
                    </div>
                  )}

                  <div className="sub-actions">
                    <button 
                      className="btn btn-secondary" 
                      style={{ fontSize: '0.8rem', padding: '0.5rem' }}
                      onClick={() => triggerNotification('Detalhes de uso atualizados.')}
                    >
                      Auditar Uso
                    </button>
                    <button 
                      className="btn btn-danger" 
                      style={{ fontSize: '0.8rem', padding: '0.5rem' }}
                      onClick={() => handleToggleActive(sub.id, sub.status)}
                    >
                      Desativar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Histórico de Serviços Desativados (Histórico de Sucessos!) */}
      <section>
        <h3 style={{ color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
          Histórico de Serviços Cancelados (Economias Salvas)
        </h3>

        {inactiveSubs.length === 0 ? (
          <div style={{ padding: '2rem', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Nenhum serviço cancelado recentemente.
          </div>
        ) : (
          <div className="sub-grid" style={{ opacity: '0.6' }}>
            {inactiveSubs.map(sub => (
              <div key={sub.id} className="card sub-card" style={{ borderColor: 'rgba(16, 185, 129, 0.2)' }}>
                <div style={{ display: 'flex', justifySpace: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>{sub.name}</h3>
                  <span className="badge income" style={{ fontSize: '0.65rem' }}>Economizando €{sub.amount}</span>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  Custo anual evitado: **€{(sub.amount * 12).toFixed(2)} / ano**
                </p>
                <button 
                  className="btn btn-secondary" 
                  style={{ width: '100%', fontSize: '0.8rem', padding: '0.4rem' }}
                  onClick={() => handleToggleActive(sub.id, sub.status)}
                >
                  Reativar Assinatura
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
