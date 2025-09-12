// Arquivo: Header.js (com SweetAlert2)

import { Link, useNavigate } from 'react-router-dom';
import { FaUserPlus, FaSignOutAlt, FaSun, FaMoon, FaChartBar } from 'react-icons/fa';
import { useEffect, useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2'; // NOVO: Importa o SweetAlert2
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

    const [userData, setUserData] = useState({
        name: 'Visitante',
        type: null,
        logoUrl: null
    });

    useEffect(() => {
        const updateUserData = () => {
            const name = localStorage.getItem('nome_gf') || 'Visitante';
            const type = localStorage.getItem('tipo');
            const logoUrl = localStorage.getItem('logo_url');
            setUserData({ name, type, logoUrl });
            setImageError(false);
        };
        updateUserData();
        window.addEventListener('storageUpdated', updateUserData);
        return () => {
            window.removeEventListener('storageUpdated', updateUserData);
        };
    }, []);

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
    
    // ALTERADO: Função de logout agora usa SweetAlert2 para confirmação
    const handleLogout = () => {
        Swal.fire({
            title: 'Você tem certeza?',
            text: "Sua sessão será encerrada!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sim, quero sair!',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            // Se o usuário clicar em "Sim"
            if (result.isConfirmed) {
                localStorage.clear();
                toast.success('Logout realizado com sucesso!');
                navigate('/');
            }
        });
    };
    
    const handleImageError = () => setImageError(true);

    return (
        <header className={`${styles.header} ${darkMode ? styles.darkMode : ''}`}>
            <div className={styles.brand}>
                <Link to={userData.type === 'admin' ? '/admin' : '/secretaria'}>
                    <img src={mavaLogo} alt="Logo Mava Connect" className={styles.logo} />
                </Link>
            </div>
            <div className={styles.userArea}>
                <div className={styles.actions}>
                    {(userData.type === 'secretaria' || userData.type === 'admin') && (
                        <Link to="/cadastrar-visitante" className={styles.actionButton} title="Novo Visitante">
                            <FaUserPlus />
                            <span className={styles.actionText}>Novo Visitante</span>
                        </Link>
                    )}
                    {userData.type === 'admin' && (
                        <Link to="/AdminEstatisticas" className={styles.actionButton} title="Estatísticas">
                            <FaChartBar />
                            <span className={styles.actionText}>Dashboard</span>
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
                        <span className={styles.userName}>{userData.name}</span>
                    </div>
                    {userData.logoUrl && !imageError ? (
                        <img 
                            src={userData.logoUrl} 
                            alt={`Perfil de ${userData.name}`} 
                            className={styles.profileImage} 
                            onError={handleImageError}
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