import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import Header from '../Components/Header';
import styles from './style/Admin.module.css';
import { 
  FaEdit, 
  FaTrashAlt, 
  FaPlus, 
  FaUsers, 
  FaWalking, 
  FaSearch,
  FaMoon,
  FaSun,
  FaCheck,
  FaTimes,
  FaUserClock
} from 'react-icons/fa';

const API_BASE_URL = 'https://mava-connect-backend.onrender.com';

const statusOptions = [
  { value: 'ativo', label: 'Ativo', color: 'green' },
  { value: 'inativo', label: 'Inativo', color: 'red' },
  { value: 'pendente', label: 'Pendente', color: 'orange' },
  { value: 'frequentando', label: 'Frequentando', color: 'blue' }
];

function Admin() {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(false);
  const [view, setView] = useState('usuarios');
  const [usuarios, setUsuarios] = useState([]);
  const [visitantes, setVisitantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});
  
  // Detect system theme preference
  useEffect(() => {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDarkMode(prefersDark);
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => setDarkMode(e.matches);
    mediaQuery.addEventListener('change', handler);
    
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Apply theme to body
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode');
      document.body.classList.remove('light-mode');
    } else {
      document.body.classList.add('light-mode');
      document.body.classList.remove('dark-mode');
    }
  }, [darkMode]);

  const fetchAllData = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    
    if (!token) {
      toast.error("Sessão expirada. Por favor, faça o login novamente.");
      navigate('/');
      return;
    }
    
    const headers = { 'Authorization': `Bearer ${token}` };
    
    try {
      const [usersRes, visitorsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/usuarios`, { headers }),
        axios.get(`${API_BASE_URL}/visitantes`, { headers })
      ]);
      
      setUsuarios(usersRes.data);
      setVisitantes(visitorsRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleOpenModal = (item = null) => {
    setEditingItem(item);
    if (view === 'usuarios') {
      setFormData({
        nome_gf: item?.nome_gf || '',
        email_gf: item?.email_gf || '',
        senha_gf: '',
        tipo_usuario: item?.tipo_usuario || 'secretaria'
      });
    } else {
      setFormData({
        nome: item?.nome || '',
        telefone: item?.telefone || '',
        status: item?.status || 'pendente',
        gf_responsavel: item?.gf_responsavel || ''
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setFormData({});
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleStatusChange = async (visitorId, newStatus) => {
    const token = localStorage.getItem('token');
    try {
      await axios.put(
        `${API_BASE_URL}/visitantes/${visitorId}/status`,
        { status: newStatus },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      toast.success(`Status atualizado para ${statusOptions.find(s => s.value === newStatus)?.label}`);
      fetchAllData();
    } catch (error) {
      toast.error("Erro ao atualizar status");
      console.error(error);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const headers = { 'Authorization': `Bearer ${token}` };
    
    const endpoint = view === 'usuarios' 
      ? `${API_BASE_URL}/api/usuarios` 
      : `${API_BASE_URL}/visitantes`;
    
    const dataToSend = { ...formData };
    if (view === 'usuarios' && editingItem && !dataToSend.senha_gf) {
      delete dataToSend.senha_gf;
    }

    try {
      let response;
      if (editingItem) {
        response = await axios.put(`${endpoint}/${editingItem.id}`, dataToSend, { headers });
      } else {
        response = await axios.post(endpoint, dataToSend, { headers });
      }
      
      toast.success(response.data.message || 'Operação realizada com sucesso!');
      fetchAllData();
      handleCloseModal();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao salvar dados');
    }
  };

  const handleDelete = async (item) => {
    const token = localStorage.getItem('token');
    const endpoint = view === 'usuarios' 
      ? `${API_BASE_URL}/api/usuarios/${item.id}` 
      : `${API_BASE_URL}/visitantes/${item.id}`;
    
    try {
      await axios.delete(endpoint, { headers: { 'Authorization': `Bearer ${token}` } });
      toast.success('Item excluído com sucesso!');
      fetchAllData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao excluir item');
    }
  };

  const filteredVisitantes = visitantes.filter(visitor => 
    visitor.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    visitor.telefone.includes(searchTerm) ||
    visitor.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredUsuarios = usuarios.filter(user => 
    user.nome_gf.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email_gf.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.tipo_usuario.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderStatusBadge = (status) => {
    const statusObj = statusOptions.find(s => s.value === status) || statusOptions[0];
    return (
      <span 
        className={styles.statusBadge} 
        style={{ backgroundColor: statusObj.color }}
      >
        {statusObj.label}
      </span>
    );
  };

  const renderUserTable = () => (
    <div className={styles.tableWrapper}>
      <table className={styles.dataTable}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Nome</th>
            <th>Email</th>
            <th>Perfil</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {filteredUsuarios.length > 0 ? filteredUsuarios.map(user => (
            <tr key={user.id}>
              <td>{user.id}</td>
              <td>{user.nome_gf}</td>
              <td>{user.email_gf}</td>
              <td>
                <span className={`${styles.perfil} ${styles[user.tipo_usuario]}`}>
                  {user.tipo_usuario}
                </span>
              </td>
              <td className={styles.actions}>
                <button 
                  onClick={() => handleOpenModal(user)} 
                  title="Editar"
                  className={styles.editButton}
                >
                  <FaEdit />
                </button>
                <button 
                  onClick={() => handleDelete(user)} 
                  title="Excluir" 
                  className={styles.deleteButton}
                >
                  <FaTrashAlt />
                </button>
              </td>
            </tr>
          )) : (
            <tr>
              <td colSpan="5" className={styles.noResults}>
                Nenhum usuário encontrado
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  const renderVisitorTable = () => (
    <div className={styles.tableWrapper}>
      <table className={styles.dataTable}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Nome</th>
            <th>Telefone</th>
            <th>Status</th>
            <th>GF Responsável</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {filteredVisitantes.length > 0 ? filteredVisitantes.map(visitor => (
            <tr key={visitor.id}>
              <td>{visitor.id}</td>
              <td>{visitor.nome}</td>
              <td>{visitor.telefone}</td>
              <td>
                <select
                  value={visitor.status}
                  onChange={(e) => handleStatusChange(visitor.id, e.target.value)}
                  className={styles.statusSelect}
                >
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </td>
              <td>{visitor.gf_responsavel}</td>
              <td className={styles.actions}>
                <button 
                  onClick={() => handleOpenModal(visitor)} 
                  title="Editar"
                  className={styles.editButton}
                >
                  <FaEdit />
                </button>
                <button 
                  onClick={() => handleDelete(visitor)} 
                  title="Excluir" 
                  className={styles.deleteButton}
                >
                  <FaTrashAlt />
                </button>
              </td>
            </tr>
          )) : (
            <tr>
              <td colSpan="6" className={styles.noResults}>
                Nenhum visitante encontrado
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  const renderModal = () => (
    <div className={`${styles.modalOverlay} ${darkMode ? styles.dark : ''}`}>
      <div className={styles.modalContent}>
        <button className={styles.closeModal} onClick={handleCloseModal}>
          &times;
        </button>
        
        <h2>
          {editingItem 
            ? `Editar ${view === 'usuarios' ? 'Usuário' : 'Visitante'}` 
            : 'Cadastrar Novo Visitante'}
        </h2>
        
        <form onSubmit={handleFormSubmit}>
          {view === 'usuarios' ? (
            <>
              <div className={styles.formGroup}>
                <label>Nome</label>
                <input 
                  type="text" 
                  name="nome_gf" 
                  value={formData.nome_gf || ''} 
                  onChange={handleFormChange} 
                  required 
                />
              </div>
              
              <div className={styles.formGroup}>
                <label>Email</label>
                <input 
                  type="email" 
                  name="email_gf" 
                  value={formData.email_gf || ''} 
                  onChange={handleFormChange} 
                  required 
                />
              </div>
              
              <div className={styles.formGroup}>
                <label>Senha</label>
                <input 
                  type="password" 
                  name="senha_gf" 
                  value={formData.senha_gf || ''} 
                  onChange={handleFormChange} 
                  placeholder={editingItem ? 'Deixe em branco para não alterar' : ''}
                />
              </div>
              
              <div className={styles.formGroup}>
                <label>Perfil</label>
                <select 
                  name="tipo_usuario" 
                  value={formData.tipo_usuario || 'secretaria'} 
                  onChange={handleFormChange}
                >
                  <option value="secretaria">Secretaria</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
            </>
          ) : (
            <>
              <div className={styles.formGroup}>
                <label>Nome Completo</label>
                <input 
                  type="text" 
                  name="nome" 
                  value={formData.nome || ''} 
                  onChange={handleFormChange} 
                  required 
                />
              </div>
              
              <div className={styles.formGroup}>
                <label>Telefone</label>
                <input 
                  type="text" 
                  name="telefone" 
                  value={formData.telefone || ''} 
                  onChange={handleFormChange} 
                  required 
                />
              </div>
              
              <div className={styles.formGroup}>
                <label>Status</label>
                <select 
                  name="status" 
                  value={formData.status || 'pendente'} 
                  onChange={handleFormChange}
                >
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className={styles.formGroup}>
                <label>GF Responsável</label>
                <input 
                  type="text" 
                  name="gf_responsavel" 
                  value={formData.gf_responsavel || ''} 
                  onChange={handleFormChange} 
                />
              </div>
            </>
          )}
          
          <div className={styles.modalActions}>
            <button 
              type="button" 
              onClick={handleCloseModal} 
              className={styles.cancelButton}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className={styles.saveButton}
            >
              {editingItem ? 'Atualizar' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <div className={`${styles.adminContainer} ${darkMode ? styles.dark : ''}`}>
      <Header darkMode={darkMode} setDarkMode={setDarkMode} />
      
      <div className={styles.adminPanel}>
        <div className={styles.header}>
          <h1>
            {view === 'usuarios' ? (
              <>
                <FaUsers /> Gerenciamento de Usuários
              </>
            ) : (
              <>
                <FaWalking /> Gerenciamento de Visitantes
              </>
            )}
          </h1>
          
          <div className={styles.controls}>
            <div className={styles.searchBox}>
              <FaSearch className={styles.searchIcon} />
              <input
                type="text"
                placeholder={`Pesquisar ${view === 'usuarios' ? 'usuários...' : 'visitantes...'}`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <button 
              onClick={() => handleOpenModal()} 
              className={styles.addButton}
            >
              <FaPlus /> {view === 'usuarios' ? 'Novo Usuário' : 'Novo Visitante'}
            </button>
          </div>
        </div>
        
        <div className={styles.viewToggle}>
          <button 
            onClick={() => setView('usuarios')} 
            className={view === 'usuarios' ? styles.active : ''}
          >
            <FaUsers /> Usuários
          </button>
          <button 
            onClick={() => setView('visitantes')} 
            className={view === 'visitantes' ? styles.active : ''}
          >
            <FaWalking /> Visitantes
          </button>
        </div>
        
        {loading ? (
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Carregando dados...</p>
          </div>
        ) : (
          view === 'usuarios' ? renderUserTable() : renderVisitorTable()
        )}
      </div>
      
      {isModalOpen && renderModal()}
    </div>
  );
}

export default Admin;