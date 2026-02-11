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
                <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                            <Button
                                icon={<ArrowLeftOutlined />}
                                onClick={() => navigate(-1)}
                                style={{ border: '3px solid #000', boxShadow: '4px 4px 0px #000', height: '40px', width: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            />
                            <div style={{ backgroundColor: '#000', color: '#fff', padding: '4px 10px', fontWeight: 900, fontSize: '12px', textTransform: 'uppercase' }}>
                                O'quvchi Profili
                            </div>
                        </div>
                        <Title level={1} style={{ margin: 0, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-2px', fontSize: 'clamp(32px, 5vw, 64px)', lineHeight: 1 }}>
                            {student.first_name} <br />
                            <span style={{ color: '#2563eb', fontSize: 'clamp(28px, 4.5vw, 56px)' }}>{student.last_name || student.name}</span>
                        </Title>
                    </div>

                    <div style={{ backgroundColor: '#000', border: '8px solid #000', boxShadow: '12px 12px 0px #2563eb' }}>
                        <Avatar
                            size={120}
                            shape="square"
                            src={student.profile_photo && (student.profile_photo.startsWith('http') ? student.profile_photo : `${apiService.baseURL.replace('/api', '')}${student.profile_photo}`)}
                            icon={<BarChartOutlined style={{ fontSize: '50px', color: '#fff' }} />}
                            style={{ borderRadius: 0 }}
                        />
                    </div>
                </div>

                {/* Status / Tags */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
                    <Tag style={{ border: '2px solid #000', padding: '4px 10px', fontWeight: 900, backgroundColor: '#000', color: '#fff', fontSize: '11px' }}>
                        SINF: {student.class_group || 'NOMA\'LUM'}
                    </Tag>
                    <Tag style={{ border: '2px solid #000', padding: '4px 10px', fontWeight: 900, backgroundColor: '#fff', fontSize: '11px' }}>
                        YO'NALISH: {student.direction?.toUpperCase() || 'YO\'NALISHSIZ'}
                    </Tag>
                    {student.is_premium && (
                        <Tag style={{ border: '2px solid #000', padding: '4px 10px', fontWeight: 900, backgroundColor: '#f59e0b', color: '#000', fontSize: '11px' }}>
                            PREMIUM O'QUVCHI
                        </Tag>
                    )}
                    <Tag style={{ border: '2px solid #000', padding: '4px 10px', fontWeight: 900, backgroundColor: '#dbeafe', fontSize: '11px' }}>
                        ID: #{student.id}
                    </Tag>
                </div>

                {/* Stats Grid */}
                <Row gutter={[16, 16]} style={{ marginBottom: '32px' }}>
                    {[
                        { title: 'JAMI TESTLAR', value: totalTests, suffix: 'TA', icon: <BarChartOutlined />, color: '#dbeafe' },
                        { title: 'O\'RTACHA BALL', value: averageScore, suffix: '%', icon: <LineChartOutlined />, color: '#f0fdf4' },
                        { title: 'ENG YUQORI', value: highestScore, suffix: '%', icon: <TrophyOutlined />, color: '#fef9c3' },
                        { title: 'YULDUZLAR', value: student.stars || 0, suffix: 'TA', icon: <StarOutlined />, color: '#fff7ed' }
                    ].map((stat, i) => (
                        <Col xs={12} sm={12} md={6} key={i}>
                            <div style={{
                                border: '3px solid #000',
                                padding: '16px',
                                boxShadow: '6px 6px 0px #000',
                                backgroundColor: stat.color,
                                height: '100%'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                    <div style={{ backgroundColor: '#000', color: '#fff', padding: '2px 6px', fontWeight: 900, fontSize: '10px', textTransform: 'uppercase' }}>
                                        {stat.title}
                                    </div>
                                    <span style={{ fontSize: '18px' }}>{stat.icon}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                                    <span style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 900, letterSpacing: '-1px' }}>{stat.value}</span>
                                    <span style={{ fontSize: '12px', fontWeight: 900 }}>{stat.suffix}</span>
                                </div>
                            </div>
                        </Col>
                    ))}
                </Row>

                {/* Recent Activity Table */}
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                        <div style={{ width: '8px', height: '30px', backgroundColor: '#000' }}></div>
                        <Title level={2} style={{ margin: 0, fontWeight: 900, textTransform: 'uppercase', fontSize: 'clamp(20px, 3vw, 28px)' }}>
                            So'nggi Urinishlar
                        </Title>
                    </div>

                    <div style={{ border: '3px solid #000', boxShadow: '8px 8px 0px rgba(0,0,0,0.1)' }}>
                        <Table
                            columns={columns}
                            dataSource={attempts}
                            rowKey="id"
                            pagination={{ pageSize: 5 }}
                            scroll={{ x: 600 }}
                        />
                    </div>
                </div>

                <style>{`
          .ant-table-thead > tr > th {
            background: #000 !important;
            color: #fff !important;
            border-radius: 0 !important;
            font-weight: 900 !important;
            padding: 12px 16px !important;
            text-transform: uppercase !important;
            border-bottom: 3px solid #000 !important;
            font-size: 12px !important;
          }
          .ant-table-tbody > tr > td {
            padding: 10px 16px !important;
            border-bottom: 2px solid #000 !important;
            font-size: 13px !important;
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
