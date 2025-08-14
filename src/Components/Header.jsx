// Arquivo: Header.module.css

import { Link, useNavigate } from 'react-router-dom';
import { FaUserPlus, FaSignOutAlt, FaSun, FaMoon, FaChartBar } from 'react-icons/fa';
import { useEffect, useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import mavaLogo from '../../public/logo_mava.png';
import styles from './Header.module.css';

// Componente de Avatar (Fallback) - Sem alterações
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

    // --- MUDANÇA 1: Usar 'useState' para os dados do usuário ---
    // Em vez de ler diretamente do localStorage, guardamos em um estado.
    // Isso torna o componente reativo a mudanças.
    const [userData, setUserData] = useState({
        name: 'Visitante',
        type: null,
        logoUrl: null
    });

    // --- MUDANÇA 2: useEffect para sincronizar com localStorage ---
    // Este efeito será executado quando o componente for montado e
    // também ouvirá por atualizações vindas de outras partes do app.
    useEffect(() => {
        // Função para ler os dados do localStorage e atualizar o estado
        const updateUserData = () => {
            const name = localStorage.getItem('nome_gf') || 'Visitante';
            const type = localStorage.getItem('tipo');
            const logoUrl = localStorage.getItem('logo_url');

            setUserData({ name, type, logoUrl });
            // Reseta o erro da imagem sempre que os dados são atualizados,
            // para que o componente tente carregar a nova foto.
            setImageError(false);
        };

        // Chama a função uma vez na montagem inicial
        updateUserData();

        // ADIÇÃO CRÍTICA: Ouve o evento 'storageUpdated' que a página Admin dispara.
        // Quando esse evento acontece, ele chama 'updateUserData' novamente.
        window.addEventListener('storageUpdated', updateUserData);

        // Função de limpeza: Remove o "ouvinte" quando o componente é desmontado
        // para evitar vazamentos de memória.
        return () => {
            window.removeEventListener('storageUpdated', updateUserData);
        };
    }, []); // O array vazio [] garante que isso só configure o "ouvinte" uma vez.

    // Efeito para o dark mode (sem alterações)
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
    
    const handleImageError = () => setImageError(true);

    return (
        <header className={`${styles.header} ${darkMode ? styles.darkMode : ''}`}>
            <div className={styles.brand}>
                {/* --- MUDANÇA 3: Usar o estado 'userData' para navegação --- */}
                <Link to={userData.type === 'admin' ? '/admin' : '/secretaria'}>
                    <img src={mavaLogo} alt="Logo Mava Connect" className={styles.logo} />
                </Link>
            </div>
            <div className={styles.userArea}>
                <div className={styles.actions}>
                    {/* Botões condicionais usando 'userData.type' */}
                    {(userData.type === 'secretaria' || userData.type === 'admin') && (
                        <Link to="/cadastrar-visitante" className={styles.actionButton} title="Novo Visitante">
                            <FaUserPlus />
                            <span className={styles.actionText}>Novo Visitante</span>
                        </Link>
                    )}
                    {userData.type === 'admin' && (
                        <Link to="/AdminEstatisticas" className={styles.actionButton} title="Estatísticas">
                            <FaChartBar />
                            <span className={styles.actionText}>Estatísticas</span>
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
                        {/* Usando o nome do estado */}
                        <span className={styles.userName}>{userData.name}</span>
                    </div>

                    {/* Lógica de imagem/avatar usando 'userData.logoUrl' */}
                    {userData.logoUrl && !imageError ? (
                        <img 
                            src={userData.logoUrl} 
                            alt={`Perfil de ${userData.name}`} 
                            className={styles.profileImage} 
                            onError={handleImageError}
                            // Adicionar uma key força o React a recarregar a tag <img> quando a URL muda
                            key={userData.logoUrl}
                        />
                    ) : (
                        <UserAvatar name={userData.name} />
                    )}
                </div>
            </div>
        </header>
    );
}

export default Header;