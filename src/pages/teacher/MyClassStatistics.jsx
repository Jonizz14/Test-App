import React, { useState, useEffect } from 'react';
import {
    Row,
    Col,
    Card,
    Typography,
    Table,
    Tag,
    Spin,
    Alert,
    Statistic,
    Progress,
    Space,
    Avatar,
    Switch,
} from 'antd';
import {
    TeamOutlined,
    TrophyOutlined,
    RiseOutlined,
    UserOutlined,
    StarOutlined,
    BookOutlined,
    CrownOutlined,
    BarChartOutlined,
    PieChartOutlined,
    LineChartOutlined,
    ArrowUpOutlined,
    ArrowDownOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../data/apiService';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title as ChartTitle,
    Tooltip,
    Legend,
    ArcElement,
    RadialLinearScale,
    Filler,
} from 'chart.js';
import { Bar, Pie, Line, Radar } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ChartTitle,
    Tooltip,
    Legend,
    ArcElement,
    RadialLinearScale,
    Filler
);

const { Title, Text } = Typography;

const MyClassStatistics = () => {
    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState({
        mySubject: '',
        classRankings: [],
        studentRankings: [],
        classStats: {
            totalClasses: 0,
            totalStudents: 0,
            averageScore: 0,
            topClass: '',
            highestScore: 0,
            lowestScore: 0,
        },
        classPerformanceData: [],
        monthlyPerformance: [],
        scoreRanges: {},
    });

    const [visibleCards, setVisibleCards] = useState({
        classPerformance: true,
        scoreDistribution: true,
        monthlyTrend: true,
        studentDistribution: true,
    });

    const toggleCard = (cardKey) => {
        setVisibleCards(prev => ({ ...prev, [cardKey]: !prev[cardKey] }));
    };

    useEffect(() => {
        loadData();
    }, [currentUser.id]);

    const loadData = async () => {
        try {
            setLoading(true);

            const [testsData, attemptsData, usersData] = await Promise.all([
                apiService.getTests({ teacher: currentUser.id }),
                apiService.getAttempts(),
                apiService.getUsers()
            ]);

            const tests = (testsData.results || testsData).filter(t => t.teacher === currentUser.id);
            const allAttempts = attemptsData.results || attemptsData;
            const users = usersData.results || usersData;
            const students = users.filter(u => u.role === 'student');

            const mySubject = tests.length > 0 ? tests[0].subject : "Noma'lum";
            const testIds = tests.map(t => t.id);
            const attempts = allAttempts.filter(a => testIds.includes(a.test));

            // Monthly performance
            const monthlyData = {};
            const now = new Date();
            for (let i = 5; i >= 0; i--) {
                const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const monthKey = date.toLocaleDateString('uz-UZ', { month: 'short', year: '2-digit' });
                monthlyData[monthKey] = { attempts: 0, totalScore: 0 };
            }

            attempts.forEach(attempt => {
                const date = new Date(attempt.submitted_at);
                const monthKey = date.toLocaleDateString('uz-UZ', { month: 'short', year: '2-digit' });
                if (monthlyData[monthKey]) {
                    monthlyData[monthKey].attempts++;
                    monthlyData[monthKey].totalScore += attempt.score || 0;
                }
            });

            const monthlyPerformance = Object.entries(monthlyData).map(([month, data]) => ({
                month,
                attempts: data.attempts,
                averageScore: data.attempts > 0 ? Math.round(data.totalScore / data.attempts) : 0
            }));

            // Class rankings
            const classGroups = {};
            attempts.forEach(attempt => {
                const student = students.find(s => s.id === attempt.student);
                if (student) {
                    const classGroup = student.class_group || "Noma'lum";
                    if (!classGroups[classGroup]) {
                        classGroups[classGroup] = {
                            name: classGroup,
                            students: new Set(),
                            totalAttempts: 0,
                            totalScore: 0,
                            highestScore: 0,
                            lowestScore: 100,
                        };
                    }
                    classGroups[classGroup].students.add(student.id);
                    classGroups[classGroup].totalAttempts++;
                    classGroups[classGroup].totalScore += attempt.score || 0;
                    if ((attempt.score || 0) > classGroups[classGroup].highestScore) {
                        classGroups[classGroup].highestScore = attempt.score || 0;
                    }
                    if ((attempt.score || 0) < classGroups[classGroup].lowestScore) {
                        classGroups[classGroup].lowestScore = attempt.score || 0;
                    }
                }
            });

            const classRankings = Object.values(classGroups)
                .map((cls, index) => ({
                    key: index,
                    rank: 0,
                    name: cls.name,
                    studentCount: cls.students.size,
                    attemptCount: cls.totalAttempts,
                    averageScore: cls.totalAttempts > 0 ? Math.round(cls.totalScore / cls.totalAttempts) : 0,
                    highestScore: cls.highestScore,
                    lowestScore: cls.lowestScore === 100 ? 0 : cls.lowestScore,
                }))
                .sort((a, b) => b.averageScore - a.averageScore)
                .map((cls, index) => ({ ...cls, rank: index + 1 }));

            // Student rankings
            const studentStats = {};
            attempts.forEach(attempt => {
                const student = students.find(s => s.id === attempt.student);
                if (student) {
                    if (!studentStats[student.id]) {
                        studentStats[student.id] = {
                            id: student.id,
                            name: student.name || student.username || `${student.first_name || ''} ${student.last_name || ''}`.trim() || 'Noma\'lum',
                            classGroup: student.class_group || "Noma'lum",
                            testCount: 0,
                            totalScore: 0,
                            highestScore: 0,
                        };
                    }
                    studentStats[student.id].testCount++;
                    studentStats[student.id].totalScore += attempt.score || 0;
                    if ((attempt.score || 0) > studentStats[student.id].highestScore) {
                        studentStats[student.id].highestScore = attempt.score || 0;
                    }
                }
            });

            const studentRankings = Object.values(studentStats)
                .map(s => ({
                    ...s,
                    averageScore: s.testCount > 0 ? Math.round(s.totalScore / s.testCount) : 0
                }))
                .sort((a, b) => b.averageScore - a.averageScore)
                .map((s, index) => ({ ...s, rank: index + 1 }));

            // Score distribution
            const scoreRanges = { '0-20': 0, '21-40': 0, '41-60': 0, '61-80': 0, '81-100': 0 };
            attempts.forEach(a => {
                const score = a.score || 0;
                if (score <= 20) scoreRanges['0-20']++;
                else if (score <= 40) scoreRanges['21-40']++;
                else if (score <= 60) scoreRanges['41-60']++;
                else if (score <= 80) scoreRanges['61-80']++;
                else scoreRanges['81-100']++;
            });

            // Calculate stats
            const totalClasses = classRankings.length;
            const totalStudents = studentRankings.length;
            const allScores = attempts.map(a => a.score || 0);
            const averageScore = allScores.length > 0 ? Math.round(allScores.reduce((sum, s) => sum + s, 0) / allScores.length) : 0;
            const topClass = classRankings.length > 0 ? classRankings[0].name : '-';
            const highestScore = allScores.length > 0 ? Math.max(...allScores) : 0;
            const lowestScore = allScores.length > 0 ? Math.min(...allScores) : 0;

            setStats({
                mySubject,
                classRankings,
                studentRankings,
                classStats: { totalClasses, totalStudents, averageScore, topClass, highestScore, lowestScore },
                classPerformanceData: classRankings.slice(0, 8),
                monthlyPerformance,
                scoreRanges,
            });

        } catch (err) {
            console.error('Error loading class statistics:', err);
            setError('Ma\'lumotlarni yuklashda xatolik yuz berdi');
        } finally {
            setLoading(false);
        }
    };

    // Charts
    const classPerformanceChart = {
        labels: stats.classPerformanceData.map(c => c.name),
        datasets: [{
            label: 'O\'rtacha ball',
            data: stats.classPerformanceData.map(c => c.averageScore),
            backgroundColor: stats.classPerformanceData.map((_, i) =>
                i === 0 ? 'rgba(234, 179, 8, 0.8)' :
                    i === 1 ? 'rgba(156, 163, 175, 0.8)' :
                        i === 2 ? 'rgba(180, 83, 9, 0.8)' :
                            'rgba(37, 99, 235, 0.8)'
            ),
            borderColor: stats.classPerformanceData.map((_, i) =>
                i === 0 ? '#eab308' : i === 1 ? '#9ca3af' : i === 2 ? '#b45309' : '#2563eb'
            ),
            borderWidth: 2,
            borderRadius: 8,
        }],
    };

    const scoreDistributionChart = {
        labels: Object.keys(stats.scoreRanges),
        datasets: [{
            label: 'O\'quvchilar soni',
            data: Object.values(stats.scoreRanges),
            backgroundColor: ['rgba(220, 38, 38, 0.8)', 'rgba(245, 158, 11, 0.8)', 'rgba(251, 191, 36, 0.8)', 'rgba(16, 185, 129, 0.8)', 'rgba(5, 150, 105, 0.8)'],
            borderColor: ['#dc2626', '#f59e0b', '#fbbf24', '#10b981', '#059669'],
            borderWidth: 2,
            borderRadius: 8,
        }],
    };

    const monthlyTrendChart = {
        labels: stats.monthlyPerformance.map(m => m.month),
        datasets: [
            {
                label: 'O\'rtacha ball',
                data: stats.monthlyPerformance.map(m => m.averageScore),
                borderColor: '#8b5cf6',
                backgroundColor: 'rgba(139, 92, 246, 0.2)',
                fill: true,
                tension: 0.4,
                borderWidth: 3,
                pointBackgroundColor: '#8b5cf6',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 6,
            },
            {
                label: 'Urinishlar',
                data: stats.monthlyPerformance.map(m => m.attempts),
                borderColor: '#2563eb',
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                fill: false,
                tension: 0.4,
                borderWidth: 2,
                pointRadius: 4,
                yAxisID: 'y1',
            },
        ],
    };

    const studentDistributionChart = {
        labels: ['A\'lo (80%+)', 'Yaxshi (60-79%)', 'Qoniqarli (40-59%)', 'Past (<40%)'],
        datasets: [{
            data: [
                stats.studentRankings.filter(s => s.averageScore >= 80).length,
                stats.studentRankings.filter(s => s.averageScore >= 60 && s.averageScore < 80).length,
                stats.studentRankings.filter(s => s.averageScore >= 40 && s.averageScore < 60).length,
                stats.studentRankings.filter(s => s.averageScore < 40).length,
            ],
            backgroundColor: ['#10b981', '#f59e0b', '#ef4444', '#7c2d12'],
            borderColor: '#ffffff',
            borderWidth: 3,
        }],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, max: 100 } },
    };

    const lineChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'top' } },
        scales: {
            y: { beginAtZero: true, max: 100, title: { display: true, text: 'O\'rtacha ball (%)' } },
            y1: { position: 'right', beginAtZero: true, grid: { drawOnChartArea: false }, title: { display: true, text: 'Urinishlar' } },
        },
    };

    const pieChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' } },
    };

    const StatCard = ({ title, value, icon, color, suffix, trend }) => (
        <div>
            <Card style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }} styles={{ body: { padding: '24px' } }} hoverable>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ flex: 1 }}>
                        <Text style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#64748b', display: 'block', marginBottom: '8px' }}>{title}</Text>
                        <Statistic value={value} suffix={suffix} styles={{ content: { fontSize: '32px', fontWeight: 700, color: '#1e293b', lineHeight: 1.2 } }} />
                    </div>
                    <div style={{ backgroundColor: color, borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: '16px' }}>
                        {React.cloneElement(icon, { style: { fontSize: '28px', color: '#ffffff' } })}
                    </div>
                </div>
            </Card>
            {trend && (
                <Card style={{ backgroundColor: trend.direction === 'up' ? '#f0fdf4' : '#fef2f2', border: `1px solid ${trend.direction === 'up' ? '#bbf7d0' : '#fecaca'}`, borderRadius: '8px', marginTop: '8px' }} bodyStyle={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {trend.direction === 'up' ? <ArrowUpOutlined style={{ color: '#16a34a', fontSize: '14px', marginRight: '6px' }} /> : <ArrowDownOutlined style={{ color: '#dc2626', fontSize: '14px', marginRight: '6px' }} />}
                        <Text style={{ fontSize: '13px', fontWeight: 600, color: trend.direction === 'up' ? '#16a34a' : '#dc2626' }}>{trend.value}</Text>
                    </div>
                </Card>
            )}
        </div>
    );

    const ResizableChart = ({ chartKey, title, icon, children, width }) => {
        if (!visibleCards[chartKey]) return null;
        return (
            <div style={{ width: `${width || 50}%`, padding: '0 8px' }}>
                <Card style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)', height: '400px' }} bodyStyle={{ padding: '16px', height: '100%', display: 'flex', flexDirection: 'column' }} hoverable>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                        {icon}
                        <Title level={3} style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b', margin: '0 0 0 8px' }}>{title}</Title>
                    </div>
                    <div style={{ flex: 1, height: '320px' }}>{children}</div>
                </Card>
            </div>
        );
    };

    const classColumns = [
        { title: '#', dataIndex: 'rank', key: 'rank', width: 60, render: (rank) => rank <= 3 ? <CrownOutlined style={{ color: rank === 1 ? '#eab308' : rank === 2 ? '#9ca3af' : '#b45309', fontSize: rank === 1 ? '20px' : '16px' }} /> : <Text style={{ fontWeight: 700, color: '#64748b' }}>{rank}</Text> },
        { title: 'Sinf', dataIndex: 'name', key: 'name', render: (text, record) => <Space><Avatar style={{ backgroundColor: record.rank <= 3 ? '#fbbf24' : '#2563eb' }} icon={<TeamOutlined />} /><Text strong style={{ color: '#1e293b' }}>{text}</Text></Space> },
        { title: 'O\'quvchilar', dataIndex: 'studentCount', key: 'studentCount', render: (count) => <Text style={{ color: '#64748b' }}>{count} ta</Text> },
        { title: 'O\'rtacha ball', dataIndex: 'averageScore', key: 'averageScore', render: (score) => <Tag color={score >= 70 ? 'green' : score >= 50 ? 'orange' : 'red'}>{score}%</Tag> },
    ];

    const studentColumns = [
        { title: '#', dataIndex: 'rank', key: 'rank', width: 60, render: (rank) => rank <= 3 ? <CrownOutlined style={{ color: rank === 1 ? '#eab308' : rank === 2 ? '#9ca3af' : '#b45309', fontSize: rank === 1 ? '20px' : '16px' }} /> : <Text style={{ fontWeight: 700, color: '#64748b' }}>{rank}</Text> },
        { title: 'O\'quvchi', dataIndex: 'name', key: 'name', render: (text, record) => <Space><Avatar style={{ backgroundColor: record.rank <= 3 ? '#fbbf24' : '#2563eb' }} icon={<UserOutlined />} /><div><Text strong style={{ color: '#1e293b', display: 'block' }}>{text}</Text><Text style={{ color: '#64748b', fontSize: '12px' }}>{record.classGroup}</Text></div></Space> },
        { title: 'Testlar', dataIndex: 'testCount', key: 'testCount', render: (count) => <Tag color="blue">{count} ta</Tag> },
        { title: 'O\'rtacha ball', dataIndex: 'averageScore', key: 'averageScore', render: (score) => <Tag color={score >= 70 ? 'green' : score >= 50 ? 'orange' : 'red'}>{score}%</Tag> },
    ];

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px', flexDirection: 'column' }}>
                <Spin size="large" />
                <Text style={{ marginTop: 16 }}>Ma'lumotlar yuklanmoqda...</Text>
            </div>
        );
    }

    if (error) {
        return <div style={{ padding: '24px' }}><Alert message={error} type="error" showIcon /></div>;
    }

    return (
        <div style={{ padding: '24px 0' }}>
            {/* Header */}
            <div style={{ marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #e2e8f0' }}>
                <Title level={1} style={{ margin: 0, color: '#1e293b', marginBottom: '8px' }}>Sinfim Statistikasi</Title>
                <Text style={{ fontSize: '18px', color: '#64748b' }}>{stats.mySubject} fani bo'yicha sinflar va o'quvchilar tahlili</Text>
            </div>

            {/* Stats Cards */}
            <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
                <Col xs={24} sm={12} md={6}><StatCard title="Jami sinflar" value={stats.classStats.totalClasses} icon={<TeamOutlined />} color="#2563eb" /></Col>
                <Col xs={24} sm={12} md={6}><StatCard title="Jami o'quvchilar" value={stats.classStats.totalStudents} icon={<UserOutlined />} color="#16a34a" /></Col>
                <Col xs={24} sm={12} md={6}><StatCard title="O'rtacha ball" value={stats.classStats.averageScore} suffix="%" icon={<RiseOutlined />} color="#f59e0b" /></Col>
                <Col xs={24} sm={12} md={6}><StatCard title="Eng yaxshi sinf" value={stats.classStats.topClass} icon={<TrophyOutlined />} color="#7c3aed" /></Col>
            </Row>

            <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
                <Col xs={24} sm={12} md={8}><StatCard title="Eng yuqori ball" value={stats.classStats.highestScore} suffix="%" icon={<TrophyOutlined />} color="#10b981" /></Col>
                <Col xs={24} sm={12} md={8}><StatCard title="Eng past ball" value={stats.classStats.lowestScore} suffix="%" icon={<ArrowDownOutlined />} color="#dc2626" /></Col>
            </Row>

            {/* Chart Controls */}
            <Card style={{ backgroundColor: '#eff6ff', borderRadius: '12px', marginBottom: '24px', border: '1px solid #e2e8f0' }}>
                <Title level={3} style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <BarChartOutlined style={{ color: '#2563eb' }} /> Diagrammalar boshqaruvi
                </Title>
                <Row gutter={[16, 12]}>
                    {[
                        { key: 'classPerformance', label: 'Sinflar natijalari', icon: <BarChartOutlined style={{ color: '#2563eb' }} /> },
                        { key: 'scoreDistribution', label: 'Ballar taqsimoti', icon: <BarChartOutlined style={{ color: '#f59e0b' }} /> },
                        { key: 'monthlyTrend', label: 'Oylik trend', icon: <LineChartOutlined style={{ color: '#8b5cf6' }} /> },
                        { key: 'studentDistribution', label: 'O\'quvchilar taqsimoti', icon: <PieChartOutlined style={{ color: '#10b981' }} /> },
                    ].map(chart => (
                        <Col xs={24} sm={12} md={6} key={chart.key}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: '#ffffff', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                                <Text style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>{chart.label}</Text>
                                <Switch size="small" checked={visibleCards[chart.key]} onChange={() => toggleCard(chart.key)} style={{ backgroundColor: visibleCards[chart.key] ? '#2563eb' : '#d1d5db' }} />
                            </div>
                        </Col>
                    ))}
                </Row>
            </Card>

            {/* Charts */}
            <div style={{ marginBottom: '24px' }}>
                <Row gutter={[0, 24]}>
                    <ResizableChart chartKey="classPerformance" title="Sinflar natijalari" icon={<BarChartOutlined style={{ color: '#2563eb' }} />} width={50}>
                        <Bar data={classPerformanceChart} options={chartOptions} />
                    </ResizableChart>
                    <ResizableChart chartKey="scoreDistribution" title="Ballar taqsimoti" icon={<BarChartOutlined style={{ color: '#f59e0b' }} />} width={50}>
                        <Bar data={scoreDistributionChart} options={chartOptions} />
                    </ResizableChart>
                </Row>
            </div>

            <div style={{ marginBottom: '24px' }}>
                <Row gutter={[0, 24]}>
                    <ResizableChart chartKey="monthlyTrend" title="Oylik trend" icon={<LineChartOutlined style={{ color: '#8b5cf6' }} />} width={60}>
                        <Line data={monthlyTrendChart} options={lineChartOptions} />
                    </ResizableChart>
                    <ResizableChart chartKey="studentDistribution" title="O'quvchilar taqsimoti" icon={<PieChartOutlined style={{ color: '#10b981' }} />} width={40}>
                        <Pie data={studentDistributionChart} options={pieChartOptions} />
                    </ResizableChart>
                </Row>
            </div>

            {/* Tables */}
            <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
                <Col xs={24} lg={12}>
                    <Card style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }}>
                        <Title level={3} style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <TrophyOutlined style={{ color: '#eab308' }} /> Sinflar reytingi
                        </Title>
                        <Table dataSource={stats.classRankings.slice(0, 10)} columns={classColumns} pagination={false} size="small" rowKey="name" />
                    </Card>
                </Col>
                <Col xs={24} lg={12}>
                    <Card style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }}>
                        <Title level={3} style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <CrownOutlined style={{ color: '#eab308' }} /> O'quvchilar reytingi
                        </Title>
                        <Table dataSource={stats.studentRankings.slice(0, 10)} columns={studentColumns} pagination={false} size="small" rowKey="id" />
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default MyClassStatistics;
