// Caminho: src/Pages/Secretaria.jsx

import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import Header from '../src/Components/Header';
import styles from './style/Secretaria.module.css';
import { FaEdit, FaTrashAlt, FaWhatsapp, FaEnvelope, FaPlus } from 'react-icons/fa';
import { useIMask } from 'react-imask';
import { useViaCep } from '../src/hooks/useViaCep';

const API_URL = 'http://localhost:3001/visitantes';

const initialVisitorState = {
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


function Secretaria() {
  const [visitantes, setVisitantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Estados para os Modais
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingVisitante, setEditingVisitante] = useState(null);
  const [newVisitor, setNewVisitor] = useState(initialVisitorState);

  const { address, loading: cepLoading, error: cepError, fetchCep } = useViaCep();
  const numeroInputRef = useRef(null);


  // Função para buscar os dados da API
  const fetchVisitantes = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(API_URL, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setVisitantes(res.data);
    } catch (err) {
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        toast.error('Sua sessão expirou. Por favor, faça login novamente.');
        localStorage.clear();
        navigate('/');
      } else {
        toast.error('Erro ao buscar visitantes.');
      }
      console.error("Erro ao buscar visitantes:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisitantes();
  }, []);

  useEffect(() => {
    if (Object.keys(address).length > 0) {
      setNewVisitor((prev) => ({
        ...prev,
        endereco: {
            ...prev.endereco,
            logradouro: address.logradouro,
            bairro: address.bairro,
            cidade: address.cidade,
            uf: address.uf,
        }
      }));
      numeroInputRef.current?.focus();
    }
  }, [address]);

  // --- Funções de Ação ---

  const handleDelete = (id) => {
    toast((t) => (
      <div className={styles.toastContainer}>
        <span>Tem certeza que deseja excluir?</span>
        <div className={styles.toastButtons}>
            <button
            className={styles.confirmButton}
            onClick={() => {
                toast.dismiss(t.id);
                const token = localStorage.getItem('token');
                const promise = axios.delete(`${API_URL}/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
                });

                toast.promise(promise, {
                loading: 'Excluindo visitante...',
                success: () => {
                    fetchVisitantes(); // Atualiza a lista
                    return 'Visitante excluído com sucesso!';
                },
                error: 'Não foi possível excluir o visitante.',
                });
            }}
            >
            Sim
            </button>
            <button className={styles.cancelButtonToast} onClick={() => toast.dismiss(t.id)}>
            Não
            </button>
        </div>
      </div>
    ));
  };

  // --- Funções do Modal de Edição ---
  const handleOpenEditModal = (visitante) => {
    setEditingVisitante(visitante);
    setIsEditModalOpen(true);
  };
  
  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingVisitante(null);
  };

  const handleEditModalChange = (e) => {
    const { name, value } = e.target;
    if (['logradouro', 'numero', 'complemento', 'bairro', 'cidade', 'uf', 'cep'].includes(name)) {
      setEditingVisitante(prev => ({
        ...prev,
        endereco: {
          ...prev.endereco,
          [name]: value,
        }
      }));
    } else {
      setEditingVisitante(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleEditModalSubmit = (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    
    const promise = axios.put(`${API_URL}/${editingVisitante.id}`, editingVisitante, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    toast.promise(promise, {
      loading: 'Atualizando dados...',
      success: () => {
        fetchVisitantes();
        handleCloseEditModal();
        return 'Visitante atualizado com sucesso!';
      },
      error: 'Erro ao atualizar os dados.'
    });
  };

  // --- Funções do Modal de Adição ---
  const handleOpenAddModal = () => {
    setNewVisitor(initialVisitorState);
    setIsAddModalOpen(true);
  };

  const handleCloseAddModal = () => {
      setIsAddModalOpen(false);
  }

  const handleAddModalChange = (e) => {
    const {name, value} = e.target;
    setNewVisitor(prev => ({...prev, [name]: value}));
  }

  const handleAddModalCepChange = (e) => {
    const {name, value} = e.target;
    setNewVisitor(prev => ({...prev, endereco: {...prev.endereco, [name]: value}}));
  }

  const handleBuscaCep = () => {
    if (newVisitor.endereco.cep) fetchCep(newVisitor.endereco.cep);
  };

  const { ref: cepRef } = useIMask(
    { mask: '00000-000' },
    { onAccept: (value) => handleAddModalCepChange({ target: { name: 'cep', value } }) }
  );

  const { ref: telefoneRef } = useIMask(
    { mask: '(00) 00000-0000' },
    { onAccept: (value) => handleAddModalChange({ target: { name: 'telefone', value } }) }
  );

  const handleAddNewVisitorSubmit = (e) => {
    e.preventDefault();

    const dataToSend = {
      ...newVisitor,
      telefone: newVisitor.telefone.replace(/\D/g, ''),
      endereco: {
        ...newVisitor.endereco,
        cep: newVisitor.endereco.cep.replace(/\D/g, ''),
      }
    };

    const promise = axios.post(API_URL, dataToSend);

    toast.promise(promise, {
        loading: 'Cadastrando visitante...',
        success: () => {
            fetchVisitantes();
            handleCloseAddModal();
            return 'Visitante cadastrado com sucesso!';
        },
        error: (err) => {
            return err.response?.data?.error || 'Erro ao cadastrar. Tente novamente.';
        }
    });
  }


  // --- Renderização da Tabela ---

  const renderContent = () => {
    if (loading) return <p className={styles.message}>Carregando visitantes...</p>;
    if (visitantes.length === 0) return <p className={styles.message}>Nenhum visitante cadastrado ainda.</p>;

    return (
      <div className={styles.tableContainer}>
        <table className={styles.visitorTable}>
          <thead>
            <tr>
              <th>Nome Completo</th>
              <th>Telefone</th>
              <th>Contato</th>
              <th>Data da Visita</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {visitantes.map((visitante) => {
              const telefoneLimpo = visitante.telefone ? visitante.telefone.replace(/\D/g, '') : '';
              return (
                <tr key={visitante.id}>
                  <td>{visitante.nome}</td> 
                  <td>{visitante.telefone}</td>
                  <td className={styles.contactActions}>
                    {visitante.telefone && (
                      <a href={`https://wa.me/55${telefoneLimpo}`} target="_blank" rel="noopener noreferrer" title="Enviar WhatsApp">
                        <FaWhatsapp className={styles.whatsappIcon} />
                      </a>
                    )}
                    {visitante.email && (
                      <a href={`mailto:${visitante.email}`} title="Enviar Email">
                        <FaEnvelope className={styles.emailIcon} />
                      </a>
                    )}
                  </td>
                  <td>
                    {new Date(visitante.data_visita).toLocaleDateString('pt-BR', {
                      day: '2-digit', month: 'short', year: 'numeric'
                    })}
                  </td>
                  <td className={styles.actions}>
                    <button onClick={() => handleOpenEditModal(visitante)} title="Editar Visitante">
                      <FaEdit />
                    </button>
                    <button onClick={() => handleDelete(visitante.id)} title="Excluir Visitante" className={styles.deleteButton}>
                      <FaTrashAlt />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div>
      <Header />
      <main className={styles.dashboard}>
        <div className={styles.dashboardHeader}>
            <h1>Visitantes Cadastrados</h1>
            <button className={styles.addButton} onClick={handleOpenAddModal}>
                <FaPlus /> Adicionar Visitante
            </button>
        </div>
        <div className={styles.content}>
          {renderContent()}
        </div>
      </main>

      {/* Modal de Edição */}
      {isEditModalOpen && editingVisitante && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <form onSubmit={handleEditModalSubmit}>
              <h2>Editando: {editingVisitante.nome}</h2>
              <div className={styles.formGrid}>
                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                    <label htmlFor="nome">Nome Completo</label>
                    <input type="text" id="nome" name="nome" value={editingVisitante.nome} onChange={handleEditModalChange} required />
                </div>
                <div className={styles.formGroup}>
                    <label htmlFor="email">Email</label>
                    <input type="email" id="email" name="email" value={editingVisitante.email || ''} onChange={handleEditModalChange} />
                </div>
                <div className={styles.formGroup}>
                    <label htmlFor="telefone">Telefone</label>
                    <input type="tel" id="telefone" name="telefone" value={editingVisitante.telefone || ''} onChange={handleEditModalChange} required/>
                </div>
              </div>
              
              <div className={styles.modalActions}>
                <button type="button" onClick={handleCloseEditModal} className={styles.cancelButton}>Cancelar</button>
                <button type="submit" className={styles.saveButton}>Salvar Alterações</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Adição */}
      {isAddModalOpen && (
         <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
                <form onSubmit={handleAddNewVisitorSubmit}>
                    <h2>Cadastro de Visitante</h2>
                    <div className={styles.formGrid}>
                        <h3 className={styles.fullWidth}>Informações Pessoais</h3>
                        <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                            <label htmlFor="nome">Nome Completo</label>
                            <input id="nome" name="nome" type="text" value={newVisitor.nome} onChange={handleAddModalChange} required />
                        </div>
                        <div className={styles.formGroup}>
                            <label htmlFor="data_nascimento">Data de Nascimento</label>
                            <input id="data_nascimento" name="data_nascimento" type="date" value={newVisitor.data_nascimento} onChange={handleAddModalChange} />
                        </div>
                        <div className={styles.formGroup}>
                            <label htmlFor="sexo">Sexo</label>
                            <select id="sexo" name="sexo" value={newVisitor.sexo} onChange={handleAddModalChange}>
                                <option value="">Selecione</option>
                                <option value="Masculino">Masculino</option>
                                <option value="Feminino">Feminino</option>
                            </select>
                        </div>
                        <div className={styles.formGroup}>
                            <label htmlFor="estado_civil">Estado Civil</label>
                            <select id="estado_civil" name="estado_civil" value={newVisitor.estado_civil} onChange={handleAddModalChange}>
                                <option value="">Selecione</option>
                                <option value="Solteiro(a)">Solteiro(a)</option>
                                <option value="Casado(a)">Casado(a)</option>
                                <option value="União Estável">União Estável</option>
                                <option value="Divorciado(a)">Divorciado(a)</option>
                                <option value="Viúvo(a)">Viúvo(a)</option>
                            </select>
                        </div>
                        <div className={styles.formGroup}>
                            <label htmlFor="profissao">Profissão</label>
                            <input id="profissao" name="profissao" type="text" value={newVisitor.profissao} onChange={handleAddModalChange} />
                        </div>

                        <h3 className={styles.fullWidth}>Contato</h3>
                        <div className={styles.formGroup}>
                            <label htmlFor="email">Email</label>
                            <input id="email" name="email" type="email" value={newVisitor.email} onChange={handleAddModalChange} />
                        </div>
                        <div className={styles.formGroup}>
                            <label htmlFor="telefone">Celular / Telefone</label>
                            <input ref={telefoneRef} id="telefone" name="telefone" type="tel" value={newVisitor.telefone} onChange={handleAddModalChange} placeholder="(99) 99999-9999" required />
                        </div>

                        <h3 className={styles.fullWidth}>Endereço</h3>
                        <div className={styles.formGroup}>
                            <label htmlFor="cep">CEP</label>
                            <input ref={cepRef} id="cep" name="cep" type="text" value={newVisitor.endereco.cep} onChange={handleAddModalCepChange} onBlur={handleBuscaCep} placeholder="00000-000"/>
                            {cepLoading && <small>Buscando...</small>}
                            {cepError && <small>{cepError}</small>}
                        </div>
                        <div className={styles.formGroup}>
                            <label htmlFor="logradouro">Rua / Logradouro</label>
                            <input id="logradouro" name="logradouro" type="text" value={newVisitor.endereco.logradouro} onChange={handleAddModalCepChange} />
                        </div>
                        <div className={styles.formGroup}>
                            <label htmlFor="numero">Número</label>
                            <input ref={numeroInputRef} id="numero" name="numero" type="text" value={newVisitor.endereco.numero} onChange={handleAddModalCepChange} />
                        </div>
                        <div className={styles.formGroup}>
                            <label htmlFor="complemento">Complemento</label>
                            <input id="complemento" name="complemento" type="text" value={newVisitor.endereco.complemento} onChange={handleAddModalCepChange} />
                        </div>
                        <div className={styles.formGroup}>
                            <label htmlFor="bairro">Bairro</label>
                            <input id="bairro" name="bairro" type="text" value={newVisitor.endereco.bairro} onChange={handleAddModalCepChange} />
                        </div>
                        <div className={styles.formGroup}>
                            <label htmlFor="cidade">Cidade</label>
                            <input id="cidade" name="cidade" type="text" value={newVisitor.endereco.cidade} onChange={handleAddModalCepChange} />
                        </div>
                        <div className={styles.formGroup}>
                            <label htmlFor="uf">Estado (UF)</label>
                            <input id="uf" name="uf" type="text" value={newVisitor.endereco.uf} onChange={handleAddModalCepChange} maxLength={2} />
                        </div>

                        <h3 className={styles.fullWidth}>Informações da Igreja</h3>
                        <div className={styles.formGroup}>
                            <label htmlFor="como_conheceu">Como conheceu a igreja?</label>
                            <input id="como_conheceu" name="como_conheceu" type="text" value={newVisitor.como_conheceu} onChange={handleAddModalChange} />
                        </div>
                        <div className={styles.formGroup}>
                            <label htmlFor="gf_responsavel">GF Responsável</label>
                            <select id="gf_responsavel" name="gf_responsavel" value={newVisitor.gf_responsavel} onChange={handleAddModalChange} required>
                                <option value="">Selecione</option>
                                <option value="Efraim">Efraim</option>
                                <option value="Naum">Naum</option>
                                <option value="Moryah">Moryah</option>
                                <option value="Filhos da promessa">Filhos da promessa</option>
                                <option value="Ekballo">Ekballo</option>
                            </select>
                        </div>
                    </div>
                    <div className={styles.modalActions}>
                        <button type="button" onClick={handleCloseAddModal} className={styles.cancelButton}>Cancelar</button>
                        <button type="submit" className={styles.saveButton}>Cadastrar</button>
                    </div>
                </form>
            </div>
         </div>
      )}
    </div>
  );
}

export default Secretaria;
