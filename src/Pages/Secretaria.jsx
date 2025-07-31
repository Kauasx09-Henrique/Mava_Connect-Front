// src/Pages/Secretaria.jsx
import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate, Link } from 'react-router-dom';
import { FiEdit, FiTrash2, FiPhone, FiMail, FiPlus, FiX, FiCalendar, FiCheck, FiClock, FiAlertCircle, FiSearch, FiUsers, FiThumbsUp } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import Header from '../Components/Header';
import styles from './style/Secretaria.module.css';

const API_URL = 'https://mava-connect-backend.onrender.com';
const WHATSAPP_MESSAGE = `Olá, tudo bem? Seja muito bem-vindo(a) à MAVA. Foi uma honra contar com sua presença em nosso culto. Queremos saber como foi sua experiência conosco. É sempre uma alegria receber pessoas que buscam crescer espiritualmente e viver em comunhão. Caso não consiga participar presencialmente, estamos disponíveis também pelas redes sociais: YouTube e Instagram: @IgrejaMava. “Grandes coisas fez o Senhor por nós, e por isso estamos alegres.” — Salmos 126:3. Esperamos revê-lo(a) em breve. Que Deus continue abençoando sua vida. Atenciosamente, Secretaria MAVA`;

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

// --- ADICIONADO: Código completo do StatusBadge ---
const StatusBadge = ({ status }) => {
    const statusInfo = useMemo(() => {
        switch (status) {
            case 'entrou em contato':
                return { label: 'Contatado', className: styles.statusContacted };
            case 'pendente':
                return { label: 'Pendente', className: styles.statusPending };
            case 'erro número':
                return { label: 'Erro no Número', className: styles.statusError };
            default:
                return { label: status, className: styles.statusDefault };
        }
    }, [status]);

    return (
        <div className={`${styles.statusBadge} ${statusInfo.className}`}>
            <span>{statusInfo.label}</span>
        </div>
    );
};

// --- ADICIONADO: Código completo do VisitorCard com a data de visita ---
const VisitorCard = ({ visitante, onEdit, onDelete }) => {
    const whatsappUrl = useMemo(() => {
        if (!visitante.telefone) return null;
        const cleanPhone = visitante.telefone.replace(/\D/g, '');
        const encodedMessage = encodeURIComponent(WHATSAPP_MESSAGE);
        return `https://wa.me/55${cleanPhone}?text=${encodedMessage}`;
    }, [visitante.telefone]);

    return (
        <div className={styles.visitorCard}>
            <div className={styles.cardHeader}>
                <h3 className={styles.visitorName}>{visitante.nome}</h3>
                <StatusBadge status={visitante.status} />
            </div>
            <div className={styles.cardBody}>
                {visitante.telefone && (
                    <div className={styles.contactItem}><FiPhone /><span>{visitante.telefone}</span></div>
                )}
                {visitante.email && (
                    <div className={styles.contactItem}><FiMail /><a href={`mailto:${visitante.email}`}>{visitante.email}</a></div>
                )}
                {/* AQUI ESTÁ A DATA DE CADASTRO/VISITA */}
                <div className={styles.contactItem}>
                    <FiCalendar />
                    <span>Visitou em: {new Date(visitante.data_visita).toLocaleDateString('pt-BR')}</span>
                </div>
            </div>
            <div className={styles.cardFooter}>
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className={`${styles.actionButton} ${styles.whatsappButton}`} title="Enviar WhatsApp">
                    <FaWhatsapp />
                </a>
                <button onClick={() => onEdit(visitante)} className={`${styles.actionButton} ${styles.editButton}`} title="Editar">
                    <FiEdit />
                </button>
                <button onClick={() => onDelete(visitante.id)} className={`${styles.actionButton} ${styles.deleteButton}`} title="Excluir">
                    <FiTrash2 />
                </button>
            </div>
        </div>
    );
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

  useEffect(() => {
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

  // --- ADICIONADO: Lógica completa para Deletar e Atualizar ---
  const handleDelete = (id) => {
    toast((t) => (
        <div>
            <p><strong>Confirmar exclusão?</strong></p>
            <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                <button
                    className={styles.toastConfirmButton}
                    onClick={() => {
                        toast.dismiss(t.id);
                        const token = localStorage.getItem('token');
                        const promise = axios.delete(`${API_URL}/visitantes/${id}`, { headers: { 'Authorization': `Bearer ${token}` } });
                        toast.promise(promise, {
                            loading: 'Excluindo...',
                            success: () => {
                                fetchData();
                                return 'Excluído com sucesso!';
                            },
                            error: 'Erro ao excluir.'
                        });
                    }}
                >
                    Excluir
                </button>
                <button className={styles.toastCancelButton} onClick={() => toast.dismiss(t.id)}>Cancelar</button>
            </div>
        </div>
    ));
  };
  
  const handleUpdateVisitor = (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const promise = axios.put(`${API_URL}/visitantes/${editingVisitor.id}`, editingVisitor, { headers: { 'Authorization': `Bearer ${token}` } });

    toast.promise(promise, {
        loading: 'Atualizando...',
        success: () => {
            fetchData();
            setEditingVisitor(null);
            return 'Visitante atualizado!';
        },
        error: 'Erro ao atualizar.'
    });
  };


  return (
    <div className={styles.pageContainer}>
      <Header />
      <main className={styles.dashboard}>
        <div className={styles.statsRow}>
          <StatCard icon={<FiUsers />} label="Total de Visitantes" value={stats.total} colorClass="total" />
          <StatCard icon={<FiClock />} label="Contatos Pendentes" value={stats.pending} colorClass="pending" />
          <StatCard icon={<FiThumbsUp />} label="Contatados" value={stats.contacted} colorClass="contacted" />
          <StatCard icon={<FiAlertCircle />} label="Números com Erro" value={stats.error} colorClass="error" />
        </div>

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

        <div className={styles.content}>
          {loading ? (
            <div className={styles.loadingContainer}><div className={styles.spinner}></div></div>
          ) : (
            <VisitorGrid visitantes={filteredVisitantes} onEdit={setEditingVisitor} onDelete={handleDelete} />
          )}
        </div>
      </main>

      {/* --- ADICIONADO: Código completo do Modal --- */}
      {editingVisitor && (
        <div className={styles.modalOverlay} onClick={() => setEditingVisitor(null)}>
           <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                <button className={styles.closeModal} onClick={() => setEditingVisitor(null)}><FiX /></button>
                <form onSubmit={handleUpdateVisitor}>
                    <h2>Editando: {editingVisitor.nome}</h2>
                    <div className={styles.formGroup}>
                        <label>Nome Completo</label>
                        <input value={editingVisitor.nome} onChange={e => setEditingVisitor({...editingVisitor, nome: e.target.value})} />
                    </div>
                    <div className={styles.formGroup}>
                        <label>Status</label>
                        <select value={editingVisitor.status} onChange={e => setEditingVisitor({...editingVisitor, status: e.target.value})}>
                            <option value="pendente">Pendente</option>
                            <option value="entrou em contato">Contatado</option>
                            <option value="erro número">Erro no Número</option>
                        </select>
                    </div>
                    {/* Adicione outros campos de edição aqui se precisar */}
                    <div className={styles.modalActions}>
                        <button type="button" onClick={() => setEditingVisitor(null)} className={styles.cancelButton}>Cancelar</button>
                        <button type="submit" className={styles.saveButton}>Salvar Alterações</button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
}

export default Secretaria;
