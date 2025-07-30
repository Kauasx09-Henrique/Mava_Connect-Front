// Caminho: src/components/Header.jsx
import { Link, useNavigate } from 'react-router-dom';
import { FaUserPlus, FaSignOutAlt } from 'react-icons/fa';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import styles from './style/Header.css';

function Header() {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(false);
  
  // Lendo os dados do usuário, com valores padrão para evitar erros
  const userName = localStorage.getItem('nome') || 'Usuário';
  const userType = localStorage.getItem('tipo');
  // Constrói a URL completa para a imagem
  const userLogoPath = localStorage.getItem('logo');
  const userLogoUrl = userLogoPath ? `http://localhost:3001/${userLogoPath}` : null;

  // Detecta o tema preferido do sistema
  useEffect(() => {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDarkMode(prefersDark);
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => setDarkMode(mediaQuery.matches);
    mediaQuery.addEventListener('change', handler);
    
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Aplica o tema ao body
  useEffect(() => {
    document.body.className = darkMode ? 'dark-mode' : 'light-mode';
  }, [darkMode]);

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

  // Alternar manualmente entre dark/light mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <header className={`${styles.header} ${darkMode ? styles.darkMode : ''}`}>
      {/* Seção de Perfil do Usuário */}
      <div className={styles.userProfile}>
        <img
          src={userLogoUrl || `https://placehold.co/40x40/EFEFEF/333333?text=+`}
          alt="Foto do usuário"
          className={styles.profileImage}
          onError={handleImageError}
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

        {/* Botão de Toggle Dark/Light Mode */}
        <button 
          onClick={toggleDarkMode} 
          className={styles.themeToggle}
          title={darkMode ? 'Alternar para modo claro' : 'Alternar para modo escuro'}
        >
          {darkMode ? '☀️' : '🌙'}
        </button>

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