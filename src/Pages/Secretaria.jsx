import { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
// REMOVIDO: import { useNavigate, Link } from 'react-router-dom';

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

// --- CSS COMPLETO ---
const ComponentStyles = `
    /* --- VARIAVEIS DE TEMA --- */
    :root {
        --bg-page: #f4f7fc;
        --bg-card: #ffffff;
        --text-primary: #1e293b;
        --text-secondary: #64748b;
        --border-color: #e2e8f0;
        --input-bg: #f8fafc;
        --accent-primary: #4f46e5;
        --accent-secondary: #10b981;
        --shadow-color: rgba(149, 157, 165, 0.1);
        --success-color: #22c55e;
        --pending-color: #f59e0b;
        --error-color: #ef4444;
        --blue-color: #3b82f6;
    }
    body.dark-mode {
        --bg-page: #121212;
        --bg-card: #1e1e1e;
        --text-primary: #e0e0e0;
        --text-secondary: #b3b3b3;
        --border-color: #333;
        --input-bg: #2a2a2a;
        --accent-primary: #bb86fc;
        --accent-secondary: #03dac6;
        --shadow-color: rgba(0, 0, 0, 0.2);
        --success-color: #4caf50;
        --pending-color: #ffc107;
        --error-color: #f44336;
        --blue-color: #2196f3;
    }

    /* --- ANIMAÇÕES --- */
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
    }

    /* --- LAYOUT GERAL --- */
    .pageContainer {
        background-color: var(--bg-page);
        color: var(--text-primary);
        min-height: 100vh;
        font-family: 'Inter', sans-serif;
    }
    .header-placeholder {
        background-color: var(--bg-card);
        padding: 1rem 2rem;
        border-bottom: 1px solid var(--border-color);
    }
    .header-placeholder h1 {
        color: var(--text-primary);
        font-size: 1.5rem;
        margin: 0;
    }
    .dashboard {
        max-width: 1600px;
        margin: 0 auto;
        padding: 2rem;
        animation: fadeIn 0.5s ease-out;
    }
    .dashboardHeader {
        margin-bottom: 2rem;
    }
    .dashboardHeader h1 {
        font-size: 2.25rem;
        font-weight: 800;
        letter-spacing: -1px;
    }
    .dashboardHeader p {
        font-size: 1.1rem;
        color: var(--text-secondary);
        margin-top: 0.25rem;
    }

    /* --- GRID DE ESTATÍSTICAS --- */
    .statsGrid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 1.5rem;
        margin-bottom: 2.5rem;
    }
    .statCard {
        background-color: var(--bg-card);
        padding: 1.5rem;
        border-radius: 12px;
        border: 1px solid var(--border-color);
        display: flex;
        align-items: center;
        gap: 1rem;
        transition: transform 0.2s, box-shadow 0.2s;
    }
    .statCard:hover {
        transform: translateY(-5px);
        box-shadow: 0 8px 20px var(--shadow-color);
    }
    .statIcon {
        font-size: 2.5rem;
        padding: 0.75rem;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .statInfo .value {
        font-size: 1.75rem;
        font-weight: 700;
        color: var(--text-primary);
        line-height: 1.2;
    }
    .statInfo .label {
        font-size: 0.9rem;
        color: var(--text-secondary);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    /* Cores dos StatCards */
    .statCard.myRegisters .statIcon { background-color: rgba(187, 134, 252, 0.1); color: var(--accent-primary); }
    .statCard.total .statIcon { background-color: rgba(33, 150, 243, 0.1); color: var(--blue-color); }
    .statCard.pending .statIcon { background-color: rgba(255, 193, 7, 0.1); color: var(--pending-color); }
    .statCard.contacted .statIcon { background-color: rgba(76, 175, 80, 0.1); color: var(--success-color); }
    .statCard.error .statIcon { background-color: rgba(244, 67, 54, 0.1); color: var(--error-color); }
    .statCard.topRegistrar .statIcon { background-color: rgba(16, 185, 129, 0.1); color: var(--accent-secondary); }
    .statCard.male .statIcon { background-color: rgba(59, 130, 246, 0.1); color: #3b82f6; }
    .statCard.female .statIcon { background-color: rgba(236, 72, 153, 0.1); color: #ec4899; }


    /* --- BARRA DE FERRAMENTAS E FILTROS --- */
    .toolbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 1.5rem;
        margin-bottom: 2rem;
        padding: 1.5rem;
        background-color: var(--bg-card);
        border-radius: 12px;
        border: 1px solid var(--border-color);
    }
    .filters {
        display: flex;
        gap: 1rem;
        flex-wrap: wrap;
    }
    .searchContainer {
        position: relative;
    }
    .searchIcon {
        position: absolute;
        left: 1rem;
        top: 50%;
        transform: translateY(-50%);
        color: var(--text-secondary);
        font-size: 1.25rem;
    }
    .searchInput, .statusFilter {
        background-color: var(--input-bg);
        color: var(--text-primary);
        border: 1px solid var(--border-color);
        border-radius: 8px;
        padding: 0.75rem;
        font-size: 1rem;
        transition: border-color 0.2s, box-shadow 0.2s;
    }
    .searchInput {
        padding-left: 3rem;
        min-width: 250px;
    }
    .searchInput:focus, .statusFilter:focus {
        outline: none;
        border-color: var(--accent-primary);
        box-shadow: 0 0 0 3px rgba(187, 134, 252, 0.2);
    }
    .addButton {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1.5rem;
        background-color: var(--accent-primary);
        color: #fff;
        border: none;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
        text-decoration: none;
        transition: background-color 0.2s, transform 0.2s;
    }
    .addButton:hover {
        background-color: var(--accent-secondary);
        transform: translateY(-2px);
    }

    /* --- GRID DE VISITANTES --- */
    .visitorGrid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
        gap: 1.5rem;
    }
    .visitorCard {
        background-color: var(--bg-card);
        border-radius: 12px;
        border: 1px solid var(--border-color);
        padding: 1.5rem;
        display: flex;
        flex-direction: column;
        gap: 1rem;
        transition: transform 0.2s, box-shadow 0.2s;
        animation: fadeIn 0.3s ease-out forwards;
    }
    .visitorCard:hover {
        transform: translateY(-5px);
        box-shadow: 0 8px 20px var(--shadow-color);
    }
    .cardHeader {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
    }
    .visitorName {
        font-size: 1.2rem;
        font-weight: 600;
        margin: 0;
        color: var(--text-primary);
    }
    .statusSelect {
        font-size: 0.8rem;
        font-weight: 600;
        border-radius: 20px;
        padding: 0.3rem 0.8rem;
        border: 1px solid;
        appearance: none;
        -webkit-appearance: none;
        cursor: pointer;
        background-color: transparent;
    }
    .statusSelect.pendente { border-color: var(--pending-color); color: var(--pending-color); }
    .statusSelect.entrouemcontato { border-color: var(--success-color); color: var(--success-color); }
    .statusSelect.erronúmero { border-color: var(--error-color); color: var(--error-color); }

    .cardBody {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        color: var(--text-secondary);
    }
    .contactItem {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }
    .contactItem span:first-child { font-size: 1.1rem; }
    .contactItem a { color: var(--accent-primary); text-decoration: none; }
    .contactItem a:hover { text-decoration: underline; }

    .cardFooter {
        margin-top: auto;
        padding-top: 1rem;
        border-top: 1px solid var(--border-color);
        display: flex;
        justify-content: flex-end;
        gap: 0.5rem;
    }
    .actionButton {
        background: none;
        border: 1px solid var(--border-color);
        color: var(--text-secondary);
        width: 36px;
        height: 36px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        font-size: 1.1rem;
        transition: all 0.2s;
    }
    .actionButton:hover {
        color: var(--text-primary);
        border-color: var(--text-primary);
    }
    .whatsappButton:hover { color: #25d366; border-color: #25d366; }
    .editButton:hover { color: var(--blue-color); border-color: var(--blue-color); }
    .deleteButton:hover { color: var(--error-color); border-color: var(--error-color); }


    /* --- PAGINAÇÃO --- */
    .paginationControls {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 1rem;
        margin-top: 2.5rem;
        padding: 1rem;
    }
    .paginationControls button {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        background-color: var(--bg-card);
        color: var(--text-primary);
        border: 1px solid var(--border-color);
        padding: 0.6rem 1.2rem;
        border-radius: 8px;
        cursor: pointer;
        transition: background-color 0.2s, color 0.2s;
    }
    .paginationControls button:hover:not(:disabled) {
        background-color: var(--accent-primary);
        color: #fff;
    }
    .paginationControls button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
    .paginationControls span {
        color: var(--text-secondary);
        font-weight: 500;
    }

    /* --- MODAL DE EDIÇÃO E DELEÇÃO --- */
    .modalOverlay {
        position: fixed;
        inset: 0;
        background-color: rgba(0, 0, 0, 0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
        animation: fadeIn 0.3s;
    }
    .modalContent {
        background-color: var(--bg-card);
        padding: 2.5rem;
        border-radius: 16px;
        width: 90%;
        max-width: 600px;
        position: relative;
        box-shadow: 0 10px 30px rgba(0,0,0,0.2);
    }
    .closeModal {
        position: absolute;
        top: 1rem;
        right: 1rem;
        background: none;
        border: none;
        color: var(--text-secondary);
        font-size: 1.5rem;
        cursor: pointer;
    }
    .modalContent h2 { margin-bottom: 1rem; }
    .modalContent p { 
        color: var(--text-secondary);
        margin-bottom: 2rem;
        font-size: 1rem;
        line-height: 1.5;
    }
    .formGrid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1.5rem;
    }
    .formGroup {
        display: flex;
        flex-direction: column;
    }
    .formGroup label {
        font-size: 0.9rem;
        color: var(--text-secondary);
        margin-bottom: 0.5rem;
    }
    .formGroup input {
        background-color: var(--input-bg);
        color: var(--text-primary);
        border: 1px solid var(--border-color);
        border-radius: 8px;
        padding: 0.75rem 1rem;
        font-size: 1rem;
    }
    .modalActions {
        display: flex;
        justify-content: flex-end;
        gap: 1rem;
        margin-top: 2rem;
        padding-top: 1.5rem;
        border-top: 1px solid var(--border-color);
    }
    .saveButton, .cancelButton, .confirmDeleteButton {
        padding: 0.75rem 1.5rem;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
        border: none;
    }
    .saveButton {
        background-color: var(--accent-primary);
        color: #fff;
    }
    .cancelButton {
        background-color: var(--border-color);
        color: var(--text-primary);
    }
    .confirmDeleteButton {
        background-color: var(--error-color);
        color: #fff;
    }

    /* --- ESTADOS VAZIOS E SKELETON --- */
    .emptyState {
        grid-column: 1 / -1;
        text-align: center;
        padding: 4rem;
        color: var(--text-secondary);
        background-color: var(--bg-card);
        border-radius: 12px;
        border: 2px dashed var(--border-color);
    }
    .skeletonCard {
        background-color: var(--bg-card);
        border-radius: 12px;
        padding: 1.5rem;
        border: 1px solid var(--border-color);
    }
    .skeletonText {
        background-color: var(--input-bg);
        border-radius: 4px;
        margin-bottom: 0.75rem;
        animation: shimmer 1.5s infinite linear;
        background: linear-gradient(to right, var(--input-bg) 8%, var(--border-color) 18%, var(--input-bg) 33%);
        background-size: 800px 104px;
    }
    @keyframes shimmer {
        0% { background-position: -468px 0; }
        100% { background-position: 468px 0; }
    }

    /* --- RESPONSIVIDADE --- */
    @media (max-width: 768px) {
        .dashboard { padding: 1rem; }
        .statsGrid { grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); }
        .toolbar { flex-direction: column; align-items: stretch; }
        .formGrid { grid-template-columns: 1fr; }
    }
`;


// --- COMPONENTES INTERNOS DE UI ---

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
    const [deletingVisitor, setDeletingVisitor] = useState(null); // NOVO: Estado para o modal de exclusão
    // REMOVIDO: const navigate = useNavigate();

    // Efeito para injetar os estilos na página
    useEffect(() => {
        const styleElement = document.createElement('style');
        styleElement.id = 'secretaria-styles';
        styleElement.innerHTML = ComponentStyles;
        document.head.appendChild(styleElement);

        return () => {
            const style = document.getElementById('secretaria-styles');
            if (style) {
                document.head.removeChild(style);
            }
        };
    }, []);

    const fetchData = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/visitantes`, { headers: { 'Authorization': `Bearer ${token}` } });
            const dataWithId = res.data.map(v => ({...v, id: v._id}));
            setVisitantes(Array.isArray(dataWithId) ? dataWithId : []);
        } catch (err) {
            console.error('Erro ao buscar visitantes:', err);
            toast.error('Sessão expirada ou erro de rede.');
            if (err.response?.status === 401 || err.response?.status === 403) {
                console.error("Redirecionamento para login necessário.");
                // navigate('/'); // REMOVIDO
            }
        }
    }, []); // REMOVIDO: navigate da dependência

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

    // NOVO: Função para confirmar e executar a exclusão
    const confirmDelete = useCallback(async () => {
        if (!deletingVisitor) return;

        const originalVisitantes = [...visitantes];
        const visitorToDelete = deletingVisitor;
        
        setVisitantes(prev => prev.filter(v => v.id !== visitorToDelete.id));
        setDeletingVisitor(null); // Fecha o modal
        
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/visitantes/${visitorToDelete.id}`, { headers: { 'Authorization': `Bearer ${token}` }});
            toast.success('Excluído com sucesso!');
        } catch {
            toast.error('Erro ao excluir.');
            setVisitantes(originalVisitantes);
        }
    }, [deletingVisitor, visitantes]);

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
                    {/* ALTERADO: Link para tag 'a' */}
                    <a href="/cadastrar-visitante" className="addButton"><span>+</span> Novo Visitante</a>
                </div>

                <div className="content">
                    {loading ? <VisitorGridSkeleton /> : 
                        <>
                            <div className="visitorGrid">
                                {paginatedVisitors.map(v => (
                                    v && v.id && <VisitorCard key={v.id} visitante={v} onEdit={setEditingVisitor} onDelete={setDeletingVisitor} onStatusChange={handleStatusChange} />
                                ))}
                            </div>
                            {paginatedVisitors.length === 0 && !loading && <div className="emptyState"><p>Nenhum visitante encontrado para os filtros selecionados.</p></div>}
                            <PaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                        </>
                    }
                </div>
            </main>

            {/* Modal de Edição */}
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
            
            {/* NOVO: Modal de Confirmação de Exclusão */}
            {deletingVisitor && (
                <div className="modalOverlay">
                    <div className="modalContent" onClick={e => e.stopPropagation()}>
                         <button className="closeModal" onClick={() => setDeletingVisitor(null)}>X</button>
                        <h2>Confirmar Exclusão</h2>
                        <p>Você tem certeza que deseja excluir <strong>{deletingVisitor.nome}</strong>? Esta ação não pode ser desfeita.</p>
                        <div className="modalActions">
                            <button type="button" onClick={() => setDeletingVisitor(null)} className="cancelButton">Cancelar</button>
                            <button onClick={confirmDelete} className="confirmDeleteButton">Excluir</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
