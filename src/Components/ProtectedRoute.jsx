import { Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';

function ProtectedRoute({ children, role }) {
  // CORREÇÃO: Lendo a chave 'tipo' em vez de 'user_tipo'
  const token = localStorage.getItem('token');
  const userType = localStorage.getItem('tipo'); 

  // --- Lógica de Verificação ---

  // 1. Se não houver token, o utilizador não está logado.
  if (!token) {
    toast.error("Acesso negado. Por favor, faça o login.");
    return <Navigate to="/" replace />;
  }

  // 2. Se a rota exige 'admin' e o tipo de utilizador não é 'admin', nega o acesso.
  if (role === 'admin' && userType !== 'admin') {
    toast.error("Você não tem permissão para acessar esta página.");
    const redirectTo = userType === 'secretaria' ? '/secretaria' : '/';
    return <Navigate to={redirectTo} replace />;
  }
  
  // 3. Se a rota exige 'secretaria' mas o utilizador não é nem 'secretaria' nem 'admin', nega o acesso.
  // (Lembre-se que o admin pode aceder a tudo)
  if (role === 'secretaria' && userType !== 'secretaria' && userType !== 'admin') {
      toast.error("Você não tem permissão para acessar esta página.");
      return <Navigate to="/" replace />;
  }

  // 4. Se passou por todas as verificações, o acesso é permitido.
  return children;
}

export default ProtectedRoute;
