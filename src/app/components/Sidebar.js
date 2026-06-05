'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Receipt,
  PiggyBank,
  CreditCard,
  TrendingUp
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Transações', path: '/transactions', icon: Receipt },
    { name: 'Orçamentos & Metas', path: '/budgets', icon: PiggyBank },
    { name: 'Assinaturas', path: '/subscriptions', icon: CreditCard },
    { name: 'Relatórios', path: '/reports', icon: TrendingUp },
  ];

  return (
    <aside className="sidebar">
      <div className="logo-container">
        <div className="logo-icon">F</div>
        <div className="logo-text">Fuga de Dinheiro</div>
      </div>

      <nav>
        <ul className="nav-menu">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = pathname === item.path;
            return (
              <li key={item.path}>
                <Link
                  href={item.path}
                  className={`nav-link ${isActive ? 'active' : ''}`}
                >
                  <IconComponent size={20} />
                  <span>{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="sidebar-footer">
        <div className="user-avatar">U</div>
        <div className="user-info">
          <h4>Utilizador Suazana</h4>
          <p>Membro Premium</p>
        </div>
      </div>
    </aside>
  );
}
