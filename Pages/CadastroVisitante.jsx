// Caminho: src/Pages/CadastroVisitante.jsx

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useIMask } from 'react-imask';
import toast from 'react-hot-toast';
import { useViaCep } from '../src/hooks/useViaCep';
import Header from '../src/Components/Header';
import styles from './style/Cadastro.module.css';

const API_URL = 'https://mava-connect-backend.onrender.com';

const initialState = {
  nome: '',
  data_nascimento: '',
  telefone: '',
  sexo: '',
  email: '',
  estado_civil: '',
  profissao: '',
  endereco: {
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    uf: '',
  },
  como_conheceu: '',
  gf_responsavel: '',
};

function CadastroVisitante() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialState);
  const [gfs, setGfs] = useState([]); // NOVO ESTADO: para armazenar a lista de GFs
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { address, loading: cepLoading, error: cepError, fetchCep } = useViaCep();
  const numeroInputRef = useRef(null);

  // --- BUSCA DE DADOS INICIAIS ---
  useEffect(() => {
    const fetchGfs = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API_URL}/api/gfs`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setGfs(res.data);
      } catch (error) {
        toast.error('Não foi possível carregar a lista de GFs.');
        console.error('Erro ao buscar GFs:', error);
      }
    };

    fetchGfs();
  }, []);


  const handleChange = (e) => {
    const { name, value } = e.target;
    if (Object.keys(form.endereco).includes(name)) {
      setForm((prev) => ({
        ...prev,
        endereco: { ...prev.endereco, [name]: value },
      }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };
  
  const { ref: cepRef } = useIMask(
    { mask: '00000-000' },
    { onAccept: (value) => handleChange({ target: { name: 'cep', value } }) }
  );

  const { ref: telefoneRef } = useIMask(
    { mask: '(00) 00000-0000' },
    { onAccept: (value) => handleChange({ target: { name: 'telefone', value } }) }
  );
  
  useEffect(() => {
    if (Object.keys(address).length > 0) {
      setForm((prev) => ({
        ...prev,
        endereco: {
          ...prev.endereco,
          logradouro: address.logradouro,
          bairro: address.bairro,
          cidade: address.cidade,
          uf: address.uf,
        },
      }));
      numeroInputRef.current?.focus();
    }
  }, [address]);

  const handleBuscaCep = () => {
    if (form.endereco.cep) fetchCep(form.endereco.cep);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const dataToSend = {
      ...form,
      data_nascimento: form.data_nascimento || null,
      telefone: form.telefone.replace(/\D/g, ''),
      endereco: {
        ...form.endereco,
        cep: form.endereco.cep.replace(/\D/g, ''),
      },
    };

    const token = localStorage.getItem('token');
    const promise = axios.post(`${API_URL}/visitantes`, dataToSend, {
        headers: { Authorization: `Bearer ${token}` }
    });

    toast.promise(promise, {
      loading: 'Cadastrando visitante...',
      success: () => {
        setForm(initialState);
        setTimeout(() => navigate('/secretaria'), 1000);
        return 'Visitante cadastrado com sucesso!';
      },
      error: (err) => err.response?.data?.details || err.response?.data?.error || 'Erro ao cadastrar.',
    }).finally(() => {
        setIsSubmitting(false);
    });
  };

  return (
    <>
      <Header />
      <div className={styles.pageContainer}>
        <form className={styles.formContainer} onSubmit={handleSubmit}>
          <h2>Cadastro de Visitante</h2>

          {/* ... outros campos do formulário ... */}

          <h3 className={styles.fullWidth}>Informações da Igreja</h3>
          <div className={styles.formGroup}>
            <label htmlFor="como_conheceu">Como conheceu a igreja?</label>
            <input id="como_conheceu" name="como_conheceu" type="text" value={form.como_conheceu} onChange={handleChange} disabled={isSubmitting} />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="gf_responsavel">GF Responsável</label>
            {/* --- SELECT DINÂMICO --- */}
            <select id="gf_responsavel" name="gf_responsavel" value={form.gf_responsavel} onChange={handleChange} required disabled={isSubmitting}>
              <option value="">Selecione um GF</option>
              {gfs.map((gf) => (
                <option key={gf.id} value={gf.nome}>
                  {gf.nome}
                </option>
              ))}
            </select>
          </div>

          <div className={`${styles.formGroup} ${styles.buttonGroup} ${styles.fullWidth}`}>
            <button type="button" className={styles.secondaryButton} onClick={() => navigate('/secretaria')} disabled={isSubmitting}>
              Voltar
            </button>
            <button type="submit" className={styles.primaryButton} disabled={isSubmitting}>
              {isSubmitting ? 'Cadastrando...' : 'Cadastrar Visitante'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

export default CadastroVisitante;
