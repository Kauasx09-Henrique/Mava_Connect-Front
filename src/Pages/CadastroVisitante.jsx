import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useIMask } from 'react-imask';
import toast from 'react-hot-toast';
import { useViaCep } from '../../src/hooks/useViaCep';
import Header from '../Components/Header';
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
  const [gfs, setGfs] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  
  const { address, loading: cepLoading, error: cepError, fetchCep } = useViaCep();
  const numeroInputRef = useRef(null);

  // Detecta o tema preferido do sistema
  useEffect(() => {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDarkMode(prefersDark);
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => setDarkMode(mediaQuery.matches);
    mediaQuery.addEventListener('change', handler);
    
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Aplica o tema ao body
  useEffect(() => {
    document.body.className = darkMode ? 'dark-mode' : 'light-mode';
  }, [darkMode]);

  // Busca lista de GFs
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
      <Header darkMode={darkMode} setDarkMode={setDarkMode} />
      <div className={`${styles.pageContainer} ${darkMode ? styles.darkMode : ''}`}>
        <form className={styles.formContainer} onSubmit={handleSubmit}>
          <h2>Cadastro de Visitante</h2>

          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label htmlFor="nome">Nome Completo</label>
              <input id="nome" name="nome" type="text" value={form.nome} onChange={handleChange} required disabled={isSubmitting} />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="data_nascimento">Data de Nascimento</label>
              <input id="data_nascimento" name="data_nascimento" type="date" value={form.data_nascimento} onChange={handleChange} disabled={isSubmitting} />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="telefone">Telefone</label>
              <input id="telefone" name="telefone" type="text" value={form.telefone} ref={telefoneRef} onChange={handleChange} required disabled={isSubmitting} />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="sexo">Sexo</label>
              <select id="sexo" name="sexo" value={form.sexo} onChange={handleChange} required disabled={isSubmitting}>
                <option value="">Selecione</option>
                <option value="Masculino">Masculino</option>
                <option value="Feminino">Feminino</option>
                <option value="Outro">Outro</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="email">E-mail</label>
              <input id="email" name="email" type="email" value={form.email} onChange={handleChange} disabled={isSubmitting} />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="estado_civil">Estado Civil</label>
              <select id="estado_civil" name="estado_civil" value={form.estado_civil} onChange={handleChange} disabled={isSubmitting}>
                <option value="">Selecione</option>
                <option value="Solteiro(a)">Solteiro(a)</option>
                <option value="Casado(a)">Casado(a)</option>
                <option value="Divorciado(a)">Divorciado(a)</option>
                <option value="Viúvo(a)">Viúvo(a)</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="profissao">Profissão</label>
              <input id="profissao" name="profissao" type="text" value={form.profissao} onChange={handleChange} disabled={isSubmitting} />
            </div>
          </div>

          <h3 className={styles.fullWidth}>Endereço</h3>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label htmlFor="cep">CEP</label>
              <div className={styles.cepContainer}>
                <input id="cep" name="cep" type="text" value={form.endereco.cep} ref={cepRef} onChange={handleChange} disabled={isSubmitting} />
                <button type="button" onClick={handleBuscaCep} disabled={isSubmitting || !form.endereco.cep || form.endereco.cep.length < 8} className={styles.cepButton}>
                  {cepLoading ? 'Buscando...' : 'Buscar'}
                </button>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="logradouro">Logradouro</label>
              <input id="logradouro" name="logradouro" type="text" value={form.endereco.logradouro} onChange={handleChange} disabled={isSubmitting} />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="numero">Número</label>
              <input id="numero" name="numero" type="text" value={form.endereco.numero} onChange={handleChange} ref={numeroInputRef} disabled={isSubmitting} />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="complemento">Complemento</label>
              <input id="complemento" name="complemento" type="text" value={form.endereco.complemento} onChange={handleChange} disabled={isSubmitting} />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="bairro">Bairro</label>
              <input id="bairro" name="bairro" type="text" value={form.endereco.bairro} onChange={handleChange} disabled={isSubmitting} />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="cidade">Cidade</label>
              <input id="cidade" name="cidade" type="text" value={form.endereco.cidade} onChange={handleChange} disabled={isSubmitting} />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="uf">UF</label>
              <input id="uf" name="uf" type="text" value={form.endereco.uf} onChange={handleChange} disabled={isSubmitting} maxLength="2" />
            </div>
          </div>

          <h3 className={styles.fullWidth}>Informações da Igreja</h3>
          <div className={styles.formGroup}>
            <label htmlFor="como_conheceu">Como conheceu a igreja?</label>
            <input id="como_conheceu" name="como_conheceu" type="text" value={form.como_conheceu} onChange={handleChange} disabled={isSubmitting} />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="gf_responsavel">GF Responsável</label>
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