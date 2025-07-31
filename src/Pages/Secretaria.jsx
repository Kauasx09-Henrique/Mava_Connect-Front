import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import Header from '../Components/Header';
import styles from './style/Secretaria.module.css';
import { FiEdit, FiTrash2, FiPhone, FiMail, FiPlus, FiX, FiCalendar, FiCheck, FiClock, FiAlertCircle } from 'react-icons/fi';
import { useIMask } from 'react-imask';
import { useViaCep } from '../hooks/useViaCep';

const API_URL = 'https://mava-connect-backend.onrender.com';

const initialVisitorState = {
  nome: '',
  data_nascimento: '',
  telefone: '',
  sexo: '',
  email: '',
  estado_civil: '',
  profissao: '',
  status: 'pendente', // Valor padrão
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
  const [statusFilter, setStatusFilter] = useState('todos'); // Novo filtro de status
  const [darkMode, setDarkMode] = useState(false);
  const navigate = useNavigate();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingVisitante, setEditingVisitante] = useState(null);
  const [newVisitor, setNewVisitor] = useState(initialVisitorState);

  const { address, loading: cepLoading, error: cepError, fetchCep } = useViaCep();
  const numeroInputRef = useRef(null);

  // Configuração inicial do modo escuro
  useEffect(() => {
    const checkDarkMode = () => {
      const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      setDarkMode(isDark);
      
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e) => setDarkMode(e.matches);
      mediaQuery.addEventListener('change', handleChange);
      
      return () => mediaQuery.removeEventListener('change', handleChange);
    };

    checkDarkMode();
  }, []);

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
    const filtered = visitantes.filter(visitante => {
      const matchesSearch = searchTerm 
        ? visitante.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (visitante.telefone && visitante.telefone.includes(searchTerm)) ||
          (visitante.email && visitante.email.toLowerCase().includes(searchTerm.toLowerCase()))
        : true;
      
      const matchesStatus = statusFilter === 'todos' 
        ? true 
        : visitante.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
    
    setFilteredVisitantes(filtered);
  }, [searchTerm, statusFilter, visitantes]);

  // ... (outras funções permanecem iguais até handleEditModalSubmit)

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

  // Função para obter ícone e cor do status
  const getStatusInfo = (status) => {
    switch (status) {
      case 'entrou em contato':
        return { icon: <FiCheck />, color: '#10B981', label: 'Contatado' };
      case 'pendente':
        return { icon: <FiClock />, color: '#F59E0B', label: 'Pendente' };
      case 'erro número':
        return { icon: <FiAlertCircle />, color: '#EF4444', label: 'Número inválido' };
      default:
        return { icon: null, color: '#6B7280', label: status };
    }
  };

  const renderVisitorCards = () => {
    if (loading) return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
      </div>
    );

    if (filteredVisitantes.length === 0) return (
      <div className={`${styles.emptyState} ${darkMode ? styles.darkEmptyState : ''}`}>
        <div className={styles.emptyIllustration}></div>
        <p>{searchTerm || statusFilter !== 'todos' ? 'Nenhum resultado encontrado' : 'Nenhum visitante cadastrado ainda'}</p>
      </div>
    );

    return (
      <div className={styles.visitorsGrid}>
        {filteredVisitantes.map(visitante => {
          const statusInfo = getStatusInfo(visitante.status);
          
          return (
            <div key={visitante.id} className={`${styles.visitorCard} ${darkMode ? styles.darkCard : ''}`}>
              <div className={styles.cardHeader}>
                <div className={styles.visitorTitle}>
                  <h3>{visitante.nome}</h3>
                  <span 
                    className={styles.statusBadge}
                    style={{ backgroundColor: statusInfo.color }}
                    title={statusInfo.label}
                  >
                    {statusInfo.icon}
                  </span>
                </div>
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
                        target="_blank"
                        rel="noopener noreferrer"
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
                  className={`${styles.editButton} ${darkMode ? styles.darkEditButton : ''}`}
                >
                  <FiEdit /> Editar
                </button>
                <button 
                  onClick={() => handleDelete(visitante.id)}
                  className={`${styles.deleteButton} ${darkMode ? styles.darkDeleteButton : ''}`}
                >
                  <FiTrash2 /> Remover
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className={`${styles.container} ${darkMode ? styles.darkMode : ''}`}>
      <Header darkMode={darkMode} />
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
                className={`${styles.searchInput} ${darkMode ? styles.darkInput : ''}`}
              />
              {searchTerm && (
                <button className={`${styles.clearSearch} ${darkMode ? styles.darkClearSearch : ''}`} 
                  onClick={() => setSearchTerm('')}>
                  <FiX />
                </button>
              )}
            </div>
            
            <div className={styles.filters}>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={`${styles.statusFilter} ${darkMode ? styles.darkInput : ''}`}
              >
                <option value="todos">Todos os status</option>
                <option value="pendente">Pendente</option>
                <option value="entrou em contato">Contatado</option>
                <option value="erro número">Número inválido</option>
              </select>
              
              <button 
                className={`${styles.addButton} ${darkMode ? styles.darkAddButton : ''}`} 
                onClick={handleOpenAddModal}
              >
                <FiPlus /> Novo Visitante
              </button>
            </div>
          </div>
        </div>
        
        <div className={styles.content}>
          {renderVisitorCards()}
        </div>
      </main>

      {/* Modal de Edição - Atualizado com campo de status */}
      {isEditModalOpen && editingVisitante && (
        <div className={styles.modalOverlay}>
          <div className={`${styles.modalContent} ${darkMode ? styles.darkModal : ''}`}>
            <button className={`${styles.closeModal} ${darkMode ? styles.darkCloseModal : ''}`} 
              onClick={handleCloseEditModal}>
              <FiX />
            </button>
            <form onSubmit={handleEditModalSubmit}>
              <h2>Editando: {editingVisitante.nome}</h2>
              <div className={styles.formGrid}>
                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label htmlFor="edit-nome">Nome Completo</label>
                  <input 
                    type="text" 
                    id="edit-nome" 
                    name="nome" 
                    value={editingVisitante.nome} 
                    onChange={handleEditModalChange} 
                    required 
                    className={darkMode ? styles.darkInput : ''}
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="edit-status">Status</label>
                  <select
                    id="edit-status"
                    name="status"
                    value={editingVisitante.status}
                    onChange={handleEditModalChange}
                    className={darkMode ? styles.darkInput : ''}
                  >
                    <option value="pendente">Pendente</option>
                    <option value="entrou em contato">Entrou em contato</option>
                    <option value="erro número">Erro número</option>
                  </select>
                </div>
                
                {/* Outros campos do formulário */}
              </div>
              
              <div className={styles.modalActions}>
                <button 
                  type="button" 
                  onClick={handleCloseEditModal} 
                  className={`${styles.cancelButton} ${darkMode ? styles.darkCancelButton : ''}`}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className={`${styles.saveButton} ${darkMode ? styles.darkSaveButton : ''}`}
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Adição - Atualizado com campo de status */}
      {isAddModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={`${styles.modalContent} ${darkMode ? styles.darkModal : ''}`}>
            <button className={`${styles.closeModal} ${darkMode ? styles.darkCloseModal : ''}`} 
              onClick={handleCloseAddModal}>
              <FiX />
            </button>
            <form onSubmit={handleAddNewVisitorSubmit}>
              <h2>Adicionar Novo Visitante</h2>
              <div className={styles.formGrid}>
                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label htmlFor="add-nome">Nome Completo *</label>
                  <input 
                    type="text" 
                    id="add-nome" 
                    name="nome" 
                    value={newVisitor.nome} 
                    onChange={handleAddModalChange} 
                    required 
                    className={darkMode ? styles.darkInput : ''}
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="add-status">Status *</label>
                  <select
                    id="add-status"
                    name="status"
                    value={newVisitor.status}
                    onChange={handleAddModalChange}
                    className={darkMode ? styles.darkInput : ''}
                  >
                    <option value="pendente">Pendente</option>
                    <option value="entrou em contato">Entrou em contato</option>
                    <option value="erro número">Erro número</option>
                  </select>
                </div>
                
                {/* Outros campos do formulário */}
              </div>
              
              <div className={styles.modalActions}>
                <button 
                  type="button" 
                  onClick={handleCloseAddModal} 
                  className={`${styles.cancelButton} ${darkMode ? styles.darkCancelButton : ''}`}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className={`${styles.saveButton} ${darkMode ? styles.darkSaveButton : ''}`}
                >
                  Cadastrar Visitante
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Secretaria;