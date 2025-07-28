// ======================================================================
// Arquivo 1: src/Components/ProtectedRoute.jsx (Com Alertas Toast)
// ======================================================================
// Este componente protege as rotas e agora usa toast para alertas.

import { Navigate } from 'react-router-dom';
import toast from 'react-hot-toast'; // 1. Importando o toast

function ProtectedRoute({ children, role }) {
  console.log("--- [ProtectedRoute] Verificando Acesso ---");

  const token = localStorage.getItem('token');
  const userType = localStorage.getItem('user_tipo'); 
  
  console.log(`[ProtectedRoute] Rota exige permissão: '${role}'`);
  console.log(`[ProtectedRoute] Tipo de usuário logado: '${userType}'`);

  // --- Lógica de Verificação com Alertas ---

  // 1. Se não houver token, nega o acesso e mostra um alerta.
  if (!token) {
    console.log("[ProtectedRoute] DECISÃO: Acesso negado (sem token).");
    toast.error("Acesso negado. Por favor, faça o login."); // Alerta para o usuário
    return <Navigate to="/" replace />;
  }

  // 2. Se o usuário for 'admin', permite o acesso.
  if (userType === 'admin') {
    console.log("[ProtectedRoute] DECISÃO: Acesso permitido (usuário é admin).");
    return children;
  }
  
  // 3. Se o tipo do usuário corresponder ao da rota, permite o acesso.
  if (userType === role) {
    console.log(`[ProtectedRoute] DECISÃO: Acesso permitido (permissão '${userType}' corresponde à rota).`);
    return children;
  }

  // 4. Se chegou aqui, a permissão é insuficiente. Nega o acesso e mostra um alerta.
  console.log(`[ProtectedRoute] DECISÃO: Acesso negado (permissão '${userType}' é insuficiente).`);
  toast.error("Você não tem permissão para acessar esta página."); // Alerta para o usuário
  const redirectTo = userType === 'secretaria' ? '/secretaria/painel' : '/';
  return <Navigate to={redirectTo} replace />;
}

export default ProtectedRoute;