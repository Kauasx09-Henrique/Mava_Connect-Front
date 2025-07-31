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
  FaFilter,
  FaChartLine,
  FaUserShield,
  FaUserFriends,
  FaPhone,
  FaEnvelope,
  FaCalendarAlt,
  FaMapMarkerAlt
} from 'react-icons/fa';
import { GiModernCity } from 'react-icons/gi';

const API_BASE_URL = 'https://mava-connect-backend.onrender.com';

const statusOptions = [
  { value: 'ativo', label: 'Ativo', color: '#4CAF50' },
  { value: 'inativo', label: 'Inativo', color: '#F44336' },
  { value: 'pendente', label: 'Pendente', color: '#FFC107' },
  { value: 'frequentando', label: 'Frequentando', color: '#2196F3' }
];

const userRoles = {
  admin: { label: 'Administrador', icon: <FaUserShield />, color: '#9C27B0' },
  secretaria: { label: 'Secretaria', icon: <FaUserFriends />, color: '#3F51B5' }
};

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
  const [activeFilter, setActiveFilter] = useState('all');

  // Theme detection
  useEffect(() => {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDarkMode(prefersDark);
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => setDarkMode(e.matches);
    mediaQuery.addEventListener('change', handler);
    
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Apply theme
  useEffect(() => {
    document.body.className = darkMode ? 'dark-mode' : 'light-mode';
  }, [darkMode]);

  // Fetch all data
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

  // Modal handlers
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
        email: item?.email || '',
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

  // Status change handler
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

  // Form submission
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

  // Delete handler
  const handleDelete = async (item) => {
    toast((t) => (
      <div className={styles.confirmationToast}>
        <p>Confirmar exclusão de <strong>{view === 'usuarios' ? item.nome_gf : item.nome}</strong>?</p>
        <div className={styles.toastActions}>
          <button 
            className={styles.toastConfirmButton}
            onClick={async () => {
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
              toast.dismiss(t.id);
            }}
          >
            Confirmar
          </button>
          <button 
            className={styles.toastCancelButton}
            onClick={() => toast.dismiss(t.id)}
          >
            Cancelar
          </button>
        </div>
      </div>
    ), { duration: 10000 });
  };

  // Filter visitors by status
  const filteredVisitantes = visitantes.filter(visitor => {
    const matchesSearch = 
      visitor.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visitor.telefone.includes(searchTerm) ||
      visitor.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visitor.gf_responsavel?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = activeFilter === 'all' || visitor.status === activeFilter;
    
    return matchesSearch && matchesFilter;
  });

  const filteredUsuarios = usuarios.filter(user => 
    user.nome_gf.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email_gf.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.tipo_usuario.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Render status badge
  const renderStatusBadge = (status) => {
    const statusObj = statusOptions.find(s => s.value === status) || statusOptions[0];
    return (
      <span 
        className={styles.statusBadge} 
        style={{ 
          backgroundColor: statusObj.color,
          color: darkMode ? '#fff' : '#000'
        }}
      >
        {statusObj.label}
      </span>
    );
  };

  // Render user role badge
  const renderRoleBadge = (role) => {
    const roleObj = userRoles[role] || userRoles.secretaria;
    return (
      <span 
        className={styles.roleBadge} 
        style={{ 
          backgroundColor: roleObj.color,
          color: '#fff'
        }}
      >
        {roleObj.icon} {roleObj.label}
      </span>
    );
  };

  // Render user table
  const renderUserTable = () => (
    <div className={styles.tableContainer}>
      <div className={styles.tableHeader}>
        <h3>Lista de Usuários</h3>
        <button 
          onClick={() => handleOpenModal()} 
          className={styles.addButton}
        >
          <FaPlus /> Novo Usuário
        </button>
      </div>
      
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
                <td>
                  <div className={styles.userInfo}>
                    <span className={styles.userName}>{user.nome_gf}</span>
                  </div>
                </td>
                <td>{user.email_gf}</td>
                <td>{renderRoleBadge(user.tipo_usuario)}</td>
                <td className={styles.actions}>
                  <div className={styles.actionButtons}>
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
                  </div>
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
    </div>
  );

  // Render visitor table
  const renderVisitorTable = () => (
    <div className={styles.tableContainer}>
      <div className={styles.tableHeader}>
        <h3>Lista de Visitantes</h3>
        <div className={styles.tableControls}>
          <div className={styles.filterButtons}>
            <button 
              onClick={() => setActiveFilter('all')} 
              className={activeFilter === 'all' ? styles.activeFilter : ''}
            >
              Todos
            </button>
            {statusOptions.map(option => (
              <button
                key={option.value}
                onClick={() => setActiveFilter(option.value)}
                className={activeFilter === option.value ? styles.activeFilter : ''}
                style={{ color: option.color }}
              >
                {option.label}
              </button>
            ))}
          </div>
          <button 
            onClick={() => handleOpenModal()} 
            className={styles.addButton}
          >
            <FaPlus /> Novo Visitante
          </button>
        </div>
      </div>
      
      <div className={styles.tableWrapper}>
        <table className={styles.dataTable}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nome</th>
              <th>Contato</th>
              <th>Status</th>
              <th>GF Responsável</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredVisitantes.length > 0 ? filteredVisitantes.map(visitor => (
              <tr key={visitor.id}>
                <td>{visitor.id}</td>
                <td>
                  <div className={styles.visitorInfo}>
                    <span className={styles.visitorName}>{visitor.nome}</span>
                    {visitor.email && (
                      <span className={styles.visitorDetail}>
                        <FaEnvelope /> {visitor.email}
                      </span>
                    )}
                  </div>
                </td>
                <td>
                  <div className={styles.contactInfo}>
                    <span className={styles.contactItem}>
                      <FaPhone /> {visitor.telefone}
                    </span>
                    {visitor.data_nascimento && (
                      <span className={styles.contactItem}>
                        <FaCalendarAlt /> {new Date(visitor.data_nascimento).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </td>
                <td>
                  <select
                    value={visitor.status}
                    onChange={(e) => handleStatusChange(visitor.id, e.target.value)}
                    className={styles.statusSelect}
                    style={{ 
                      borderColor: statusOptions.find(s => s.value === visitor.status)?.color,
                      color: darkMode ? '#fff' : '#333'
                    }}
                  >
                    {statusOptions.map(option => (
                      <option 
                        key={option.value} 
                        value={option.value}
                        style={{ color: '#333' }}
                      >
                        {option.label}
                      </option>
                    ))}
                  </select>
                </td>
                <td>{visitor.gf_responsavel}</td>
                <td className={styles.actions}>
                  <div className={styles.actionButtons}>
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
                  </div>
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
    </div>
  );

  // Render visitor modal
  const renderVisitorModal = () => (
    <div className={`${styles.modalOverlay} ${darkMode ? styles.dark : ''}`}>
      <div className={styles.modalContent}>
        <button className={styles.closeModal} onClick={handleCloseModal}>
          &times;
        </button>
        
        <h2>
          {editingItem 
            ? `Editar Visitante - ${editingItem.nome}`
            : 'Cadastrar Novo Visitante'}
        </h2>
        
        <form onSubmit={handleFormSubmit} className={styles.modalForm}>
          <div className={styles.formSection}>
            <h3>Informações Pessoais</h3>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label>Nome Completo*</label>
                <input 
                  type="text" 
                  name="nome" 
                  value={formData.nome || ''} 
                  onChange={handleFormChange} 
                  required 
                />
              </div>
              
              <div className={styles.formGroup}>
                <label>Telefone*</label>
                <input 
                  type="text" 
                  name="telefone" 
                  value={formData.telefone || ''} 
                  onChange={handleFormChange} 
                  required 
                />
              </div>
              
              <div className={styles.formGroup}>
                <label>Email</label>
                <input 
                  type="email" 
                  name="email" 
                  value={formData.email || ''} 
                  onChange={handleFormChange} 
                />
              </div>
              
              <div className={styles.formGroup}>
                <label>Status*</label>
                <select 
                  name="status" 
                  value={formData.status || 'pendente'} 
                  onChange={handleFormChange}
                  required
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
            </div>
          </div>
          
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
              {editingItem ? 'Atualizar Visitante' : 'Cadastrar Visitante'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  // Render user modal
  const renderUserModal = () => (
    <div className={`${styles.modalOverlay} ${darkMode ? styles.dark : ''}`}>
      <div className={styles.modalContent}>
        <button className={styles.closeModal} onClick={handleCloseModal}>
          &times;
        </button>
        
        <h2>
          {editingItem 
            ? `Editar Usuário - ${editingItem.nome_gf}`
            : 'Cadastrar Novo Usuário'}
        </h2>
        
        <form onSubmit={handleFormSubmit} className={styles.modalForm}>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>Nome*</label>
              <input 
                type="text" 
                name="nome_gf" 
                value={formData.nome_gf || ''} 
                onChange={handleFormChange} 
                required 
              />
            </div>
            
            <div className={styles.formGroup}>
              <label>Email*</label>
              <input 
                type="email" 
                name="email_gf" 
                value={formData.email_gf || ''} 
                onChange={handleFormChange} 
                required 
              />
            </div>
            
            <div className={styles.formGroup}>
              <label>Senha{!editingItem && '*'}</label>
              <input 
                type="password" 
                name="senha_gf" 
                value={formData.senha_gf || ''} 
                onChange={handleFormChange} 
                placeholder={editingItem ? 'Deixe em branco para não alterar' : ''}
                required={!editingItem}
              />
            </div>
            
            <div className={styles.formGroup}>
              <label>Perfil*</label>
              <select 
                name="tipo_usuario" 
                value={formData.tipo_usuario || 'secretaria'} 
                onChange={handleFormChange}
                required
              >
                <option value="secretaria">Secretaria</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
          </div>
          
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
              {editingItem ? 'Atualizar Usuário' : 'Cadastrar Usuário'}
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
        {/* Dashboard Header */}
        <div className={styles.dashboardHeader}>
          <h1>
            <FaUserShield /> Painel de Administração
          </h1>
        </div>
        
        {/* View Toggle */}
        <div className={styles.viewToggle}>
          <button 
            onClick={() => setView('usuarios')} 
            className={view === 'usuarios' ? styles.active : ''}
          >
            <FaUsers /> Gerenciar Usuários
          </button>
          <button 
            onClick={() => setView('visitantes')} 
            className={view === 'visitantes' ? styles.active : ''}
          >
            <FaWalking /> Gerenciar Visitantes
          </button>
        </div>
        
        {/* Search and Filters */}
        <div className={styles.searchContainer}>
          <div className={styles.searchBox}>
            <FaSearch className={styles.searchIcon} />
            <input
              type="text"
              placeholder={`Pesquisar ${view === 'usuarios' ? 'usuários...' : 'visitantes...'}`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        {/* Content Area */}
        {loading ? (
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Carregando dados...</p>
          </div>
        ) : (
          view === 'usuarios' ? renderUserTable() : renderVisitorTable()
        )}
      </div>
      
      {/* Modals */}
      {isModalOpen && (view === 'usuarios' ? renderUserModal() : renderVisitorModal())}
    </div>
  );
}

export default Admin;