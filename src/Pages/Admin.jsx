import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import Header from '../Components/Header';
import styles from './style/Admin.module.css';
import { 
  FaEdit, FaTrashAlt, FaPlus, FaUsers, FaWalking, FaSearch,
  FaUserShield, FaUserFriends, FaPhone, FaEnvelope, FaCalendarAlt
} from 'react-icons/fa';

const API_BASE_URL = 'https://mava-connect-backend.onrender.com';

// CORRIGIDO: Status alinhados com o banco de dados
const statusOptions = [
  { value: 'pendente', label: 'Pendente', color: '#FFC107' },
  { value: 'entrou em contato', label: 'Contatado', color: '#4CAF50' },
  { value: 'erro número', label: 'Erro no Número', color: '#F44336' }
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
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => setDarkMode(e.matches);
    setDarkMode(mediaQuery.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Apply theme
  useEffect(() => {
    document.body.className = darkMode ? 'dark-mode' : '';
  }, [darkMode]);

  // Fetch all data
  const fetchAllData = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error("Sessão expirada.");
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
      toast.error("Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [navigate]);

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
      // ATUALIZADO: Preenche o formulário com todos os dados do visitante
      setFormData({
        nome: item?.nome || '',
        data_nascimento: item?.data_nascimento ? new Date(item.data_nascimento).toISOString().split('T')[0] : '',
        telefone: item?.telefone || '',
        sexo: item?.sexo || '',
        email: item?.email || '',
        estado_civil: item?.estado_civil || '',
        profissao: item?.profissao || '',
        como_conheceu: item?.como_conheceu || '',
        gf_responsavel: item?.gf_responsavel || '', // Assumindo que o nome do GF vem na resposta
        status: item?.status || 'pendente',
        endereco: item?.endereco || { cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', uf: '' }
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
  
  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      endereco: { ...prev.endereco, [name]: value }
    }));
  };

  // Status change handler
  const handleStatusChange = async (visitorId, newStatus) => {
    const token = localStorage.getItem('token');
    const originalVisitors = [...visitantes];
    setVisitantes(prev => prev.map(v => v.id === visitorId ? { ...v, status: newStatus } : v)); // Otimista

    try {
      // CORRIGIDO: Usando PATCH para a rota de status
      await axios.patch(
        `${API_BASE_URL}/visitantes/${visitorId}/status`,
        { status: newStatus },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      toast.success('Status atualizado!');
      fetchAllData(); // Re-sincroniza por segurança
    } catch (error) {
      setVisitantes(originalVisitors); // Reverte em caso de erro
      toast.error(error.response?.data?.error || "Erro ao atualizar status");
    }
  };

  // Form submission
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const headers = { 'Authorization': `Bearer ${token}` };
    const endpoint = view === 'usuarios' ? `${API_BASE_URL}/api/usuarios` : `${API_BASE_URL}/visitantes`;
    
    const dataToSend = { ...formData };
    if (view === 'usuarios' && editingItem && !dataToSend.senha_gf) {
      delete dataToSend.senha_gf;
    }

    const promise = editingItem
      ? axios.put(`${endpoint}/${editingItem.id}`, dataToSend, { headers })
      : axios.post(endpoint, dataToSend, { headers });

    toast.promise(promise, {
        loading: 'Salvando...',
        success: (res) => {
            fetchAllData();
            handleCloseModal();
            return res.data.message || 'Operação realizada com sucesso!';
        },
        error: (err) => err.response?.data?.error || 'Erro ao salvar dados'
    });
  };

  // Delete handler
  const handleDelete = (item) => {
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
                toast.success('Item excluído!');
                fetchAllData();
              } catch (error) {
                toast.error(error.response?.data?.error || 'Erro ao excluir');
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

  // Filtering logic
  const filteredVisitantes = useMemo(() => visitantes.filter(visitor => {
    const searchString = searchTerm.toLowerCase();
    const matchesSearch = 
      visitor.nome.toLowerCase().includes(searchString) ||
      visitor.telefone.includes(searchString) ||
      visitor.email?.toLowerCase().includes(searchString) ||
      visitor.gf_responsavel?.toLowerCase().includes(searchString);
    const matchesFilter = activeFilter === 'all' || visitor.status === activeFilter;
    return matchesSearch && matchesFilter;
  }), [visitantes, searchTerm, activeFilter]);

  const filteredUsuarios = useMemo(() => usuarios.filter(user => 
    user.nome_gf.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email_gf.toLowerCase().includes(searchTerm.toLowerCase())
  ), [usuarios, searchTerm]);

  // Render Functions
  const renderUserTable = () => (
    <div className={styles.tableContainer}>
      <div className={styles.tableHeader}>
        <h3>Lista de Usuários ({filteredUsuarios.length})</h3>
        <button onClick={() => handleOpenModal()} className={styles.addButton}><FaPlus /> Novo Usuário</button>
      </div>
      <div className={styles.tableWrapper}>
        <table className={styles.dataTable}>
            {/* ... cabeçalho da tabela de usuários ... */}
            <tbody>
                {filteredUsuarios.map(user => (
                    <tr key={user.id}>
                        <td>{user.id}</td>
                        <td>{user.nome_gf}</td>
                        <td>{user.email_gf}</td>
                        <td><span className={`${styles.roleBadge}`} style={{backgroundColor: userRoles[user.tipo_usuario]?.color || '#777'}}>{userRoles[user.tipo_usuario]?.icon} {userRoles[user.tipo_usuario]?.label}</span></td>
                        <td className={styles.actions}><div className={styles.actionButtons}><button onClick={() => handleOpenModal(user)} title="Editar" className={styles.editButton}><FaEdit /></button><button onClick={() => handleDelete(user)} title="Excluir" className={styles.deleteButton}><FaTrashAlt /></button></div></td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>
    </div>
  );

  const renderVisitorTable = () => (
    <div className={styles.tableContainer}>
      <div className={styles.tableHeader}>
        <h3>Lista de Visitantes ({filteredVisitantes.length})</h3>
        <div className={styles.tableControls}>
          <div className={styles.filterButtons}>
            <button onClick={() => setActiveFilter('all')} className={activeFilter === 'all' ? styles.activeFilter : ''}>Todos</button>
            {statusOptions.map(option => (
              <button key={option.value} onClick={() => setActiveFilter(option.value)} className={activeFilter === option.value ? styles.activeFilter : ''} style={{'--active-color': option.color}}>{option.label}</button>
            ))}
          </div>
          <button onClick={() => handleOpenModal()} className={styles.addButton}><FaPlus /> Novo Visitante</button>
        </div>
      </div>
      <div className={styles.tableWrapper}>
        <table className={styles.dataTable}>
            {/* ... cabeçalho da tabela de visitantes ... */}
            <tbody>
                {filteredVisitantes.map(visitor => (
                    <tr key={visitor.id}>
                        <td>{visitor.id}</td>
                        <td><div className={styles.visitorInfo}><span className={styles.visitorName}>{visitor.nome}</span>{visitor.email && <span className={styles.visitorDetail}><FaEnvelope /> {visitor.email}</span>}</div></td>
                        <td><div className={styles.contactInfo}><span className={styles.contactItem}><FaPhone /> {visitor.telefone}</span>{visitor.data_nascimento && <span className={styles.contactItem}><FaCalendarAlt /> {new Date(visitor.data_nascimento).toLocaleDateString()}</span>}</div></td>
                        <td><select value={visitor.status} onChange={(e) => handleStatusChange(visitor.id, e.target.value)} className={styles.statusSelect} style={{borderColor: statusOptions.find(s => s.value === visitor.status)?.color}}>{statusOptions.map(option => (<option key={option.value} value={option.value}>{option.label}</option>))}</select></td>
                        <td>{visitor.gf_responsavel}</td>
                        <td className={styles.actions}><div className={styles.actionButtons}><button onClick={() => handleOpenModal(visitor)} title="Editar" className={styles.editButton}><FaEdit /></button><button onClick={() => handleDelete(visitor)} title="Excluir" className={styles.deleteButton}><FaTrashAlt /></button></div></td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>
    </div>
  );

  const renderModal = () => {
    const isUserView = view === 'usuarios';
    return (
        <div className={`${styles.modalOverlay} ${darkMode ? styles.dark : ''}`}>
            <div className={styles.modalContent}>
                <button className={styles.closeModal} onClick={handleCloseModal}>&times;</button>
                <h2>{editingItem ? `Editar ${isUserView ? 'Usuário' : 'Visitante'}` : `Novo ${isUserView ? 'Usuário' : 'Visitante'}`}</h2>
                <form onSubmit={handleFormSubmit} className={styles.modalForm}>
                    {isUserView ? (
                        // Formulário de Usuário
                        <div className={styles.formGrid}>
                            <div className={styles.formGroup}><label>Nome*</label><input type="text" name="nome_gf" value={formData.nome_gf || ''} onChange={handleFormChange} required /></div>
                            <div className={styles.formGroup}><label>Email*</label><input type="email" name="email_gf" value={formData.email_gf || ''} onChange={handleFormChange} required /></div>
                            <div className={styles.formGroup}><label>Senha{!editingItem && '*'}</label><input type="password" name="senha_gf" value={formData.senha_gf || ''} onChange={handleFormChange} placeholder={editingItem ? 'Deixe em branco para não alterar' : ''} required={!editingItem} /></div>
                            <div className={styles.formGroup}><label>Perfil*</label><select name="tipo_usuario" value={formData.tipo_usuario || 'secretaria'} onChange={handleFormChange} required><option value="secretaria">Secretaria</option><option value="admin">Administrador</option></select></div>
                        </div>
                    ) : (
                        // Formulário de Visitante Completo
                        <>
                            <div className={styles.formSection}>
                                <h3>Informações Pessoais</h3>
                                <div className={styles.formGrid}>
                                    <div className={styles.formGroup}><label>Nome Completo*</label><input type="text" name="nome" value={formData.nome || ''} onChange={handleFormChange} required /></div>
                                    <div className={styles.formGroup}><label>Data de Nascimento</label><input type="date" name="data_nascimento" value={formData.data_nascimento || ''} onChange={handleFormChange} /></div>
                                    <div className={styles.formGroup}><label>Sexo</label><select name="sexo" value={formData.sexo || ''} onChange={handleFormChange}><option value="">Não informar</option><option value="Masculino">Masculino</option><option value="Feminino">Feminino</option></select></div>
                                    <div className={styles.formGroup}><label>Estado Civil</label><input type="text" name="estado_civil" value={formData.estado_civil || ''} onChange={handleFormChange} /></div>
                                    <div className={styles.formGroup}><label>Profissão</label><input type="text" name="profissao" value={formData.profissao || ''} onChange={handleFormChange} /></div>
                                </div>
                            </div>
                            <div className={styles.formSection}>
                                <h3>Contato e Visita</h3>
                                <div className={styles.formGrid}>
                                    <div className={styles.formGroup}><label>Telefone*</label><input type="text" name="telefone" value={formData.telefone || ''} onChange={handleFormChange} required /></div>
                                    <div className={styles.formGroup}><label>Email</label><input type="email" name="email" value={formData.email || ''} onChange={handleFormChange} /></div>
                                    <div className={styles.formGroup}><label>Status*</label><select name="status" value={formData.status || 'pendente'} onChange={handleFormChange} required>{statusOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}</select></div>
                                    <div className={styles.formGroup}><label>GF Responsável</label><input type="text" name="gf_responsavel" value={formData.gf_responsavel || ''} onChange={handleFormChange} /></div>
                                    <div className={styles.formGroup} style={{gridColumn: 'span 2'}}><label>Como conheceu a igreja?</label><textarea name="como_conheceu" value={formData.como_conheceu || ''} onChange={handleFormChange}></textarea></div>
                                </div>
                            </div>
                            <div className={styles.formSection}>
                                <h3>Endereço</h3>
                                <div className={styles.formGrid}>
                                    <div className={styles.formGroup}><label>CEP</label><input type="text" name="cep" value={formData.endereco?.cep || ''} onChange={handleAddressChange} /></div>
                                    <div className={styles.formGroup}><label>Logradouro</label><input type="text" name="logradouro" value={formData.endereco?.logradouro || ''} onChange={handleAddressChange} /></div>
                                    <div className={styles.formGroup}><label>Número</label><input type="text" name="numero" value={formData.endereco?.numero || ''} onChange={handleAddressChange} /></div>
                                    <div className={styles.formGroup}><label>Complemento</label><input type="text" name="complemento" value={formData.endereco?.complemento || ''} onChange={handleAddressChange} /></div>
                                    <div className={styles.formGroup}><label>Bairro</label><input type="text" name="bairro" value={formData.endereco?.bairro || ''} onChange={handleAddressChange} /></div>
                                    <div className={styles.formGroup}><label>Cidade</label><input type="text" name="cidade" value={formData.endereco?.cidade || ''} onChange={handleAddressChange} /></div>
                                    <div className={styles.formGroup}><label>UF</label><input type="text" name="uf" value={formData.endereco?.uf || ''} onChange={handleAddressChange} maxLength="2" /></div>
                                </div>
                            </div>
                        </>
                    )}
                    <div className={styles.modalActions}>
                        <button type="button" onClick={handleCloseModal} className={styles.cancelButton}>Cancelar</button>
                        <button type="submit" className={styles.saveButton}>{editingItem ? 'Atualizar' : 'Cadastrar'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
  };

  return (
    <div className={`${styles.adminContainer} ${darkMode ? 'dark-mode' : ''}`}>
      <Header />
      <div className={styles.adminPanel}>
        <div className={styles.dashboardHeader}>
          <h1><FaUserShield /> Painel de Administração</h1>
        </div>
        <div className={styles.viewToggle}>
          <button onClick={() => setView('usuarios')} className={view === 'usuarios' ? styles.active : ''}><FaUsers /> Gerenciar Usuários</button>
          <button onClick={() => setView('visitantes')} className={view === 'visitantes' ? styles.active : ''}><FaWalking /> Gerenciar Visitantes</button>
        </div>
        <div className={styles.searchContainer}>
          <div className={styles.searchBox}>
            <FaSearch className={styles.searchIcon} />
            <input type="text" placeholder={`Pesquisar ${view === 'usuarios' ? 'usuários...' : 'visitantes...'}`} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>
        {loading ? (
          <div className={styles.loading}><div className={styles.spinner}></div><p>Carregando dados...</p></div>
        ) : (
          view === 'usuarios' ? renderUserTable() : renderVisitorTable()
        )}
      </div>
      {isModalOpen && renderModal()}
    </div>
  );
}

export default Admin;
