// src/Pages/Secretaria.jsx

import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate, Link } from 'react-router-dom';
import { FiEdit, FiTrash2, FiPhone, FiMail, FiPlus, FiX, FiCalendar, FiCheck, FiClock, FiAlertCircle, FiSearch } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import Header from '../Components/Header';
import styles from './styles/Secretaria.module.css';

const API_URL = 'https://mava-connect-backend.onrender.com';

// --- MENSAGEM PADRÃO DO WHATSAPP ---
const WHATSAPP_MESSAGE = `Olá, tudo bem?

Seja muito bem-vindo(a) à MAVA. Foi uma honra contar com sua presença em nosso culto.

Queremos saber como foi sua experiência conosco. É sempre uma alegria receber pessoas que buscam crescer espiritualmente e viver em comunhão.

Caso não consiga participar presencialmente, estamos disponíveis também pelas redes sociais:
YouTube e Instagram: @IgrejaMava

“Grandes coisas fez o Senhor por nós, e por isso estamos alegres.”
— Salmos 126:3

Esperamos revê-lo(a) em breve. Que Deus continue abençoando sua vida.

Atenciosamente,
Secretaria MAVA`;


// --- COMPONENTES AUXILIARES PARA DEIXAR O CÓDIGO LIMPO ---

// Componente para o Badge de Status
const StatusBadge = ({ status }) => {
  const statusInfo = useMemo(() => {
    switch (status) {
      case 'entrou em contato':
        return { icon: <FiCheck />, label: 'Contatado', className: styles.statusContacted };
      case 'pendente':
        return { icon: <FiClock />, label: 'Pendente', className: styles.statusPending };
      case 'erro número':
        return { icon: <FiAlertCircle />, label: 'Número Inválido', className: styles.statusError };
      default:
        return { icon: null, label: status, className: styles.statusDefault };
    }
  }, [status]);

  return (
    <div className={`${styles.statusBadge} ${statusInfo.className}`}>
      {statusInfo.icon}
      <span>{statusInfo.label}</span>
    </div>
  );
};

// Componente do Card de Visitante
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
          <div className={styles.contactItem}>
            <FiPhone />
            <span>{visitante.telefone}</span>
          </div>
        )}
        {visitante.email && (
          <div className={styles.contactItem}>
            <FiMail />
            <a href={`mailto:${visitante.email}`}>{visitante.email}</a>
          </div>
        )}
        <div className={styles.contactItem}>
          <FiCalendar />
          <span>Visitou em: {new Date(visitante.data_visita).toLocaleDateString('pt-BR')}</span>
        </div>
      </div>

      <div className={styles.cardFooter}>
        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className={`${styles.actionButton} ${styles.whatsappButton}`} title="Enviar mensagem no WhatsApp">
          <FaWhatsapp />
        </a>
        <button onClick={() => onEdit(visitante)} className={`${styles.actionButton} ${styles.editButton}`} title="Editar Visitante">
          <FiEdit />
        </button>
        <button onClick={() => onDelete(visitante.id)} className={`${styles.actionButton} ${styles.deleteButton}`} title="Remover Visitante">
          <FiTrash2 />
        </button>
      </div>
    </div>
  );
};


// --- COMPONENTE PRINCIPAL DA PÁGINA ---

function Secretaria() {
  const [visitantes, setVisitantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const navigate = useNavigate();
  const [editingVisitor, setEditingVisitor] = useState(null);

  // Lógica para buscar dados
  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/visitantes`, { headers: { 'Authorization': `Bearer ${token}` } });
      setVisitantes(res.data);
    } catch (err) {
      toast.error('Erro ao buscar visitantes.');
      if (err.response?.status === 401) {
        navigate('/');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Lógica de filtro combinada
  const filteredVisitantes = useMemo(() => {
    return visitantes.filter(visitante => {
      const matchesSearch = searchTerm
        ? visitante.nome.toLowerCase().includes(searchTerm.toLowerCase())
        : true;
      const matchesStatus = statusFilter === 'todos'
        ? true
        : visitante.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [searchTerm, statusFilter, visitantes]);

  // Lógica para o modal de edição
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
        <div className={styles.dashboardHeader}>
          <h1>Painel de Visitantes</h1>
          <div className={styles.actionsHeader}>
            <div className={styles.searchContainer}>
              <FiSearch className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Buscar por nome..."
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
            <Link to="/cadastrar-visitante" className={styles.addButton}>
              <FiPlus /> Novo Visitante
            </Link>
          </div>
        </div>

        <div className={styles.content}>
          {loading ? (
            <p>Carregando...</p>
          ) : filteredVisitantes.length === 0 ? (
            <div className={styles.emptyState}>
              <p>Nenhum visitante encontrado.</p>
            </div>
          ) : (
            <div className={styles.visitorsGrid}>
              {filteredVisitantes.map(visitante => (
                <VisitorCard
                  key={visitante.id}
                  visitante={visitante}
                  onEdit={setEditingVisitor}
                  onDelete={() => { /* Implementar lógica de delete */ }}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modal de Edição (simplificado para focar na página principal) */}
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
                            <option value="entrou em contato">Entrou em contato</option>
                            <option value="erro número">Número inválido</option>
                        </select>
                    </div>
                    <div className={styles.modalActions}>
                        <button type="button" onClick={() => setEditingVisitor(null)} className={styles.cancelButton}>Cancelar</button>
                        <button type="submit" className={styles.saveButton}>Salvar</button>
                    </div>
                </form>
            </div>
         </div>
      )}
    </div>
  );
}

export default Secretaria;