import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import Header from '../Components/Header';
import styles from './style/Admin.module.css';
import { 
  FaEdit, FaTrashAlt, FaPlus, FaUsers, FaWalking, FaSearch,
  FaUserShield, FaUserFriends, FaPhone, FaEnvelope, FaCalendarAlt,
  FaChartLine, FaChartPie, FaUserPlus, FaUserMinus, FaHome, FaMapMarkerAlt
} from 'react-icons/fa';
import { IconContext } from 'react-icons';
import { FiUser, FiUserCheck, FiUserX, FiAward, FiTrendingUp, FiTrendingDown } from 'react-icons/fi';
import { BsGenderMale, BsGenderFemale, BsGeoAlt, BsCalendarDate } from 'react-icons/bs';
import { MdEmail, MdPhone, MdFamilyRestroom, MdWork } from 'react-icons/md';

const API_BASE_URL = 'https://mava-connect-backend.onrender.com';

const statusOptions = [
  { value: 'pendente', label: 'Pendente', color: '#FFC107', icon: <FiUser /> },
  { value: 'entrou em contato', label: 'Contatado', color: '#4CAF50', icon: <FiUserCheck /> },
  { value: 'erro número', label: 'Erro no Número', color: '#F44336', icon: <FiUserX /> }
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
  const [stats, setStats] = useState({
    topGF: null,
    bottomGF: null,
    statusDistribution: {},
    genderDistribution: {},
    monthlyTrend: []
  });

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

  // Calculate statistics
  const calculateStats = (visitors) => {
    const gfCounts = {};
    const statusCounts = {};
    const genderCounts = { Masculino: 0, Feminino: 0 };
    const monthlyCounts = {};
    
    visitors.forEach(visitor => {
      // Count by GF
      const gf = visitor.gf_responsavel || 'Sem GF';
      gfCounts[gf] = (gfCounts[gf] || 0) + 1;
      
      // Count by status
      statusCounts[visitor.status] = (statusCounts[visitor.status] || 0) + 1;
      
      // Count by gender
      if (visitor.sexo && genderCounts.hasOwnProperty(visitor.sexo)) {
        genderCounts[visitor.sexo] += 1;
      }
      
      // Count by month
      if (visitor.data_nascimento) {
        const month = new Date(visitor.data_nascimento).toLocaleString('default', { month: 'short' });
        monthlyCounts[month] = (monthlyCounts[month] || 0) + 1;
      }
    });
    
    // Find top and bottom GF
    const gfEntries = Object.entries(gfCounts);
    const sortedGFs = gfEntries.sort((a, b) => b[1] - a[1]);
    
    return {
      topGF: sortedGFs.length > 0 ? { name: sortedGFs[0][0], count: sortedGFs[0][1] } : null,
      bottomGF: sortedGFs.length > 1 ? { name: sortedGFs[sortedGFs.length - 1][0], count: sortedGFs[sortedGFs.length - 1][1] } : null,
      statusDistribution: statusCounts,
      genderDistribution: genderCounts,
      monthlyTrend: Object.entries(monthlyCounts).map(([month, count]) => ({ month, count }))
    };
  };

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
      setStats(calculateStats(visitorsRes.data));
    } catch (error) {
      toast.error("Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [navigate]);

  // ... [rest of your existing functions remain the same until the render functions]

  // New Statistics Cards
  const renderStatsCards = () => {
    const totalVisitors = visitantes.length;
    const pendingCount = stats.statusDistribution.pendente || 0;
    const contactedCount = stats.statusDistribution['entrou em contato'] || 0;
    const errorCount = stats.statusDistribution['erro número'] || 0;
    
    return (
      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} ${styles.primary}`}>
          <div className={styles.statIcon}><FaUserPlus /></div>
          <div className={styles.statContent}>
            <h3>Total Visitantes</h3>
            <p>{totalVisitors}</p>
          </div>
        </div>
        
        <div className={`${styles.statCard} ${styles.warning}`}>
          <div className={styles.statIcon}><FiUser /></div>
          <div className={styles.statContent}>
            <h3>Pendentes</h3>
            <p>{pendingCount} <span>({totalVisitors ? Math.round((pendingCount/totalVisitors)*100) : 0}%)</span></p>
          </div>
        </div>
        
        <div className={`${styles.statCard} ${styles.success}`}>
          <div className={styles.statIcon}><FiUserCheck /></div>
          <div className={styles.statContent}>
            <h3>Contatados</h3>
            <p>{contactedCount} <span>({totalVisitors ? Math.round((contactedCount/totalVisitors)*100) : 0}%)</span></p>
          </div>
        </div>
        
        <div className={`${styles.statCard} ${styles.danger}`}>
          <div className={styles.statIcon}><FiUserX /></div>
          <div className={styles.statContent}>
            <h3>Erros</h3>
            <p>{errorCount} <span>({totalVisitors ? Math.round((errorCount/totalVisitors)*100) : 0}%)</span></p>
          </div>
        </div>
        
        {stats.topGF && (
          <div className={`${styles.statCard} ${styles.info}`}>
            <div className={styles.statIcon}><FiTrendingUp /></div>
            <div className={styles.statContent}>
              <h3>GF Top</h3>
              <p>{stats.topGF.name} <span>({stats.topGF.count})</span></p>
            </div>
          </div>
        )}
        
        {stats.bottomGF && (
          <div className={`${styles.statCard} ${styles.info}`}>
            <div className={styles.statIcon}><FiTrendingDown /></div>
            <div className={styles.statContent}>
              <h3>GF Menos</h3>
              <p>{stats.bottomGF.name} <span>({stats.bottomGF.count})</span></p>
            </div>
          </div>
        )}
        
        <div className={`${styles.statCard} ${styles.purple}`}>
          <div className={styles.statIcon}><BsGenderMale /></div>
          <div className={styles.statContent}>
            <h3>Masculino</h3>
            <p>{stats.genderDistribution.Masculino || 0}</p>
          </div>
        </div>
        
        <div className={`${styles.statCard} ${styles.pink}`}>
          <div className={styles.statIcon}><BsGenderFemale /></div>
          <div className={styles.statContent}>
            <h3>Feminino</h3>
            <p>{stats.genderDistribution.Feminino || 0}</p>
          </div>
        </div>
      </div>
    );
  };

  // Render Functions
  const renderUserTable = () => (
    <div className={styles.tableContainer}>
      <div className={styles.tableHeader}>
        <h3>Lista de Usuários ({filteredUsuarios.length})</h3>
        <button onClick={() => handleOpenModal()} className={styles.addButton}>
          <IconContext.Provider value={{ className: styles.buttonIcon }}>
            <FaPlus />
          </IconContext.Provider>
          Novo Usuário
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
            {filteredUsuarios.map(user => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.nome_gf}</td>
                <td>{user.email_gf}</td>
                <td>
                  <span className={styles.roleBadge} style={{backgroundColor: userRoles[user.tipo_usuario]?.color || '#777'}}>
                    <IconContext.Provider value={{ className: styles.badgeIcon }}>
                      {userRoles[user.tipo_usuario]?.icon}
                    </IconContext.Provider>
                    {userRoles[user.tipo_usuario]?.label}
                  </span>
                </td>
                <td className={styles.actions}>
                  <div className={styles.actionButtons}>
                    <button onClick={() => handleOpenModal(user)} title="Editar" className={styles.editButton}>
                      <FaEdit />
                    </button>
                    <button onClick={() => handleDelete(user)} title="Excluir" className={styles.deleteButton}>
                      <FaTrashAlt />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderVisitorTable = () => (
    <>
      {renderStatsCards()}
      <div className={styles.tableContainer}>
        <div className={styles.tableHeader}>
          <h3>Lista de Visitantes ({filteredVisitantes.length})</h3>
          <div className={styles.tableControls}>
            <div className={styles.filterButtons}>
              <button onClick={() => setActiveFilter('all')} className={activeFilter === 'all' ? styles.activeFilter : ''}>
                Todos
              </button>
              {statusOptions.map(option => (
                <button 
                  key={option.value} 
                  onClick={() => setActiveFilter(option.value)} 
                  className={activeFilter === option.value ? styles.activeFilter : ''} 
                  style={{'--active-color': option.color}}
                >
                  <IconContext.Provider value={{ className: styles.filterIcon }}>
                    {option.icon}
                  </IconContext.Provider>
                  {option.label}
                </button>
              ))}
            </div>
            <button onClick={() => handleOpenModal()} className={styles.addButton}>
              <IconContext.Provider value={{ className: styles.buttonIcon }}>
                <FaPlus />
              </IconContext.Provider>
              Novo Visitante
            </button>
          </div>
        </div>
        <div className={styles.tableWrapper}>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Visitante</th>
                <th>Contato</th>
                <th>Status</th>
                <th>GF Responsável</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredVisitantes.map(visitor => (
                <tr key={visitor.id}>
                  <td>{visitor.id}</td>
                  <td>
                    <div className={styles.visitorInfo}>
                      <span className={styles.visitorName}>{visitor.nome}</span>
                      {visitor.email && (
                        <span className={styles.visitorDetail}>
                          <IconContext.Provider value={{ className: styles.detailIcon }}>
                            <MdEmail />
                          </IconContext.Provider>
                          {visitor.email}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className={styles.contactInfo}>
                      <span className={styles.contactItem}>
                        <IconContext.Provider value={{ className: styles.contactIcon }}>
                          <MdPhone />
                        </IconContext.Provider>
                        {visitor.telefone}
                      </span>
                      {visitor.data_nascimento && (
                        <span className={styles.contactItem}>
                          <IconContext.Provider value={{ className: styles.contactIcon }}>
                            <BsCalendarDate />
                          </IconContext.Provider>
                          {new Date(visitor.data_nascimento).toLocaleDateString()}
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
                        backgroundColor: darkMode ? '#2d3748' : 'white'
                      }}
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
                    <div className={styles.actionButtons}>
                      <button onClick={() => handleOpenModal(visitor)} title="Editar" className={styles.editButton}>
                        <FaEdit />
                      </button>
                      <button onClick={() => handleDelete(visitor)} title="Excluir" className={styles.deleteButton}>
                        <FaTrashAlt />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );

  const renderModal = () => {
    const isUserView = view === 'usuarios';
    return (
      <div className={`${styles.modalOverlay} ${darkMode ? styles.dark : ''}`}>
        <div className={styles.modalContent}>
          <button className={styles.closeModal} onClick={handleCloseModal}>&times;</button>
          <h2>
            <IconContext.Provider value={{ className: styles.modalTitleIcon }}>
              {isUserView ? <FaUsers /> : <FaWalking />}
            </IconContext.Provider>
            {editingItem ? `Editar ${isUserView ? 'Usuário' : 'Visitante'}` : `Novo ${isUserView ? 'Usuário' : 'Visitante'}`}
          </h2>
          <form onSubmit={handleFormSubmit} className={styles.modalForm}>
            {isUserView ? (
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>
                    <IconContext.Provider value={{ className: styles.formLabelIcon }}>
                      <FiUser />
                    </IconContext.Provider>
                    Nome*
                  </label>
                  <input type="text" name="nome_gf" value={formData.nome_gf || ''} onChange={handleFormChange} required />
                </div>
                <div className={styles.formGroup}>
                  <label>
                    <IconContext.Provider value={{ className: styles.formLabelIcon }}>
                      <MdEmail />
                    </IconContext.Provider>
                    Email*
                  </label>
                  <input type="email" name="email_gf" value={formData.email_gf || ''} onChange={handleFormChange} required />
                </div>
                <div className={styles.formGroup}>
                  <label>
                    <IconContext.Provider value={{ className: styles.formLabelIcon }}>
                      <FaUserShield />
                    </IconContext.Provider>
                    Senha{!editingItem && '*'}
                  </label>
                  <input type="password" name="senha_gf" value={formData.senha_gf || ''} onChange={handleFormChange} placeholder={editingItem ? 'Deixe em branco para não alterar' : ''} required={!editingItem} />
                </div>
                <div className={styles.formGroup}>
                  <label>
                    <IconContext.Provider value={{ className: styles.formLabelIcon }}>
                      <FaUserFriends />
                    </IconContext.Provider>
                    Perfil*
                  </label>
                  <select name="tipo_usuario" value={formData.tipo_usuario || 'secretaria'} onChange={handleFormChange} required>
                    <option value="secretaria">Secretaria</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
              </div>
            ) : (
              <>
                <div className={styles.formSection}>
                  <h3>
                    <IconContext.Provider value={{ className: styles.sectionIcon }}>
                      <FiUser />
                    </IconContext.Provider>
                    Informações Pessoais
                  </h3>
                  <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                      <label>Nome Completo*</label>
                      <input type="text" name="nome" value={formData.nome || ''} onChange={handleFormChange} required />
                    </div>
                    <div className={styles.formGroup}>
                      <label>
                        <IconContext.Provider value={{ className: styles.formLabelIcon }}>
                          <BsCalendarDate />
                        </IconContext.Provider>
                        Data de Nascimento
                      </label>
                      <input type="date" name="data_nascimento" value={formData.data_nascimento || ''} onChange={handleFormChange} />
                    </div>
                    <div className={styles.formGroup}>
                      <label>
                        <IconContext.Provider value={{ className: styles.formLabelIcon }}>
                          {formData.sexo === 'Masculino' ? <BsGenderMale /> : <BsGenderFemale />}
                        </IconContext.Provider>
                        Sexo
                      </label>
                      <select name="sexo" value={formData.sexo || ''} onChange={handleFormChange}>
                        <option value="">Não informar</option>
                        <option value="Masculino">Masculino</option>
                        <option value="Feminino">Feminino</option>
                      </select>
                    </div>
                    <div className={styles.formGroup}>
                      <label>
                        <IconContext.Provider value={{ className: styles.formLabelIcon }}>
                          <MdFamilyRestroom />
                        </IconContext.Provider>
                        Estado Civil
                      </label>
                      <input type="text" name="estado_civil" value={formData.estado_civil || ''} onChange={handleFormChange} />
                    </div>
                    <div className={styles.formGroup}>
                      <label>
                        <IconContext.Provider value={{ className: styles.formLabelIcon }}>
                          <MdWork />
                        </IconContext.Provider>
                        Profissão
                      </label>
                      <input type="text" name="profissao" value={formData.profissao || ''} onChange={handleFormChange} />
                    </div>
                  </div>
                </div>
                
                <div className={styles.formSection}>
                  <h3>
                    <IconContext.Provider value={{ className: styles.sectionIcon }}>
                      <FaPhone />
                    </IconContext.Provider>
                    Contato e Visita
                  </h3>
                  <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                      <label>
                        <IconContext.Provider value={{ className: styles.formLabelIcon }}>
                          <MdPhone />
                        </IconContext.Provider>
                        Telefone*
                      </label>
                      <input type="text" name="telefone" value={formData.telefone || ''} onChange={handleFormChange} required />
                    </div>
                    <div className={styles.formGroup}>
                      <label>
                        <IconContext.Provider value={{ className: styles.formLabelIcon }}>
                          <MdEmail />
                        </IconContext.Provider>
                        Email
                      </label>
                      <input type="email" name="email" value={formData.email || ''} onChange={handleFormChange} />
                    </div>
                    <div className={styles.formGroup}>
                      <label>
                        <IconContext.Provider value={{ className: styles.formLabelIcon }}>
                          <FiUserCheck />
                        </IconContext.Provider>
                        Status*
                      </label>
                      <select name="status" value={formData.status || 'pendente'} onChange={handleFormChange} required>
                        {statusOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className={styles.formGroup}>
                      <label>
                        <IconContext.Provider value={{ className: styles.formLabelIcon }}>
                          <FaUserFriends />
                        </IconContext.Provider>
                        GF Responsável
                      </label>
                      <input type="text" name="gf_responsavel" value={formData.gf_responsavel || ''} onChange={handleFormChange} />
                    </div>
                    <div className={styles.formGroup} style={{gridColumn: 'span 2'}}>
                      <label>
                        <IconContext.Provider value={{ className: styles.formLabelIcon }}>
                          <FaHome />
                        </IconContext.Provider>
                        Como conheceu a igreja?
                      </label>
                      <textarea name="como_conheceu" value={formData.como_conheceu || ''} onChange={handleFormChange}></textarea>
                    </div>
                  </div>
                </div>
                
                <div className={styles.formSection}>
                  <h3>
                    <IconContext.Provider value={{ className: styles.sectionIcon }}>
                      <FaMapMarkerAlt />
                    </IconContext.Provider>
                    Endereço
                  </h3>
                  <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                      <label>CEP</label>
                      <input type="text" name="cep" value={formData.endereco?.cep || ''} onChange={handleAddressChange} />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Logradouro</label>
                      <input type="text" name="logradouro" value={formData.endereco?.logradouro || ''} onChange={handleAddressChange} />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Número</label>
                      <input type="text" name="numero" value={formData.endereco?.numero || ''} onChange={handleAddressChange} />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Complemento</label>
                      <input type="text" name="complemento" value={formData.endereco?.complemento || ''} onChange={handleAddressChange} />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Bairro</label>
                      <input type="text" name="bairro" value={formData.endereco?.bairro || ''} onChange={handleAddressChange} />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Cidade</label>
                      <input type="text" name="cidade" value={formData.endereco?.cidade || ''} onChange={handleAddressChange} />
                    </div>
                    <div className={styles.formGroup}>
                      <label>UF</label>
                      <input type="text" name="uf" value={formData.endereco?.uf || ''} onChange={handleAddressChange} maxLength="2" />
                    </div>
                  </div>
                </div>
              </>
            )}
            <div className={styles.modalActions}>
              <button type="button" onClick={handleCloseModal} className={styles.cancelButton}>
                Cancelar
              </button>
              <button type="submit" className={styles.saveButton}>
                {editingItem ? 'Atualizar' : 'Cadastrar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <IconContext.Provider value={{ size: '1.1em' }}>
      <div className={`${styles.adminContainer} ${darkMode ? 'dark-mode' : ''}`}>
        <Header />
        <div className={styles.adminPanel}>
          <div className={styles.dashboardHeader}>
            <h1>
              <IconContext.Provider value={{ className: styles.headerIcon }}>
                <FaUserShield />
              </IconContext.Provider>
              Painel de Administração
            </h1>
          </div>
          <div className={styles.viewToggle}>
            <button 
              onClick={() => setView('usuarios')} 
              className={view === 'usuarios' ? styles.active : ''}
            >
              <IconContext.Provider value={{ className: styles.toggleIcon }}>
                <FaUsers />
              </IconContext.Provider>
              Gerenciar Usuários
            </button>
            <button 
              onClick={() => setView('visitantes')} 
              className={view === 'visitantes' ? styles.active : ''}
            >
              <IconContext.Provider value={{ className: styles.toggleIcon }}>
                <FaWalking />
              </IconContext.Provider>
              Gerenciar Visitantes
            </button>
          </div>
          <div className={styles.searchContainer}>
            <div className={styles.searchBox}>
              <IconContext.Provider value={{ className: styles.searchIcon }}>
                <FaSearch />
              </IconContext.Provider>
              <input 
                type="text" 
                placeholder={`Pesquisar ${view === 'usuarios' ? 'usuários...' : 'visitantes...'}`} 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
              />
            </div>
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
    </IconContext.Provider>
  );
}

export default Admin;