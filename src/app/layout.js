import Sidebar from './components/Sidebar';
import './globals.css';

export const metadata = {
  title: 'Fuga de Dinheiro - Detector de Desperdícios Financeiros',
  description: 'Controle os seus gastos pessoais, detete vazamentos e otimize o seu orçamento com o sistema Fuga de Dinheiro.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div className="app-container">
          <Sidebar />
          <main className="main-content">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
