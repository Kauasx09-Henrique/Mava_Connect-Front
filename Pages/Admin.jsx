// Caminho: src/Pages/Admin.jsx

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import Header from '../Components/Header'; // Header importado e pronto para uso
import styles from './style/Admin.module.css';
import { FaEdit, FaTrashAlt, FaPlus, FaUsers, FaWalking } from 'react-icons/fa';

const API_BASE_URL = 'https://mava-connect-backend.onrender.com'; 

function Admin() {
  const navigate = useNavigate(); 
  
  // --- STATE MANAGEMENT ---
  const [view, setView] = useState('usuarios');
  const [usuarios, setUsuarios] = useState([]);
  const [visitantes, setVisitantes] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null); 
  const [formData, setFormData] = useState({});

  // --- API DATA FETCHING ---
  const fetchAllData = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    
    if (!token) {
      toast.error("Sessão expirada. Por favor, faça o login novamente.");
      setLoading(false);
      navigate('/'); // Redireciona para o login se não houver token
      return;
    }
    
    const headers = { 'Authorization': `Bearer ${token}` };
    
    const usersPromise = axios.get(`${API_BASE_URL}/api/usuarios`, { headers });
    const visitorsPromise = axios.get(`${API_BASE_URL}/visitantes`, { headers });

    try {
      const results = await Promise.allSettled([usersPromise, visitorsPromise]);
      
      if (results[0].status === 'fulfilled') {
        setUsuarios(results[0].value.data);
      } else {
        console.error("Erro ao buscar usuários:", results[0].reason);
        toast.error("Não foi possível carregar os usuários.");
      }

      if (results[1].status === 'fulfilled') {
        setVisitantes(results[1].value.data);
      } else {
        console.error("Erro ao buscar visitantes:", results[1].reason);
        toast.error("Não foi possível carregar os visitantes.");
      }

    } catch (error) {
      toast.error('Ocorreu um erro inesperado ao carregar os dados.');
      console.error("Erro geral ao buscar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // --- MODAL AND FORM HANDLING ---

  const handleOpenModal = (item = null) => {
    setEditingItem(item);
    if (view === 'usuarios') {
      setFormData({
        nome_gf: item ? item.nome_gf : '',
        email_gf: item ? item.email_gf : '',
        senha_gf: '',
        tipo_usuario: item ? item.tipo_usuario : 'secretaria',
        logo: item ? item.logo : null
      });
    } else {
      setFormData({
        nome: item ? item.nome : '',
        rg: item ? item.rg : '',
        empresa: item ? item.empresa : '',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setFormData({});
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // --- CRUD OPERATIONS ---

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const headers = { 'Authorization': `Bearer ${token}` };
    
    let promise;
    let dataToSend = { ...formData };
    const endpoint = view === 'usuarios' ? `${API_BASE_URL}/api/usuarios` : `${API_BASE_URL}/visitantes`;

    if (view === 'usuarios' && editingItem && !formData.senha_gf) {
      delete dataToSend.senha_gf;
    }

    if (editingItem) {
      promise = axios.put(`${endpoint}/${editingItem.id}`, dataToSend, { headers });
    } else {
      promise = axios.post(endpoint, dataToSend, { headers });
    }

    toast.promise(promise, {
      loading: 'Salvando...',
      success: () => {
        fetchAllData(); 
        handleCloseModal();
        return `Item ${editingItem ? 'atualizado' : 'criado'} com sucesso!`;
      },
      error: (err) => err.response?.data?.error || 'Ocorreu um erro ao salvar.',
    });
  };

  const handleDelete = (item) => {
    const endpoint = view === 'usuarios' ? `${API_BASE_URL}/api/usuarios` : `${API_BASE_URL}/visitantes`;
    const itemName = view === 'usuarios' ? item.nome_gf : item.nome;

    toast((t) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <p>Tem certeza que deseja excluir <strong>{itemName}</strong>?</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                    className={styles.confirmButton}
                    onClick={() => {
                        const token = localStorage.getItem('token');
                        const promise = axios.delete(`${endpoint}/${item.id}`, { headers: { 'Authorization': `Bearer ${token}` } });
                        toast.promise(promise, {
                            loading: 'Excluindo...',
                            success: () => { fetchAllData(); return 'Item excluído!'; },
                            error: 'Não foi possível excluir.',
                        });
                        toast.dismiss(t.id);
                    }}
                >Excluir</button>
                <button className={styles.cancelButton} onClick={() => toast.dismiss(t.id)}>Cancelar</button>
            </div>
        </div>
    ), { duration: 6000 });
  };
  
  const handleAddNewClick = () => {
    if (view === 'usuarios') {
      navigate('/cadastrar-usuario');
    } else {
      handleOpenModal();
    }
  };

  // --- RENDER FUNCTIONS ---
  
  const renderUserTable = () => (
    <table className={styles.dataTable}>
      <thead>
        <tr>
          <th>ID</th>
          <th>Nome</th>
          <th>Email</th>
          <th>Perfil</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody>
        {usuarios.length > 0 ? usuarios.map(user => (
          <tr key={user.id}>
            <td>{user.id}</td>
            <td>{user.nome_gf}</td>
            <td>{user.email_gf}</td>
            <td><span className={`${styles.perfil} ${styles[user.tipo_usuario]}`}>{user.tipo_usuario}</span></td>
            <td className={styles.actions}>
              <button onClick={() => handleOpenModal(user)} title="Editar"><FaEdit /></button>
              <button onClick={() => handleDelete(user)} title="Excluir" className={styles.deleteButton}><FaTrashAlt /></button>
            </td>
          </tr>
        )) : (
          <tr><td colSpan="5">Nenhum usuário encontrado.</td></tr>
        )}
      </tbody>
    </table>
  );

  const renderVisitorTable = () => (
    <table className={styles.dataTable}>
      <thead>
        <tr>
          <th>ID</th>
          <th>Nome</th>
          <th>RG</th>
          <th>Empresa</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody>
        {visitantes.length > 0 ? visitantes.map(visitor => (
          <tr key={visitor.id}>
            <td>{visitor.id}</td>
            <td>{visitor.nome}</td>
            <td>{visitor.rg}</td>
            <td>{visitor.empresa}</td>
            <td className={styles.actions}>
              <button onClick={() => handleOpenModal(visitor)} title="Editar"><FaEdit /></button>
              <button onClick={() => handleDelete(visitor)} title="Excluir" className={styles.deleteButton}><FaTrashAlt /></button>
            </td>
          </tr>
        )) : (
          <tr><td colSpan="5">Nenhum visitante encontrado.</td></tr>
        )}
      </tbody>
    </table>
  );
  
  const renderModal = () => (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <form onSubmit={handleFormSubmit}>
          <h2>{editingItem ? `Editar ${view === 'usuarios' ? 'Usuário' : 'Visitante'}` : `Novo Visitante`}</h2>
          
          {view === 'usuarios' ? (
            <>
              <div className={styles.formGroup}><label>Nome</label><input type="text" name="nome_gf" value={formData.nome_gf || ''} onChange={handleFormChange} required /></div>
              <div className={styles.formGroup}><label>Email</label><input type="email" name="email_gf" value={formData.email_gf || ''} onChange={handleFormChange} required /></div>
              <div className={styles.formGroup}><label>Senha</label><input type="password" name="senha_gf" value={formData.senha_gf || ''} onChange={handleFormChange} placeholder='Deixe em branco para não alterar' /></div>
              <div className={styles.formGroup}><label>Perfil</label><select name="tipo_usuario" value={formData.tipo_usuario || 'secretaria'} onChange={handleFormChange}><option value="secretaria">Secretaria</option><option value="admin">Admin</option></select></div>
            </>
          ) : (
            <>
              <div className={styles.formGroup}><label>Nome Completo</label><input type="text" name="nome" value={formData.nome || ''} onChange={handleFormChange} required /></div>
              <div className={styles.formGroup}><label>RG</label><input type="text" name="rg" value={formData.rg || ''} onChange={handleFormChange} required /></div>
              <div className={styles.formGroup}><label>Empresa</label><input type="text" name="empresa" value={formData.empresa || ''} onChange={handleFormChange} /></div>
            </>
          )}

          <div className={styles.modalActions}>
            <button type="button" onClick={handleCloseModal} className={styles.cancelButton}>Cancelar</button>
            <button type="submit" className={styles.saveButton}>Salvar</button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <>
      <Header />
      <div className={styles.adminPanel}>
        <div className={styles.viewToggle}>
            <button onClick={() => setView('usuarios')} className={view === 'usuarios' ? styles.active : ''}><FaUsers /> Gerenciar Usuários</button>
            <button onClick={() => setView('visitantes')} className={view === 'visitantes' ? styles.active : ''}><FaWalking /> Gerenciar Visitantes</button>
        </div>

        <div className={styles.header}>
          <h1>{view === 'usuarios' ? 'Lista de Usuários' : 'Lista de Visitantes'}</h1>
          <button onClick={handleAddNewClick} className={styles.addButton}>
            <FaPlus /> Cadastrar {view === 'usuarios' ? 'Usuário' : 'Visitante'}
          </button>
        </div>

        {loading ? <p>Carregando dados...</p> : (
          <div className={styles.tableContainer}>
            {view === 'usuarios' ? renderUserTable() : renderVisitorTable()}
          </div>
        )}
      </div>

      {isModalOpen && renderModal()}
    </>
  );
}

export default Admin;
