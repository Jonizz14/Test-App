import React, { useState, useEffect } from 'react';
import 'animate.css';
import { Typography, Card, Row, Col, Statistic, Spin, ConfigProvider } from 'antd';
import {
    BarChartOutlined as AssessmentIcon,
    RiseOutlined as TrendingUpIcon,
    GlobalOutlined,
    UserOutlined as EmojiPeopleIcon,
} from '@ant-design/icons';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    LineElement,
    PointElement,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../data/apiService';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    LineElement,
    PointElement
);

const { Title: AntTitle, Text } = Typography;

const ContentManagerStatistics = () => {
    const { currentUser } = useAuth();
    const [managerTests, setManagerTests] = useState([]);
    const [managerAttempts, setManagerAttempts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStatistics();
    }, [currentUser.id]);

    const loadStatistics = async () => {
        try {
            setLoading(true);
            const testsResponse = await apiService.getTests({ teacher: currentUser.id });
            const tests = testsResponse.results || testsResponse;
            setManagerTests(tests);

            const attemptsResponse = await apiService.getAttempts();
            const allAttempts = attemptsResponse.results || attemptsResponse;
            const filteredAttempts = allAttempts.filter(attempt =>
                tests.some(test => test.id === attempt.test)
            );
            setManagerAttempts(filteredAttempts);
        } catch (error) {
            console.error('Error loading statistics:', error);
        } finally {
            setLoading(false);
        }
    };

    const scores = managerAttempts.map(attempt => attempt.score || 0);
    const averageScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    const highestScore = scores.length > 0 ? Math.round(Math.max(...scores)) : 0;

    const scoreRanges = { '0-20': 0, '21-40': 0, '41-60': 0, '61-80': 0, '81-100': 0 };
    scores.forEach(score => {
        if (score <= 20) scoreRanges['0-20']++;
        else if (score <= 40) scoreRanges['21-40']++;
        else if (score <= 60) scoreRanges['41-60']++;
        else if (score <= 80) scoreRanges['61-80']++;
        else scoreRanges['81-100']++;
    });

    const scoreDistributionData = {
        labels: Object.keys(scoreRanges),
        datasets: [{
            label: 'O' + "'" + 'quvchilar soni',
            data: Object.values(scoreRanges),
            backgroundColor: ['#000', '#2563eb', '#16a34a', '#d97706', '#7c3aed'],
            borderWidth: 4,
            borderColor: '#000'
        }]
    };

    const StatBox = ({ title, value, icon, suffix }) => (
        <Card
            style={{
                borderRadius: 0,
                border: '4px solid #000',
                boxShadow: '8px 8px 0px #000',
                backgroundColor: '#fff',
            }}
            styles={{ body: { padding: '20px' } }}
        >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <Text style={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', color: '#000', display: 'block' }}>{title}</Text>
                    <Statistic value={value} suffix={suffix} valueStyle={{ fontSize: '28px', fontWeight: 900, color: '#000' }} />
                </div>
                <div style={{ width: '40px', height: '40px', backgroundColor: '#000', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {React.cloneElement(icon, { style: { fontSize: '18px' } })}
                </div>
            </div>
        </Card>
    );

    if (loading) return <div style={{ textAlign: 'center', padding: '100px' }}><Spin size="large" /></div>;

    return (
        <ConfigProvider theme={{ token: { borderRadius: 0, colorPrimary: '#000' } }}>
            <div style={{ paddingBottom: '40px' }}>
                <div style={{ marginBottom: '32px' }}>
                    <div style={{ display: 'inline-block', backgroundColor: '#000', color: '#fff', padding: '6px 12px', fontWeight: 900, fontSize: '12px', textTransform: 'uppercase', marginBottom: '12px' }}>
                        STATISTIKA
                    </div>
                    <AntTitle level={1} style={{ margin: 0, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-1px' }}>
                        Global Testlar Tahlili
                    </AntTitle>
                    <div style={{ width: '60px', height: '8px', backgroundColor: '#000', margin: '20px 0' }}></div>
                </div>

                <Row gutter={[24, 24]} style={{ marginBottom: '40px' }}>
                    <Col xs={24} sm={12} lg={6}><StatBox title="Jami Testlar" value={managerTests.length} icon={<AssessmentIcon />} /></Col>
                    <Col xs={24} sm={12} lg={6}><StatBox title="Urinishlar" value={managerAttempts.length} icon={<EmojiPeopleIcon />} /></Col>
                    <Col xs={24} sm={12} lg={6}><StatBox title="O'rtacha Ball" value={averageScore} suffix="%" icon={<TrendingUpIcon />} /></Col>
                    <Col xs={24} sm={12} lg={6}><StatBox title="Eng Yuqori" value={highestScore} suffix="%" icon={<TrendingUpIcon />} /></Col>
                </Row>

                <Row gutter={[24, 24]}>
                    <Col span={24}>
                        <Card
                            title={<Text style={{ fontWeight: 900, textTransform: 'uppercase' }}>Ballar Taqsimoti Jadvallari</Text>}
                            style={{ border: '4px solid #000', boxShadow: '12px 12px 0px rgba(0,0,0,0.05)' }}
                        >
                            <div style={{ height: '400px' }}>
                                <Bar
                                    data={scoreDistributionData}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        scales: {
                                            x: { ticks: { font: { weight: '900' } } },
                                            y: { ticks: { font: { weight: '900' } } }
                                        }
                                    }}
                                />
                            </div>
                        </Card>
                    </Col>
                </Row>
            </div>
        </ConfigProvider>
    );
};

export default ContentManagerStatistics;
