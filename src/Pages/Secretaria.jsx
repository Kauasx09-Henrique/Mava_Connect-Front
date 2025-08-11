import { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate, Link } from 'react-router-dom';

// --- CONSTANTES E CONFIGURAÇÕES ---
const API_URL = 'https://mava-connect-backend.onrender.com';
const ITEMS_PER_PAGE = 12;
const WHATSAPP_MESSAGE = `Olá, tudo bem?\n\nSeja muito bem-vindo(a) à MAVA. Foi uma honra contar com sua presença em nosso culto.\n\nAtenciosamente,\nSecretaria MAVA`;
const STATUS_OPTIONS = [
    { value: 'todos', label: 'Todos os Status' },
    { value: 'pendente', label: 'Pendente' },
    { value: 'entrou em contato', label: 'Contatado' },
    { value: 'erro número', label: 'Número Inválido' }
];

// --- COMPONENTES INTERNOS DE UI (CORRIGIDOS) ---

// Header Simulado para evitar erro de importação
const Header = () => (
    <header className="header-placeholder">
        <h1>MAVA Connect</h1>
    </header>
);

// Card de Estatísticas
const StatCard = ({ icon, label, value, colorClass }) => (
    <div className={`statCard ${colorClass}`}>
        <div className="statIcon">{icon}</div>
        <div className="statInfo">
            <p className="value">{value}</p>
            <p className="label">{label}</p>
        </div>
    </div>
);

// Card de Visitante
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
        <div className="visitorCard">
            <div className="cardHeader">
                <h3 className="visitorName">{visitante.nome || 'Nome não informado'}</h3>
                <select 
                    value={visitante.status} 
                    onChange={(e) => onStatusChange(visitante._id, e.target.value)} 
                    className={`statusSelect ${visitante.status?.replace(/ /g, '')}`}
                    onClick={(e) => e.stopPropagation()}
                >
                    <option value="pendente">Pendente</option>
                    <option value="entrou em contato">Contatado</option>
                    <option value="erro número">Erro no Número</option>
                </select>
            </div>
            <div className="cardBody">
                {visitante.telefone && <div className="contactItem"><span>📞</span><span>{visitante.telefone}</span></div>}
                {visitante.email && <div className="contactItem"><span>✉️</span><a href={`mailto:${visitante.email}`}>{visitante.email}</a></div>}
                <div className="contactItem"><span>🗓️</span><span>Visitou em: {visitDate}</span></div>
                {visitante.evento && <div className="contactItem"><span>🏆</span><span>Origem: {formatEventName(visitante.evento)}</span></div>}
            </div>
            <div className="cardFooter">
                {whatsappUrl && <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="actionButton whatsappButton" title="Enviar WhatsApp">💬</a>}
                <button onClick={() => onEdit(visitante)} className="actionButton editButton" title="Editar">✏️</button>
                <button onClick={() => onDelete(visitante)} className="actionButton deleteButton" title="Excluir">🗑️</button>
            </div>
        </div>
    );
};

// Skeleton Loader para o Grid
const VisitorGridSkeleton = () => (
    <div className="visitorGrid">
        {[...Array(ITEMS_PER_PAGE)].map((_, i) => (
            <div key={i} className="skeletonCard">
                <div className="skeletonText" style={{ width: '60%', height: '24px' }}></div>
                <div className="skeletonText" style={{ width: '40%', height: '20px' }}></div>
                <div className="skeletonText" style={{ marginTop: '1rem', width: '80%' }}></div>
                <div className="skeletonText" style={{ width: '70%' }}></div>
            </div>
        ))}
    </div>
);

// Controles de Paginação
const PaginationControls = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;
    return (
        <div className="paginationControls">
            <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>{"<"} Anterior</button>
            <span>Página {currentPage} de {totalPages}</span>
            <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}>Próximo {">"}</button>
        </div>
    );
};

// --- COMPONENTE PRINCIPAL ---
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
            const res = await axios.get(`${API_URL}/visitantes`, { headers: { 'Authorization': `Bearer ${token}` } });
            const dataWithId = res.data.map(v => ({...v, id: v._id}));
            setVisitantes(Array.isArray(dataWithId) ? dataWithId : []);
        } catch (err) {
            console.error('Erro ao buscar visitantes:', err);
            toast.error('Sessão expirada ou erro de rede.');
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

    const stats = useMemo(() => {
        if (visitantes.length === 0) return { total: 0, pending: 0, contacted: 0, error: 0, myRegisters: 0, male: 0, female: 0, topRegistrar: null };
        
        const loggedInUserName = localStorage.getItem('usuario_nome'); 

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
            myRegisters: loggedInUserName ? visitantes.filter(v => v.gf_responsavel === loggedInUserName).length : 0,
            male: visitantes.filter(v => v.sexo === 'Masculino').length,
            female: visitantes.filter(v => v.sexo === 'Feminino').length,
            topRegistrar: topRegistrar ? { name: topRegistrar[0], count: topRegistrar[1] } : null,
        };
    }, [visitantes]);

    const { paginatedVisitors, totalPages } = useMemo(() => {
        const filtered = visitantes.filter(v => {
            if (!v) return false;
            const searchLower = searchTerm.toLowerCase();
            const matchesSearch = !searchLower || v.nome?.toLowerCase().includes(searchLower) || v.telefone?.includes(searchTerm);
            const matchesStatus = statusFilter === 'todos' || v.status === statusFilter;
            return matchesSearch && matchesStatus;
        }).sort((a, b) => new Date(b.data_visita) - new Date(a.data_visita));

        const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
        const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
        return { paginatedVisitors: paginated, totalPages };
    }, [searchTerm, statusFilter, visitantes, currentPage]);

    const handleStatusChange = useCallback(async (id, status) => {
        const originalVisitantes = [...visitantes];
        setVisitantes(prev => prev.map(v => v.id === id ? { ...v, status } : v));

        try {
            const token = localStorage.getItem('token');
            await axios.patch(`${API_URL}/visitantes/${id}/status`, { status }, { headers: { 'Authorization': `Bearer ${token}` }});
            toast.success('Status alterado!');
        } catch {
            toast.error('Erro ao alterar status.');
            setVisitantes(originalVisitantes);
        }
    }, [visitantes]);

    const handleDelete = useCallback((visitorToDelete) => {
        toast((t) => (
            <div className="toastContainer">
                <p>Excluir <strong>{visitorToDelete.nome}</strong>?</p>
                <div className="toastActions">
                    <button className="toastConfirmButton" onClick={async () => {
                        toast.dismiss(t.id);
                        const originalVisitantes = [...visitantes];
                        setVisitantes(prev => prev.filter(v => v.id !== visitorToDelete.id));
                        
                        try {
                            const token = localStorage.getItem('token');
                            await axios.delete(`${API_URL}/visitantes/${visitorToDelete.id}`, { headers: { 'Authorization': `Bearer ${token}` }});
                            toast.success('Excluído com sucesso!');
                        } catch {
                            toast.error('Erro ao excluir.');
                            setVisitantes(originalVisitantes);
                        }
                    }}>Excluir</button>
                    <button className="toastCancelButton" onClick={() => toast.dismiss(t.id)}>Cancelar</button>
                </div>
            </div>
        ));
    }, [visitantes]);

    const handleUpdateVisitor = useCallback(async (e) => {
        e.preventDefault();
        const originalVisitantes = [...visitantes];
        setVisitantes(prev => prev.map(v => v.id === editingVisitor.id ? editingVisitor : v));
        const visitorToUpdate = { ...editingVisitor };
        setEditingVisitor(null);
        
        try {
            const token = localStorage.getItem('token');
            const { _id, ...updateData } = visitorToUpdate;
            await axios.put(`${API_URL}/visitantes/${visitorToUpdate.id}`, updateData, { headers: { 'Authorization': `Bearer ${token}` }});
            toast.success('Visitante atualizado!');
        } catch {
            toast.error('Erro ao atualizar.');
            setVisitantes(originalVisitantes);
        }
    }, [editingVisitor, visitantes]);
    
    const handleModalChange = useCallback((e) => {
        const { name, value } = e.target;
        setEditingVisitor(prev => ({ ...prev, [name]: value }));
    }, []);

    return (
            <div className="pageContainer">
                <Header />
                <main className="dashboard">
                    <div className="dashboardHeader">
                        <h1>Dashboard da Secretaria</h1>
                        <p>Gerencie os visitantes de forma simples e eficiente.</p>
                    </div>

                    <div className="statsGrid">
                        <StatCard icon="👤" label="Meus Cadastros" value={stats.myRegisters} colorClass="myRegisters" />
                        <StatCard icon="👥" label="Total de Visitantes" value={stats.total} colorClass="total" />
                        <StatCard icon="⏳" label="Contatos Pendentes" value={stats.pending} colorClass="pending" />
                        <StatCard icon="👍" label="Contatados" value={stats.contacted} colorClass="contacted" />
                        <StatCard icon="⚠️" label="Números com Erro" value={stats.error} colorClass="error" />
                        {stats.topRegistrar && <StatCard icon="🏆" label="Top Cadastrador" value={`${stats.topRegistrar.name} (${stats.topRegistrar.count})`} colorClass="topRegistrar" />}
                        <StatCard icon="👨" label="Visitantes Homens" value={stats.male} colorClass="male" />
                        <StatCard icon="👩" label="Visitantes Mulheres" value={stats.female} colorClass="female" />
                    </div>
                    
                    <div className="toolbar">
                        <div className="filters">
                            <div className="searchContainer">
                                <span className="searchIcon">🔍</span>
                                <input type="text" placeholder="Buscar por nome ou telefone..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="searchInput" />
                            </div>
                            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="statusFilter">
                                {STATUS_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                            </select>
                        </div>
                        <Link to="/cadastrar-visitante" className="addButton"><span>+</span> Novo Visitante</Link>
                    </div>

                    <div className="content">
                        {loading ? <VisitorGridSkeleton /> : 
                            <>
                                <div className="visitorGrid">
                                    {paginatedVisitors.map(v => (
                                        v && v.id && <VisitorCard key={v.id} visitante={v} onEdit={setEditingVisitor} onDelete={handleDelete} onStatusChange={handleStatusChange} />
                                    ))}
                                </div>
                                {paginatedVisitors.length === 0 && !loading && <div className="emptyState"><p>Nenhum visitante encontrado para os filtros selecionados.</p></div>}
                                <PaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                            </>
                        }
                    </div>
                </main>

                {editingVisitor && (
                    <div className="modalOverlay" onClick={() => setEditingVisitor(null)}>
                        <div className="modalContent" onClick={e => e.stopPropagation()}>
                            <button className="closeModal" onClick={() => setEditingVisitor(null)}>X</button>
                            <form onSubmit={handleUpdateVisitor}>
                                <h2>Editando: {editingVisitor.nome}</h2>
                                <div className="formGrid">
                                    <div className="formGroup"><label>Nome Completo</label><input name="nome" value={editingVisitor.nome || ''} onChange={handleModalChange} /></div>
                                    <div className="formGroup"><label>Telefone</label><input name="telefone" value={editingVisitor.telefone || ''} onChange={handleModalChange} /></div>
                                    <div className="formGroup"><label>Email</label><input name="email" type="email" value={editingVisitor.email || ''} onChange={handleModalChange} /></div>
                                    <div className="formGroup"><label>Como Conheceu</label><input name="como_conheceu" value={editingVisitor.como_conheceu || ''} onChange={handleModalChange} /></div>
                                </div>
                                <div className="modalActions">
                                    <button type="button" onClick={() => setEditingVisitor(null)} className="cancelButton">Cancelar</button>
                                    <button type="submit" className="saveButton">Salvar Alterações</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
      );
}
