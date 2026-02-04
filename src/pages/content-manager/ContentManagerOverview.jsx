import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Typography, Row, Col, Statistic, Spin, Alert, Button, List, Avatar, ConfigProvider } from 'antd';
import {
    BookOutlined,
    TrophyOutlined,
    BarChartOutlined,
    TeamOutlined,
    UserOutlined,
    ClockCircleOutlined,
    CheckCircleOutlined,
    RiseOutlined,
    GlobalOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../data/apiService';
import 'animate.css';

const { Title, Text, Paragraph } = Typography;

const ContentManagerOverview = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalTests: 0,
        activeTests: 0,
        totalAttempts: 0,
        uniqueStudents: 0,
        averageScore: 0,
        highestScore: 0,
        lowestScore: 0,
        recentActivity: []
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchStatistics = async () => {
            try {
                setLoading(true);
                const testsResponse = await apiService.getTests({ teacher: currentUser.id });
                const managerTests = testsResponse.results || testsResponse;
                const attemptsResponse = await apiService.getAttempts();
                const allAttempts = attemptsResponse.results || attemptsResponse;
                const managerAttempts = allAttempts.filter(attempt =>
                    managerTests.some(test => test.id === attempt.test)
                );
                const usersResponse = await apiService.getUsers();
                const allUsers = usersResponse.results || usersResponse;
                const studentUsers = allUsers.filter(user => user.role === 'student');

                const totalTests = managerTests.length;
                const activeTests = managerTests.filter(test => test.is_active !== false).length;
                const totalAttempts = managerAttempts.length;
                const uniqueStudents = new Set(managerAttempts.map(attempt => attempt.student)).size;
                const scores = managerAttempts.map(attempt => attempt.score || 0);
                const averageScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
                const highestScore = scores.length > 0 ? Math.round(Math.max(...scores)) : 0;
                const lowestScore = scores.length > 0 ? Math.round(Math.min(...scores)) : 0;

                const recentActivity = managerAttempts
                    .sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at))
                    .slice(0, 5)
                    .map(attempt => ({
                        id: attempt.id,
                        user: studentUsers.find(s => s.id === attempt.student)?.name || 'O' + "'" + 'quvchi',
                        test: managerTests.find(t => t.id === attempt.test)?.title || 'Test',
                        score: attempt.score,
                        time: new Date(attempt.submitted_at).toLocaleDateString('uz-UZ')
                    }));

                setStats({ totalTests, activeTests, totalAttempts, uniqueStudents, averageScore, highestScore, lowestScore, recentActivity });
            } catch (err) {
                setError('Xatolik yuz berdi');
            } finally {
                setLoading(false);
            }
        };
        fetchStatistics();
    }, [currentUser.id]);

    const StatBox = ({ title, value, icon, delay, suffix }) => (
        <div className="animate__animated animate__fadeIn" style={{ animationDelay: delay }}>
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
        </div>
    );

    if (loading) return <div style={{ textAlign: 'center', padding: '100px' }}><Spin size="large" /></div>;

    return (
        <ConfigProvider theme={{ token: { borderRadius: 0, colorPrimary: '#000' } }}>
            <div style={{ paddingBottom: '40px' }}>
                <div style={{ marginBottom: '32px' }}>
                    <div style={{ display: 'inline-block', backgroundColor: '#000', color: '#fff', padding: '6px 12px', fontWeight: 900, fontSize: '12px', textTransform: 'uppercase', marginBottom: '12px' }}>
                        Content Manager
                    </div>
                    <Title level={1} style={{ margin: 0, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-1px' }}>
                        Global Boshqaruv Paneli
                    </Title>
                    <div style={{ width: '60px', height: '8px', backgroundColor: '#000', margin: '20px 0' }}></div>
                </div>

                <Row gutter={[24, 24]}>
                    <Col xs={24} sm={12} lg={6}><StatBox title="Jami Testlar" value={stats.totalTests} icon={<BookOutlined />} delay="0.1s" /></Col>
                    <Col xs={24} sm={12} lg={6}><StatBox title="Faol Testlar" value={stats.activeTests} icon={<CheckCircleOutlined />} delay="0.2s" /></Col>
                    <Col xs={24} sm={12} lg={6}><StatBox title="Urinishlar" value={stats.totalAttempts} icon={<ClockCircleOutlined />} delay="0.3s" /></Col>
                    <Col xs={24} sm={12} lg={6}><StatBox title="O'rtacha Ball" value={stats.averageScore} suffix="%" icon={<RiseOutlined />} delay="0.4s" /></Col>
                </Row>

                <Row gutter={[32, 32]} style={{ marginTop: '40px' }}>
                    <Col span={24}>
                        <Card title={<Text style={{ fontWeight: 900, textTransform: 'uppercase' }}>Oxirgi Faollik</Text>} style={{ border: '4px solid #000', boxShadow: '10px 10px 0px rgba(0,0,0,0.05)' }}>
                            <List
                                dataSource={stats.recentActivity}
                                renderItem={item => (
                                    <List.Item style={{ borderBottom: '2px solid #f0f0f0' }}>
                                        <List.Item.Meta
                                            avatar={<Avatar icon={<UserOutlined />} style={{ borderRadius: 0, border: '2px solid #000' }} />}
                                            title={<Text style={{ fontWeight: 800 }}>{item.user}</Text>}
                                            description={`${item.test} ni yakunladi - ${item.time}`}
                                        />
                                        <div style={{ border: '3px solid #000', padding: '4px 12px', fontWeight: 900, backgroundColor: item.score >= 60 ? '#ecfdf5' : '#fef2f2' }}>
                                            {item.score}%
                                        </div>
                                    </List.Item>
                                )}
                            />
                        </Card>
                    </Col>
                </Row>
            </div>
        </ConfigProvider>
    );
};

export default ContentManagerOverview;
