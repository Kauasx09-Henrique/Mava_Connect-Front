// src/Components/Header.jsx
import { Link, useNavigate } from 'react-router-dom';
import { FaUserPlus, FaSignOutAlt, FaSun, FaMoon } from 'react-icons/fa';
import { useEffect, useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import styles from './Header.module.css'; // Crie um CSS para ele se precisar

// Componente Avatar otimizado
const UserAvatar = ({ name }) => {
  const initial = name.charAt(0).toUpperCase();

  const avatarColor = useMemo(() => {
    const colors = ['#3b82f6', '#22c55e', '#a855f7', '#ec4899', '#ef4444', '#eab308'];
    const charCode = name.charCodeAt(0) || 0;
    return colors[charCode % colors.length];
  }, [name]);

  return (
    <div className={styles.avatar} style={{ backgroundColor: avatarColor }}>
      {initial}
    </div>
  );
};


function Header() {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(false);
  const [imageError, setImageError] = useState(false);

  const userName = localStorage.getItem('nome_gf') || 'Visitante';
  const userType = localStorage.getItem('tipo');
  const userLogoPath = localStorage.getItem('logo');

  const API_URL = import.meta.env.VITE_API_URL || 'https://mava-connect-backend.onrender.com';
  const userLogoUrl = userLogoPath ? `${API_URL}/${userLogoPath}` : null;

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setDarkMode(mediaQuery.matches);
    const handler = (e) => setDarkMode(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    document.body.className = darkMode ? 'dark-mode' : 'light-mode';
  }, [darkMode]);

  useEffect(() => {
    setImageError(false);
  }, [userLogoPath]);

  const handleLogout = () => {
    localStorage.clear();
    toast.success('Logout realizado com sucesso!');
    navigate('/');
  };

  const toggleDarkMode = () => setDarkMode(prev => !prev);
  const handleImageError = () => setImageError(true);

  return (
    <header className={`${styles.header} ${darkMode ? styles.darkMode : ''}`}>
      <div className={styles.brand}>
        <img src="https://via.placeholder.com/150x50?text=Mava+Connect" alt="Logo Mava Connect" className={styles.logo} />
      </div>
      <div className={styles.userArea}>
        <div className={styles.actions}>
          {(userType === 'secretaria' || userType === 'admin') && (
            <Link to="/cadastrar-visitante" className={styles.actionButton} title="Novo Visitante">
              <FaUserPlus />
              <span className={styles.actionText}>Novo Visitante</span>
            </Link>
          )}
          <button onClick={toggleDarkMode} className={styles.iconButton} title={darkMode ? 'Modo claro' : 'Modo escuro'}>
            {darkMode ? <FaSun /> : <FaMoon />}
          </button>
          <button onClick={handleLogout} className={styles.iconButton} title="Sair">
            <FaSignOutAlt />
          </button>
        </div>
        <div className={styles.profile}>
          <div className={styles.userInfo}>
            <span className={styles.greeting}>Olá,</span>
            <span className={styles.userName}>{userName}</span>
          </div>
          {userLogoUrl && !imageError ? (
            <img src={userLogoUrl} alt={`Logo de ${userName}`} className={styles.profileImage} onError={handleImageError} />
          ) : (
            <UserAvatar name={userName} />
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;