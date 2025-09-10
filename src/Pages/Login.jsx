// Login.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import styles from './style/Login.module.css';
import logo from '../../public/logo_mava.png';

const API_BASE_URL = 'https://mava-connect.onrender.com';


function Login() {
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [loading, setLoading] = useState(false);
    const [darkMode, setDarkMode] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        setDarkMode(isDark);
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = (e) => setDarkMode(e.matches);
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // --- ADMIN FIXO ---
            if (email === "admin@gmail.com" && senha === "123456") {
                localStorage.setItem("token", "fake-admin-token");
                localStorage.setItem("tipo", "admin");
                localStorage.setItem("nome_gf", "Administrador");
                localStorage.setItem("logo_url", ""); // pode ser uma imagem default se quiser

                toast.success("Bem-vindo(a), Administrador!");

                navigate("/admin");
                window.dispatchEvent(new Event("storageUpdated"));
                return; // não chama backend
            }

            // --- LOGIN NORMAL (via backend) ---
            const res = await axios.post(`${API_URL}/auth/login`, { email, senha });
            const { token, usuario } = res.data;

            if (!token || !usuario || !usuario.tipo) {
                throw new Error("Resposta inválida do servidor.");
            }

            localStorage.setItem("token", token);
            localStorage.setItem("tipo", usuario.tipo);
            localStorage.setItem("nome_gf", usuario.nome);
            localStorage.setItem("logo_url", usuario.logo_url || "");

            toast.success(`Bem-vindo(a), ${usuario.nome}!`);

            if (usuario.tipo === "admin") {
                navigate("/admin");
            } else if (usuario.tipo === "secretaria") {
                navigate("/secretaria");
            } else {
                navigate("/");
            }

            window.dispatchEvent(new Event("storageUpdated"));
        } catch (err) {
            toast.error(err.response?.data?.mensagem || "Erro no login");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`${styles.loginContainer} ${darkMode ? styles.darkMode : ''}`}>
            <form className={styles.loginForm} onSubmit={handleLogin}>
                <div className={styles.logoContainer}>
                    <img src={logo} alt="Logo da Empresa" className={styles.logo} />
                </div>
                <h2>Acessar o Sistema</h2>
                <div className={styles.inputGroup}>
                    <label htmlFor="email">Email</label>
                    <input
                        id="email"
                        type="email"
                        placeholder="seu@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={loading}
                    />
                </div>
                <div className={styles.inputGroup}>
                    <label htmlFor="password">Senha</label>
                    <input
                        id="password"
                        type="password"
                        placeholder="Sua senha"
                        value={senha}
                        onChange={(e) => setSenha(e.target.value)}
                        required
                        disabled={loading}
                    />
                </div>
                <button type="submit" className={styles.loginButton} disabled={loading}>
                    {loading ? 'Entrando...' : 'Entrar'}
                </button>
            </form>
        </div>
    );
}

export default Login;
