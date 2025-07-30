// Caminho: src/Pages/Login.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import styles from './style/Login.module.css';

// Boa prática: Definir a URL base da API em um só lugar.
const API_URL = 'https://mava-connect-backend.onrender.com';

function Login() {
  // --- STATE MANAGEMENT ---
  // Estados para controlar os campos do formulário e o status de carregamento.
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // --- FUNÇÃO DE LOGIN ---
  const handleLogin = async (e) => {
    // Previne o recarregamento padrão da página ao submeter o formulário.
    e.preventDefault();
    setLoading(true);

    // !! LINHA DE DEBATE ADICIONADA !!
    // Verifique o console do seu NAVEGADOR (F12) para ver o que está sendo enviado.
    // A 'senha' aqui deve ser o texto que você digitou, e não um código.
    console.log('[Login.jsx] DADOS QUE SERÃO ENVIADOS PARA A API:', { email, senha });

    // Usa axios.post para enviar os dados para a rota de login do backend.
    const loginPromise = axios.post(`${API_URL}/auth/login`, { email, senha });

    // `toast.promise` gerencia automaticamente as mensagens de carregando, sucesso e erro.
    toast.promise(loginPromise, {
      loading: 'Verificando credenciais...',
      success: (res) => {
        // Quando a requisição é bem-sucedida:
        const { token, usuario } = res.data;

        // Validação para garantir que a resposta da API está como esperado.
        if (!token || !usuario || !usuario.tipo) {
          throw new Error('Resposta inválida do servidor. Faltando dados essenciais.');
        }

        // Salva os dados do usuário no localStorage para manter a sessão.
        localStorage.setItem('token', token);
        localStorage.setItem('user_tipo', usuario.tipo);
        localStorage.setItem('user_nome', usuario.nome);
        if (usuario.logo) {
          localStorage.setItem('user_logo', usuario.logo);
        }

        // Redireciona o usuário com base no seu tipo.
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
        // Exibe a mensagem de erro vinda do backend ou uma mensagem padrão.
        console.error('[Login.jsx] Erro ao fazer login:', err);
        // Acessa a mensagem de erro específica do backend
        return err.response?.data?.mensagem || 'Credenciais inválidas ou erro no servidor.';
      },
    }).finally(() => {
      // Garante que o estado de 'loading' seja desativado ao final.
      setLoading(false);
    });
  };

  // --- RENDERIZAÇÃO DO COMPONENTE ---
  return (
    <div className={styles.loginContainer}>
      <form className={styles.loginForm} onSubmit={handleLogin}>
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
