import { Link, useNavigate } from 'react-router-dom';
import { FaUserPlus, FaSignOutAlt, FaSun, FaMoon, FaChartBar } from 'react-icons/fa';
import { useEffect, useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import mavaLogo from '../../public/logo_mava.png';
import styles from './Header.module.css';

// Componente para o avatar do usuário (Fallback)
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
    // Estado que controla se houve erro ao carregar a imagem da logo
    const [imageError, setImageError] = useState(false);

    // Lê os dados do usuário do localStorage
    const userName = localStorage.getItem('nome_gf') || 'Visitante';
    const userType = localStorage.getItem('tipo');
    // 1. Puxa o caminho da logo do localStorage
    const userLogoPath = localStorage.getItem('logo_url'); // O nome da chave é 'logo_url'

    const API_URL = import.meta.env.VITE_API_URL || 'https://mava-connect-backend.onrender.com';
    // 2. Monta a URL completa da imagem apenas se o caminho existir
    const userProfileImageUrl = userLogoPath ? `${userLogoPath}` : null;

    // Efeito para gerir o modo escuro
    useEffect(() => {
        const isDark = localStorage.getItem('darkMode') === 'true';
        setDarkMode(isDark);
        document.body.classList.toggle('dark-mode', isDark);
    }, []);

    const toggleDarkMode = () => {
        const newDarkMode = !darkMode;
        setDarkMode(newDarkMode);
        localStorage.setItem('darkMode', newDarkMode);
        document.body.classList.toggle('dark-mode', newDarkMode);
    };
    
    const handleLogout = () => {
        localStorage.clear();
        toast.success('Logout realizado com sucesso!');
        navigate('/');
    };
    
    // 3. Função que é chamada se a imagem não carregar, ativando o fallback
    const handleImageError = () => setImageError(true);

    return (
        <header className={`${styles.header} ${darkMode ? styles.darkMode : ''}`}>
            <div className={styles.brand}>
                <Link to={userType === 'admin' ? '/admin' : '/secretaria'}>
                    <img src={mavaLogo} alt="Logo Mava Connect" className={styles.logo} />
                </Link>
            </div>
            <div className={styles.userArea}>
                <div className={styles.actions}>
                    {/* Link para Novo Visitante (Secretaria e Admin) */}
                    {(userType === 'secretaria' || userType === 'admin') && (
                        <Link to="/cadastrar-visitante" className={styles.actionButton} title="Novo Visitante">
                            <FaUserPlus />
                            <span className={styles.actionText}>Novo Visitante</span>
                        </Link>
                    )}

                    {/* Link para Estatísticas (Apenas Admin) */}
                    {userType === 'admin' && (
                        <Link to="/AdminEstatisticas" className={styles.actionButton} title="Estatísticas">
                            <FaChartBar />
                            <span className={styles.actionText}>Estatísticas</span>
                        </Link>
                    )}

                    {/* Botões de Ação */}
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
                    {/* 4. LÓGICA PRINCIPAL: Se a URL existir e não houver erro, mostra a <img>. Caso contrário, mostra o avatar com a inicial. */}
                    {userProfileImageUrl && !imageError ? (
                        <img 
                            src={userProfileImageUrl} 
                            alt={`Perfil de ${userName}`} 
                            className={styles.profileImage} 
                            onError={handleImageError} // Ativa o fallback em caso de erro
                        />
                    ) : (
                        <UserAvatar name={userName} /> // O fallback
                    )}
                </div>
            </div>
        </header>
    );
}

export default Header;