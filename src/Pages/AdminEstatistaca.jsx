import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

// Importações do Chart.js
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

// Importações de Componentes e Estilos
import Header from '../../Components/Header'; // Ajuste o caminho se necessário
import styles from './style/adminestatisticas.css';
import { FaUsers, FaVenusMars, FaBirthdayCake, FaCalendarDay } from 'react-icons/fa';

// Registro dos componentes do Chart.js
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
    });

    // Função para processar os dados para os gráficos
    const processDataForCharts = (data) => {
        // 1. Gráfico de Gênero (Pizza)
        const genderCounts = data.reduce((acc, visitor) => {
            const gender = visitor.sexo || 'Não informado';
            acc[gender] = (acc[gender] || 0) + 1;
            return acc;
        }, {});
        const genderChart = {
            labels: Object.keys(genderCounts),
            datasets: [{
                label: 'Visitantes por Gênero',
                data: Object.values(genderCounts),
                backgroundColor: ['rgba(54, 162, 235, 0.7)', 'rgba(255, 99, 132, 0.7)', 'rgba(201, 203, 207, 0.7)'],
                borderColor: ['#fff'],
                borderWidth: 2,
            }],
        };

        // 2. Gráfico de Faixa Etária (Barras)
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
                label: 'Visitantes por Faixa Etária',
                data: Object.values(ageGroups),
                backgroundColor: 'rgba(75, 192, 192, 0.7)',
            }],
        };

        // 3. Gráfico de Visitas por Data (Barras)
        const dateCounts = data.reduce((acc, visitor) => {
            const visitDate = new Date(visitor.data_visita).toLocaleDateString('pt-BR');
            acc[visitDate] = (acc[visitDate] || 0) + 1;
            return acc;
        }, {});
        // Pega as 7 datas com mais visitas
        const topDates = Object.entries(dateCounts).sort((a, b) => b[1] - a[1]).slice(0, 7);
        const visitsByDateChart = {
            labels: topDates.map(item => item[0]),
            datasets: [{
                label: 'Top 7 Dias com Mais Visitas',
                data: topDates.map(item => item[1]),
                backgroundColor: 'rgba(153, 102, 255, 0.7)',
            }],
        };

        setChartData({ gender: genderChart, age: ageChart, visitsByDate: visitsByDateChart });
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
        return <div className={styles.loading}><div className={styles.spinner}></div><p>Carregando estatísticas...</p></div>;
    }

    return (
        <div className={styles.statsContainer}>
            <Header />
            <main className={styles.mainContent}>
                <header className={styles.mainHeader}>
                    <h1>Estatísticas de Visitantes</h1>
                    <div className={styles.totalVisitorsCard}>
                        <FaUsers />
                        <span><strong>{visitantes.length}</strong> Visitantes Totais</span>
                    </div>
                </header>

                <div className={styles.chartsGrid}>
                    {/* Card do Gráfico de Gênero */}
                    <div className={styles.chartCard}>
                        <h2 className={styles.chartTitle}><FaVenusMars /> Distribuição por Gênero</h2>
                        <div className={styles.chartWrapper}>
                            {chartData.gender && <Pie data={chartData.gender} />}
                        </div>
                    </div>

                    {/* Card do Gráfico de Idade */}
                    <div className={styles.chartCard}>
                        <h2 className={styles.chartTitle}><FaBirthdayCake /> Distribuição por Faixa Etária</h2>
                        <div className={styles.chartWrapper}>
                           {chartData.age && <Bar data={chartData.age} options={{ responsive: true, plugins: { legend: { display: false } } }} />}
                        </div>
                    </div>

                    {/* Card do Gráfico de Visitas por Data */}
                    <div className={styles.chartCard} style={{ gridColumn: '1 / -1' }}>
                        <h2 className={styles.chartTitle}><FaCalendarDay /> Top 7 Dias com Mais Visitas</h2>
                        <div className={styles.chartWrapper}>
                            {chartData.visitsByDate && <Bar data={chartData.visitsByDate} options={{ responsive: true, plugins: { legend: { display: false } } }} />}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default AdminEstatisticas;
