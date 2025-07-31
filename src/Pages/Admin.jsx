// src/Pages/Admin.jsx

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import Header from '../Components/Header';
import styles from './style/Admin.module.css';
import { FaEdit, FaTrashAlt, FaPlus, FaUsers, FaWalking, FaUserShield } from 'react-icons/fa';

const API_BASE_URL = 'https://mava-connect-backend.onrender.com';

// --- Componentes Internos para um código mais limpo ---

const ProfileBadge = ({ type }) => (
  <span className={`${styles.badge} ${styles[type] || styles.secretaria}`}>
    {type}
  </span>
);

// --- Componente Principal ---

function Admin() {
    const navigate = useNavigate();
    const [view, setView] = useState('usuarios'); // 'usuarios' ou 'visitantes'
    const [usuarios, setUsuarios] = useState([]);
    const [visitantes, setVisitantes] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Estado para o Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [formData, setFormData] = useState({});

    // Busca de dados
    useEffect(() => {
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
                toast.error("Erro ao carregar dados do painel.");
                console.error("Erro na busca de dados:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchAllData();
    }, [navigate]);

    // --- LÓGICA DE ALTERAÇÃO DE STATUS ---
    const handleStatusChange = async (visitorId, newStatus) => {
        const token = localStorage.getItem('token');
        const originalVisitors = [...visitantes];

        // Atualização otimista da UI
        setVisitantes(prev => prev.map(v => v.id === visitorId ? { ...v, status: newStatus } : v));

        try {
            await axios.patch(
                `${API_BASE_URL}/visitantes/${visitorId}/status`,
                { status: newStatus },
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            toast.success('Status atualizado com sucesso!');
        } catch (error) {
            // Reverte a UI em caso de erro
            setVisitantes(originalVisitors);
            toast.error(error.response?.data?.error || "Não foi possível alterar o status.");
            console.error("Erro ao alterar status:", error);
        }
    };

    // Lógica do Modal
    const handleOpenModal = (item = null) => {
        setEditingItem(item);
        // Preenche o formulário apenas para edição de usuários
        if (view === 'usuarios') {
            setFormData({
                nome_gf: item?.nome_gf || '',
                email_gf: item?.email_gf || '',
                senha_gf: '',
                tipo_usuario: item?.tipo_usuario || 'secretaria'
            });
            setIsModalOpen(true);
        }
        // Para visitantes, a edição de status é direta na tabela.
        // O modal para visitantes não é mais necessário aqui, a menos que queira editar outros dados.
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingItem(null);
        setFormData({});
    };
    
    const handleFormChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

    // Lógica para submeter o formulário (agora apenas para usuários)
    const handleUserFormSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        const headers = { 'Authorization': `Bearer ${token}` };
        const endpoint = `${API_BASE_URL}/api/usuarios`;
        
        let dataToSend = { ...formData };
        if (editingItem && !formData.senha_gf) {
            delete dataToSend.senha_gf;
        }

        const promise = editingItem 
            ? axios.put(`${endpoint}/${editingItem.id}`, dataToSend, { headers })
            : axios.post(endpoint, dataToSend, { headers });

        toast.promise(promise, {
            loading: 'Salvando usuário...',
            success: (res) => {
                fetchAllData();
                handleCloseModal();
                return res.data.message || 'Usuário salvo com sucesso!';
            },
            error: (err) => err.response?.data?.error || 'Ocorreu um erro ao salvar.',
        });
    };

    return (
        <>
            <Header />
            <div className={styles.adminLayout}>
                <aside className={styles.sidebar}>
                    <h2 className={styles.sidebarTitle}>Painel Admin</h2>
                    <button onClick={() => setView('usuarios')} className={`${styles.navButton} ${view === 'usuarios' ? styles.active : ''}`}>
                        <FaUsers /> Gerenciar Usuários
                    </button>
                    <button onClick={() => setView('visitantes')} className={`${styles.navButton} ${view === 'visitantes' ? styles.active : ''}`}>
                        <FaWalking /> Gerenciar Visitantes
                    </button>
                </aside>

                <main className={styles.content}>
                    {view === 'usuarios' && (
                        <div>
                            <div className={styles.contentHeader}>
                                <h1>Lista de Usuários</h1>
                                <button onClick={() => handleOpenModal()} className={styles.addButton}><FaPlus /> Novo Usuário</button>
                            </div>
                            <div className={styles.tableContainer}>
                                <table className={styles.dataTable}>
                                    <thead><tr><th>Nome</th><th>Email</th><th>Perfil</th><th>Ações</th></tr></thead>
                                    <tbody>
                                        {usuarios.map(user => (
                                            <tr key={user.id}>
                                                <td>{user.nome_gf}</td>
                                                <td>{user.email_gf}</td>
                                                <td><ProfileBadge type={user.tipo_usuario} /></td>
                                                <td className={styles.actions}>
                                                    <button onClick={() => handleOpenModal(user)} title="Editar"><FaEdit /></button>
                                                    {/* Adicionar função de delete aqui */}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {view === 'visitantes' && (
                        <div>
                            <div className={styles.contentHeader}>
                                <h1>Lista de Visitantes</h1>
                            </div>
                            <div className={styles.tableContainer}>
                                <table className={styles.dataTable}>
                                    <thead><tr><th>Nome</th><th>Telefone</th><th>Email</th><th>Status</th></tr></thead>
                                    <tbody>
                                        {visitantes.map(visitor => (
                                            <tr key={visitor.id}>
                                                <td>{visitor.nome}</td>
                                                <td>{visitor.telefone}</td>
                                                <td>{visitor.email}</td>
                                                <td>
                                                    <select
                                                        className={styles.statusSelect}
                                                        value={visitor.status}
                                                        onChange={(e) => handleStatusChange(visitor.id, e.target.value)}
                                                    >
                                                        <option value="pendente">Pendente</option>
                                                        <option value="entrou em contato">Contatado</option>
                                                        <option value="erro número">Erro no Número</option>
                                                    </select>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {isModalOpen && view === 'usuarios' && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <form onSubmit={handleUserFormSubmit}>
                            <h2>{editingItem ? 'Editar Usuário' : 'Novo Usuário'}</h2>
                            {/* Campos do formulário de usuário */}
                            <div className={styles.formGroup}><label>Nome</label><input type="text" name="nome_gf" value={formData.nome_gf || ''} onChange={handleFormChange} required /></div>
                            <div className={styles.formGroup}><label>Email</label><input type="email" name="email_gf" value={formData.email_gf || ''} onChange={handleFormChange} required /></div>
                            <div className={styles.formGroup}><label>Senha</label><input type="password" name="senha_gf" value={formData.senha_gf || ''} onChange={handleFormChange} placeholder={editingItem ? 'Deixe em branco para não alterar' : ''} required={!editingItem} /></div>
                            <div className={styles.formGroup}><label>Perfil</label><select name="tipo_usuario" value={formData.tipo_usuario || 'secretaria'} onChange={handleFormChange}><option value="secretaria">Secretaria</option><option value="admin">Admin</option></select></div>
                            <div className={styles.modalActions}>
                                <button type="button" onClick={handleCloseModal}>Cancelar</button>
                                <button type="submit">Salvar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}

export default Admin;
