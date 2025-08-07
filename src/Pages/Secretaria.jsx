import { useState, useEffect, useMemo, useCallback } from 'react';
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

// Constantes de configuração
const API_URL = 'https://mava-connect-backend.onrender.com';
const WHATSAPP_MESSAGE = `Olá, tudo bem?\n\nSeja muito bem-vindo(a) à MAVA. Foi uma honra contar com sua presença em nosso culto.\n\nAtenciosamente,\nSecretaria MAVA`;
const STATUS_OPTIONS = [
  { value: 'todos', label: 'Todos os Status' },
  { value: 'pendente', label: 'Pendente' },
  { value: 'entrou em contato', label: 'Contatado' },
  { value: 'erro número', label: 'Número Inválido' }
];

/**
 * Componente de Card de Estatística
 */
const StatCard = ({ icon, label, value, colorClass }) => (
  <div className={`${styles.statCard} ${styles[colorClass]}`}>
    <div className={styles.statIcon}>{icon}</div>
    <div className={styles.statInfo}>
      <p className={styles.value}>{value}</p>
      <p className={styles.label}>{label}</p>
    </div>
  </div>
);

/**
 * Componente de Card de Visitante
 */
const VisitorCard = ({ visitante, onEdit, onDelete, onStatusChange }) => {
  const whatsappUrl = useMemo(() => {
    if (!visitante?.telefone) return null;
    const cleanPhone = visitante.telefone.replace(/\D/g, '');
    return `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;
  }, [visitante?.telefone]);

  const visitDate = useMemo(() => {
    return visitante?.data_visita 
      ? new Date(visitante.data_visita).toLocaleDateString('pt-BR') 
      : 'N/A';
  }, [visitante?.data_visita]);

  const formatEventName = useCallback((event) => {
    if (!event) return 'N/A';
    const formatted = event.charAt(0).toUpperCase() + event.slice(1);
    return formatted === 'Gf' ? 'GF' : formatted;
  }, []);

  return (
    <div className={styles.visitorCard}>
      <div className={styles.cardHeader}>
        <h3 className={styles.visitorName}>
          {visitante.nome || 'Nome não informado'}
        </h3>
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
        {visitante.telefone && (
          <div className={styles.contactItem}>
            <MdPhone />
            <span>{visitante.telefone}</span>
          </div>
        )}
        
        {visitante.email && (
          <div className={styles.contactItem}>
            <MdOutlineMail />
            <a href={`mailto:${visitante.email}`}>{visitante.email}</a>
          </div>
        )}
        
        <div className={styles.contactItem}>
          <MdCalendarToday />
          <span>Visitou em: {visitDate}</span>
        </div>
        
        {visitante.evento && (
          <div className={styles.contactItem}>
            <MdEmojiEvents />
            <span>Origem: {formatEventName(visitante.evento)}</span>
          </div>
        )}
      </div>
      
      <div className={styles.cardFooter}>
        {whatsappUrl && (
          <a 
            href={whatsappUrl} 
            target="_blank" 
            rel="noopener noreferrer" 
            className={`${styles.actionButton} ${styles.whatsappButton}`} 
            title="Enviar WhatsApp"
          >
            <MdWhatsapp />
          </a>
        )}
        <button 
          onClick={() => onEdit(visitante)} 
          className={`${styles.actionButton} ${styles.editButton}`} 
          title="Editar"
        >
          <HiPencil />
        </button>
        <button 
          onClick={() => onDelete(visitante.id)} 
          className={`${styles.actionButton} ${styles.deleteButton}`} 
          title="Excluir"
        >
          <HiOutlineTrash />
        </button>
      </div>
    </div>
  );
};

/**
 * Componente de Grid de Visitantes
 */
const VisitorGrid = ({ visitantes, onEdit, onDelete, onStatusChange }) => {
  if (!visitantes || visitantes.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>Nenhum visitante encontrado para os filtros selecionados.</p>
      </div>
    );
  }

  return (
    <div className={styles.visitorGrid}>
      {visitantes.map(v => 
        v && v.id && (
          <VisitorCard 
            key={v.id} 
            visitante={v} 
            onEdit={onEdit} 
            onDelete={onDelete}
            onStatusChange={onStatusChange} 
          />
        )
      )}
    </div>
  );
};

/**
 * Componente Principal da Página
 */
function Secretaria() {
  const [visitantes, setVisitantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [editingVisitor, setEditingVisitor] = useState(null);
  const navigate = useNavigate();

  // Função para buscar dados dos visitantes
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/visitantes`, { 
        headers: { 'Authorization': `Bearer ${token}` } 
      });
      setVisitantes(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Erro ao buscar visitantes:', err);
      toast.error('Erro ao buscar visitantes.');
      if (err.response?.status === 401 || err.response?.status === 403) {
        navigate('/');
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => { 
    fetchData(); 
  }, [fetchData]);

  // Estatísticas calculadas
  const stats = useMemo(() => {
    const loggedInUserId = localStorage.getItem('usuario_id');
    return {
      total: visitantes.length,
      pending: visitantes.filter(v => v.status === 'pendente').length,
      contacted: visitantes.filter(v => v.status === 'entrou em contato').length,
      error: visitantes.filter(v => v.status === 'erro número').length,
      myRegisters: loggedInUserId 
        ? visitantes.filter(v => v.usuario_id === parseInt(loggedInUserId, 10)).length 
        : 0,
      male: visitantes.filter(v => v.sexo === 'Masculino').length,
      female: visitantes.filter(v => v.sexo === 'Feminino').length,
    };
  }, [visitantes]);

  // Visitantes filtrados
  const filteredVisitantes = useMemo(() => {
    return visitantes.filter(v => {
      if (!v) return false;
      
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchLower || 
        (v.nome && v.nome.toLowerCase().includes(searchLower)) ||
        (v.email && v.email.toLowerCase().includes(searchLower)) ||
        (v.telefone && v.telefone.includes(searchTerm));
      
      const matchesStatus = statusFilter === 'todos' || v.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [searchTerm, statusFilter, visitantes]);

  // Manipulador de mudança de status
  const handleStatusChange = useCallback(async (id, status) => {
    const token = localStorage.getItem('token');
    const promise = axios.patch(
      `${API_URL}/visitantes/${id}/status`, 
      { status }, 
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    
    toast.promise(promise, {
      loading: 'Alterando status...',
      success: () => { 
        fetchData(); 
        return 'Status alterado!'; 
      },
      error: 'Erro ao alterar status.'
    });
  }, [fetchData]);

  // Manipulador de exclusão
  const handleDelete = useCallback((id) => {
    toast((t) => (
      <div>
        <p><strong>Confirmar exclusão?</strong></p>
        <div className={styles.toastActions}>
          <button 
            className={styles.toastConfirmButton} 
            onClick={() => {
              toast.dismiss(t.id);
              const token = localStorage.getItem('token');
              const promise = axios.delete(
                `${API_URL}/visitantes/${id}`, 
                { headers: { 'Authorization': `Bearer ${token}` } }
              );
              
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
          <button 
            className={styles.toastCancelButton} 
            onClick={() => toast.dismiss(t.id)}
          >
            Cancelar
          </button>
        </div>
      </div>
    ));
  }, [fetchData]);

  // Manipulador de atualização do visitante
  const handleUpdateVisitor = useCallback(async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const promise = axios.put(
      `${API_URL}/visitantes/${editingVisitor.id}`, 
      editingVisitor, 
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    
    toast.promise(promise, {
      loading: 'Atualizando...',
      success: () => {
        fetchData();
        setEditingVisitor(null);
        return 'Visitante atualizado!';
      },
      error: 'Erro ao atualizar.'
    });
  }, [editingVisitor, fetchData]);

  // Manipulador de mudança no modal
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

        {/* Estatísticas */}
        <div className={styles.statsGrid}>
          <StatCard 
            icon={<MdPerson />} 
            label="Meus Cadastros" 
            value={stats.myRegisters} 
            colorClass="myRegisters" 
          />
          <StatCard 
            icon={<MdGroups />} 
            label="Total de Visitantes" 
            value={stats.total} 
            colorClass="total" 
          />
          <StatCard 
            icon={<MdOutlineAccessTime />} 
            label="Contatos Pendentes" 
            value={stats.pending} 
            colorClass="pending" 
          />
          <StatCard 
            icon={<MdThumbUp />} 
            label="Contatados" 
            value={stats.contacted} 
            colorClass="contacted" 
          />
          <StatCard 
            icon={<MdErrorOutline />} 
            label="Números com Erro" 
            value={stats.error} 
            colorClass="error" 
          />
          <StatCard 
            icon={<MdMale />} 
            label="Visitantes Homens" 
            value={stats.male} 
            colorClass="male" 
          />
          <StatCard 
            icon={<MdFemale />} 
            label="Visitantes Mulheres" 
            value={stats.female} 
            colorClass="female" 
          />
        </div>
        
        {/* Barra de ferramentas */}
        <div className={styles.toolbar}>
          <div className={styles.filters}>
            <div className={styles.searchContainer}>
              <MdSearch className={styles.searchIcon} />
              <input 
                type="text" 
                placeholder="Buscar por nome, email ou telefone..." 
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
              {STATUS_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          <Link to="/cadastrar-visitante" className={styles.addButton}>
            <MdAdd /> Novo Visitante
          </Link>
        </div>

        {/* Conteúdo principal */}
        <div className={styles.content}>
          {loading ? (
            <div className={styles.loadingContainer}>
              <div className={styles.spinner}></div>
            </div>
          ) : (
            <VisitorGrid 
              visitantes={filteredVisitantes} 
              onEdit={setEditingVisitor} 
              onDelete={handleDelete}
              onStatusChange={handleStatusChange} 
            />
          )}
        </div>
      </main>

      {/* Modal de edição */}
      {editingVisitor && (
        <div className={styles.modalOverlay} onClick={() => setEditingVisitor(null)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <button 
              className={styles.closeModal} 
              onClick={() => setEditingVisitor(null)}
            >
              <MdClose />
            </button>
            
            <form onSubmit={handleUpdateVisitor}>
              <h2>Editando: {editingVisitor.nome}</h2>
              
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Nome Completo</label>
                  <input 
                    name="nome" 
                    value={editingVisitor.nome || ''} 
                    onChange={handleModalChange} 
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label>Telefone</label>
                  <input 
                    name="telefone" 
                    value={editingVisitor.telefone || ''} 
                    onChange={handleModalChange} 
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label>Email</label>
                  <input 
                    name="email" 
                    type="email" 
                    value={editingVisitor.email || ''} 
                    onChange={handleModalChange} 
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label>Como Conheceu</label>
                  <input 
                    name="como_conheceu" 
                    value={editingVisitor.como_conheceu || ''} 
                    onChange={handleModalChange} 
                  />
                </div>
              </div>
              
              <div className={styles.modalActions}>
                <button 
                  type="button" 
                  onClick={() => setEditingVisitor(null)} 
                  className={styles.cancelButton}
                >
                  <MdClose /> Cancelar
                </button>
                
                <button 
                  type="submit" 
                  className={styles.saveButton}
                >
                  <MdCheck /> Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Secretaria;