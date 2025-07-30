import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import Header from '../src/Components/Header';
import styles from './style/Secretaria.module.css';
import { FiEdit, FiTrash2, FiPhone, FiMail, FiPlus, FiX, FiCalendar } from 'react-icons/fi';
import { useIMask } from 'react-imask';
import { useViaCep } from '../src/hooks/useViaCep';

const API_URL = 'https://mava-connect-backend.onrender.com';

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
  const [filteredVisitantes, setFilteredVisitantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingVisitante, setEditingVisitante] = useState(null);
  const [newVisitor, setNewVisitor] = useState(initialVisitorState);

  const { address, loading: cepLoading, error: cepError, fetchCep } = useViaCep();
  const numeroInputRef = useRef(null);

  const fetchVisitantes = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/visitantes`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setVisitantes(res.data);
      setFilteredVisitantes(res.data);
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
    if (searchTerm) {
      const filtered = visitantes.filter(visitante =>
        visitante.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (visitante.telefone && visitante.telefone.includes(searchTerm)) ||
        (visitante.email && visitante.email.toLowerCase().includes(searchTerm.toLowerCase())));
      setFilteredVisitantes(filtered);
    } else {
      setFilteredVisitantes(visitantes);
    }
  }, [searchTerm, visitantes]);

  useEffect(() => {
    if (Object.keys(address).length > 0) {
      const stateToUpdate = isAddModalOpen ? setNewVisitor : setEditingVisitante;
      const visitorToUpdate = isAddModalOpen ? newVisitor : editingVisitante;

      stateToUpdate((prev) => ({
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
  }, [address, isAddModalOpen, isEditModalOpen]);

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
              const promise = axios.delete(`${API_URL}/visitantes/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
              });

              toast.promise(promise, {
                loading: 'Excluindo visitante...',
                success: () => {
                  fetchVisitantes();
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
    const isEnderecoField = ['logradouro', 'numero', 'complemento', 'bairro', 'cidade', 'uf', 'cep'].includes(name);

    setEditingVisitante(prev => ({
      ...prev,
      ...(isEnderecoField ? { endereco: { ...prev.endereco, [name]: value } } : { [name]: value })
    }));
  };

  const handleEditModalSubmit = (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    
    const promise = axios.put(`${API_URL}/visitantes/${editingVisitante.id}`, editingVisitante, {
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

  const handleOpenAddModal = () => {
    setNewVisitor(initialVisitorState);
    setIsAddModalOpen(true);
  };

  const handleCloseAddModal = () => setIsAddModalOpen(false);

  const handleAddModalChange = (e) => {
    const {name, value} = e.target;
    const isEnderecoField = ['logradouro', 'numero', 'complemento', 'bairro', 'cidade', 'uf', 'cep'].includes(name);
    
    setNewVisitor(prev => ({
      ...prev,
      ...(isEnderecoField ? { endereco: { ...prev.endereco, [name]: value } } : { [name]: value })
    }));
  };

  const handleBuscaCep = () => {
    const cepToSearch = isAddModalOpen ? newVisitor.endereco.cep : editingVisitante?.endereco.cep;
    if (cepToSearch) fetchCep(cepToSearch);
  };

  const { ref: cepRef } = useIMask({ mask: '00000-000' });
  const { ref: telefoneRef } = useIMask({ mask: '(00) 00000-0000' });

  const handleAddNewVisitorSubmit = (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');

    const dataToSend = {
      ...newVisitor,
      telefone: newVisitor.telefone.replace(/\D/g, ''),
      endereco: {
        ...newVisitor.endereco,
        cep: newVisitor.endereco.cep.replace(/\D/g, ''),
      }
    };

    const promise = axios.post(`${API_URL}/visitantes`, dataToSend, {
      headers: { Authorization: `Bearer ${token}` }
    });

    toast.promise(promise, {
      loading: 'Cadastrando visitante...',
      success: () => {
        fetchVisitantes();
        handleCloseAddModal();
        return 'Visitante cadastrado com sucesso!';
      },
      error: (err) => err.response?.data?.error || 'Erro ao cadastrar. Tente novamente.'
    });
  };

  const renderVisitorCards = () => {
    if (loading) return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
      </div>
    );

    if (filteredVisitantes.length === 0) return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIllustration}></div>
        <p>{searchTerm ? 'Nenhum resultado encontrado' : 'Nenhum visitante cadastrado ainda'}</p>
      </div>
    );

    return (
      <div className={styles.visitorsGrid}>
        {filteredVisitantes.map(visitante => (
          <div key={visitante.id} className={styles.visitorCard}>
            <div className={styles.cardHeader}>
              <h3>{visitante.nome}</h3>
              <div className={styles.visitDate}>
                <FiCalendar />
                <span>
                  {new Date(visitante.data_visita).toLocaleDateString('pt-BR', {
                    day: '2-digit', month: 'short', year: 'numeric'
                  })}
                </span>
              </div>
            </div>
            
            <div className={styles.cardContent}>
              {visitante.telefone && (
                <div className={styles.contactItem}>
                  <FiPhone className={styles.contactIcon} />
                  <div>
                    <p className={styles.contactLabel}>Telefone</p>
                    <a 
                      href={`https://wa.me/55${visitante.telefone.replace(/\D/g, '')}`} 
                      className={styles.contactLink}
                    >
                      {visitante.telefone}
                    </a>
                  </div>
                </div>
              )}
              
              {visitante.email && (
                <div className={styles.contactItem}>
                  <FiMail className={styles.contactIcon} />
                  <div>
                    <p className={styles.contactLabel}>Email</p>
                    <a 
                      href={`mailto:${visitante.email}`} 
                      className={styles.contactLink}
                    >
                      {visitante.email}
                    </a>
                  </div>
                </div>
              )}
            </div>
            
            <div className={styles.cardFooter}>
              <button 
                onClick={() => handleOpenEditModal(visitante)}
                className={styles.editButton}
              >
                <FiEdit /> Editar
              </button>
              <button 
                onClick={() => handleDelete(visitante.id)}
                className={styles.deleteButton}
              >
                <FiTrash2 /> Remover
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <Header />
      <main className={styles.dashboard}>
        <div className={styles.dashboardHeader}>
          <h1>Visitantes Cadastrados</h1>
          <div className={styles.actionsHeader}>
            <div className={styles.searchContainer}>
              <input
                type="text"
                placeholder="Buscar visitantes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.searchInput}
              />
              {searchTerm && (
                <button className={styles.clearSearch} onClick={() => setSearchTerm('')}>
                  <FiX />
                </button>
              )}
            </div>
            <button className={styles.addButton} onClick={handleOpenAddModal}>
              <FiPlus /> Novo Visitante
            </button>
          </div>
        </div>
        
        <div className={styles.content}>
          {renderVisitorCards()}
        </div>
      </main>

      {/* Modal de Edição */}
      {isEditModalOpen && editingVisitante && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <button className={styles.closeModal} onClick={handleCloseEditModal}>
              <FiX />
            </button>
            <form onSubmit={handleEditModalSubmit}>
              <h2>Editando: {editingVisitante.nome}</h2>
              <div className={styles.formGrid}>
                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label htmlFor="edit-nome">Nome Completo</label>
                  <input type="text" id="edit-nome" name="nome" value={editingVisitante.nome} onChange={handleEditModalChange} required />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="edit-email">Email</label>
                  <input type="email" id="edit-email" name="email" value={editingVisitante.email || ''} onChange={handleEditModalChange} />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="edit-telefone">Telefone</label>
                  <input type="tel" id="edit-telefone" name="telefone" value={editingVisitante.telefone || ''} onChange={handleEditModalChange} required ref={telefoneRef} />
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
            <button className={styles.closeModal} onClick={handleCloseAddModal}>
              <FiX />
            </button>
            <form onSubmit={handleAddNewVisitorSubmit}>
              <h2>Adicionar Novo Visitante</h2>
              <div className={styles.formGrid}>
                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label htmlFor="add-nome">Nome Completo*</label>
                  <input type="text" id="add-nome" name="nome" value={newVisitor.nome} onChange={handleAddModalChange} required />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="add-email">Email</label>
                  <input type="email" id="add-email" name="email" value={newVisitor.email} onChange={handleAddModalChange} />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="add-telefone">Telefone*</label>
                  <input type="tel" id="add-telefone" name="telefone" value={newVisitor.telefone} onChange={handleAddModalChange} required ref={telefoneRef} />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="add-cep">CEP</label>
                  <div className={styles.cepContainer}>
                    <input type="text" id="add-cep" name="cep" value={newVisitor.endereco.cep} onChange={handleAddModalChange} ref={cepRef} />
                    <button type="button" onClick={handleBuscaCep} className={styles.cepButton} disabled={cepLoading}>
                      {cepLoading ? 'Buscando...' : 'Buscar'}
                    </button>
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="add-logradouro">Logradouro</label>
                  <input type="text" id="add-logradouro" name="logradouro" value={newVisitor.endereco.logradouro} onChange={handleAddModalChange} />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="add-numero">Número</label>
                  <input type="text" id="add-numero" name="numero" value={newVisitor.endereco.numero} onChange={handleAddModalChange} ref={numeroInputRef} />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="add-complemento">Complemento</label>
                  <input type="text" id="add-complemento" name="complemento" value={newVisitor.endereco.complemento} onChange={handleAddModalChange} />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="add-bairro">Bairro</label>
                  <input type="text" id="add-bairro" name="bairro" value={newVisitor.endereco.bairro} onChange={handleAddModalChange} />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="add-cidade">Cidade</label>
                  <input type="text" id="add-cidade" name="cidade" value={newVisitor.endereco.cidade} onChange={handleAddModalChange} />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="add-uf">UF</label>
                  <input type="text" id="add-uf" name="uf" value={newVisitor.endereco.uf} onChange={handleAddModalChange} maxLength="2" />
                </div>
              </div>
              
              <div className={styles.modalActions}>
                <button type="button" onClick={handleCloseAddModal} className={styles.cancelButton}>Cancelar</button>
                <button type="submit" className={styles.saveButton}>Cadastrar Visitante</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
export default Secretaria;