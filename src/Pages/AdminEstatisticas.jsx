import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import Header from '../Components/Header'; 
import styles from './style/AdminEstatisticas.module.css';
import { FaUsers, FaVenusMars, FaBirthdayCake, FaCalendarDay, FaMapMarkedAlt } from 'react-icons/fa';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const API_BASE_URL = 'https://mava-connect-backend.onrender.com';

function AdminEstatisticas() {
    const navigate = useNavigate();
    const [visitantes, setVisitantes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [chartData, setChartData] = useState({
        gender: null,
        age: null,
        visitsByDate: null,
        location: null,
    });
    const [chartOptions, setChartOptions] = useState({ pie: {}, bar: {} });

    // Efeito para configurar as opções dos gráficos de acordo com o tema (claro/escuro)
    useEffect(() => {
        // Esta função lê as variáveis de cor do seu theme.css
        const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim();
        const gridColor = getComputedStyle(document.documentElement).getPropertyValue('--border-color').trim();

        const barChartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    ticks: { color: textColor, font: { size: 12 } },
                    grid: { color: gridColor }
                },
                x: {
                    ticks: { color: textColor, font: { size: 12 } },
                    grid: { color: 'transparent' }
                }
            }
        };

        const pieChartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: textColor,
                        font: { size: 14 }
                    }
                }
            }
        };
        
        setChartOptions({ bar: barChartOptions, pie: pieChartOptions });
    }, []); // Executa uma vez ao montar o componente

    const processDataForCharts = (data) => {
        const genderCounts = data.reduce((acc, visitor) => {
            const gender = visitor.sexo || 'Não informado';
            acc[gender] = (acc[gender] || 0) + 1;
            return acc;
        }, {});

        const genderLabels = Object.keys(genderCounts);
        const genderChart = {
            labels: genderLabels,
            datasets: [{
                label: 'Visitantes',
                data: Object.values(genderCounts),
                backgroundColor: genderLabels.map(label => {
                    if (label === 'Masculino') return '#3b82f6'; // Azul
                    if (label === 'Feminino') return '#ec4899'; // Rosa
                    return '#a0aec0'; // Cinza
                }),
                borderColor: 'var(--bg-card)',
                borderWidth: 4,
            }],
        };

        const ageGroups = { '0-17': 0, '18-25': 0, '26-35': 0, '36-50': 0, '51+': 0, 'Não informado': 0 };
        data.forEach(visitor => {
            if (visitor.data_nascimento) {
                const birthDate = new Date(visitor.data_nascimento);
                const age = new Date().getFullYear() - birthDate.getFullYear();
                if (age <= 17) ageGroups['0-17']++;
                else if (age <= 25) ageGroups['18-25']++;
                else if (age <= 35) ageGroups['26-35']++;
                else if (age <= 50) ageGroups['36-50']++;
                else ageGroups['51+']++;
            } else {
                ageGroups['Não informado']++;
            }
        });
        const ageChart = {
            labels: Object.keys(ageGroups),
            datasets: [{
                label: 'Nº de Visitantes',
                data: Object.values(ageGroups),
                backgroundColor: 'var(--accent-secondary)',
                borderRadius: 4,
            }],
        };

        const dateCounts = data.reduce((acc, visitor) => {
            const visitDate = new Date(visitor.data_visita).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
            acc[visitDate] = (acc[visitDate] || 0) + 1;
            return acc;
        }, {});
        const topDates = Object.entries(dateCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);
        const visitsByDateChart = {
            labels: topDates.map(item => item[0]),
            datasets: [{
                label: 'Nº de Visitantes',
                data: topDates.map(item => item[1]),
                backgroundColor: 'var(--accent-primary)',
                borderRadius: 4,
            }],
        };

        const mainCities = ['Ceilândia', 'Taguatinga', 'Samambaia', 'Recanto das Emas', 'Guará', 'Águas Claras', 'Park Way'];
        const locationCounts = data.reduce((acc, visitor) => {
            const city = visitor.endereco?.cidade || 'Não informado';
            const formattedCity = city.charAt(0).toUpperCase() + city.slice(1).toLowerCase();
            
            if (mainCities.includes(formattedCity)) {
                acc[formattedCity] = (acc[formattedCity] || 0) + 1;
            } else {
                acc['Outras'] = (acc['Outras'] || 0) + 1;
            }
            return acc;
        }, {});
        const locationChart = {
            labels: Object.keys(locationCounts),
            datasets: [{
                label: 'Nº de Visitantes',
                data: Object.values(locationCounts),
                backgroundColor: '#34d399',
                borderRadius: 4,
            }],
        };

        setChartData({ gender: genderChart, age: ageChart, visitsByDate: visitsByDateChart, location: locationChart });
    };

    useEffect(() => {
        const fetchVisitantes = async () => {
            setLoading(true);
            const token = localStorage.getItem('token');
            if (!token) {
                toast.error("Sessão expirada.");
                navigate('/');
                return;
            }
            try {
                const headers = { 'Authorization': `Bearer ${token}` };
                const response = await axios.get(`${API_BASE_URL}/visitantes`, { headers });
                setVisitantes(response.data);
                processDataForCharts(response.data);
            } catch (error) {
                toast.error("Erro ao carregar dados dos visitantes.");
            } finally {
                setLoading(false);
            }
        };
        fetchVisitantes();
    }, [navigate]);

    if (loading) {
        return <div className={styles.loading}><div className={styles.spinner}></div><p>A carregar estatísticas...</p></div>;
    }

    return (
        <div className={styles.statsContainer}>
            <Header />
            <main className={styles.mainContent}>
                <header className={styles.mainHeader}>
                    <h1>Dashboard de Visitantes</h1>
                    <div className={styles.totalVisitorsCard}>
                        <FaUsers />
                        <span><strong>{visitantes.length}</strong> Visitantes Totais</span>
                    </div>
                </header>

                <div className={styles.chartsGrid}>
                    <div className={styles.chartCard}>
                        <h2 className={styles.chartTitle}><FaVenusMars /> Distribuição por Gênero</h2>
                        <div className={styles.chartWrapper}>
                            {chartData.gender && <Pie data={chartData.gender} options={chartOptions.pie} />}
                        </div>
                    </div>

                    <div className={styles.chartCard}>
                        <h2 className={styles.chartTitle}><FaBirthdayCake /> Distribuição por Faixa Etária</h2>
                        <div className={styles.chartWrapper}>
                           {chartData.age && <Bar data={chartData.age} options={chartOptions.bar} />}
                        </div>
                    </div>

                    <div className={`${styles.chartCard} ${styles.fullWidthCard}`}>
                        <h2 className={styles.chartTitle}><FaMapMarkedAlt /> Visitantes por Localização</h2>
                        <div className={styles.chartWrapper}>
                            {chartData.location && <Bar data={chartData.location} options={chartOptions.bar} />}
                        </div>
                    </div>

                    <div className={`${styles.chartCard} ${styles.fullWidthCard}`}>
                        <h2 className={styles.chartTitle}><FaCalendarDay /> Top 10 Dias com Mais Visitas</h2>
                        <div className={styles.chartWrapper}>
                            {chartData.visitsByDate && <Bar data={chartData.visitsByDate} options={chartOptions.bar} />}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default AdminEstatisticas;
