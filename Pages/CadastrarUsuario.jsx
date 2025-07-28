// Caminho: src/Pages/Cadastrar_Usuario.jsx

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import styles from './style/Form.module.css';

const API_URL = 'http://localhost:3001/api/usuarios';

function CadastrarUsuario() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nome_gf: '',
    email_gf: '',
    senha_gf: '',
    tipo_usuario: 'secretaria',
  });
  const [logoFile, setLogoFile] = useState(null); // Estado separado para o arquivo do logo
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Função específica para lidar com a seleção do arquivo
  const handleFileChange = (e) => {
    setLogoFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const token = localStorage.getItem('token');
    if (!token) {
      toast.error("Sessão inválida. Faça o login novamente.");
      setLoading(false);
      navigate('/');
      return;
    }

    // Usamos FormData para poder enviar o arquivo da imagem
    const dataToSend = new FormData();
    dataToSend.append('nome_gf', formData.nome_gf);
    dataToSend.append('email_gf', formData.email_gf);
    dataToSend.append('senha_gf', formData.senha_gf);
    dataToSend.append('tipo_usuario', formData.tipo_usuario);
    if (logoFile) {
      dataToSend.append('logo', logoFile); // Adiciona o arquivo ao formulário
    }

    const promise = axios.post(API_URL, dataToSend, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data', // Essencial para o envio de arquivos
      }
    });

    toast.promise(promise, {
      loading: 'Cadastrando usuário...',
      success: (res) => {
        setTimeout(() => {
          navigate('/admin');
        }, 1000);
        return `Usuário ${res.data.nome_gf} cadastrado com sucesso!`;
      },
      error: (err) => {
        return err.response?.data?.error || 'Não foi possível cadastrar o usuário.';
      }
    }).finally(() => {
      setLoading(false);
    });
  };

  return (
    <div className={styles.formContainer}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <h2 className={styles.formTitle}>Cadastrar Novo Usuário</h2>
        
        <div className={styles.inputGroup}>
          <label htmlFor="nome_gf">Nome Completo</label>
          <input
            id="nome_gf"
            name="nome_gf"
            type="text"
            value={formData.nome_gf}
            onChange={handleInputChange}
            required
            disabled={loading}
          />
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="email_gf">Email</label>
          <input
            id="email_gf"
            name="email_gf"
            type="email"
            value={formData.email_gf}
            onChange={handleInputChange}
            required
            disabled={loading}
          />
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="senha_gf">Senha</label>
          <input
            id="senha_gf"
            name="senha_gf"
            type="password"
            value={formData.senha_gf}
            onChange={handleInputChange}
            required
            disabled={loading}
          />
        </div>
        
        {/* --- CAMPO DE UPLOAD DE ARQUIVO --- */}
        <div className={styles.inputGroup}>
          <label htmlFor="logo">Foto de Perfil (Opcional)</label>
          <input
            id="logo"
            name="logo"
            type="file"
            accept="image/png, image/jpeg, image/gif" // Aceita apenas imagens
            onChange={handleFileChange}
            disabled={loading}
          />
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="tipo_usuario">Perfil de Usuário</label>
          <select
            id="tipo_usuario"
            name="tipo_usuario"
            value={formData.tipo_usuario}
            onChange={handleInputChange}
            disabled={loading}
          >
            <option value="secretaria">Secretaria</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <div className={styles.buttonGroup}>
          <button 
            type="button" 
            className={styles.secondaryButton} 
            onClick={() => navigate('/admin')}
            disabled={loading}
          >
            Voltar
          </button>
          <button 
            type="submit" 
            className={styles.primaryButton}
            disabled={loading}
          >
            {loading ? 'Salvando...' : 'Salvar Usuário'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default CadastrarUsuario;
