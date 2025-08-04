import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate, Link } from 'react-router-dom';
import { 
    MdPhone, MdOutlineMail, MdAdd, MdClose, 
    MdCalendarToday, MdCheck, MdOutlineAccessTime, MdErrorOutline, 
    MdSearch, MdGroups, MdThumbUp, MdEmojiEvents, MdWhatsapp,
    MdPerson, MdMale, MdFemale 
} from 'react-icons/md';
import { HiPencil, HiOutlineTrash } from 'react-icons/hi';
import Header from '../Components/Header';
import styles from './style/Secretaria.module.css';

const API_URL = 'https://mava-connect-backend.onrender.com';
const WHATSAPP_MESSAGE = `Olá, tudo bem?\n\nSeja muito bem-vindo(a) à MAVA...\n\nAtenciosamente,\nSecretaria MAVA`;

// --- Componentes Internos ---

const StatCard = ({ icon, label, value, colorClass }) => (
    <div className={styles.statCard}>
        <div className={`${styles.statIcon} ${styles[colorClass]}`}>{icon}</div>
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

    const visitDate = visitante?.data_visita ? new Date(visitante.data_visita).toLocaleDateString('pt-BR') : 'N/A';
    
    return (
        <div className={styles.visitorRow}>
            <div className={`${styles.visitorCell} ${styles.visitorInfo}`}>
                <span className={styles.visitorName}>{visitante.nome || 'Nome não informado'}</span>
                <span className={styles.visitorEvent}>{visitante.evento || 'Origem não informada'}</span>
            </div>
            <div className={`${styles.visitorCell} ${styles.visitorContact}`}>
                <span><MdPhone /> {visitante.telefone || 'N/A'}</span>
                <span><MdOutlineMail /> {visitante.email || 'N/A'}</span>
            </div>
            <div className={`${styles.visitorCell} ${styles.visitorDate}`}>
                <MdCalendarToday /> {visitDate}
            </div>
            <div className={`${styles.visitorCell} ${styles.visitorStatus}`}>
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
            <div className={`${styles.visitorCell} ${styles.visitorActions}`}>
                {whatsappUrl && (
                    <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className={`${styles.actionButton} ${styles.whatsappButton}`} title="Enviar WhatsApp">
                        <MdWhatsapp />
                    </a>
                )}
                <button onClick={() => onEdit(visitante)} className={`${styles.actionButton} ${styles.editButton}`} title="Editar"><HiPencil /></button>
                <button onClick={() => onDelete(visitante.id)} className={`${styles.actionButton} ${styles.deleteButton}`} title="Excluir"><HiOutlineTrash /></button>
            </div>
        </div>
    );
};

// --- Componente Principal ---
function Secretaria() {
    const [visitantes, setVisitantes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('todos');
    const [editingVisitor, setEditingVisitor] = useState(null);
    const navigate = useNavigate();

    const fetchData = async () => { /* ...Lógica sem alterações... */ };
    useEffect(() => { fetchData(); }, [navigate]);
    const stats = useMemo(() => { /* ...Lógica sem alterações... */ }, [visitantes]);
    const filteredVisitantes = useMemo(() => { /* ...Lógica sem alterações... */ }, [searchTerm, statusFilter, visitantes]);
    const handleStatusChange = async (id, status) => { /* ...Lógica sem alterações... */ };
    const handleDelete = (id) => { /* ...Lógica sem alterações... */ };
    const handleUpdateVisitor = (e) => { /* ...Lógica sem alterações... */ };
    const handleModalChange = (e) => { /* ...Lógica sem alterações... */ };

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
                    <StatCard icon={<MdMale />} label="Visitantes Homens" value={stats.male} colorClass="male" />
                    <StatCard icon={<MdFemale />} label="Visitantes Mulheres" value={stats.female} colorClass="female" />
                </div>
                
                <div className={styles.contentContainer}>
                    <div className={styles.toolbar}>
                        <div className={styles.filters}>
                            <div className={styles.searchContainer}>
                                <MdSearch className={styles.searchIcon} />
                                <input type="text" placeholder="Buscar por nome, email ou telefone..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={styles.searchInput} />
                            </div>
                            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={styles.statusFilter}>
                                <option value="todos">Todos os Status</option>
                                <option value="pendente">Pendente</option>
                                <option value="entrou em contato">Contatado</option>
                                <option value="erro número">Número Inválido</option>
                            </select>
                        </div>
                        <Link to="/cadastrar-visitante" className={styles.addButton}><MdAdd /> Novo Visitante</Link>
                    </div>

                    <div className={styles.visitorList}>
                        <div className={styles.gridHeader}>
                            <div className={styles.headerCell}>Visitante</div>
                            <div className={styles.headerCell}>Contato</div>
                            <div className={styles.headerCell}>Data da Visita</div>
                            <div className={styles.headerCell}>Status</div>
                            <div className={styles.headerCell}>Ações</div>
                        </div>
                        {loading ? (
                            <div className={styles.loadingContainer}><div className={styles.spinner}></div></div>
                        ) : (
                            filteredVisitantes.length > 0 ? (
                                filteredVisitantes.map(v => v && v.id ? <VisitorCard key={v.id} visitante={v} onEdit={setEditingVisitor} onDelete={handleDelete} onStatusChange={handleStatusChange} /> : null)
                            ) : (
                                <div className={styles.emptyState}><p>Nenhum visitante encontrado.</p></div>
                            )
                        )}
                    </div>
                </div>
            </main>
            {editingVisitor && (
                <div className={styles.modalOverlay} onClick={() => setEditingVisitor(null)}>
                    {/* ... O seu modal continua igual ... */}
                </div>
            )}
        </div>
    );
}

export default Secretaria;