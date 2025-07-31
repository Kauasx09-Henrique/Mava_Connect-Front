// src/components/Header.jsx

import { Link, useNavigate } from 'react-router-dom';
import { FaUserPlus, FaSignOutAlt, FaSun, FaMoon } from 'react-icons/fa';
import { useEffect, useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import styles from './style/Header.module.css'; // Sugestão: usar .module.css

// --- Componente Avatar Otimizado ---
// Extraído para fora do Header para evitar recriação a cada renderização.
// React.memo impede que ele renderize novamente se o nome não mudar.
const UserAvatar = ({ name }) => {
  const initial = name.charAt(0).toUpperCase();

  // Gera uma cor consistente baseada no nome do usuário, em vez de aleatória.
  const avatarColor = useMemo(() => {
    const colors = [
      '#3b82f6', // bg-blue-500
      '#22c55e', // bg-green-500
      '#a855f7', // bg-purple-500
      '#ec4899', // bg-pink-500
      '#ef4444', // bg-red-500
      '#eab308', // bg-yellow-500
    ];
    const charCode = name.charCodeAt(0) || 0;
    return colors[charCode % colors.length];
  }, [name]);

  return (
    <div className={styles.avatar} style={{ backgroundColor: avatarColor }}>
      {initial}
    </div>
  );
};

// --- Componente Principal ---
function Header() {
  const navigate = useNavigate();
  
  // Estado para o tema e para o controle de erro da imagem
  const [darkMode, setDarkMode] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Dados do usuário vindos do localStorage
  const userName = localStorage.getItem('nome_gf') || 'Visitante';
  const userType = localStorage.getItem('tipo');
  const userLogoPath = localStorage.getItem('logo');

  // URL da API (idealmente vinda de uma variável de ambiente)
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  const userLogoUrl = userLogoPath ? `${API_URL}/${userLogoPath}` : null;

  // Efeito para gerenciar o tema (light/dark)
  useEffect(() => {
    // Detecta o tema preferido do sistema na primeira vez
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setDarkMode(mediaQuery.matches);

    // Ouve por mudanças no tema do sistema
    const handler = (e) => setDarkMode(e.matches);
    mediaQuery.addEventListener('change', handler);

    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Aplica a classe de tema no body
  useEffect(() => {
    document.body.className = darkMode ? 'dark-mode' : 'light-mode';
  }, [darkMode]);

  // Reseta o erro da imagem se o usuário mudar
  useEffect(() => {
    setImageError(false);
  }, [userLogoPath]);

  // Funções de manipulação de eventos
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
        <img 
          src="https://via.placeholder.com/150x50?text=Mava+Connect" 
          alt="Logo Mava Connect" 
          className={styles.logo}
        />
      </div>

      <div className={styles.userArea}>
        <div className={styles.actions}>
          {(userType === 'secretaria' || userType === 'admin') && (
            <Link to="/cadastrar-visitante" className={styles.actionButton} title="Novo Visitante">
              <FaUserPlus />
              <span className={styles.actionText}>Novo Visitante</span>
            </Link>
          )}

          <button onClick={toggleDarkMode} className={styles.iconButton} aria-label={darkMode ? 'Ativar modo claro' : 'Ativar modo escuro'} title={darkMode ? 'Modo claro' : 'Modo escuro'}>
            {darkMode ? <FaSun /> : <FaMoon />}
          </button>

          <button onClick={handleLogout} className={styles.iconButton} aria-label="Sair" title="Sair">
            <FaSignOutAlt />
          </button>
        </div>

        <div className={styles.profile}>
          <div className={styles.userInfo}>
            <span className={styles.greeting}>Olá,</span>
            <span className={styles.userName}>{userName}</span>
          </div>
          
          {/* Lógica de renderização do avatar: tenta a imagem, se falhar ou não existir, mostra o avatar com a inicial */}
          {userLogoUrl && !imageError ? (
            <img
              src={userLogoUrl}
              alt={`Logo de ${userName}`}
              className={styles.profileImage}
              onError={handleImageError}
            />
          ) : (
            <UserAvatar name={userName} />
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;