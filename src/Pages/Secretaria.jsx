// src/Pages/Secretaria.jsx
import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate, Link } from 'react-router-dom';
import { FiEdit, FiTrash2, FiPhone, FiMail, FiPlus, FiX, FiCalendar, FiCheck, FiClock, FiAlertCircle, FiSearch, FiUsers, FiThumbsUp } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import Header from '../Components/Header';
import styles from './styles/Secretaria.module.css';

const API_URL = 'https://mava-connect-backend.onrender.com';
const WHATSAPP_MESSAGE = `Olá, tudo bem? ... Atenciosamente, Secretaria MAVA`; // Mensagem completa aqui

// --- COMPONENTES INTERNOS PARA UM CÓDIGO MAIS LIMPO ---

const StatCard = ({ icon, label, value, colorClass }) => (
  <div className={styles.statCard}>
    <div className={`${styles.statIcon} ${styles[colorClass]}`}>{icon}</div>
    <div className={styles.statInfo}>
      <p className={styles.label}>{label}</p>
      <p className={styles.value}>{value}</p>
    </div>
  </div>
);

const StatusBadge = ({ status }) => {
    // ... (código do StatusBadge sem alterações)
};

const VisitorCard = ({ visitante, onEdit, onDelete }) => {
    // ... (código do VisitorCard sem alterações)
};

const VisitorGrid = ({ visitantes, onEdit, onDelete }) => {
  if (visitantes.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>Nenhum visitante encontrado com os filtros atuais.</p>
      </div>
    );
  }
  return (
    <div className={styles.visitorGrid}>
      {visitantes.map(visitante => (
        <VisitorCard key={visitante.id} visitante={visitante} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </div>
  );
};


// --- COMPONENTE PRINCIPAL DA PÁGINA ---

function Secretaria() {
  const [visitantes, setVisitantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [editingVisitor, setEditingVisitor] = useState(null);
  const navigate = useNavigate();

  // Busca de dados
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API_URL}/visitantes`, { headers: { 'Authorization': `Bearer ${token}` } });
        setVisitantes(res.data);
      } catch (err) {
        toast.error('Erro ao buscar visitantes.');
        if (err.response?.status === 401) navigate('/');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  // Cálculos para os cards de estatísticas
  const stats = useMemo(() => {
    return {
      total: visitantes.length,
      pending: visitantes.filter(v => v.status === 'pendente').length,
      contacted: visitantes.filter(v => v.status === 'entrou em contato').length,
      error: visitantes.filter(v => v.status === 'erro número').length,
    };
  }, [visitantes]);

  // Filtragem dos visitantes para a lista
  const filteredVisitantes = useMemo(() => {
    return visitantes.filter(v => {
      const matchesSearch = v.nome.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'todos' || v.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [searchTerm, statusFilter, visitantes]);

  const handleDelete = (id) => {
    // ... (sua função de delete com confirmação aqui)
  };
  
  const handleUpdateVisitor = (e) => {
    // ... (sua função de update aqui)
  };


  return (
    <div className={styles.pageContainer}>
      <Header />
      <main className={styles.dashboard}>
        {/* --- NOVO: LINHA DE ESTATÍSTICAS --- */}
        <div className={styles.statsRow}>
          <StatCard icon={<FiUsers />} label="Total de Visitantes" value={stats.total} colorClass="total" />
          <StatCard icon={<FiClock />} label="Contatos Pendentes" value={stats.pending} colorClass="pending" />
          <StatCard icon={<FiThumbsUp />} label="Contatados" value={stats.contacted} colorClass="contacted" />
          <StatCard icon={<FiAlertCircle />} label="Números com Erro" value={stats.error} colorClass="error" />
        </div>

        {/* --- MELHORADO: TOOLBAR DE AÇÕES --- */}
        <div className={styles.toolbar}>
          <div className={styles.filters}>
            <div className={styles.searchContainer}>
              <FiSearch className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Buscar por nome do visitante..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.searchInput}
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={styles.statusFilter}
            >
              <option value="todos">Todos os Status</option>
              <option value="pendente">Pendente</option>
              <option value="entrou em contato">Contatado</option>
              <option value="erro número">Número Inválido</option>
            </select>
          </div>
          <Link to="/cadastrar-visitante" className={styles.addButton}>
            <FiPlus /> Novo Visitante
          </Link>
        </div>

        {/* --- ÁREA DE CONTEÚDO PRINCIPAL --- */}
        <div className={styles.content}>
          {loading ? (
            <div className={styles.loadingContainer}><div className={styles.spinner}></div></div>
          ) : (
            <VisitorGrid visitantes={filteredVisitantes} onEdit={setEditingVisitor} onDelete={handleDelete} />
          )}
        </div>
      </main>

      {/* --- MODAL DE EDIÇÃO --- */}
      {editingVisitor && (
        <div className={styles.modalOverlay} onClick={() => setEditingVisitor(null)}>
           {/* ... (seu código do modal aqui, ele funcionará com o novo CSS) ... */}
        </div>
      )}
    </div>
  );
}

export default Secretaria;