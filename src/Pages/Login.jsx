// Caminho: src/Pages/Login.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import styles from './style/Login.module.css';
import logo from '../../public/logo_mava.png';

const API_URL = 'https://mava-connect-backend.onrender.com';

function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const navigate = useNavigate();

  // Verifica o modo do sistema ao carregar o componente
  useEffect(() => {
    const checkDarkMode = () => {
      const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      setDarkMode(isDark);
      
      // Adiciona listener para mudanças no tema
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e) => setDarkMode(e.matches);
      mediaQuery.addListener(handleChange);
      
      return () => mediaQuery.removeListener(handleChange);
    };

    checkDarkMode();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    console.log('[Login.jsx] DADOS QUE SERÃO ENVIADOS PARA A API:', { email, senha });

    const loginPromise = axios.post(`${API_URL}/auth/login`, { email, senha });

    toast.promise(loginPromise, {
      loading: 'Verificando credenciais...',
      success: (res) => {
        const { token, usuario } = res.data;

        if (!token || !usuario || !usuario.tipo) {
          throw new Error('Resposta inválida do servidor. Faltando dados essenciais.');
        }

        localStorage.setItem('token', token);
        localStorage.setItem('user_tipo', usuario.tipo);
        localStorage.setItem('user_nome', usuario.nome);
        if (usuario.logo) {
          localStorage.setItem('user_logo', usuario.logo);
        }

        setTimeout(() => {
          if (usuario.tipo === 'admin') {
            navigate('/admin');
          } else if (usuario.tipo === 'secretaria') {
            navigate('/secretaria');
          } else {
            navigate('/');
          }
        }, 800);

        return `Bem-vindo(a), ${usuario.nome || 'usuário'}!`;
      },
      error: (err) => {
        console.error('[Login.jsx] Erro ao fazer login:', err);
        return err.response?.data?.mensagem || 'Credenciais inválidas ou erro no servidor.';
      },
    }).finally(() => {
      setLoading(false);
    });
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