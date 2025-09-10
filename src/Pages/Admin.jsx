import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import styles from './style/Admin.module.css';
import Header from '../Components/Header';

// Import de todos os Ícones (Adicionado FaImage)
import {
    FaEdit, FaTrashAlt, FaPlus, FaUsers, FaWalking, FaSearch,
    FaUserShield, FaUserFriends, FaPhone, FaChurch,
    FaHome, FaMapMarkerAlt, FaUsersCog, FaRegClock,
    FaChevronLeft, FaChevronRight, FaImage // <-- Ícone da logo adicionado
} from 'react-icons/fa';
import { FiUserCheck, FiUserX } from 'react-icons/fi';
import { BsGenderMale, BsGenderFemale, BsCalendarDate } from 'react-icons/bs';
import { MdEmail, MdPhone, MdFamilyRestroom, MdWork } from 'react-icons/md';

// --- 1. CONFIGURAÇÕES E CONSTANTES ---

const API_URL = 'https://mava-connect.onrender.com';
const ITEMS_PER_PAGE = 7; // Itens por página da tabela

const statusOptions = [
    { value: 'pendente', label: 'Pendente', color: '#F59E0B' },
    { value: 'entrou em contato', label: 'Contatado', color: '#22C55E' },
    { value: 'erro número', label: 'Erro no Número', color: '#EF4444' }
];

const userRoles = {
    admin: { label: 'Administrador', icon: <FaUserShield />, color: '#6f42c1' },
    secretaria: { label: 'Secretaria', icon: <FaUserFriends />, color: '#007bff' }
};


// --- 2. COMPONENTES INTERNOS DE UI ---

const SkeletonPage = () => (
    <main className={styles.mainContent}>
        <header className={styles.mainHeader}>
            <div className={`${styles.skeleton} ${styles.skeletonTitle}`}></div>
            <div className={`${styles.skeleton} ${styles.skeletonSearch}`}></div>
        </header>
        <div className={styles.statsGrid}>
            {[...Array(6)].map((_, i) => <div key={i} className={`${styles.skeleton} ${styles.skeletonCard}`}></div>)}
        </div>
        <div className={`${styles.skeleton} ${styles.skeletonTable}`}></div>
    </main>
);

const VisitorForm = ({ formData, onFormChange, onAddressChange }) => {
    const [activeTab, setActiveTab] = useState('pessoal');
    const formContent = {
        pessoal: (
            <div className={styles.formGrid}>
                <div className={styles.formGroup}><label>Nome Completo*</label><input type="text" name="nome" value={formData.nome || ''} onChange={onFormChange} required /></div>
                <div className={styles.formGroup}><label><BsCalendarDate /> Data de Nascimento</label><input type="date" name="data_nascimento" value={formData.data_nascimento || ''} onChange={onFormChange} /></div>
                <div className={styles.formGroup}><label><BsGenderMale /> Sexo</label><select name="sexo" value={formData.sexo || ''} onChange={onFormChange}><option value="">Não informar</option><option value="Masculino">Masculino</option><option value="Feminino">Feminino</option></select></div>
                <div className={styles.formGroup}><label><MdFamilyRestroom /> Estado Civil</label><input type="text" name="estado_civil" value={formData.estado_civil || ''} onChange={onFormChange} /></div>
                <div className={styles.formGroup}><label><MdWork /> Profissão</label><input type="text" name="profissao" value={formData.profissao || ''} onChange={onFormChange} /></div>
            </div>
        ),
        contato: (
            <div className={styles.formGrid}>
                <div className={styles.formGroup}><label><MdPhone /> Telefone*</label><input type="tel" name="telefone" value={formData.telefone || ''} onChange={onFormChange} required /></div>
                <div className={styles.formGroup}><label><MdEmail /> Email</label><input type="email" name="email" value={formData.email || ''} onChange={onFormChange} /></div>
                <div className={styles.formGroup}><label><FiUserCheck /> Status*</label><select name="status" value={formData.status || 'pendente'} onChange={onFormChange} required>{statusOptions.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}</select></div>
                <div className={styles.formGroup}><label><FaUserFriends /> GF Responsável</label><input type="text" name="gf_responsavel" value={formData.gf_responsavel || ''} onChange={onFormChange} /></div>
                <div className={styles.formGroup}><label><FaChurch /> Evento da Visita*</label><select name="evento" value={formData.evento || ''} onChange={onFormChange} required><option value="" disabled>Selecione...</option><option value="gf">GF</option><option value="evangelismo">Evangelismo</option><option value="culto">Culto</option></select></div>
                <div className={styles.formGroup} style={{ gridColumn: 'span 2' }}><label><FaHome /> Como conheceu a igreja?</label><textarea name="como_conheceu" value={formData.como_conheceu || ''} onChange={onFormChange}></textarea></div>
            </div>
        ),
        endereco: (
            <div className={styles.formGrid}>
                <div className={styles.formGroup}><label>CEP</label><input type="text" name="cep" value={formData.endereco?.cep || ''} onChange={onAddressChange} /></div>
                <div className={styles.formGroup}><label>Logradouro</label><input type="text" name="logradouro" value={formData.endereco?.logradouro || ''} onChange={onAddressChange} /></div>
                <div className={styles.formGroup}><label>Número</label><input type="text" name="numero" value={formData.endereco?.numero || ''} onChange={onAddressChange} /></div>
                <div className={styles.formGroup}><label>Complemento</label><input type="text" name="complemento" value={formData.endereco?.complemento || ''} onChange={onAddressChange} /></div>
                <div className={styles.formGroup}><label>Bairro</label><input type="text" name="bairro" value={formData.endereco?.bairro || ''} onChange={onAddressChange} /></div>
                <div className={styles.formGroup}><label>Cidade</label><input type="text" name="cidade" value={formData.endereco?.cidade || ''} onChange={onAddressChange} /></div>
                <div className={styles.formGroup}><label>UF</label><input type="text" name="uf" value={formData.endereco?.uf || ''} onChange={onAddressChange} maxLength="2" /></div>
            </div>
        ),
    };

    return (
        <>
            <div className={styles.formTabs}>
                <button type="button" onClick={() => setActiveTab('pessoal')} className={activeTab === 'pessoal' ? styles.activeTab : ''}>Informações Pessoais</button>
                <button type="button" onClick={() => setActiveTab('contato')} className={activeTab === 'contato' ? styles.activeTab : ''}>Contato e Visita</button>
                <button type="button" onClick={() => setActiveTab('endereco')} className={activeTab === 'endereco' ? styles.activeTab : ''}>Endereço</button>
            </div>
            <div className={styles.formTabContent}>{formContent[activeTab]}</div>
        </>
    );
};

const PaginationControls = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;

    return (
        <div className={styles.paginationControls}>
            <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>
                <FaChevronLeft /> Anterior
            </button>
            <span>Página {currentPage} de {totalPages}</span>
            <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}>
                Próximo <FaChevronRight />
            </button>
        </div>
    );
};

// --- 3. COMPONENTE PRINCIPAL: Admin ---

export default function Admin() {
    const navigate = useNavigate();
    const [view, setView] = useState('visitantes');
    const [usuarios, setUsuarios] = useState([]);
    const [visitantes, setVisitantes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    
    // Estados dos Modais
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [formData, setFormData] = useState({});
    const [confirmModalState, setConfirmModalState] = useState({ isOpen: false, item: null, onConfirm: null });

    // Carregamento inicial
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) { toast.error("Sessão expirada."); navigate('/'); return; }
        const headers = { 'Authorization': `Bearer ${token}` };
        
        setLoading(true);
        Promise.all([
            axios.get(`${API_BASE_URL}/api/usuarios`, { headers }),
            axios.get(`${API_BASE_URL}/visitantes`, { headers })
        ]).then(([usersRes, visitorsRes]) => {
            setUsuarios(usersRes.data);
            setVisitantes(visitorsRes.data);
        }).catch(error => {
            console.error("Erro ao carregar dados:", error);
            toast.error("Erro ao carregar dados.");
        }).finally(() => setLoading(false));
    }, [navigate]);

    // Reseta a página para 1 sempre que os filtros mudarem
    useEffect(() => {
        setCurrentPage(1);
    }, [view, activeFilter, searchTerm]);

    // Lógica de filtragem
    const filteredData = useMemo(() => {
        const data = view === 'visitantes' ? visitantes : usuarios;
        let filtered = data;

        if (view === 'visitantes' && activeFilter !== 'all') {
            filtered = data.filter(v => v.status === activeFilter);
        }
        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            filtered = filtered.filter(item =>
                (item.nome?.toLowerCase().includes(lowerTerm)) ||
                (item.nome_gf?.toLowerCase().includes(lowerTerm)) ||
                (item.email?.toLowerCase().includes(lowerTerm)) ||
                (item.email_gf?.toLowerCase().includes(lowerTerm)) || // Adicionado email_gf
                (item.telefone?.includes(lowerTerm))
            );
        }
        return filtered;
    }, [view, visitantes, usuarios, activeFilter, searchTerm]);
    
    // Lógica para fatiar os dados para a página atual
    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        return filteredData.slice(startIndex, endIndex);
    }, [filteredData, currentPage]);
    
    const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);

    // Funções de Ação
    const handleOpenModal = (item = null) => {
        setEditingItem(item);
        if (item) {
            setFormData({ ...item, data_nascimento: item.data_nascimento ? new Date(item.data_nascimento).toISOString().split('T')[0] : '' });
        } else {
            // Limpa o campo de logo ao criar novo item
            setFormData(view === 'usuarios' ? { tipo_usuario: 'secretaria', logo: null } : { status: 'pendente', evento: 'culto', endereco: {} });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => { setIsModalOpen(false); setEditingItem(null); setFormData({}); };
    
    const handleFormChange = (e) => {
        const { name, value, files } = e.target;
        if (files && files[0]) {
            setFormData(prev => ({ ...prev, [name]: files[0] }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };
    
    const handleAddressChange = (e) => { const { name, value } = e.target; setFormData(prev => ({ ...prev, endereco: { ...prev.endereco, [name]: value } })); };

    const handleStatusChange = async (id, newStatus) => {
        const originalVisitantes = [...visitantes];
        setVisitantes(prev => prev.map(v => v.id === id ? { ...v, status: newStatus } : v));
        try {
            const token = localStorage.getItem('token');
            await axios.patch(`${API_BASE_URL}/visitantes/${id}/status`, { status: newStatus }, { headers: { 'Authorization': `Bearer ${token}` }});
            toast.success("Status atualizado!");
        } catch (error) {
            toast.error("Falha ao atualizar. Restaurando.");
            setVisitantes(originalVisitantes);
        }
    };
    
    const handleDelete = (item) => {
        const onConfirm = async () => {
            const isUserView = view === 'usuarios';
            const originalData = isUserView ? [...usuarios] : [...visitantes];
            const endpoint = isUserView ? `/api/usuarios/${item.id}` : `/visitantes/${item.id}`;
            const setData = isUserView ? setUsuarios : setVisitantes;
            
            setData(prevData => prevData.filter(d => d.id !== item.id));
            
            try {
                const token = localStorage.getItem('token');
                await axios.delete(`${API_BASE_URL}${endpoint}`, { headers: { 'Authorization': `Bearer ${token}` }});
                toast.success("Item removido!");
            } catch (error) {
                toast.error("Falha ao excluir no servidor. Restaurando.");
                setData(originalData);
            }
        };
        setConfirmModalState({ isOpen: true, item, onConfirm });
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        const isUserView = view === 'usuarios';
        const endpoint = isUserView ? '/api/usuarios' : '/visitantes';
        const url = `${API_BASE_URL}${endpoint}${editingItem ? `/${editingItem.id}` : ''}`;
        const method = editingItem ? 'put' : 'post';
        
        let payload;
        const headers = { 'Authorization': `Bearer ${token}` };

        if (isUserView) {
            payload = new FormData();
            for (const key in formData) {
                if (formData[key] !== null && formData[key] !== undefined) {
                    payload.append(key, formData[key]);
                }
            }
        } else {
            payload = formData;
            headers['Content-Type'] = 'application/json';
        }

        try {
            const response = await axios[method](url, payload, { headers });
            toast.success(`Dados salvos com sucesso!`);
            
            const updatedItem = response.data;
            const setData = isUserView ? setUsuarios : setVisitantes;
            if (editingItem) {
                setData(prev => prev.map(item => item.id === editingItem.id ? updatedItem : item));
            } else {
                setData(prev => [updatedItem, ...prev]);
            }

            // --- INÍCIO DA ALTERAÇÃO ---
            // Verifica se o usuário editado é o mesmo que está logado.
            // É importante que você salve o ID do usuário como 'userId' no localStorage durante o login.
            const loggedInUserId = localStorage.getItem('userId');
            
            if (isUserView && editingItem && loggedInUserId && updatedItem.id.toString() === loggedInUserId) {
                // Atualiza os dados no localStorage
                localStorage.setItem('nome_gf', updatedItem.nome_gf);
                localStorage.setItem('logo_url', updatedItem.logo_url);
                localStorage.setItem('tipo', updatedItem.tipo_usuario);

                // Dispara o evento customizado para notificar o Header da mudança
                window.dispatchEvent(new Event('storageUpdated'));
            }
            // --- FIM DA ALTERAÇÃO ---

            handleCloseModal();
        } catch (error) { 
            const errorMessage = error.response?.data?.message || "Falha ao salvar. Verifique os dados.";
            toast.error(errorMessage);
        }
    };
    
    // --- Renderização ---
    if (loading) {
        return <div className={styles.adminContainer}><Header /><SkeletonPage /></div>;
    }

    const statItems = view === 'visitantes' ? calculateVisitorStats(visitantes) : calculateUserStats(usuarios);
    const isUserView = view === 'usuarios';
    const columns = isUserView 
        ? [{key: 'logo', label: 'Logo'}, {key: 'nome_gf', label: 'Nome'}, {key: 'email_gf', label: 'Email'}, {key: 'tipo_usuario', label: 'Perfil'}]
        : [{key: 'id', label: 'ID'}, {key: 'nome', label: 'Visitante'}, {key: 'telefone', label: 'Contato'}, {key: 'status', label: 'Status'}, {key: 'gf_responsavel', label: 'GF Responsável'}];

    return (
        <div className={styles.adminContainer}>
            <Header />
            <main className={styles.mainContent}>
                <header className={styles.mainHeader}>
                    <h1>Painel de Administração</h1>
                    <div className={styles.searchBox}>
                        <FaSearch /><input type="text" placeholder="Pesquisar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    </div>
                </header>

                <div className={styles.viewToggle}>
                    <button onClick={() => setView('visitantes')} className={view === 'visitantes' ? styles.active : ''}><FaWalking /> Visitantes</button>
                    <button onClick={() => setView('usuarios')} className={view === 'usuarios' ? styles.active : ''}><FaUsers /> Usuários</button>
                </div>
                
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
                
                <div className={styles.tableContainer}>
                    <div className={styles.tableHeader}>
                        <h3>{isUserView ? 'Usuários' : 'Visitantes'} ({filteredData.length})</h3>
                        <div className={styles.headerActions}>
                            {!isUserView && (
                                <div className={styles.filterButtons}>
                                    <button onClick={() => setActiveFilter('all')} className={activeFilter === 'all' ? styles.active : ''}>Todos</button>
                                    {statusOptions.map(opt => <button key={opt.value} onClick={() => setActiveFilter(opt.value)} className={activeFilter === opt.value ? styles.active : ''}>{opt.label}</button>)}
                                </div>
                            )}
                            <button onClick={() => handleOpenModal()} className={styles.addButton}><FaPlus /> Novo</button>
                        </div>
                    </div>
                    <div className={styles.tableWrapper}>
                        <table className={styles.dataTable}>
                            <thead><tr>{columns.map(c => <th key={c.key}>{c.label}</th>)}<th>Ações</th></tr></thead>
                            <tbody>
                                {paginatedData.map(item => (
                                    <tr key={item.id}>
                                        {columns.map(col => (
                                            <td key={`${item.id}-${col.key}`} data-label={col.label}>
                                                {(() => {
                                                    if (col.key === 'logo') {
                                                        return <img src={item.logo_url || 'https://via.placeholder.com/40'} alt="Logo" className={styles.tableLogo} />;
                                                    }
                                                    if (col.key === 'tipo_usuario') {
                                                        return <span className={styles.roleBadge} style={{'--role-color': userRoles[item.tipo_usuario]?.color}}>{userRoles[item.tipo_usuario]?.icon}{userRoles[item.tipo_usuario]?.label}</span>;
                                                    }
                                                    if (col.key === 'status') {
                                                        return <select value={item.status} onChange={(e) => handleStatusChange(item.id, e.target.value)} className={styles.statusSelect} style={{'--status-color': statusOptions.find(s => s.value === item.status)?.color}}>{statusOptions.map(opt=><option key={opt.value} value={opt.value}>{opt.label}</option>)}</select>;
                                                    }
                                                    return item[col.key];
                                                })()}
                                            </td>
                                        ))}
                                        <td data-label="Ações">
                                            <div className={styles.actionButtons}>
                                                <button onClick={() => handleOpenModal(item)} className={styles.editButton}><FaEdit /></button>
                                                <button onClick={() => handleDelete(item)} className={styles.deleteButton}><FaTrashAlt /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    
                    <PaginationControls 
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                    />
                </div>
            </main>

            {isModalOpen && (
                <div className={styles.modalOverlay} onClick={handleCloseModal}>
                    <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                        <button className={styles.closeModal} onClick={handleCloseModal}>&times;</button>
                        <h2>{editingItem ? `Editar ${isUserView ? 'Usuário' : 'Visitante'}` : `Novo ${isUserView ? 'Usuário' : 'Visitante'}`}</h2>
                        <form onSubmit={handleFormSubmit} className={styles.modalForm}>
                            {isUserView ? (
                                <div className={styles.formGrid}>
                                    <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                                        <label><FaImage /> Logo do Usuário</label>
                                        <div className={styles.logoUploadContainer}>
                                            <img 
                                                src={
                                                    formData.logo instanceof File
                                                        ? URL.createObjectURL(formData.logo)
                                                        : (editingItem?.logo_url || 'https://via.placeholder.com/100')
                                                }
                                                alt="Preview"
                                                className={styles.logoPreview}
                                            />
                                            <input
                                                type="file"
                                                name="logo"
                                                accept="image/*"
                                                onChange={handleFormChange}
                                                className={styles.fileInput}
                                            />
                                        </div>
                                    </div>

                                    <div className={styles.formGroup}><label>Nome*</label><input type="text" name="nome_gf" value={formData.nome_gf || ''} onChange={handleFormChange} required /></div>
                                    <div className={styles.formGroup}><label>Email*</label><input type="email" name="email_gf" value={formData.email_gf || ''} onChange={handleFormChange} required /></div>
                                    <div className={styles.formGroup}><label>Senha{!editingItem && '*'}</label><input type="password" name="senha_gf" onChange={handleFormChange} placeholder={editingItem ? 'Deixe em branco para não alterar' : ''} required={!editingItem} /></div>
                                    <div className={styles.formGroup}><label>Perfil*</label><select name="tipo_usuario" value={formData.tipo_usuario || 'secretaria'} onChange={handleFormChange} required><option value="secretaria">Secretaria</option><option value="admin">Administrador</option></select></div>
                                </div>
                            ) : (
                                <VisitorForm formData={formData} onFormChange={handleFormChange} onAddressChange={handleAddressChange} />
                            )}
                            <div className={styles.modalActions}>
                                <button type="button" onClick={handleCloseModal} className={styles.cancelButton}>Cancelar</button>
                                <button type="submit" className={styles.saveButton}>{editingItem ? 'Atualizar' : 'Salvar'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            
            {confirmModalState.isOpen && (
                 <div className={styles.modalOverlay}>
                    <div className={styles.modalContent} style={{ maxWidth: '450px' }}>
                        <h2>Confirmar Exclusão</h2>
                        <p>Tem certeza que deseja excluir '<b>{confirmModalState.item?.nome || confirmModalState.item?.nome_gf}</b>'? Esta ação não pode ser desfeita.</p>
                        <div className={styles.modalActions}>
                            <button onClick={() => setConfirmModalState({ isOpen: false, item: null, onConfirm: null })} className={styles.cancelButton}>Cancelar</button>
                            <button onClick={() => { confirmModalState.onConfirm(); setConfirmModalState({ isOpen: false, item: null, onConfirm: null }); }} className={`${styles.deleteButton} ${styles.saveButton}`}>Confirmar Exclusão</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Funções para calcular estatísticas
const calculateVisitorStats = (visitors) => {
    if (!visitors || visitors.length === 0) return [];
    const statusDistribution = visitors.reduce((acc, v) => { acc[v.status] = (acc[v.status] || 0) + 1; return acc; }, {});
    const genderDistribution = visitors.reduce((acc, v) => { if(v.sexo) acc[v.sexo] = (acc[v.sexo] || 0) + 1; return acc; }, {});
    return [
        { icon: <FaUsers />, value: visitors.length, label: 'Total de Visitantes', color: 'blue' },
        { icon: <FaRegClock />, value: statusDistribution.pendente || 0, label: 'Pendentes', color: 'yellow' },
        { icon: <FiUserCheck />, value: statusDistribution['entrou em contato'] || 0, label: 'Contatados', color: 'green' },
        { icon: <FiUserX />, value: statusDistribution['erro número'] || 0, label: 'Erros', color: 'red' },
        { icon: <BsGenderMale />, value: genderDistribution.Masculino || 0, label: 'Homens', color: 'blue' },
        { icon: <BsGenderFemale />, value: genderDistribution.Feminino || 0, label: 'Mulheres', color: 'pink' }
    ];
};

const calculateUserStats = (users) => {
    if (!users || users.length === 0) return [];
    return [
        { icon: <FaUsersCog />, value: users.length, label: 'Total de Usuários', color: 'blue' },
        { icon: <FaUserShield />, value: users.filter(u => u.tipo_usuario === 'admin').length, label: 'Administradores', color: 'purple' },
        { icon: <FaUserFriends />, value: users.filter(u => u.tipo_usuario === 'secretaria').length, label: 'Secretarias', color: 'green' },
    ];
};
