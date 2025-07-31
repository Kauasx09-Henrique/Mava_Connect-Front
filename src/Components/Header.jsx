// src/Components/Header.jsx
import { Link, useNavigate } from 'react-router-dom';
import { FaUserPlus, FaSignOutAlt, FaSun, FaMoon } from 'react-icons/fa';
import { useEffect, useState, useMemo } from 'react';
import toast from 'react-hot-toast';

// --> MELHORIA: Importe a sua logo diretamente. É a forma correta.
import mavaLogo from '../../public/logo_mava.png'; // <-- COLOQUE SUA LOGO AQUI

import styles from './Header.module.css';

// --- Componente Avatar (sem alterações) ---
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

// --- Componente Header Principal ---
function Header() {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Puxa os dados do usuário do localStorage
  const userName = localStorage.getItem('nome_gf') || 'Visitante';
  const userType = localStorage.getItem('tipo');
  const userLogoPath = localStorage.getItem('logo');

  const API_URL = import.meta.env.VITE_API_URL || 'https://mava-connect-backend.onrender.com';
  const userProfileImageUrl = userLogoPath ? `${API_URL}/${userLogoPath}` : null;

  // Efeito para gerenciar o tema (light/dark)
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setDarkMode(mediaQuery.matches);
    const handler = (e) => setDarkMode(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Aplica a classe de tema no body para o CSS funcionar
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [darkMode]);

  // Reseta o erro da imagem do perfil se o usuário mudar
  useEffect(() => {
    setImageError(false);
  }, [userLogoPath]);

  // Funções de manipulação
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
        {/* --> MELHORIA: Usando a logo importada */}
        <img src={mavaLogo} alt="Logo Mava Connect" className={styles.logo} />
      </div>

      <div className={styles.userArea}>
        <div className={styles.actions}>
          {(userType === 'secretaria' || userType === 'admin') && (
            <Link to="/cadastrar-visitante" className={styles.actionButton} title="Novo Visitante">
              <FaUserPlus />
              <span>Novo Visitante</span>
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
          {userProfileImageUrl && !imageError ? (
            <img src={userProfileImageUrl} alt={`Perfil de ${userName}`} className={styles.profileImage} onError={handleImageError} />
          ) : (
            <UserAvatar name={userName} />
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;