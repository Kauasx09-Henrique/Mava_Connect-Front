// Caminho: src/components/Header.jsx
import { Link, useNavigate } from 'react-router-dom';
import { FaUserPlus, FaSignOutAlt, FaSun, FaMoon } from 'react-icons/fa';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import styles from './style/Header.module.css';

function Header() {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(false);
  
  // Dados do usuário
  const userName = localStorage.getItem('nome_gf') || 'GF Mava';
  const userType = localStorage.getItem('tipo');
  const userLogoPath = localStorage.getItem('logo');

  // Logo padrão (substitua pela sua logo)
  const defaultLogo = 'https://via.placeholder.com/150x50?text=Mava+Connect';
  
  // URL completa da imagem (usa a do banco ou a padrão)
  const userLogoUrl = userLogoPath 
    ? `http://localhost:3001/${userLogoPath}`
    : defaultLogo;

  // Detecta o tema do sistema
  useEffect(() => {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDarkMode(prefersDark);
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => setDarkMode(mediaQuery.matches);
    mediaQuery.addEventListener('change', handler);
    
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Aplica o tema
  useEffect(() => {
    document.body.className = darkMode ? 'dark-mode' : 'light-mode';
  }, [darkMode]);

  const handleLogout = () => {
    localStorage.clear();
    toast.success('Logout realizado com sucesso!');
    navigate('/');
  };

  // Avatar personalizado com a inicial
  const UserAvatar = () => {
    const initial = userName.charAt(0).toUpperCase();
    const avatarColors = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 
      'bg-pink-500', 'bg-red-500', 'bg-yellow-500'
    ];
    const randomColor = avatarColors[Math.floor(Math.random() * avatarColors.length)];

    return (
      <div className={`${styles.avatar} ${randomColor}`}>
        {initial}
      </div>
    );
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <header className={`${styles.header} ${darkMode ? styles.darkMode : ''}`}>
      {/* Logo + Nome */}
      <div className={styles.brand}>
        <img 
          src={defaultLogo} 
          alt="Logo Mava Connect" 
          className={styles.logo}
        />
      </div>

      {/* Área do usuário */}
      <div className={styles.userArea}>
        {/* Botões de ação */}
        <div className={styles.actions}>
          {(userType === 'secretaria' || userType === 'admin') && (
            <Link to="/cadastrar-visitante" className={styles.actionButton}>
              <FaUserPlus className={styles.icon} />
              <span>Novo Visitante</span>
            </Link>
          )}

          <button 
            onClick={toggleDarkMode} 
            className={styles.themeToggle}
            aria-label={darkMode ? 'Modo claro' : 'Modo escuro'}
          >
            {darkMode ? <FaSun /> : <FaMoon />}
          </button>

          <button 
            onClick={handleLogout} 
            className={styles.logoutButton}
            aria-label="Sair"
          >
            <FaSignOutAlt className={styles.icon} />
          </button>
        </div>

        {/* Perfil do usuário */}
        <div className={styles.profile}>
          <div className={styles.userInfo}>
            <span className={styles.greeting}>Olá,</span>
            <span className={styles.userName}>{userName}</span>
          </div>
          {userLogoPath ? (
            <img
              src={userLogoUrl}
              alt={userName}
              className={styles.profileImage}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextElementSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <UserAvatar />
        </div>
      </div>
    </header>
  );
}

export default Header;