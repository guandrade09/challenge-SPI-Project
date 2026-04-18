// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { NavBar } from './layouts/NavBar';
import MonitoramentoPage from './features/monitoramentoPage/MonitoramentoPage';
import LogsPage from './features/logsPage/LogsPage'

function App() {
  return (
    <Router>
      {/* Removido o excesso de padding/margin que causa o desalinhamento vertical */}
      <div className="min-h-screen bg-[#16171d] flex flex-col">
          <header className="w-full bg-[#1a1b23] border-b border-white/5">
              <NavBar />
          </header>

        <main className="flex-1 flex flex-col">
          <Routes>
            <Route path="/" />
            <Route path="/monitoramento" element={<MonitoramentoPage />} />
            <Route path="/logs" element={<LogsPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;