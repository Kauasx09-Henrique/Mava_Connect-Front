// Caminho: src/components/Header.jsx

import { Link, useNavigate } from 'react-router-dom';
import { FaUserPlus, FaSignOutAlt } from 'react-icons/fa';
import toast from 'react-hot-toast';
import styles from './Header.module.css';

function Header() {
  const navigate = useNavigate();
  
  // Lendo os dados do usuário, com valores padrão para evitar erros
  const userName = localStorage.getItem('nome') || 'Usuário';
  const userType = localStorage.getItem('tipo');
  // Constrói a URL completa para a imagem
  const userLogoPath = localStorage.getItem('logo');
  const userLogoUrl = userLogoPath ? `http://localhost:3001/${userLogoPath}` : null;

  const handleLogout = () => {
    // Limpa todos os dados da sessão
    localStorage.removeItem('token');
    localStorage.removeItem('tipo');
    localStorage.removeItem('nome');
    localStorage.removeItem('logo'); 
    
    toast.success('Logout realizado com sucesso!');
    navigate('/');
  };
  
  // Função para lidar com erros ao carregar a imagem do usuário
  const handleImageError = (e) => {
    // Se a imagem falhar, gera um placeholder com a inicial do nome
    const initial = userName.charAt(0).toUpperCase();
    e.target.onerror = null; // Evita loops infinitos se o placeholder também falhar
    e.target.src = `https://placehold.co/40x40/007bff/FFFFFF?text=${initial}`;
  };

  return (
    <header className={styles.header}>
      {/* Seção de Perfil do Usuário */}
      <div className={styles.userProfile}>
        <img
          src={userLogoUrl || `https://placehold.co/40x40/EFEFEF/333333?text=+`} // Usa a URL completa do logo ou um placeholder
          alt="Foto do usuário"
          className={styles.profileImage}
          onError={handleImageError} // Define um fallback para links de imagem quebrados
        />
        <span className={styles.userName}>Olá, {userName}</span>
      </div>
      
      {/* Seção de Ações */}
      <div className={styles.actions}>
        {/* O link para cadastro de visitante aparece para admin e secretaria */}
        {(userType === 'secretaria' || userType === 'admin') && (
          <Link to="/cadastrar-visitante" className={styles.actionButton} title="Cadastrar novo visitante">
            <FaUserPlus />
            <span className={styles.buttonText}>Novo Visitante</span>
          </Link>
        )}

        {/* Botão de Logout */}
        <button onClick={handleLogout} className={styles.logoutButton} title="Sair do sistema">
          <FaSignOutAlt />
          <span className={styles.buttonText}>Sair</span>
        </button>
      </div>
    </header>
  );
}

export default Header;
