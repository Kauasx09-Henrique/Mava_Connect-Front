import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
// Removi o Header, pois o painel agora tem seu próprio cabeçalho.
// import Header from '../Components/Header'; 
import styles from './style/Admin.module.css';
import {
    FaEdit, FaTrashAlt, FaPlus, FaUsers, FaWalking, FaSearch,
    FaUserShield, FaUserFriends, FaPhone, FaEnvelope, FaCalendarAlt,
    FaHome, FaMapMarkerAlt, FaUsersCog
} from 'react-icons/fa';
import { IconContext } from 'react-icons';
import { FiUser, FiUserCheck, FiUserX, FiTrendingUp, FiTrendingDown, FiMoon, FiSun } from 'react-icons/fi';
import { BsGenderMale, BsGenderFemale, BsCalendarDate } from 'react-icons/bs';
import { MdEmail, MdPhone, MdFamilyRestroom, MdWork } from 'react-icons/md';

const API_BASE_URL = 'https://mava-connect-backend.onrender.com';

const statusOptions = [
    { value: 'pendente', label: 'Pendente', color: '#ffc107', icon: <FiUser /> },
    { value: 'entrou em contato', label: 'Contatado', color: '#28a745', icon: <FiUserCheck /> },
    { value: 'erro número', label: 'Erro no Número', color: '#dc3545', icon: <FiUserX /> }
];

const userRoles = {
    admin: { label: 'Administrador', icon: <FaUserShield />, color: '#6f42c1' },
    secretaria: { label: 'Secretaria', icon: <FaUserFriends />, color: '#007bff' }
};

function Admin() {
    const navigate = useNavigate();
    const [darkMode, setDarkMode] = useState(true); // Começa com dark mode por padrão
    const [view, setView] = useState('visitantes'); // Começa com visitantes por padrão
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
    });

    useEffect(() => {
        const isDark = localStorage.getItem('darkMode') === 'true';
        setDarkMode(isDark);
    }, []);

    useEffect(() => {
        document.body.className = darkMode ? 'dark-mode' : 'light-mode';
        localStorage.setItem('darkMode', darkMode);
    }, [darkMode]);

    const toggleDarkMode = () => setDarkMode(prev => !prev);
    
    // Hooks de useMemo e funções de lógica (fetchAllData, handlers) permanecem os mesmos...
    const filteredUsuarios = useMemo(() => {
        if (!searchTerm) return usuarios;
        return usuarios.filter(user =>
            (user.nome_gf && user.nome_gf.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (user.email_gf && user.email_gf.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [usuarios, searchTerm]);

    const filteredVisitantes = useMemo(() => {
        let items = visitantes;
        if (activeFilter !== 'all') {
            items = items.filter(visitor => visitor.status === activeFilter);
        }
        if (searchTerm) {
            const lowercasedTerm = searchTerm.toLowerCase();
            items = items.filter(visitor =>
                (visitor.nome && visitor.nome.toLowerCase().includes(lowercasedTerm)) ||
                (visitor.email && visitor.email.toLowerCase().includes(lowercasedTerm)) ||
                (visitor.telefone && visitor.telefone.includes(searchTerm)) ||
                (visitor.gf_responsavel && visitor.gf_responsavel.toLowerCase().includes(lowercasedTerm))
            );
        }
        return items;
    }, [visitantes, searchTerm, activeFilter]);
    
    const calculateStats = (visitors) => {
        const gfCounts = {}, statusCounts = {}, genderCounts = { Masculino: 0, Feminino: 0 };
        visitors.forEach(visitor => {
            const gf = visitor.gf_responsavel || 'Sem GF';
            gfCounts[gf] = (gfCounts[gf] || 0) + 1;
            statusCounts[visitor.status] = (statusCounts[visitor.status] || 0) + 1;
            if (visitor.sexo && genderCounts.hasOwnProperty(visitor.sexo)) { genderCounts[visitor.sexo] += 1; }
        });
        const gfEntries = Object.entries(gfCounts).filter(([key]) => key !== 'Sem GF');
        const sortedGFs = gfEntries.sort((a, b) => b[1] - a[1]);
        return {
            topGF: sortedGFs.length > 0 ? { name: sortedGFs[0][0], count: sortedGFs[0][1] } : null,
            bottomGF: sortedGFs.length > 1 ? { name: sortedGFs[sortedGFs.length - 1][0], count: sortedGFs[sortedGFs.length - 1][1] } : null,
            statusDistribution: statusCounts,
            genderDistribution: genderCounts,
        };
    };
    
    const fetchAllData = async () => {
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token) { toast.error("Sessão expirada."); navigate('/'); return; }
        const headers = { 'Authorization': `Bearer ${token}` };
        try {
            const [usersRes, visitorsRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/api/usuarios`, { headers }),
                axios.get(`${API_BASE_URL}/visitantes`, { headers })
            ]);
            setUsuarios(usersRes.data);
            setVisitantes(visitorsRes.data);
            setStats(calculateStats(visitorsRes.data));
        } catch (error) { toast.error("Erro ao carregar dados."); } 
        finally { setLoading(false); }
    };

    useEffect(() => { fetchAllData(); }, [navigate]);

    const handleOpenModal = (item = null) => {
        setEditingItem(item);
        if (item) {
            const formattedData = { ...item };
            if (formattedData.data_nascimento) {
                formattedData.data_nascimento = new Date(item.data_nascimento).toISOString().split('T')[0];
            }
            setFormData(formattedData);
        } else {
            setFormData(view === 'usuarios' ? { tipo_usuario: 'secretaria' } : { status: 'pendente', endereco: {} });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => { setIsModalOpen(false); setEditingItem(null); setFormData({}); };
    const handleFormChange = (e) => { const { name, value } = e.target; setFormData(prev => ({ ...prev, [name]: value })); };
    const handleAddressChange = (e) => { const { name, value } = e.target; setFormData(prev => ({ ...prev, endereco: { ...prev.endereco, [name]: value } })); };
    
    const handleStatusChange = async (id, status) => {
        const token = localStorage.getItem('token');
        const headers = { 'Authorization': `Bearer ${token}` };
        try {
            await axios.put(`${API_BASE_URL}/visitantes/${id}/status`, { status }, { headers });
            toast.success("Status atualizado!");
            setVisitantes(prev => prev.map(v => v.id === id ? { ...v, status } : v));
        } catch (error) { toast.error("Falha ao atualizar status."); }
    };

    const handleDelete = async (item) => {
        const itemName = item.nome || item.nome_gf;
        if (window.confirm(`Tem certeza que deseja excluir '${itemName}'?`)) {
            const token = localStorage.getItem('token');
            const headers = { 'Authorization': `Bearer ${token}` };
            const endpoint = view === 'usuarios' ? `/api/usuarios/${item.id}` : `/visitantes/${item.id}`;
            try {
                await axios.delete(`${API_BASE_URL}${endpoint}`, { headers });
                toast.success("Item excluído com sucesso!");
                fetchAllData();
            } catch (error) { toast.error("Falha ao excluir."); }
        }
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        const headers = { 'Authorization': `Bearer ${token}` };
        const isUserView = view === 'usuarios';
        const endpoint = isUserView ? '/api/usuarios' : '/visitantes';
        const url = `${API_BASE_URL}${endpoint}${editingItem ? `/${editingItem.id}` : ''}`;
        const method = editingItem ? 'put' : 'post';
        try {
            await axios[method](url, formData, { headers });
            toast.success(`${isUserView ? 'Usuário' : 'Visitante'} ${editingItem ? 'atualizado' : 'cadastrado'}!`);
            fetchAllData();
            handleCloseModal();
        } catch (error) { toast.error("Falha ao salvar. Verifique os dados."); }
    };

    // ** NOVAS FUNÇÕES DE RENDERIZAÇÃO **
    const renderStatsCards = () => {
        const totalVisitors = visitantes.length;
        const pendingCount = stats.statusDistribution.pendente || 0;
        const contactedCount = stats.statusDistribution['entrou em contato'] || 0;
        const errorCount = stats.statusDistribution['erro número'] || 0;

        const statItems = [
            { icon: <FaUsers />, value: totalVisitors, label: 'Total de Visitantes', color: 'blue' },
            { icon: <FiUser />, value: pendingCount, label: 'Pendentes', color: 'yellow' },
            { icon: <FiUserCheck />, value: contactedCount, label: 'Contatados', color: 'green' },
            { icon: <FiUserX />, value: errorCount, label: 'Erros de Número', color: 'red' },
            stats.topGF ? { icon: <FiTrendingUp />, value: stats.topGF.count, label: `GF Top: ${stats.topGF.name}`, color: 'purple' } : null,
            stats.bottomGF ? { icon: <FiTrendingDown />, value: stats.bottomGF.count, label: `GF Menos Ativo: ${stats.bottomGF.name}`, color: 'orange' } : null
        ].filter(Boolean); // Remove nulls

        return (
            <div className={styles.statsGrid}>
                {statItems.map((item, index) => (
                    <div key={index} className={`${styles.statCard} ${styles[item.color]}`}>
                        <div className={styles.statIcon}>{item.icon}</div>
                        <div className={styles.statInfo}>
                            <span className={styles.statValue}>{item.value}</span>
                            <span className={styles.statLabel}>{item.label}</span>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const renderTable = () => {
        const isUserView = view === 'usuarios';
        const data = isUserView ? filteredUsuarios : filteredVisitantes;
        const columns = isUserView 
            ? [{key: 'id', label: 'ID'}, {key: 'nome_gf', label: 'Nome'}, {key: 'email_gf', label: 'Email'}, {key: 'tipo_usuario', label: 'Perfil'}]
            : [{key: 'id', label: 'ID'}, {key: 'nome', label: 'Visitante'}, {key: 'telefone', label: 'Contato'}, {key: 'status', label: 'Status'}, {key: 'gf_responsavel', label: 'GF Responsável'}];

        return(
            <div className={styles.tableContainer}>
                <div className={styles.tableHeader}>
                    <h3>{isUserView ? 'Gerenciamento de Usuários' : 'Lista de Visitantes'} ({data.length})</h3>
                    <div className={styles.headerActions}>
                        {!isUserView && (
                            <div className={styles.filterButtons}>
                                <button onClick={() => setActiveFilter('all')} className={activeFilter === 'all' ? styles.active : ''}>Todos</button>
                                {statusOptions.map(opt => (
                                    <button key={opt.value} onClick={() => setActiveFilter(opt.value)} className={activeFilter === opt.value ? styles.active : ''}>{opt.icon} {opt.label}</button>
                                ))}
                            </div>
                        )}
                        <button onClick={() => handleOpenModal()} className={styles.addButton}><FaPlus /> Novo</button>
                    </div>
                </div>
                <div className={styles.tableWrapper}>
                    <table className={styles.dataTable}>
                        <thead>
                            <tr>
                                {columns.map(col => <th key={col.key}>{col.label}</th>)}
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.length > 0 ? data.map(item => (
                                <tr key={item.id}>
                                    {columns.map(col => (
                                        <td key={`${item.id}-${col.key}`} data-label={col.label}>
                                            {col.key === 'tipo_usuario' ? <span className={styles.roleBadge} style={{'--role-color': userRoles[item.tipo_usuario]?.color}}>{userRoles[item.tipo_usuario]?.icon}{userRoles[item.tipo_usuario]?.label}</span>
                                            : col.key === 'status' ? <select value={item.status} onChange={(e) => handleStatusChange(item.id, e.target.value)} className={styles.statusSelect} style={{'--status-color': statusOptions.find(s=>s.value===item.status)?.color}}>{statusOptions.map(opt=><option key={opt.value} value={opt.value}>{opt.label}</option>)}</select>
                                            : item[col.key]}
                                        </td>
                                    ))}
                                    <td data-label="Ações">
                                        <div className={styles.actionButtons}>
                                            <button onClick={() => handleOpenModal(item)} className={styles.editButton}><FaEdit /></button>
                                            <button onClick={() => handleDelete(item)} className={styles.deleteButton}><FaTrashAlt /></button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan={columns.length + 1}>Nenhum dado encontrado.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        )
    };
    
    // Seu `renderModal` completo
    const renderModal = () => { /* ... seu código do modal permanece o mesmo ... */ };

    return (
        <IconContext.Provider value={{ size: '1em' }}>
            <div className={styles.adminContainer}>
                <aside className={styles.sidebar}>
                    <div className={styles.sidebarHeader}>
                        <FaUsersCog />
                        <h2>Painel</h2>
                    </div>
                    <nav className={styles.sidebarNav}>
                        <button onClick={() => setView('visitantes')} className={view === 'visitantes' ? styles.active : ''}>
                            <FaWalking /> Visitantes
                        </button>
                        <button onClick={() => setView('usuarios')} className={view === 'usuarios' ? styles.active : ''}>
                            <FaUsers /> Usuários
                        </button>
                    </nav>
                    <div className={styles.sidebarFooter}>
                        <button onClick={toggleDarkMode} className={styles.themeToggle}>
                            {darkMode ? <FiSun /> : <FiMoon />}
                        </button>
                        <span>Kauã Henrique</span>
                    </div>
                </aside>
                <main className={styles.mainContent}>
                    <header className={styles.mainHeader}>
                        <h1>{view === 'visitantes' ? 'Dashboard de Visitantes' : 'Gerenciamento de Usuários'}</h1>
                        <div className={styles.searchBox}>
                            <FaSearch />
                            <input
                                type="text"
                                placeholder="Pesquisar..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </header>
                    {loading ? (
                         <div className={styles.loading}><div className={styles.spinner}></div><p>Carregando dados...</p></div>
                    ) : (
                        <>
                            {view === 'visitantes' && renderStatsCards()}
                            {renderTable()}
                        </>
                    )}
                </main>
                 {isModalOpen && renderModal()} {/* O modal será renderizado sobre tudo */}
            </div>
        </IconContext.Provider>
    );
}

export default Admin;