import React, { useState, useEffect } from 'react';
import {
    Row,
    Col,
    Card,
    Typography,
    Spin,
    Space,
    Input,
    Avatar,
    Table,
    Tag,
    Alert,
} from 'antd';
import {
    SearchOutlined,
    TeamOutlined,
    CrownOutlined,
    BankOutlined,
    RiseOutlined,
    BookOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../data/apiService';

const { Title, Text } = Typography;

const ClassesRating = () => {
    const { currentUser } = useAuth();
    const [classes, setClasses] = useState([]);
    const [filteredClasses, setFilteredClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState('');
    const [stats, setStats] = useState({
        totalClasses: 0,
        totalStudents: 0,
        averageScore: 0,
        topClass: '',
    });

    useEffect(() => {
        const fetchClassesRating = async () => {
            try {
                setLoading(true);

                const [usersData, attemptsData] = await Promise.all([
                    apiService.getUsers(),
                    apiService.getAttempts()
                ]);

                const users = usersData.results || usersData;
                const allAttempts = attemptsData.results || attemptsData;
                const students = users.filter(u => u.role === 'student');

                // Group by class group
                const classGroups = {};

                // Process students to get class structure
                students.forEach(student => {
                    const groupName = student.class_group || 'Noma\'lum';
                    if (!classGroups[groupName]) {
                        classGroups[groupName] = {
                            name: groupName,
                            students: new Set(),
                            attempts: [],
                            totalScore: 0,
                        };
                    }
                    classGroups[groupName].students.add(student.id);
                });

                // Process attempts
                allAttempts.forEach(attempt => {
                    const student = students.find(s => s.id === attempt.student);
                    if (student) {
                        const groupName = student.class_group || 'Noma\'lum';
                        if (classGroups[groupName]) {
                            classGroups[groupName].attempts.push(attempt);
                            classGroups[groupName].totalScore += attempt.score || 0;
                        }
                    }
                });

                // Calculate stats for each class
                const classAnalytics = Object.values(classGroups).map(group => {
                    const studentCount = group.students.size;
                    const attemptCount = group.attempts.length;
                    const averageScore = attemptCount > 0
                        ? Math.round(group.totalScore / attemptCount)
                        : 0;

                    // Rating formula: (Avg Score * 0.6) + (Attempts per Student * 10) + (Student Count * 0.5)
                    const attemptsPerStudent = studentCount > 0 ? attemptCount / studentCount : 0;
                    const ratingScore = (averageScore * 0.6) + (attemptsPerStudent * 10) + (studentCount * 0.5);

                    return {
                        name: group.name,
                        studentCount,
                        attemptCount,
                        averageScore,
                        ratingScore,
                    };
                }).filter(c => c.studentCount > 0) // Only show classes with students
                    .sort((a, b) => b.ratingScore - a.ratingScore);

                const rankedClasses = classAnalytics.map((cls, index) => ({
                    ...cls,
                    rank: index + 1
                }));

                const totalClasses = rankedClasses.length;
                const totalStudents = rankedClasses.reduce((sum, c) => sum + c.studentCount, 0);
                const avgScore = totalClasses > 0 ? Math.round(rankedClasses.reduce((sum, c) => sum + c.averageScore, 0) / totalClasses) : 0;
                const topClass = rankedClasses.length > 0 ? rankedClasses[0].name : '-';

                setClasses(rankedClasses);
                setFilteredClasses(rankedClasses);
                setStats({ totalClasses, totalStudents, averageScore: avgScore, topClass });

            } catch (error) {
                console.error('Error fetching classes rating:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchClassesRating();
    }, [currentUser]);

    const handleSearch = (e) => {
        const value = e.target.value;
        setSearchText(value);
        const filtered = classes.filter(cls =>
            cls.name.toLowerCase().includes(value.toLowerCase())
        );
        setFilteredClasses(filtered);
    };

    const columns = [
        {
            title: '#',
            key: 'rank',
            width: 80,
            align: 'center',
            render: (rank) => (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {rank.rank === 1 ? <CrownOutlined style={{ color: '#eab308', fontSize: '24px' }} /> :
                        rank.rank === 2 ? <CrownOutlined style={{ color: '#9ca3af', fontSize: '20px' }} /> :
                            rank.rank === 3 ? <CrownOutlined style={{ color: '#b45309', fontSize: '18px' }} /> :
                                <Text strong style={{ color: '#64748b' }}>{rank.rank}</Text>}
                </div>
            ),
        },
        {
            title: 'Sinf',
            key: 'name',
            sorter: (a, b) => a.name.localeCompare(b.name),
            render: (_, record) => (
                <Space>
                    <Avatar
                        style={{ backgroundColor: record.rank <= 3 ? '#fbbf24' : '#2563eb' }}
                        icon={<TeamOutlined />}
                    >
                        {record.name?.charAt(0)}
                    </Avatar>
                    <Text strong style={{ color: '#1e293b', fontSize: '16px' }}>
                        {record.name}
                    </Text>
                </Space>
            ),
        },
        {
            title: 'O\'quvchilar',
            dataIndex: 'studentCount',
            key: 'studentCount',
            sorter: (a, b) => a.studentCount - b.studentCount,
            render: (count) => <Tag color="blue">{count} ta</Tag>,
        },
        {
            title: 'Urinishlar',
            dataIndex: 'attemptCount',
            key: 'attemptCount',
            sorter: (a, b) => a.attemptCount - b.attemptCount,
            render: (count) => <Tag color="geekblue">{count} ta</Tag>,
        },
        {
            title: 'O\'rtacha ball',
            dataIndex: 'averageScore',
            key: 'averageScore',
            sorter: (a, b) => a.averageScore - b.averageScore,
            render: (score) => (
                <Tag color={score >= 80 ? 'green' : score >= 60 ? 'orange' : 'red'}>
                    {score}%
                </Tag>
            ),
        },
        {
            title: 'Reyting bali',
            dataIndex: 'ratingScore',
            key: 'ratingScore',
            sorter: (a, b) => a.ratingScore - b.ratingScore,
            defaultSortOrder: 'descend',
            render: (score) => <Text strong style={{ color: '#2563eb' }}>{Math.round(score)}</Text>,
        },
    ];

    const StatCard = ({ title, value, icon, color, suffix }) => (
        <Card
            style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            }}
            styles={{ body: { padding: '24px' } }}
            hoverable
        >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ flex: 1 }}>
                    <Text style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#64748b', display: 'block', marginBottom: '8px' }}>
                        {title}
                    </Text>
                    <Title level={2} style={{ margin: 0, color: '#1e293b' }}>
                        {value}{suffix && <span style={{ fontSize: '1.5rem', color: '#64748b' }}>{suffix}</span>}
                    </Title>
                </div>
                <div style={{ backgroundColor: color, borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: '16px' }}>
                    {React.cloneElement(icon, { style: { fontSize: '28px', color: '#ffffff' } })}
                </div>
            </div>
        </Card>
    );

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px', flexDirection: 'column' }}>
                <Spin size="large" />
                <Text style={{ marginTop: 16 }}>Ma'lumotlar yuklanmoqda...</Text>
            </div>
        );
    }

    return (
        <div style={{ padding: '24px 0' }}>
            {/* Header */}
            <div style={{ marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #e2e8f0' }}>
                <Title level={1} style={{ margin: 0, color: '#1e293b', marginBottom: '8px' }}>Sinflar Reytingi</Title>
                <Text style={{ fontSize: '18px', color: '#64748b' }}>
                    Eng faol va yuqori natijali sinflar ro'yxati
                </Text>
            </div>

            {/* Stats Cards */}
            <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
                <Col xs={24} sm={12} md={6}>
                    <StatCard title="Jami sinflar" value={stats.totalClasses} icon={<BankOutlined />} color="#2563eb" />
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <StatCard title="Jami o'quvchilar" value={stats.totalStudents} icon={<TeamOutlined />} color="#16a34a" />
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <StatCard title="O'rtacha ball" value={stats.averageScore} suffix="%" icon={<RiseOutlined />} color="#f59e0b" />
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <StatCard title="Top sinf" value={stats.topClass} icon={<CrownOutlined />} color="#7c3aed" />
                </Col>
            </Row>

            {/* Top 3 Cards */}
            <Row gutter={[24, 24]} style={{ marginBottom: 48 }} justify="center">
                {classes.slice(0, 3).map((cls, index) => (
                    <Col xs={24} sm={8} md={7} key={cls.name}>
                        <Card
                            hoverable
                            style={{
                                height: '100%',
                                borderRadius: 16,
                                border: '1px solid #e2e8f0',
                                textAlign: 'center',
                                position: 'relative',
                                overflow: 'hidden',
                                transform: index === 0 ? 'scale(1.05)' : 'scale(1)',
                                zIndex: index === 0 ? 10 : 1,
                                boxShadow: index === 0 ? '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
                            }}
                            bodyStyle={{ padding: 24 }}
                        >
                            {index === 0 && (
                                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(to right, #f59e0b, #fbbf24)' }} />
                            )}

                            <div style={{ marginBottom: 16, position: 'relative', display: 'inline-block' }}>
                                <Avatar size={80} icon={<TeamOutlined />} style={{ backgroundColor: index === 0 ? '#fffbeb' : '#f1f5f9', color: index === 0 ? '#d97706' : '#64748b' }}>
                                    {cls.name.charAt(0)}
                                </Avatar>
                                <div style={{
                                    position: 'absolute',
                                    bottom: -10,
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    backgroundColor: index === 0 ? '#fbbf24' : index === 1 ? '#9ca3af' : '#b45309',
                                    color: '#fff',
                                    padding: '2px 8px',
                                    borderRadius: 12,
                                    fontSize: 12,
                                    fontWeight: 'bold',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                }}>
                                    #{index + 1}
                                </div>
                            </div>

                            <Title level={4} style={{ margin: '16px 0 4px', color: '#1e293b' }}>{cls.name}</Title>

                            <Space split={<Alert type="vertical" />} style={{ width: '100%', justifyContent: 'center', marginTop: 16 }}>
                                <div style={{ textAlign: 'center' }}>
                                    <Text type="secondary" style={{ fontSize: 12 }}>Ball</Text>
                                    <div style={{ fontWeight: 'bold', color: '#10b981' }}>{cls.averageScore}%</div>
                                </div>
                                <div style={{ width: 1, height: 24, background: '#e2e8f0' }}></div>
                                <div style={{ textAlign: 'center' }}>
                                    <Text type="secondary" style={{ fontSize: 12 }}>Urinishlar</Text>
                                    <div style={{ fontWeight: 'bold', color: '#2563eb' }}>{cls.attemptCount}</div>
                                </div>
                            </Space>
                        </Card>
                    </Col>
                ))}
            </Row>


            {/* Table Card */}
            <Card
                style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <Title level={3} style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CrownOutlined style={{ color: '#eab308' }} /> Umumiy reyting
                    </Title>
                    <Input
                        placeholder="Sinf nomini qidirish..."
                        prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
                        value={searchText}
                        onChange={handleSearch}
                        style={{ width: 280 }}
                        allowClear
                    />
                </div>

                <Table
                    columns={columns}
                    dataSource={filteredClasses}
                    rowKey="name"
                    pagination={{ pageSize: 15 }}
                />
            </Card>
        </div>
    );
};

export default ClassesRating;
