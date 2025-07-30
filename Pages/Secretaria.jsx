// Caminho: src/Pages/Secretaria.jsx

import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import Header from '../src/Components/Header'; // Caminho de import corrigido
import styles from './style/Secretaria.module.css';
import { FaEdit, FaTrashAlt, FaWhatsapp, FaEnvelope, FaPlus } from 'react-icons/fa';
import { useIMask } from 'react-imask';
import { useViaCep } from '../src/hooks/useViaCep'; // Caminho de import corrigido

const API_URL = 'https://mava-connect-backend.onrender.com';

const initialVisitorState = {
  nome: '',
  data_nascimento: '',
  telefone: '',
  sexo: '',
  email: '',
  estado_civil: '',
  profissao: '',
  endereco: {
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    uf: '',
  },
  como_conheceu: '',
  gf_responsavel: '',
};


function Secretaria() {
  const [visitantes, setVisitantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingVisitante, setEditingVisitante] = useState(null);
  const [newVisitor, setNewVisitor] = useState(initialVisitorState);

  const { address, loading: cepLoading, error: cepError, fetchCep } = useViaCep();
  const numeroInputRef = useRef(null);


  const fetchVisitantes = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      // --- CORREÇÃO 1/4: Buscar visitantes ---
      const res = await axios.get(`${API_URL}/visitantes`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setVisitantes(res.data);
    } catch (err) {
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        toast.error('Sua sessão expirou. Por favor, faça login novamente.');
        localStorage.clear();
        navigate('/');
      } else {
        toast.error('Erro ao buscar visitantes.');
      }
      console.error("Erro ao buscar visitantes:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisitantes();
  }, []);

  useEffect(() => {
    if (Object.keys(address).length > 0) {
      const stateToUpdate = isAddModalOpen ? setNewVisitor : setEditingVisitante;
      const visitorToUpdate = isAddModalOpen ? newVisitor : editingVisitante;

      stateToUpdate((prev) => ({
        ...prev,
        endereco: {
          ...prev.endereco,
          logradouro: address.logradouro,
          bairro: address.bairro,
          cidade: address.cidade,
          uf: address.uf,
        }
      }));
      numeroInputRef.current?.focus();
    }
  }, [address, isAddModalOpen, isEditModalOpen]);

  const handleDelete = (id) => {
    toast((t) => (
      <div className={styles.toastContainer}>
        <span>Tem certeza que deseja excluir?</span>
        <div className={styles.toastButtons}>
            <button
            className={styles.confirmButton}
            onClick={() => {
                toast.dismiss(t.id);
                const token = localStorage.getItem('token');
                // --- CORREÇÃO 2/4: Deletar visitante ---
                const promise = axios.delete(`${API_URL}/visitantes/${id}`, {
                  headers: { 'Authorization': `Bearer ${token}` }
                });

                toast.promise(promise, {
                  loading: 'Excluindo visitante...',
                  success: () => {
                      fetchVisitantes();
                      return 'Visitante excluído com sucesso!';
                  },
                  error: 'Não foi possível excluir o visitante.',
                });
            }}
            >
            Sim
            </button>
            <button className={styles.cancelButtonToast} onClick={() => toast.dismiss(t.id)}>
            Não
            </button>
        </div>
      </div>
    ));
  };

  const handleOpenEditModal = (visitante) => {
    setEditingVisitante(visitante);
    setIsEditModalOpen(true);
  };
  
  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingVisitante(null);
  };

  const handleEditModalChange = (e) => {
    const { name, value } = e.target;
    const isEnderecoField = ['logradouro', 'numero', 'complemento', 'bairro', 'cidade', 'uf', 'cep'].includes(name);

    setEditingVisitante(prev => ({
      ...prev,
      ...(isEnderecoField ? { endereco: { ...prev.endereco, [name]: value } } : { [name]: value })
    }));
  };

  const handleEditModalSubmit = (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    
    // --- CORREÇÃO 3/4: Atualizar visitante ---
    const promise = axios.put(`${API_URL}/visitantes/${editingVisitante.id}`, editingVisitante, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    toast.promise(promise, {
      loading: 'Atualizando dados...',
      success: () => {
        fetchVisitantes();
        handleCloseEditModal();
        return 'Visitante atualizado com sucesso!';
      },
      error: 'Erro ao atualizar os dados.'
    });
  };

  const handleOpenAddModal = () => {
    setNewVisitor(initialVisitorState);
    setIsAddModalOpen(true);
  };

  const handleCloseAddModal = () => setIsAddModalOpen(false);

  const handleAddModalChange = (e) => {
    const {name, value} = e.target;
    const isEnderecoField = ['logradouro', 'numero', 'complemento', 'bairro', 'cidade', 'uf', 'cep'].includes(name);
    
    setNewVisitor(prev => ({
        ...prev,
        ...(isEnderecoField ? { endereco: { ...prev.endereco, [name]: value } } : { [name]: value })
    }));
  };

  const handleBuscaCep = () => {
    const cepToSearch = isAddModalOpen ? newVisitor.endereco.cep : editingVisitante?.endereco.cep;
    if (cepToSearch) fetchCep(cepToSearch);
  };

  const { ref: cepRef } = useIMask({ mask: '00000-000' });
  const { ref: telefoneRef } = useIMask({ mask: '(00) 00000-0000' });

  const handleAddNewVisitorSubmit = (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');

    const dataToSend = {
      ...newVisitor,
      telefone: newVisitor.telefone.replace(/\D/g, ''),
      endereco: {
        ...newVisitor.endereco,
        cep: newVisitor.endereco.cep.replace(/\D/g, ''),
      }
    };

    // --- CORREÇÃO 4/4: Adicionar novo visitante ---
    const promise = axios.post(`${API_URL}/visitantes`, dataToSend, {
        headers: { Authorization: `Bearer ${token}` }
    });

    toast.promise(promise, {
        loading: 'Cadastrando visitante...',
        success: () => {
            fetchVisitantes();
            handleCloseAddModal();
            return 'Visitante cadastrado com sucesso!';
        },
        error: (err) => err.response?.data?.error || 'Erro ao cadastrar. Tente novamente.'
    });
  };


  const renderContent = () => {
    if (loading) return <p className={styles.message}>Carregando visitantes...</p>;
    if (visitantes.length === 0) return <p className={styles.message}>Nenhum visitante cadastrado ainda.</p>;

    return (
      <div className={styles.tableContainer}>
        <table className={styles.visitorTable}>
          <thead>
            <tr>
              <th>Nome Completo</th>
              <th>Telefone</th>
              <th>Contato</th>
              <th>Data da Visita</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {visitantes.map((visitante) => {
              const telefoneLimpo = visitante.telefone ? String(visitante.telefone).replace(/\D/g, '') : '';
              return (
                <tr key={visitante.id}>
                  <td>{visitante.nome}</td> 
                  <td>{visitante.telefone}</td>
                  <td className={styles.contactActions}>
                    {visitante.telefone && (
                      <a href={`https://wa.me/55${telefoneLimpo}`} target="_blank" rel="noopener noreferrer" title="Enviar WhatsApp">
                        <FaWhatsapp className={styles.whatsappIcon} />
                      </a>
                    )}
                    {visitante.email && (
                      <a href={`mailto:${visitante.email}`} title="Enviar Email">
                        <FaEnvelope className={styles.emailIcon} />
                      </a>
                    )}
                  </td>
                  <td>
                    {new Date(visitante.data_visita).toLocaleDateString('pt-BR', {
                      day: '2-digit', month: 'short', year: 'numeric'
                    })}
                  </td>
                  <td className={styles.actions}>
                    <button onClick={() => handleOpenEditModal(visitante)} title="Editar Visitante">
                      <FaEdit />
                    </button>
                    <button onClick={() => handleDelete(visitante.id)} title="Excluir Visitante" className={styles.deleteButton}>
                      <FaTrashAlt />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div>
      <Header />
      <main className={styles.dashboard}>
        <div className={styles.dashboardHeader}>
            <h1>Visitantes Cadastrados</h1>
            <button className={styles.addButton} onClick={() => navigate('/cadastrar-visitante')}>
              <FaPlus /> Adicionar Visitante
            </button>
        </div>
        <div className={styles.content}>
          {renderContent()}
        </div>
      </main>

      {/* Modal de Edição */}
      {isEditModalOpen && editingVisitante && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <form onSubmit={handleEditModalSubmit}>
              <h2>Editando: {editingVisitante.nome}</h2>
              <div className={styles.formGrid}>
                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                    <label htmlFor="edit-nome">Nome Completo</label>
                    <input type="text" id="edit-nome" name="nome" value={editingVisitante.nome} onChange={handleEditModalChange} required />
                </div>
                <div className={styles.formGroup}>
                    <label htmlFor="edit-email">Email</label>
                    <input type="email" id="edit-email" name="email" value={editingVisitante.email || ''} onChange={handleEditModalChange} />
                </div>
                <div className={styles.formGroup}>
                    <label htmlFor="edit-telefone">Telefone</label>
                    <input type="tel" id="edit-telefone" name="telefone" value={editingVisitante.telefone || ''} onChange={handleEditModalChange} required/>
                </div>
              </div>
              
              <div className={styles.modalActions}>
                <button type="button" onClick={handleCloseEditModal} className={styles.cancelButton}>Cancelar</button>
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
