import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import styles from './style/Admin.module.css';
import Header from '../Components/Header';
import {
    FaEdit, FaTrashAlt, FaPlus, FaUsers, FaWalking, FaSearch,
    FaUserShield, FaUserFriends, FaPhone, FaEnvelope,
    FaHome, FaMapMarkerAlt, FaUsersCog, FaChurch,
    FaRegClock, FaArrowUp, FaArrowDown
} from 'react-icons/fa';
import { IconContext } from 'react-icons';
import { FiUserCheck, FiUserX, FiTrendingUp, FiTrendingDown } from 'react-icons/fi';
import { BsGenderMale, BsGenderFemale, BsCalendarDate, BsGraphUp } from 'react-icons/bs';
import { MdEmail, MdPhone, MdFamilyRestroom, MdWork } from 'react-icons/md';

const API_BASE_URL = 'https://mava-connect-backend.onrender.com';

const statusOptions = [
    { value: 'pendente', label: 'Pendente', color: '#F59E0B', icon: <FaRegClock /> },
    { value: 'entrou em contato', label: 'Contatado', color: '#22C55E', icon: <FiUserCheck /> },
    { value: 'erro número', label: 'Erro no Número', color: '#EF4444', icon: <FiUserX /> }
];

const userRoles = {
    admin: { label: 'Administrador', icon: <FaUserShield />, color: '#6f42c1' },
    secretaria: { label: 'Secretaria', icon: <FaUserFriends />, color: '#007bff' }
};

function Admin() {
    const navigate = useNavigate();
    const [view, setView] = useState('visitantes');
    const [usuarios, setUsuarios] = useState([]);
    const [visitantes, setVisitantes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [formData, setFormData] = useState({});
    const [activeFilter, setActiveFilter] = useState('all');
    const [previousStats, setPreviousStats] = useState({});
    
    const [visitorStats, setVisitorStats] = useState({
        topGF: null, bottomGF: null, statusDistribution: {}, genderDistribution: {},
    });
    
    const [userStats, setUserStats] = useState({ total: 0, admins: 0, secretarias: 0 });

    const filteredUsuarios = useMemo(() => {
        if (!searchTerm) return usuarios;
        return usuarios.filter(user =>
            (user.nome_gf && user.nome_gf.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (user.email_gf && user.email_gf.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [usuarios, searchTerm]);

    const filteredVisitantes = useMemo(() => {
        let items = visitantes;
        if (activeFilter !== 'all') {
            items = items.filter(visitor => visitor.status === activeFilter);
        }
        if (searchTerm) {
            const lowercasedTerm = searchTerm.toLowerCase();
            items = items.filter(visitor =>
                (visitor.nome && visitor.nome.toLowerCase().includes(lowercasedTerm)) ||
                (visitor.email && visitor.email.toLowerCase().includes(lowercasedTerm)) ||
                (visitor.telefone && visitor.telefone.includes(searchTerm)) ||
                (visitor.gf_responsavel && visitor.gf_responsavel.toLowerCase().includes(lowercasedTerm))
            );
        }
        return items;
    }, [visitantes, searchTerm, activeFilter]);
    
    const calculateVisitorStats = (visitors) => {
        const gfCounts = {}, statusCounts = {}, genderCounts = { Masculino: 0, Feminino: 0 };
        visitors.forEach(visitor => {
            const gf = visitor.gf_responsavel || 'Sem GF';
            gfCounts[gf] = (gfCounts[gf] || 0) + 1;
            statusCounts[visitor.status] = (statusCounts[visitor.status] || 0) + 1;
            if (visitor.sexo && genderCounts.hasOwnProperty(visitor.sexo)) { genderCounts[visitor.sexo] += 1; }
        });
        const gfEntries = Object.entries(gfCounts).filter(([key]) => key !== 'Sem GF');
        const sortedGFs = gfEntries.sort((a, b) => b[1] - a[1]);
        return {
            topGF: sortedGFs.length > 0 ? { name: sortedGFs[0][0], count: sortedGFs[0][1] } : null,
            bottomGF: sortedGFs.length > 1 ? { name: sortedGFs[sortedGFs.length - 1][0], count: sortedGFs[sortedGFs.length - 1][1] } : null,
            statusDistribution: statusCounts,
            genderDistribution: genderCounts,
        };
    };

    const calculateUserStats = (users) => {
        const total = users.length;
        const admins = users.filter(u => u.tipo_usuario === 'admin').length;
        const secretarias = users.filter(u => u.tipo_usuario === 'secretaria').length;
        return { total, admins, secretarias };
    };
    
    const fetchAllData = async () => {
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token) { toast.error("Sessão expirada."); navigate('/'); return; }
        const headers = { 'Authorization': `Bearer ${token}` };
        try {
            const [usersRes, visitorsRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/api/usuarios`, { headers }),
                axios.get(`${API_BASE_URL}/visitantes`, { headers })
            ]);
            
            // Salvar estatísticas anteriores para animação
            setPreviousStats({
                visitorStats: calculateVisitorStats(visitantes),
                userStats: calculateUserStats(usuarios)
            });
            
            setUsuarios(usersRes.data);
            setVisitantes(visitorsRes.data);
            
            setVisitorStats(calculateVisitorStats(visitorsRes.data));
            setUserStats(calculateUserStats(usersRes.data));

        } catch (error) { toast.error("Erro ao carregar dados."); } 
        finally { setLoading(false); }
    };

    useEffect(() => { fetchAllData(); }, [navigate]);

    // Restante das funções permanecem iguais (handleOpenModal, handleCloseModal, etc.)

    const renderVisitorStatsCards = () => {
        const totalVisitors = visitantes.length;
        const previousTotal = previousStats.visitorStats?.genderDistribution?.Masculino + previousStats.visitorStats?.genderDistribution?.Feminino || 0;
        
        const statItems = [
            { 
                icon: <FaUsers />, 
                value: totalVisitors, 
                label: 'Total de Visitantes', 
                color: 'primary',
                change: totalVisitors - previousTotal,
                changeLabel: 'desde a última atualização'
            },
            { 
                icon: statusOptions.find(s => s.value === 'pendente').icon, 
                value: visitorStats.statusDistribution.pendente || 0, 
                label: 'Pendentes', 
                color: 'warning',
                previousValue: previousStats.visitorStats?.statusDistribution?.pendente || 0
            },
            { 
                icon: statusOptions.find(s => s.value === 'entrou em contato').icon, 
                value: visitorStats.statusDistribution['entrou em contato'] || 0, 
                label: 'Contatados', 
                color: 'success',
                previousValue: previousStats.visitorStats?.statusDistribution?.['entrou em contato'] || 0
            },
            { 
                icon: statusOptions.find(s => s.value === 'erro número').icon, 
                value: visitorStats.statusDistribution['erro número'] || 0, 
                label: 'Erros de Número', 
                color: 'danger',
                previousValue: previousStats.visitorStats?.statusDistribution?.['erro número'] || 0
            },
            visitorStats.topGF ? { 
                icon: <FiTrendingUp />, 
                value: visitorStats.topGF.count, 
                label: `GF Top: ${visitorStats.topGF.name}`, 
                color: 'purple',
                isHighlight: true
            } : null,
            visitorStats.bottomGF ? { 
                icon: <FiTrendingDown />, 
                value: visitorStats.bottomGF.count, 
                label: `GF que menos cadastrou: ${visitorStats.bottomGF.name}`, 
                color: 'orange',
                isHighlight: true
            } : null,
            { 
                icon: <BsGenderMale />, 
                value: visitorStats.genderDistribution.Masculino || 0, 
                label: 'Visitantes Masculinos', 
                color: 'info',
                previousValue: previousStats.visitorStats?.genderDistribution?.Masculino || 0
            },
            { 
                icon: <BsGenderFemale />, 
                value: visitorStats.genderDistribution.Feminino || 0, 
                label: 'Visitantes Femininos', 
                color: 'pink',
                previousValue: previousStats.visitorStats?.genderDistribution?.Feminino || 0
            },
            {
                icon: <BsGraphUp />,
                value: visitantes.length > 0 ? 
                    Math.round((visitorStats.statusDistribution['entrou em contato'] || 0) / visitantes.length * 100) : 0,
                label: 'Taxa de Contato',
                color: 'teal',
                isPercentage: true
            }
        ].filter(Boolean);

        // Dividir os cards em grupos de 4 para melhor visualização
        const cardGroups = [];
        for (let i = 0; i < statItems.length; i += 4) {
            cardGroups.push(statItems.slice(i, i + 4));
        }

        return (
            <div className={styles.statsContainer}>
                {cardGroups.map((group, groupIndex) => (
                    <div key={groupIndex} className={styles.statsRow}>
                        {group.map((item, index) => (
                            <div 
                                key={index} 
                                className={`${styles.statCard} ${styles[item.color]} ${item.isHighlight ? styles.highlightCard : ''}`}
                            >
                                <div className={styles.cardHeader}>
                                    <div className={styles.statIcon}>{item.icon}</div>
                                    <h3 className={styles.cardTitle}>{item.label}</h3>
                                </div>
                                <div className={styles.cardBody}>
                                    <div className={styles.mainValue}>
                                        {item.isPercentage ? `${item.value}%` : item.value}
                                    </div>
                                    {item.change !== undefined && (
                                        <div className={`${styles.changeIndicator} ${item.change >= 0 ? styles.positive : styles.negative}`}>
                                            {item.change >= 0 ? <FaArrowUp /> : <FaArrowDown />}
                                            <span>{Math.abs(item.change)}</span>
                                        </div>
                                    )}
                                    {item.previousValue !== undefined && (
                                        <div className={styles.comparisonText}>
                                            {item.value > item.previousValue ? 'Aumento' : 'Redução'} em relação ao anterior
                                        </div>
                                    )}
                                    {item.changeLabel && (
                                        <div className={styles.changeLabel}>{item.changeLabel}</div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        );
    };

    const renderUserStatsCards = () => {
        const statItems = [
            { 
                icon: <FaUsersCog />, 
                value: userStats.total, 
                label: 'Total de Usuários', 
                color: 'primary',
                previousValue: previousStats.userStats?.total || 0
            },
            { 
                icon: <FaUserShield />, 
                value: userStats.admins, 
                label: 'Administradores', 
                color: 'purple',
                previousValue: previousStats.userStats?.admins || 0
            },
            { 
                icon: <FaUserFriends />, 
                value: userStats.secretarias, 
                label: 'Secretarias', 
                color: 'success',
                previousValue: previousStats.userStats?.secretarias || 0
            },
        ];

        return (
            <div className={styles.statsRow}>
                {statItems.map((item, index) => (
                    <div key={index} className={`${styles.statCard} ${styles[item.color]}`}>
                        <div className={styles.cardHeader}>
                            <div className={styles.statIcon}>{item.icon}</div>
                            <h3 className={styles.cardTitle}>{item.label}</h3>
                        </div>
                        <div className={styles.cardBody}>
                            <div className={styles.mainValue}>{item.value}</div>
                            {item.previousValue !== undefined && (
                                <div className={`${styles.changeIndicator} ${item.value >= item.previousValue ? styles.positive : styles.negative}`}>
                                    {item.value >= item.previousValue ? <FaArrowUp /> : <FaArrowDown />}
                                    <span>{Math.abs(item.value - item.previousValue)}</span>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    // Restante do componente permanece igual
    // ...
}

export default Admin;