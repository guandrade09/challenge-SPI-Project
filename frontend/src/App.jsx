// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { NavBar } from './layouts/NavBar';
import MonitoramentoPage from './features/monitoramento/monitoramento';

function App() {
  return (
    <Router>
      {/* bg-[#121212] para combinar com a imagem */}
      <div className="min-h-screen bg-[#1a1a1a] text-white">
        
        {/* Header fixo no topo */}
        <header className="w-full bg-[#252525] border-b border-white/5 py-4 mb-10">
           <NavBar />
        </header>

        <Routes>
          <Route path="/" element={<MonitoramentoPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;