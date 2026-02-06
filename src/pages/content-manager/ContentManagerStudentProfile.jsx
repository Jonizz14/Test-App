import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Typography, Button, Avatar, Tag, Row, Col, Alert, Statistic, ConfigProvider, Table, Spin } from 'antd';
import {
    ArrowLeftOutlined,
    CheckCircleOutlined,
    TrophyOutlined,
    BarChartOutlined,
    StarOutlined,
    LineChartOutlined
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../data/apiService';

const { Title, Text } = Typography;

const ContentManagerStudentProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [student, setStudent] = useState(null);
    const [attempts, setAttempts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadStudentProfile = async () => {
            try {
                setLoading(true);
                const users = await apiService.getUsers();
                const studentData = users.find(user => user.id === parseInt(id));
                setStudent(studentData);

                if (!studentData) {
                    setError('O\'quvchi topilmadi');
                    return;
                }

                const allAttempts = await apiService.getAttempts({ student: id });
                setAttempts(allAttempts);

            } catch (error) {
                console.error('Failed to load student profile:', error);
                setError('Ma\'lumotlarni yuklashda xatolik yuz berdi');
            } finally {
                setLoading(false);
            }
        };

        loadStudentProfile();
    }, [id]);

    const totalTests = attempts.length;
    const scores = attempts.map(attempt => attempt.score || 0);
    const averageScore = scores.length > 0
        ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
        : 0;
    const highestScore = scores.length > 0
        ? Math.round(Math.max(...scores))
        : 0;

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
                <Spin size="large" />
            </div>
        );
    }

    if (error || !student) {
        return (
            <div style={{ padding: '20px' }}>
                <Alert
                    message={<Text style={{ fontWeight: 900 }}>XATOLIK</Text>}
                    description={error || 'O\'quvchi topilmadi'}
                    type="error"
                    showIcon
                    style={{ border: '4px solid #000', borderRadius: 0 }}
                />
                <Button
                    onClick={() => navigate(-1)}
                    style={{ marginTop: '20px', border: '2px solid #000', fontWeight: 900 }}
                >
                    ORTGA QAYTISH
                </Button>
            </div>
        );
    }

    const columns = [
        {
            title: 'TEST NOMI',
            dataIndex: 'test_title',
            key: 'test',
            render: (text, record) => <Text style={{ fontWeight: 900 }}>{text || record.test}</Text>
        },
        {
            title: 'BALL',
            dataIndex: 'score',
            key: 'score',
            render: (score) => (
                <div style={{
                    display: 'inline-block',
                    padding: '2px 8px',
                    border: '2px solid #000',
                    fontWeight: 900,
                    backgroundColor: score >= 60 ? '#ecfdf5' : '#fef2f2'
                }}>
                    {score}%
                </div>
            )
        },
        {
            title: 'SANA',
            dataIndex: 'submitted_at',
            key: 'date',
            render: (date) => <Text style={{ fontWeight: 700 }}>{new Date(date).toLocaleDateString('uz-UZ')}</Text>
        },
        {
            title: 'BATAFSIL',
            key: 'actions',
            render: (attempt) => (
                <Button
                    onClick={() => navigate(`/content-manager/student-result/${attempt.id}`)}
                    style={{ border: '2px solid #000', fontWeight: 900, fontSize: '11px' }}
                >
                    KO'RISH
                </Button>
            )
        }
    ];

    return (
        <ConfigProvider theme={{ token: { borderRadius: 0, colorPrimary: '#000' } }}>
            <div style={{ paddingBottom: '60px' }}>

                {/* HeaderSection */}
                <div style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '24px' }}>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                            <Button
                                icon={<ArrowLeftOutlined />}
                                onClick={() => navigate(-1)}
                                style={{ border: '3px solid #000', boxShadow: '4px 4px 0px #000', height: '44px', width: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            />
                            <div style={{ backgroundColor: '#000', color: '#fff', padding: '4px 12px', fontWeight: 900, fontSize: '14px', textTransform: 'uppercase' }}>
                                O'quvchi Profili
                            </div>
                        </div>
                        <Title level={1} style={{ margin: 0, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-2px', fontSize: '64px', lineHeight: 0.9 }}>
                            {student.first_name} <br />
                            <span style={{ color: '#2563eb' }}>{student.last_name || student.name}</span>
                        </Title>
                    </div>

                    <div style={{ backgroundColor: '#000', border: '8px solid #000', boxShadow: '12px 12px 0px #2563eb' }}>
                        <Avatar
                            size={180}
                            shape="square"
                            src={student.profile_photo && (student.profile_photo.startsWith('http') ? student.profile_photo : `${apiService.baseURL.replace('/api', '')}${student.profile_photo}`)}
                            icon={<BarChartOutlined style={{ fontSize: '80px', color: '#fff' }} />}
                            style={{ borderRadius: 0 }}
                        />
                    </div>
                </div>

                {/* Status / Tags */}
                <div style={{ display: 'flex', gap: '12px', marginBottom: '40px', flexWrap: 'wrap' }}>
                    <Tag style={{ border: '3px solid #000', padding: '6px 16px', fontWeight: 900, backgroundColor: '#000', color: '#fff' }}>
                        SINF: {student.class_group || 'NOMA\'LUM'}
                    </Tag>
                    <Tag style={{ border: '3px solid #000', padding: '6px 16px', fontWeight: 900, backgroundColor: '#fff' }}>
                        YO'NALISH: {student.direction?.toUpperCase() || 'YO\'NALISHSIZ'}
                    </Tag>
                    {student.is_premium && (
                        <Tag style={{ border: '3px solid #000', padding: '6px 16px', fontWeight: 900, backgroundColor: '#f59e0b', color: '#000' }}>
                            PREMIUM O'QUVCHI
                        </Tag>
                    )}
                    <Tag style={{ border: '3px solid #000', padding: '6px 16px', fontWeight: 900, backgroundColor: '#dbeafe' }}>
                        ID: #{student.id}
                    </Tag>
                </div>

                {/* Stats Grid */}
                <Row gutter={[24, 24]} style={{ marginBottom: '48px' }}>
                    {[
                        { title: 'JAMI TESTLAR', value: totalTests, suffix: 'TA', icon: <BarChartOutlined />, color: '#dbeafe' },
                        { title: 'O\'RTACHA BALL', value: averageScore, suffix: '%', icon: <LineChartOutlined />, color: '#f0fdf4' },
                        { title: 'ENG YUQORI', value: highestScore, suffix: '%', icon: <TrophyOutlined />, color: '#fef9c3' },
                        { title: 'YULDUZLAR', value: student.stars || 0, suffix: 'TA', icon: <StarOutlined />, color: '#fff7ed' }
                    ].map((stat, i) => (
                        <Col xs={24} sm={12} md={6} key={i}>
                            <div style={{
                                backgroundColor: '#fff',
                                border: '4px solid #000',
                                padding: '24px',
                                boxShadow: '8px 8px 0px #000',
                                backgroundColor: stat.color
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                    <div style={{ backgroundColor: '#000', color: '#fff', padding: '2px 8px', fontWeight: 900, fontSize: '12px', textTransform: 'uppercase' }}>
                                        {stat.title}
                                    </div>
                                    <span style={{ fontSize: '24px' }}>{stat.icon}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                                    <span style={{ fontSize: '42px', fontWeight: 900, letterSpacing: '-2px' }}>{stat.value}</span>
                                    <span style={{ fontSize: '16px', fontWeight: 900 }}>{stat.suffix}</span>
                                </div>
                            </div>
                        </Col>
                    ))}
                </Row>

                {/* Recent Activity Table */}
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                        <div style={{ width: '12px', height: '40px', backgroundColor: '#000' }}></div>
                        <Title level={2} style={{ margin: 0, fontWeight: 900, textTransform: 'uppercase' }}>
                            So'nggi Urinishlar
                        </Title>
                    </div>

                    <div style={{ border: '4px solid #000', boxShadow: '12px 12px 0px rgba(0,0,0,0.1)' }}>
                        <Table
                            columns={columns}
                            dataSource={attempts}
                            rowKey="id"
                            pagination={{ pageSize: 5 }}
                            scroll={{ x: 800 }}
                        />
                    </div>
                </div>

                <style>{`
          .ant-table-thead > tr > th {
            background: #000 !important;
            color: #fff !important;
            border-radius: 0 !important;
            font-weight: 900 !important;
            padding: 16px 20px !important;
            text-transform: uppercase !important;
            border-bottom: 4px solid #000 !important;
          }
          .ant-table-tbody > tr > td {
            padding: 12px 20px !important;
            border-bottom: 2px solid #000 !important;
          }
          .ant-table-tbody > tr:hover > td {
            background: #f8fafc !important;
          }
        `}</style>
            </div>
        </ConfigProvider>
    );
};

export default ContentManagerStudentProfile;
