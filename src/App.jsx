import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast'; 

// Importação das páginas
import Login from './Pages/Login.jsx';
import Admin from './Pages/Admin.jsx';
import AdminEstatisticas from './Pages/AdminEstatisticas.jsx'
import CadastrarUsuario from './Pages/CadastrarUsuario.jsx';
import Secretaria from './Pages/Secretaria.jsx'; 
import CadastroVisitante from './Pages/CadastroVisitante.jsx';

// Importação dos componentes
import ProtectedRoute from './Components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />

      <Routes>
        {/* --- Rota Pública --- */}
        <Route path="/" element={<Login />} />

        {/* --- Rotas Protegidas --- */}
        
        {/* Rota principal do Admin */}
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute role="admin">
              <Admin />
            </ProtectedRoute>
          } 
        />

        {/* 2. ADICIONE A NOVA ROTA DE ESTATÍSTICAS AQUI */}
       <Route 
          path="/admin/estatisticas" // O caminho foi corrigido aqui
          element={
            <ProtectedRoute role="admin">
              <AdminEstatisticas />
            </ProtectedRoute>
          }
        />
        
        {/* Rota para a PÁGINA de cadastro de usuário */}
        <Route 
          path="/cadastrar-usuario"
          element={
            <ProtectedRoute role="admin">
              <CadastrarUsuario />
            </ProtectedRoute>
          } 
        />
        
        {/* Rota para a PÁGINA de cadastro de VISITANTE */}
        <Route 
          path="/cadastrar-visitante"
          element={
            <ProtectedRoute role="secretaria"> 
              <CadastroVisitante />
            </ProtectedRoute>
          } 
        />
        
        {/* Rota principal da Secretaria */}
        <Route 
          path="/secretaria" 
          element={
            <ProtectedRoute role="secretaria">
              <Secretaria />
            </ProtectedRoute>
          } 
        />

        {/* Rota para página não encontrada */}
        <Route path="*" element={<h1>404: Página não encontrada</h1>} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
