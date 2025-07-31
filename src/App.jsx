import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast'; 

// Importação das páginas
import Login from './Pages/Login.js';
import Admin from './Pages/Admin.jsx';
import CadastrarUsuario from './Pages/CadastrarUsuario.js';
import Secretaria from './Pages/Secretaria.jsx'; 
import CadastroVisitante from './Pages/CadastroVisitante.js'; // 1. Importe a página de cadastro de visitante

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
          path="/cadastrar-visitante" // CORREÇÃO: Caminho padronizado para minúsculas
          element={
            // CORREÇÃO: A rota deve ser acessível tanto pela secretaria quanto pelo admin.
            // A lógica do ProtectedRoute já permite que 'admin' acesse tudo.
            <ProtectedRoute role="secretaria"> 
              <CadastroVisitante /> {/* CORREÇÃO: Apontando para o componente correto */}
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
