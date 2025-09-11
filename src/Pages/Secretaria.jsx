import { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2'; // ALTERAÇÃO: Importado SweetAlert2 em vez de toast
import { useNavigate, Link } from 'react-router-dom';

// Ícones do Material Design
import { 
    MdPhone, MdOutlineMail, MdAdd, MdClose, MdCheck, // CORREÇÃO: Ícone MdCheck adicionado
    MdCalendarToday, MdOutlineAccessTime, MdErrorOutline, 
    MdSearch, MdGroups, MdThumbUp, MdEmojiEvents, MdWhatsapp,
    MdPerson, MdMale, MdFemale 
} from 'react-icons/md';
// Ícones do Font Awesome
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
// Ícones do Heroicons
import { HiPencil, HiOutlineTrash } from 'react-icons/hi';

import Header from '../Components/Header';
import styles from './style/Secretaria.module.css';

// --- 1. CONSTANTES E CONFIGURAÇÕES ---

// CORREÇÃO: Adicionado o prefixo /api à URL base para corrigir os erros 404
const API_BASE_URL = 'https://mava-connect.onrender.com/api';

const ITEMS_PER_PAGE = 12; // Cards por página
const WHATSAPP_MESSAGE = `Olá, tudo bem?\n\nSeja muito bem-vindo(a) à MAVA. Foi uma honra contar com sua presença em nosso culto.\n\nAtenciosamente,\nSecretaria MAVA`;
const STATUS_OPTIONS = [
    { value: 'todos', label: 'Todos os Status' },
    { value: 'pendente', label: 'Pendente' },
    { value: 'entrou em contato', label: 'Contatado' },
    { value: 'erro número', label: 'Número Inválido' }
];

// --- 2. COMPONENTES INTERNOS DE UI ---

const StatCard = ({ icon, label, value, colorClass }) => (
    <div className={`${styles.statCard} ${styles[colorClass]}`}>
        <div className={styles.statIcon}>{icon}</div>
        <div className={styles.statInfo}>
            <p className={styles.value}>{value}</p>
            <p className={styles.label}>{label}</p>
        </div>
    </div>
);

const VisitorCard = ({ visitante, onEdit, onDelete, onStatusChange }) => {
    const whatsappUrl = useMemo(() => {
        if (!visitante?.telefone) return null;
        const cleanPhone = visitante.telefone.replace(/\D/g, '');
        return `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;
    }, [visitante?.telefone]);

    const visitDate = useMemo(() => {
        return visitante?.data_visita ? new Date(visitante.data_visita).toLocaleDateString('pt-BR') : 'N/A';
    }, [visitante?.data_visita]);

    const formatEventName = useCallback((event) => {
        if (!event) return 'N/A';
        const formatted = event.charAt(0).toUpperCase() + event.slice(1);
        return formatted === 'Gf' ? 'GF' : formatted;
    }, []);

    return (
        <div className={styles.visitorCard}>
            <div className={styles.cardHeader}>
                <h3 className={styles.visitorName}>{visitante.nome || 'Nome não informado'}</h3>
                <select 
                    value={visitante.status} 
                    onChange={(e) => onStatusChange(visitante.id, e.target.value)} 
                    className={`${styles.statusSelect} ${styles[visitante.status?.replace(/ /g, '')]}`}
                    onClick={(e) => e.stopPropagation()}
                >
                    <option value="pendente">Pendente</option>
                    <option value="entrou em contato">Contatado</option>
                    <option value="erro número">Erro no Número</option>
                </select>
            </div>
            <div className={styles.cardBody}>
                {visitante.telefone && <div className={styles.contactItem}><MdPhone /><span>{visitante.telefone}</span></div>}
                {visitante.email && <div className={styles.contactItem}><MdOutlineMail /><a href={`mailto:${visitante.email}`}>{visitante.email}</a></div>}
                <div className={styles.contactItem}><MdCalendarToday /><span>Visitou em: {visitDate}</span></div>
                {visitante.evento && <div className={styles.contactItem}><MdEmojiEvents /><span>Origem: {formatEventName(visitante.evento)}</span></div>}
            </div>
            <div className={styles.cardFooter}>
                {whatsappUrl && <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className={`${styles.actionButton} ${styles.whatsappButton}`} title="Enviar WhatsApp"><MdWhatsapp /></a>}
                <button onClick={() => onEdit(visitante)} className={`${styles.actionButton} ${styles.editButton}`} title="Editar"><HiPencil /></button>
                <button onClick={() => onDelete(visitante)} className={`${styles.actionButton} ${styles.deleteButton}`} title="Excluir"><HiOutlineTrash /></button>
            </div>
        </div>
    );
};

const VisitorGridSkeleton = () => (
    <div className={styles.visitorGrid}>
        {[...Array(ITEMS_PER_PAGE)].map((_, i) => (
            <div key={i} className={`${styles.skeletonCard}`}>
                <div className={styles.skeletonText} style={{ width: '60%', height: '24px' }}></div>
                <div className={styles.skeletonText} style={{ width: '40%', height: '20px' }}></div>
                <div className={styles.skeletonText} style={{ marginTop: '1rem', width: '80%' }}></div>
                <div className={styles.skeletonText} style={{ width: '70%' }}></div>
            </div>
        ))}
    </div>
);

const PaginationControls = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;
    return (
        <div className={styles.paginationControls}>
            <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}><FaChevronLeft /> Anterior</button>
            <span>Página {currentPage} de {totalPages}</span>
            <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}>Próximo <FaChevronRight /></button>
        </div>
    );
};

// --- 3. COMPONENTE PRINCIPAL ---
export default function Secretaria() {
    const [visitantes, setVisitantes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('todos');
    const [currentPage, setCurrentPage] = useState(1);
    const [editingVisitor, setEditingVisitor] = useState(null);
    const navigate = useNavigate();

    const fetchData = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_BASE_URL}/visitantes`, { headers: { 'Authorization': `Bearer ${token}` } });
            setVisitantes(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error('Erro ao buscar visitantes:', err);
            // ALTERAÇÃO: Usando SweetAlert para erro
            Swal.fire({
                icon: 'error',
                title: 'Erro de Autenticação',
                text: 'Sessão expirada ou erro de rede. Por favor, faça login novamente.',
            });
            if (err.response?.status === 401 || err.response?.status === 403) navigate('/');
        }
    }, [navigate]);

    useEffect(() => { 
        setLoading(true);
        fetchData().finally(() => setLoading(false));
    }, [fetchData]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter]);

    // Estatísticas calculadas
    const stats = useMemo(() => {
        if (visitantes.length === 0) return { total: 0, pending: 0, contacted: 0, error: 0, myRegisters: 0, male: 0, female: 0, topRegistrar: null };

        const loggedInUserId = localStorage.getItem('usuario_id');
        const registrarCounts = visitantes.reduce((acc, v) => {
            const registrarName = v.gf_responsavel || 'Não atribuído';
            acc[registrarName] = (acc[registrarName] || 0) + 1;
            return acc;
        }, {});

        const topRegistrar = Object.entries(registrarCounts)
            .filter(([name]) => name !== 'Não atribuído')
            .sort(([, a], [, b]) => b - a)[0];

        return {
            total: visitantes.length,
            pending: visitantes.filter(v => v.status === 'pendente').length,
            contacted: visitantes.filter(v => v.status === 'entrou em contato').length,
            error: visitantes.filter(v => v.status === 'erro número').length,
            myRegisters: loggedInUserId ? visitantes.filter(v => v.usuario_id === parseInt(loggedInUserId, 10)).length : 0,
            male: visitantes.filter(v => v.sexo === 'Masculino').length,
            female: visitantes.filter(v => v.sexo === 'Feminino').length,
            topRegistrar: topRegistrar ? { name: topRegistrar[0], count: topRegistrar[1] } : null,
        };
    }, [visitantes]);

    // Visitantes filtrados e paginados
    const { paginatedVisitors, totalPages } = useMemo(() => {
        const filtered = visitantes.filter(v => {
            if (!v) return false;
            const searchLower = searchTerm.toLowerCase();
            const matchesSearch = !searchLower || v.nome?.toLowerCase().includes(searchLower) || v.telefone?.includes(searchTerm);
            const matchesStatus = statusFilter === 'todos' || v.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
        const totalPagesResult = Math.ceil(filtered.length / ITEMS_PER_PAGE);
        const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
        return { paginatedVisitors: paginated, totalPages: totalPagesResult };
    }, [searchTerm, statusFilter, visitantes, currentPage]);

    // Manipuladores de Ações com UI Otimista
    const handleStatusChange = useCallback(async (id, status) => {
        const originalVisitantes = [...visitantes];
        setVisitantes(prev => prev.map(v => v.id === id ? { ...v, status } : v));

        try {
            const token = localStorage.getItem('token');
            await axios.patch(`${API_BASE_URL}/visitantes/${id}/status`, { status }, { headers: { 'Authorization': `Bearer ${token}` }});
            // ALTERAÇÃO: Usando SweetAlert para sucesso
             Swal.fire({
                icon: 'success',
                title: 'Status alterado!',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 2000,
                timerProgressBar: true,
            });
        } catch {
            // ALTERAÇÃO: Usando SweetAlert para erro
            Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: 'Erro ao alterar o status.',
            });
            setVisitantes(originalVisitantes);
        }
    }, [visitantes]);

    const handleDelete = useCallback((visitorToDelete) => {
        // ALTERAÇÃO: Usando SweetAlert para confirmação
        Swal.fire({
            title: `Excluir ${visitorToDelete.nome}?`,
            text: "Esta ação não pode ser desfeita!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#6e7881',
            confirmButtonText: 'Sim, excluir!',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                const originalVisitantes = [...visitantes];
                setVisitantes(prev => prev.filter(v => v.id !== visitorToDelete.id));

                const token = localStorage.getItem('token');
                axios.delete(`${API_BASE_URL}/visitantes/${visitorToDelete.id}`, { headers: { 'Authorization': `Bearer ${token}` }})
                    .then(() => {
                        Swal.fire(
                            'Excluído!',
                            'O visitante foi removido.',
                            'success'
                        );
                    })
                    .catch(() => {
                        Swal.fire(
                            'Erro!',
                            'Falha ao excluir o visitante.',
                            'error'
                        );
                        setVisitantes(originalVisitantes);
                    });
            }
        });
    }, [visitantes]);

    const handleUpdateVisitor = useCallback(async (e) => {
        e.preventDefault();
        const originalVisitantes = [...visitantes];
        setVisitantes(prev => prev.map(v => v.id === editingVisitor.id ? editingVisitor : v));
        setEditingVisitor(null);
        
        try {
            const token = localStorage.getItem('token');
            await axios.put(`${API_BASE_URL}/visitantes/${editingVisitor.id}`, editingVisitor, { headers: { 'Authorization': `Bearer ${token}` }});
            // ALTERAÇÃO: Usando SweetAlert para sucesso
            Swal.fire({
                icon: 'success',
                title: 'Visitante atualizado!',
                showConfirmButton: false,
                timer: 1500
            });
        } catch {
            // ALTERAÇÃO: Usando SweetAlert para erro
            Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: 'Erro ao atualizar o visitante.',
            });
            setVisitantes(originalVisitantes);
        }
    }, [editingVisitor, visitantes]);
    
    const handleModalChange = useCallback((e) => {
        const { name, value } = e.target;
        setEditingVisitor(prev => ({ ...prev, [name]: value }));
    }, []);

    return (
        <div className={styles.pageContainer}>
            <Header />
            <main className={styles.dashboard}>
                <div className={styles.dashboardHeader}>
                    <h1>Dashboard da Secretaria</h1>
                    <p>Gerencie os visitantes de forma simples e eficiente.</p>
                </div>

                <div className={styles.statsGrid}>
                    <StatCard icon={<MdPerson />} label="Meus Cadastros" value={stats.myRegisters} colorClass="myRegisters" />
                    <StatCard icon={<MdGroups />} label="Total de Visitantes" value={stats.total} colorClass="total" />
                    <StatCard icon={<MdOutlineAccessTime />} label="Contatos Pendentes" value={stats.pending} colorClass="pending" />
                    <StatCard icon={<MdThumbUp />} label="Contatados" value={stats.contacted} colorClass="contacted" />
                    <StatCard icon={<MdErrorOutline />} label="Números com Erro" value={stats.error} colorClass="error" />
                    {stats.topRegistrar && <StatCard icon={<MdEmojiEvents />} label="Top Cadastrador" value={`${stats.topRegistrar.name} (${stats.topRegistrar.count})`} colorClass="topRegistrar" />}
                    <StatCard icon={<MdMale />} label="Visitantes Homens" value={stats.male} colorClass="male" />
                    <StatCard icon={<MdFemale />} label="Visitantes Mulheres" value={stats.female} colorClass="female" />
                </div>
                
                <div className={styles.toolbar}>
                    <div className={styles.filters}>
                        <div className={styles.searchContainer}>
                            <MdSearch className={styles.searchIcon} />
                            <input type="text" placeholder="Buscar por nome ou telefone..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={styles.searchInput} />
                        </div>
                        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={styles.statusFilter}>
                            {STATUS_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                        </select>
                    </div>
                    <Link to="/cadastrar-visitante" className={styles.addButton}><MdAdd /> Novo Visitante</Link>
                </div>

                <div className={styles.content}>
                    {loading ? <VisitorGridSkeleton /> : 
                        <>
                            <div className={styles.visitorGrid}>
                                {paginatedVisitors.map(v => (
                                    v && v.id && <VisitorCard key={v.id} visitante={v} onEdit={setEditingVisitor} onDelete={handleDelete} onStatusChange={handleStatusChange} />
                                ))}
                            </div>
                            {paginatedVisitors.length === 0 && <div className={styles.emptyState}><p>Nenhum visitante encontrado para os filtros selecionados.</p></div>}
                            <PaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                        </>
                    }
                </div>
            </main>

            {editingVisitor && (
                <div className={styles.modalOverlay} onClick={() => setEditingVisitor(null)}>
                    <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                        <button className={styles.closeModal} onClick={() => setEditingVisitor(null)}><MdClose /></button>
                        <form onSubmit={handleUpdateVisitor}>
                            <h2>Editando: {editingVisitor.nome}</h2>
                            <div className={styles.formGrid}>
                                <div className={styles.formGroup}><label>Nome Completo</label><input name="nome" value={editingVisitor.nome || ''} onChange={handleModalChange} /></div>
                                <div className={styles.formGroup}><label>Telefone</label><input name="telefone" value={editingVisitor.telefone || ''} onChange={handleModalChange} /></div>
                                <div className={styles.formGroup}><label>Email</label><input name="email" type="email" value={editingVisitor.email || ''} onChange={handleModalChange} /></div>
                                <div className={styles.formGroup}><label>Como Conheceu</label><input name="como_conheceu" value={editingVisitor.como_conheceu || ''} onChange={handleModalChange} /></div>
                            </div>
                            <div className={styles.modalActions}>
                                <button type="button" onClick={() => setEditingVisitor(null)} className={styles.cancelButton}><MdClose /> Cancelar</button>
                                <button type="submit" className={styles.saveButton}><MdCheck /> Salvar Alterações</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}