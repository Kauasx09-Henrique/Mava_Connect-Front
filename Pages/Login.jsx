// Caminho: src/Pages/Login.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import styles from './style/Login.module.css';

// Boa prática: Definir a URL base da API em um só lugar.
// Em projetos maiores, isso viria de um arquivo de configuração ou variável de ambiente.
const API_URL = 'http://localhost:3001';

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

    // Usa axios.post para enviar os dados para a rota de login do backend.
    const loginPromise = axios.post(`${API_URL}/auth/login`, { email, senha });

    // `toast.promise` gerencia automaticamente as mensagens de carregando, sucesso e erro.
    toast.promise(loginPromise, {
      loading: 'Verificando credenciais...',
      success: (res) => {
        // Quando a requisição é bem-sucedida:
        // 1. Extrai os dados retornados pela API.
        const { token, tipo, nome, logo } = res.data;

        console.log('[Login.jsx] Resposta da API recebida:', res.data);

        // 2. Validação para garantir que a resposta da API está como esperado.
        if (!token || !tipo) {
          // Se algo estiver faltando, lança um erro que será capturado pelo `toast`.
          throw new Error('Resposta inválida do servidor. Faltando token ou tipo.');
        }

        // 3. Salva os dados do usuário no localStorage para manter a sessão.
        localStorage.setItem('token', token);
        localStorage.setItem('user_tipo', tipo); // Usei 'user_tipo' para clareza
        localStorage.setItem('user_nome', nome);
        if (logo) {
            localStorage.setItem('user_logo', logo);
        }

        // 4. Redireciona o usuário com base no seu tipo.
        // O setTimeout dá tempo para o usuário ver a mensagem de sucesso.
        setTimeout(() => {
          if  (tipo === 'admin') {
  navigate('/admin'); 

          } else if (tipo === 'secretaria') {
            navigate('/secretaria'); // Exemplo de rota de secretaria
          } else {
            // Caso de segurança: se o tipo for desconhecido, volta para o início.
            navigate('/');
          }
        }, 800); // 0.8 segundos de delay

        return `Bem-vindo(a), ${nome || 'usuário'}!`;
      },
      error: (err) => {
        // Quando a requisição falha:
        // Exibe a mensagem de erro vinda do backend ou uma mensagem padrão.
        console.error('[Login.jsx] Erro ao fazer login:', err);
        return err.response?.data?.error || 'Não foi possível conectar ao servidor.';
      },
    }).finally(() => {
      // Garante que o estado de 'loading' seja desativado ao final,
      // tanto em caso de sucesso quanto de erro.
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
            disabled={loading} // Desabilita o campo durante o carregamento
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
            disabled={loading} // Desabilita o campo durante o carregamento
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
