import { Link, useNavigate } from 'react-router-dom';
// 1. Importei o ícone de gráfico
import { FaUserPlus, FaSignOutAlt, FaSun, FaMoon, FaChartBar } from 'react-icons/fa';
import { useEffect, useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import mavaLogo from '../../public/logo_mava.png';
import styles from './Header.module.css';

const UserAvatar = ({ name }) => {
    const initial = name ? name.charAt(0).toUpperCase() : '?';
    const avatarColor = useMemo(() => {
        const colors = ['#3b82f6', '#22c55e', '#a855f7', '#ec4899', '#ef4444', '#eab308'];
        const charCode = name ? name.charCodeAt(0) : 0;
        return colors[charCode % colors.length];
    }, [name]);
    return (<div className={styles.avatar} style={{ backgroundColor: avatarColor }}>{initial}</div>);
};

function Header() {
    const navigate = useNavigate();
    const [darkMode, setDarkMode] = useState(false);
    const [imageError, setImageError] = useState(false);

    const userName = localStorage.getItem('nome_gf') || 'Visitante';
    const userType = localStorage.getItem('tipo');
    const userLogoPath = localStorage.getItem('logo');

    const API_URL = import.meta.env.VITE_API_URL || 'https://mava-connect-backend.onrender.com';
    const userProfileImageUrl = userLogoPath ? `${API_URL}/${userLogoPath}` : null;

    useEffect(() => {
        const isDark = localStorage.getItem('darkMode') === 'true';
        setDarkMode(isDark);
        if (isDark) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
    }, []);

    const toggleDarkMode = () => {
        const newDarkMode = !darkMode;
        setDarkMode(newDarkMode);
        localStorage.setItem('darkMode', newDarkMode);
        if (newDarkMode) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
    };
    
    const handleLogout = () => {
        localStorage.clear();
        toast.success('Logout realizado com sucesso!');
        navigate('/');
    };
    
    const handleImageError = () => setImageError(true);

    return (
        <header className={`${styles.header} ${darkMode ? styles.darkMode : ''}`}>
            <div className={styles.brand}>
                <img src={mavaLogo} alt="Logo Mava Connect" className={styles.logo} />
            </div>
            <div className={styles.userArea}>
                <div className={styles.actions}>
                    {/* Link para Novo Visitante */}
                    {(userType === 'secretaria' || userType === 'admin') && (
                        <Link to="/cadastrar-visitante" className={styles.actionButton} title="Novo Visitante">
                            <FaUserPlus />
                            <span>Novo Visitante</span>
                        </Link>
                    )}

                    {/* Link de Estatísticas corrigido */}
                    {userType === 'admin' && (
                        <Link to="/AdminEstatisticas" className={styles.actionButton} title="Estatísticas">
                            <FaChartBar />
                            <span>Estatísticas</span>
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
