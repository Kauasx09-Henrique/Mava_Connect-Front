import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import styles from './style/Login.module.css'; // Certifique-se que o caminho está correto
import mavaLogo from '../../public/logo_mava.png';
import { FaUser, FaLock } from 'react-icons/fa';

function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [loading, setLoading] = useState(false);

    const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://mava-connect-backend.onrender.com';

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!email || !senha) {
            toast.error('Por favor, preencha todos os campos.');
            return;
        }
        setLoading(true);

        try {
            // A sua rota de login no backend. Ajuste se for diferente (ex: /auth/login)
            // 1. CORREÇÃO: Enviando os campos com os nomes que o backend espera (email_gf, senha_gf)
            const response = await axios.post(`${API_BASE_URL}/api/login`, {
                email_gf: email,
                senha_gf: senha,
            });

            const { token, usuario } = response.data;

            if (!token || !usuario) {
                toast.error('Resposta inválida do servidor.');
                setLoading(false);
                return;
            }

            // Guardar os dados no localStorage
            localStorage.setItem('token', token);
            localStorage.setItem('nome_gf', usuario.nome_gf);
            
            // 2. CORREÇÃO: Usando a chave 'tipo', que é a mesma que o Header.jsx procura.
            localStorage.setItem('tipo', usuario.tipo_usuario); 
            
            localStorage.setItem('logo', usuario.logo || '');

            toast.success(`Bem-vindo(a), ${usuario.nome_gf}!`);

            // Redireciona o usuário com base no seu tipo
            if (usuario.tipo_usuario === 'admin') {
                navigate('/admin');
            } else {
                navigate('/secretaria');
            }

        } catch (error) {
            const errorMessage = error.response?.data?.error || 'Email ou senha incorretos. Tente novamente.';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.loginContainer}>
            <div className={styles.loginBox}>
                <img src={mavaLogo} alt="Logo Mava Connect" className={styles.logo} />
                <h1 className={styles.title}>Bem-vindo de volta!</h1>
                <p className={styles.subtitle}>Faça login para continuar</p>
                <form onSubmit={handleLogin} className={styles.loginForm}>
                    <div className={styles.inputGroup}>
                        <FaUser className={styles.icon} />
                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className={styles.inputGroup}>
                        <FaLock className={styles.icon} />
                        <input
                            type="password"
                            placeholder="Senha"
                            value={senha}
                            onChange={(e) => setSenha(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className={styles.loginButton} disabled={loading}>
                        {loading ? 'A entrar...' : 'Entrar'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default Login;
