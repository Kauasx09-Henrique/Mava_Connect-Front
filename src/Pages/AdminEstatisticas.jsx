import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import Header from '../Components/Header'; 
import styles from './style/AdminEstatisticas.module.css';
import { FaUsers, FaBirthdayCake, FaCalendarDay, FaMapMarkedAlt, FaUserCheck, FaFilter, FaTimesCircle } from 'react-icons/fa';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const API_BASE_URL = 'https://mava-connect.onrender.com/api';

const SkeletonLoader = () => (
    <div className={styles.statsContainer}>
        <Header />
        <main className={styles.mainContent}>
            <header className={styles.skeletonHeader}>
                <div className={`${styles.skeleton} ${styles.skeletonTitle}`}></div>
                <div className={`${styles.skeleton} ${styles.skeletonBadge}`}></div>
            </header>
            <div className={styles.chartsGrid}>
                <div className={`${styles.skeleton} ${styles.skeletonCard}`}></div>
                <div className={`${styles.skeleton} ${styles.skeletonCard}`}></div>
                <div className={`${styles.skeleton} ${styles.skeletonCard}`}></div>
                <div className={`${styles.skeleton} ${styles.skeletonCard}`}></div>
            </div>
        </main>
    </div>
);

const getThemeColor = (varName) => getComputedStyle(document.documentElement).getPropertyValue(varName).trim();

function AdminEstatisticas() {
    const navigate = useNavigate();
    const [visitantes, setVisitantes] = useState([]);
    const [loading, setLoading] = useState(true);

    const [filtroGF, setFiltroGF] = useState('');
    const [filtroDataInicio, setFiltroDataInicio] = useState('');
    const [filtroDataFim, setFiltroDataFim] = useState('');

    const gfsUnicos = useMemo(() => {
        if (visitantes.length === 0) return [];
        const gfs = visitantes.map(v => v.gf_responsavel?.trim()).filter(Boolean);
        return [...new Set(gfs)].sort();
    }, [visitantes]);

    const visitantesFiltrados = useMemo(() => {
        return visitantes.filter(visitante => {
            if (filtroGF && visitante.gf_responsavel?.trim() !== filtroGF) {
                return false;
            }
            if (filtroDataInicio && filtroDataFim) {
                const dataVisita = new Date(visitante.data_visita);
                const dataInicio = new Date(filtroDataInicio);
                const dataFim = new Date(filtroDataFim);
                dataVisita.setHours(0, 0, 0, 0);
                dataInicio.setHours(0, 0, 0, 0);
                dataFim.setHours(0, 0, 0, 0);
                if (dataVisita < dataInicio || dataVisita > dataFim) {
                    return false;
                }
            }
            return true;
        });
    }, [visitantes, filtroGF, filtroDataInicio, filtroDataFim]);

    const handleClearFilters = () => {
        setFiltroGF('');
        setFiltroDataInicio('');
        setFiltroDataFim('');
    };

    const chartData = useMemo(() => {
        if (visitantesFiltrados.length === 0) return {};

        const accentPrimary = getThemeColor('--accent-primary');
        const accentSecondary = getThemeColor('--accent-secondary');
        const colorMale = '#3b82f6';
        const colorFemale = '#ec4899';
        const colorOther = '#a0aec0';
        const colorIncomplete = '#a0aec0';

        const gfCounts = visitantesFiltrados.reduce((acc, { gf_responsavel }) => {
            const nomeGF = gf_responsavel?.trim() || 'Não informado';
            acc[nomeGF] = (acc[nomeGF] || 0) + 1;
            return acc;
        }, {});
        const totalVisitantes = visitantesFiltrados.length;
        const gfChart = {
            labels: Object.keys(gfCounts),
            datasets: [{
                data: Object.values(gfCounts).map(count => ((count / totalVisitantes) * 100).toFixed(1)),
                backgroundColor: ['#5AC8FA', '#43A047', '#E53935', '#FFB300', '#8E24AA', '#3949AB', '#F4511E', '#6D4C41'],
                borderColor: getThemeColor('--bg-card'),
                borderWidth: 4,
            }],
        };

        const registrationCounts = visitantesFiltrados.reduce((acc, { sexo }) => {
            const status = sexo || 'Cadastro Incompleto'; 
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, {});
        const registrationChart = {
            labels: Object.keys(registrationCounts),
            datasets: [{
                data: Object.values(registrationCounts),
                backgroundColor: Object.keys(registrationCounts).map(label => {
                    if (label === 'Masculino') return colorMale;
                    if (label === 'Feminino') return colorFemale;
                    if (label === 'Cadastro Incompleto') return colorIncomplete;
                    return colorOther;
                }),
                borderColor: getThemeColor('--bg-card'),
                borderWidth: 4,
            }],
        };

        const ageGroups = { '0-17': 0, '18-25': 0, '26-35': 0, '36-50': 0, '51+': 0, 'Não informado': 0 };
        visitantesFiltrados.forEach(({ data_nascimento }) => {
            if (!data_nascimento) {
                ageGroups['Não informado']++;
                return;
            }
            const birthDate = new Date(data_nascimento);
            const age = Math.floor((new Date() - birthDate.getTime()) / 3.15576e+10);
            if (age <= 17) ageGroups['0-17']++;
            else if (age <= 25) ageGroups['18-25']++;
            else if (age <= 35) ageGroups['26-35']++;
            else if (age <= 50) ageGroups['36-50']++;
            else ageGroups['51+']++;
        });
        const ageChart = {
             labels: Object.keys(ageGroups),
             datasets: [{ label: 'Nº de Visitantes', data: Object.values(ageGroups), backgroundColor: accentSecondary, borderRadius: 4 }],
        };

        const locationCounts = visitantesFiltrados.reduce((acc, { endereco }) => {
            const city = endereco?.cidade ? (endereco.cidade.charAt(0).toUpperCase() + endereco.cidade.slice(1).toLowerCase()) : 'Não informado';
            acc[city] = (acc[city] || 0) + 1;
            return acc;
        }, {});
        const sortedLocations = Object.entries(locationCounts).sort(([, a], [, b]) => b - a);
        const topLocations = sortedLocations.slice(0, 7);
        const otherCount = sortedLocations.slice(7).reduce((sum, [, count]) => sum + count, 0);
        if (otherCount > 0) topLocations.push(['Outras', otherCount]);
        const locationChart = {
            labels: topLocations.map(([city]) => city),
            datasets: [{ label: 'Nº de Visitantes', data: topLocations.map(([, count]) => count), backgroundColor: '#34d399', borderRadius: 4 }],
        };

        const dateCounts = visitantesFiltrados.reduce((acc, { data_visita }) => {
            const visitDate = new Date(data_visita).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
            acc[visitDate] = (acc[visitDate] || 0) + 1;
            return acc;
        }, {});
        const topDates = Object.entries(dateCounts).sort(([, a], [, b]) => b - a).slice(0, 10);
        const visitsByDateChart = {
            labels: topDates.map(([date]) => date),
            datasets: [{ label: 'Nº de Visitantes', data: topDates.map(([, count]) => count), backgroundColor: accentPrimary, borderRadius: 4 }],
        };

        return { gf: gfChart, registration: registrationChart, age: ageChart, location: locationChart, visitsByDate: visitsByDateChart };
    }, [visitantesFiltrados]);

    const chartOptions = useMemo(() => {
        const textColor = getThemeColor('--text-secondary');
        const gridColor = getThemeColor('--border-color');
        
        const baseOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { labels: { color: textColor, font: { size: 14 } } } },
        };
        
        return {
            pie: { ...baseOptions, plugins: { ...baseOptions.plugins, legend: { ...baseOptions.plugins.legend, position: 'top' } } },
            bar: {
                ...baseOptions,
                plugins: { ...baseOptions.plugins, legend: { display: false } },
                scales: {
                    y: { ticks: { color: textColor, font: { size: 12 } }, grid: { color: gridColor } },
                    x: { ticks: { color: textColor, font: { size: 12 } }, grid: { color: 'transparent' } },
                },
            },
        };
    }, []);

    useEffect(() => {
        const fetchVisitantes = async () => {
            setLoading(true);
            const token = localStorage.getItem('token');
            if (!token) {
                toast.error("Sessão expirada. Faça login novamente.");
                navigate('/');
                return;
            }
            try {
                const headers = { 'Authorization': `Bearer ${token}` };
                const response = await axios.get(`${API_BASE_URL}/visitantes`, { headers });
                setVisitantes(response.data);
            } catch (error) {
                toast.error("Erro ao carregar dados dos visitantes.");
                console.error("API Error:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchVisitantes();
    }, [navigate]);

    if (loading) return <SkeletonLoader />;

    return (
        <div className={styles.statsContainer}>
            <Header />
            <main className={styles.mainContent}>
                <header className={styles.mainHeader}>
                    <h1>Dashboard de Visitantes</h1>
                    <div className={styles.totalVisitorsCard}>
                        <FaUsers />
                        <span><strong>{visitantesFiltrados.length}</strong> Visitantes</span>
                    </div>
                </header>

                <div className={styles.filtersContainer}>
                    <div className={styles.filterGroup}>
                        <label htmlFor="gf-filter">Filtrar por GF</label>
                        <select id="gf-filter" value={filtroGF} onChange={(e) => setFiltroGF(e.target.value)}>
                            <option value="">Todos os GFs</option>
                            {gfsUnicos.map(gf => <option key={gf} value={gf}>{gf}</option>)}
                        </select>
                    </div>
                    <div className={styles.filterGroup}>
                        <label htmlFor="start-date">Data de Início</label>
                        <input type="date" id="start-date" value={filtroDataInicio} onChange={(e) => setFiltroDataInicio(e.target.value)} />
                    </div>
                    <div className={styles.filterGroup}>
                        <label htmlFor="end-date">Data de Fim</label>
                        <input type="date" id="end-date" value={filtroDataFim} onChange={(e) => setFiltroDataFim(e.target.value)} />
                    </div>
                    <button className={styles.clearButton} onClick={handleClearFilters}>
                        <FaTimesCircle /> Limpar Filtros
                    </button>
                </div>
                
                {visitantesFiltrados.length === 0 && !loading && (
                    <div className={styles.noResults}>
                        <FaFilter />
                        <h3>Nenhum resultado encontrado</h3>
                        <p>Tente ajustar os filtros ou limpá-los para ver os dados.</p>
                    </div>
                )}

                {visitantesFiltrados.length > 0 && (
                    <div className={styles.chartsGrid}>
                        {chartData.gf && (
                            <div className={styles.chartCard} style={{animationDelay: '0.05s'}}>
                                <h2 className={styles.chartTitle}><FaUsers /> Percentual de Cadastros por GF</h2>
                                <div className={styles.chartWrapper}>
                                    <Pie data={chartData.gf} options={{
                                        ...chartOptions.pie,
                                        plugins: {
                                            ...chartOptions.pie.plugins,
                                            tooltip: {
                                                callbacks: {
                                                    label: (context) => `${context.label}: ${context.formattedValue}%`
                                                }
                                            }
                                        }
                                    }} />
                                </div>
                            </div>
                        )}
                        {chartData.registration && (
                            <div className={styles.chartCard} style={{animationDelay: '0.1s'}}>
                                <h2 className={styles.chartTitle}><FaUserCheck /> Status de Cadastro por Gênero</h2>
                                <div className={styles.chartWrapper}>
                                    <Pie data={chartData.registration} options={chartOptions.pie} />
                                </div>
                            </div>
                        )}
                        {chartData.age && (
                            <div className={styles.chartCard} style={{animationDelay: '0.2s'}}>
                                <h2 className={styles.chartTitle}><FaBirthdayCake /> Distribuição por Faixa Etária</h2>
                                <div className={styles.chartWrapper}>
                                    <Bar data={chartData.age} options={chartOptions.bar} />
                                </div>
                            </div>
                        )}
                        {chartData.location && (
                            <div className={styles.chartCard} style={{animationDelay: '0.3s'}}>
                                <h2 className={styles.chartTitle}><FaMapMarkedAlt /> Visitantes por Localização</h2>
                                <div className={styles.chartWrapper}>
                                    <Bar data={chartData.location} options={chartOptions.bar} />
                                </div>
                            </div>
                        )}
                        {chartData.visitsByDate && (
                            <div className={styles.chartCard} style={{animationDelay: '0.4s'}}>
                                <h2 className={styles.chartTitle}><FaCalendarDay /> Top 10 Dias com Mais Visitas</h2>
                                <div className={styles.chartWrapper}>
                                    <Bar data={chartData.visitsByDate} options={chartOptions.bar} />
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}

export default AdminEstatisticas;