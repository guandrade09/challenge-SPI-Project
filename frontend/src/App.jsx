// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';
import { PrivateRoute } from './routes/PrivateRoute';

// Importações das Features
import {Login, Register, ForgotPassword} from './features/auth/registerUserPage';
import LogsPage from './features/logsPage/LogsPage';
import MonitoramentoPage from './features/monitoramentoPage/MonitoramentoPage';

export function App() {
  return (
    <Router>
      <Routes>
        {/* ROTA PÚBLICA: Login não usa NavBar nem Layout global */}
        <Route path="/login" element={<Login />} />
        <Route path='/register' element={<Register />} />
        <Route path='/forgot-password' element={<ForgotPassword />} />

        {/* ROTAS PROTEGIDAS: Usam o MainLayout (NavBar + Sidebar + Conteúdo) */}
        <Route element={<PrivateRoute><MainLayout /></PrivateRoute>}>
          <Route path="/" element={<div className="flex bg-projeto-main min-h-screen items-center justify-center"><h1 className='text-white font-bold text-3xl'>Index (Em breve)</h1></div>} />
          <Route path="/logs" element={<LogsPage />} />
          <Route path="/monitoramento" element={<MonitoramentoPage />} />
          <Route path="/settings" element={<div className="flex bg-projeto-main min-h-screen items-center justify-center"><h1 className='text-white font-bold text-3xl'>Configurações (Em breve)</h1></div>} />
        </Route>

        {/* Fallback para rotas não encontradas */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;