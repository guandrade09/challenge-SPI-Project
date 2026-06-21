// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';
import { PrivateRoute } from './routes/PrivateRoute';
import { PerformanceObserver } from './components/shared/PerformanceObserver'; // 🚀 Importação do Observador

// Importações das Features
import { Login, Register, ForgotPassword, Logout } from './features/auth/registerUserPage';
import LogsPage from './features/logsPage/LogsPage';
import MonitoramentoPage from './features/monitoramentoPage/MonitoramentoPage';
import HomePage from './features/homePage/HomePage';

export function App() {
  return (
    <Router>
      {/* 🚀 O Observador fica aqui no topo do Router para escutar CLIQUES e RENDERIZAÇÕES de qualquer rota da SPA */}
      <PerformanceObserver />

      <Routes>
        {/* ROTA PÚBLICA: Login não usa NavBar nem Layout global */}
        <Route path="/login" element={<Login />} />
        <Route path='/register' element={<Register />} />
        <Route path='/forgot-password' element={<ForgotPassword />} />
        <Route path="/logout" element={<Logout />} />

        {/* ROTAS PROTEGIDAS: Envolvidas pelo PrivateRoute e renderizadas dentro do MainLayout */}
        <Route element={<PrivateRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/logs" element={<LogsPage />} />
            <Route path="/monitoramento" element={<MonitoramentoPage />} />
            <Route path="/settings" element={
              <div className="flex bg-projeto-main min-h-screen items-center justify-center">
                <h1 className='text-white font-bold text-3xl'>Configurações (Em breve)</h1>
              </div>
            } />
          </Route>
        </Route>

        {/* Fallback para rotas não encontradas */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;