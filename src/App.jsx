import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast'; 


import Login from './Pages/Login.jsx';
import Admin from './Pages/Admin.jsx';
import AdminEstatisticas from './Pages/AdminEstatisticas.jsx'
import CadastrarUsuario from './Pages/CadastrarUsuario.jsx';
import Secretaria from './Pages/Secretaria.jsx'; 
import CadastroVisitante from './Pages/CadastroVisitante.jsx';


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
     
        <Route path="/" element={<Login />} />

      
    
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute role="admin">
              <Admin />
            </ProtectedRoute>
          } 
        />

      
       <Route 
          path="/AdminEstatisticas" 
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
        
       
        <Route 
          path="/cadastrar-visitante"
          element={
            <ProtectedRoute role="secretaria"> 
              <CadastroVisitante />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/secretaria" 
          element={
            <ProtectedRoute role="secretaria">
              <Secretaria />
            </ProtectedRoute>
          } 
        />
        <Route path="*" element={<h1>404: Página não encontrada</h1>} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
