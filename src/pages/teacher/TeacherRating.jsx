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
    UserOutlined,
    TrophyOutlined,
    SearchOutlined,
    TeamOutlined,
    CrownOutlined,
    StarOutlined,
    RiseOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../data/apiService';

const { Title, Text } = Typography;

const TeacherRating = () => {
    const { currentUser } = useAuth();
    const [teachers, setTeachers] = useState([]);
    const [filteredTeachers, setFilteredTeachers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState('');
    const [myRank, setMyRank] = useState(null);
    const [stats, setStats] = useState({
        totalTeachers: 0,
        averageTests: 0,
        averageScore: 0,
        topTeacher: '',
    });

    useEffect(() => {
        const fetchTeachersRating = async () => {
            try {
                setLoading(true);

                const [usersData, testsData, attemptsData] = await Promise.all([
                    apiService.getUsers(),
                    apiService.getTests(),
                    apiService.getAttempts()
                ]);

                const users = usersData.results || usersData;
                const allTests = testsData.results || testsData;
                const allAttempts = attemptsData.results || attemptsData;

                const teacherList = users.filter(user => user.role === 'teacher');

                const teacherAnalytics = teacherList.map(teacher => {
                    const teacherTests = allTests.filter(test => test.teacher === teacher.id);
                    const testIds = teacherTests.map(test => test.id);
                    const teacherAttempts = allAttempts.filter(attempt => testIds.includes(attempt.test));

                    const totalTests = teacherTests.length;
                    const totalAttempts = teacherAttempts.length;
                    const uniqueStudents = new Set(teacherAttempts.map(a => a.student)).size;

                    const scores = teacherAttempts.map(a => a.score || 0);
                    const averageScore = scores.length > 0
                        ? Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length)
                        : 0;

                    const ratingScore = (totalTests * 2) + (uniqueStudents * 1) + (averageScore * 0.5) + (totalAttempts * 0.1);

                    return {
                        id: teacher.id,
                        name: teacher.name || teacher.username || 'Noma\'lum',
                        subject: teacher.subject || 'Fan yo\'q',
                        totalTests,
                        totalAttempts,
                        uniqueStudents,
                        averageScore,
                        ratingScore,
                        profilePhoto: teacher.profile_photo_url,
                    };
                })
                    .sort((a, b) => b.ratingScore - a.ratingScore);

                const rankedTeachers = teacherAnalytics.map((teacher, index) => ({
                    ...teacher,
                    rank: index + 1
                }));

                const totalTeachers = rankedTeachers.length;
                const avgTests = totalTeachers > 0 ? Math.round(rankedTeachers.reduce((sum, t) => sum + t.totalTests, 0) / totalTeachers) : 0;
                const avgScore = totalTeachers > 0 ? Math.round(rankedTeachers.reduce((sum, t) => sum + t.averageScore, 0) / totalTeachers) : 0;
                const topTeacher = rankedTeachers.length > 0 ? rankedTeachers[0].name : '-';

                setTeachers(rankedTeachers);
                setFilteredTeachers(rankedTeachers);
                setStats({ totalTeachers, averageTests: avgTests, averageScore: avgScore, topTeacher });

                const currentUserRank = rankedTeachers.findIndex(t => t.id === currentUser?.id);
                if (currentUserRank !== -1) {
                    setMyRank(currentUserRank + 1);
                }

            } catch (error) {
                console.error('Error fetching teachers rating:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchTeachersRating();
    }, [currentUser]);

    const handleSearch = (e) => {
        const value = e.target.value;
        setSearchText(value);
        const filtered = teachers.filter(teacher =>
            teacher.name.toLowerCase().includes(value.toLowerCase()) ||
            teacher.subject.toLowerCase().includes(value.toLowerCase())
        );
        setFilteredTeachers(filtered);
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
            title: 'O\'qituvchi',
            key: 'name',
            sorter: (a, b) => a.name.localeCompare(b.name),
            render: (_, record) => (
                <Space>
                    <Avatar
                        style={{ backgroundColor: record.rank <= 3 ? '#fbbf24' : '#2563eb' }}
                        icon={<UserOutlined />}
                    >
                        {record.name?.charAt(0)?.toUpperCase()}
                    </Avatar>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <Text strong style={{ color: '#1e293b' }}>
                            {record.name} {record.id === currentUser?.id && <Tag color="blue" style={{ marginLeft: 8 }}>SIZ</Tag>}
                        </Text>
                        <Text type="secondary" style={{ fontSize: '12px' }}>{record.subject}</Text>
                    </div>
                </Space>
            ),
        },
        {
            title: 'Testlar',
            dataIndex: 'totalTests',
            key: 'totalTests',
            sorter: (a, b) => a.totalTests - b.totalTests,
            render: (count) => <Tag color="blue">{count} ta</Tag>,
        },
        {
            title: 'Urinishlar',
            dataIndex: 'totalAttempts',
            key: 'totalAttempts',
            sorter: (a, b) => a.totalAttempts - b.totalAttempts,
            render: (count) => <Tag color="geekblue">{count} ta</Tag>,
        },
        {
            title: 'O\'quvchilar',
            dataIndex: 'uniqueStudents',
            key: 'uniqueStudents',
            sorter: (a, b) => a.uniqueStudents - b.uniqueStudents,
            render: (count) => <Tag color="cyan">{count} ta</Tag>,
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
                <Title level={1} style={{ margin: 0, color: '#1e293b', marginBottom: '8px' }}>O'qituvchilar Reytingi</Title>
                <Text style={{ fontSize: '18px', color: '#64748b' }}>
                    Platformadagi eng faol va natijali o'qituvchilar
                </Text>
            </div>

            {/* Stats Cards */}
            <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
                <Col xs={24} sm={12} md={6}>
                    <StatCard title="Jami o'qituvchilar" value={stats.totalTeachers} icon={<TeamOutlined />} color="#2563eb" />
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <StatCard title="O'rtacha testlar" value={stats.averageTests} icon={<StarOutlined />} color="#16a34a" />
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <StatCard title="O'rtacha ball" value={stats.averageScore} suffix="%" icon={<RiseOutlined />} color="#f59e0b" />
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <StatCard title="Top o'qituvchi" value={stats.topTeacher} icon={<TrophyOutlined />} color="#7c3aed" />
                </Col>
            </Row>

            {/* Top 3 Teachers */}
            <Row gutter={[24, 24]} style={{ marginBottom: 48 }} justify="center">
                {teachers.slice(0, 3).map((teacher, index) => (
                    <Col xs={24} sm={8} md={7} key={teacher.id}>
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
                                <Avatar size={80} src={teacher.profilePhoto} icon={<UserOutlined />} style={{ backgroundColor: index === 0 ? '#fffbeb' : '#f1f5f9', color: index === 0 ? '#d97706' : '#64748b' }}>
                                    {teacher.name?.charAt(0)}
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

                            <Title level={4} style={{ margin: '16px 0 4px', color: '#1e293b' }}>{teacher.name}</Title>

                            <Space split={<div style={{ width: 1, height: 24, background: '#e2e8f0' }}></div>} style={{ width: '100%', justifyContent: 'center', marginTop: 16 }}>
                                <div style={{ textAlign: 'center' }}>
                                    <Text type="secondary" style={{ fontSize: 12 }}>Ball</Text>
                                    <div style={{ fontWeight: 'bold', color: '#10b981' }}>{teacher.averageScore}%</div>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <Text type="secondary" style={{ fontSize: 12 }}>Urinishlar</Text>
                                    <div style={{ fontWeight: 'bold', color: '#2563eb' }}>{teacher.totalAttempts}</div>
                                </div>
                            </Space>
                        </Card>
                    </Col>
                ))}
            </Row>

            {/* User Rank Alert */}
            {myRank && myRank > 3 && (
                <Alert
                    message={
                        <Space>
                            <TrophyOutlined style={{ color: '#2563eb' }} />
                            <Text>Sizning joriy reytingingiz: <Text strong>#{myRank}</Text></Text>
                        </Space>
                    }
                    type="info"
                    showIcon={false}
                    style={{ marginBottom: 24, borderRadius: 12, border: '1px solid #bfdbfe', backgroundColor: '#eff6ff' }}
                />
            )}

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
                        <TrophyOutlined style={{ color: '#eab308' }} /> Umumiy reyting
                    </Title>
                    <Input
                        placeholder="Ism yoki fan bo'yicha qidirish..."
                        prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
                        value={searchText}
                        onChange={handleSearch}
                        style={{ width: 280 }}
                        allowClear
                    />
                </div>

                <Table
                    columns={columns}
                    dataSource={filteredTeachers}
                    rowKey="id"
                    pagination={{ pageSize: 15 }}
                    rowClassName={(record) => record.id === currentUser?.id ? 'bg-blue-50' : ''}
                />
            </Card>

            <style>{`
                .bg-blue-50 {
                    background-color: #eff6ff;
                }
            `}</style>
        </div>
    );
};

export default TeacherRating;
