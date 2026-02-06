import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Typography,
    Card,
    Table,
    Button,
    Tag,
    Alert,
    Row,
    Col,
    Avatar,
    Space,
    Statistic,
    Divider,
    Modal,
    ConfigProvider,
    Spin
} from 'antd';
import {
    ArrowLeftOutlined as ArrowBackIcon,
    BarChartOutlined as AssessmentIcon,
    UserOutlined as PersonIcon,
    CheckCircleOutlined as CheckCircleIcon,
    CloseCircleOutlined as CancelIcon,
    TeamOutlined as PeopleIcon,
    ArrowUpOutlined as TrendingUpIcon,
    TrophyOutlined as EmojiEventsIcon,
    ArrowDownOutlined as TrendingDownIcon,
    InfoCircleOutlined
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../data/apiService';

const { Title, Text } = Typography;

const ContentManagerTestDetails = () => {
    const { testId } = useParams();
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [test, setTest] = useState(null);
    const [attempts, setAttempts] = useState([]);
    const [allStudents, setAllStudents] = useState([]);
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadTestDetails();
    }, [testId]);

    const loadTestDetails = async () => {
        try {
            setLoading(true);
            const foundTest = await apiService.getTest(testId);

            if (!foundTest) {
                setError('Test topilmadi');
                setLoading(false);
                return;
            }

            setTest(foundTest);

            const attemptsResponse = await apiService.getAttempts({ test: testId });
            const testAttempts = attemptsResponse.results || attemptsResponse;
            setAttempts(testAttempts);

            const questionsResponse = await apiService.getQuestions({ test: testId });
            const testQuestions = questionsResponse.results || questionsResponse;
            setQuestions(testQuestions);

            const usersResponse = await apiService.getUsers();
            const allUsers = usersResponse.results || usersResponse;
            const students = allUsers.filter(user => user.role === 'student');
            setAllStudents(students);

            setLoading(false);
        } catch (err) {
            console.error('Failed to load test details:', err);
            setError('Test tafsilotlarini yuklashda xatolik yuz berdi');
            setLoading(false);
        }
    };

    const getScoreColor = (score) => {
        if (score >= 90) return '#ecfdf5';
        if (score >= 70) return '#fffbeb';
        return '#fef2f2';
    };

    const getScoreText = (score) => {
        if (score >= 90) return 'Ajoyib';
        if (score >= 80) return 'Yaxshi';
        if (score >= 70) return 'Qoniqarli';
        if (score >= 60) return 'Qoniqarsiz';
        return 'Yomon';
    };

    const isAnswerCorrect = (attempt, question) => {
        const studentAnswer = attempt.answers?.[question.id] || '';
        return studentAnswer === question.correct_answer || studentAnswer === question.correctAnswer;
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
                <Spin size="large" />
            </div>
        );
    }

    if (error || !test) {
        return (
            <div style={{ padding: '20px' }}>
                <Alert
                    message={<Text style={{ fontWeight: 900 }}>XATOLIK</Text>}
                    description={error || 'Test topilmadi'}
                    type="error"
                    showIcon
                    style={{ border: '4px solid #000', borderRadius: 0 }}
                />
                <Button
                    onClick={() => navigate('/content-manager/my-tests')}
                    style={{ marginTop: '20px', border: '2px solid #000', fontWeight: 900 }}
                >
                    ORTGA QAYTISH
                </Button>
            </div>
        );
    }

    const totalAttempts = attempts.length;
    const averageScore = totalAttempts > 0
        ? Math.round(attempts.reduce((sum, a) => sum + a.score, 0) / totalAttempts)
        : 0;
    const highestScore = totalAttempts > 0 ? Math.max(...attempts.map(a => a.score)) : 0;
    const lowestScore = totalAttempts > 0 ? Math.min(...attempts.map(a => a.score)) : 0;

    const columns = [
        {
            title: 'O\'QUVCHI',
            key: 'student',
            render: (attempt) => {
                const student = allStudents.find(s => s.id === attempt.student);
                return (
                    <Space>
                        <Avatar
                            icon={<PersonIcon />}
                            style={{ backgroundColor: '#000', border: '2px solid #fff' }}
                            src={student?.profile_photo && (student.profile_photo.startsWith('http') ? student.profile_photo : `${apiService.baseURL.replace('/api', '')}${student.profile_photo}`)}
                        />
                        <div>
                            <div
                                style={{ fontWeight: 900, cursor: 'pointer', textTransform: 'uppercase' }}
                                onClick={() => navigate(`/content-manager/student-profile/${student?.id}`)}
                            >
                                {student?.name || student?.first_name || 'Noma\'lum'} {student?.last_name || ''}
                            </div>
                            <Text style={{ fontSize: '10px', fontWeight: 700, opacity: 0.6 }}>
                                {student?.direction === 'natural' ? 'TABIIY' : student?.direction === 'exact' ? 'ANIQ' : 'YO\'NALISHSIZ'}
                            </Text>
                        </div>
                    </Space>
                );
            },
        },
        {
            title: 'BALL',
            dataIndex: 'score',
            key: 'score',
            render: (score) => (
                <div style={{
                    display: 'inline-block',
                    padding: '4px 12px',
                    border: '2px solid #000',
                    fontWeight: 900,
                    backgroundColor: getScoreColor(score),
                    fontSize: '16px'
                }}>
                    {score}%
                </div>
            ),
        },
        {
            title: 'TO\'G\'RI / NOTO\'G\'RI',
            key: 'answers',
            render: (attempt) => {
                let correct = 0;
                questions.forEach(q => { if (isAnswerCorrect(attempt, q)) correct++; });
                const incorrect = questions.length - correct;
                return (
                    <Space>
                        <Tag style={{ border: '2px solid #000', fontWeight: 900, borderRadius: 0, backgroundColor: '#ecfdf5' }}>
                            +{correct}
                        </Tag>
                        <Tag style={{ border: '2px solid #000', fontWeight: 900, borderRadius: 0, backgroundColor: '#fef2f2' }}>
                            -{incorrect}
                        </Tag>
                    </Space>
                );
            },
        },
        {
            title: 'VAQT',
            dataIndex: 'time_taken',
            key: 'time',
            render: (time) => (
                <Text style={{ fontWeight: 800 }}>
                    {`${Math.floor(time / 60)}:${(time % 60).toString().padStart(2, '0')}`}
                </Text>
            ),
        },
        {
            title: 'SANA',
            dataIndex: 'submitted_at',
            key: 'date',
            render: (date) => (
                <Text style={{ fontWeight: 700, fontSize: '12px' }}>
                    {new Date(date).toLocaleDateString('uz-UZ')}
                </Text>
            ),
        },
        {
            title: 'BAHO',
            dataIndex: 'score',
            key: 'grade',
            render: (score) => (
                <Tag style={{ border: '2px solid #000', fontWeight: 900, borderRadius: 0, textTransform: 'uppercase', backgroundColor: '#fff' }}>
                    {getScoreText(score)}
                </Tag>
            ),
        },
        {
            title: 'BATAFSIL',
            key: 'actions',
            render: (attempt) => (
                <Button
                    onClick={() => navigate(`/content-manager/student-result/${attempt.id}`)}
                    style={{ border: '2px solid #000', fontWeight: 900, fontSize: '11px', height: '32px' }}
                >
                    NATIJA
                </Button>
            )
        }
    ];

    return (
        <ConfigProvider theme={{ token: { borderRadius: 0, colorPrimary: '#000' } }}>
            <div style={{ paddingBottom: '60px' }}>

                {/* Header Section */}
                <div style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '24px' }}>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                            <Button
                                icon={<ArrowBackIcon />}
                                onClick={() => navigate('/content-manager/my-tests')}
                                style={{ border: '3px solid #000', boxShadow: '4px 4px 0px #000', height: '44px', width: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            />
                            <div style={{ backgroundColor: '#000', color: '#fff', padding: '4px 12px', fontWeight: 900, fontSize: '14px', textTransform: 'uppercase' }}>
                                Test Tafsilotlari
                            </div>
                        </div>
                        <Title level={1} style={{ margin: 0, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-2px', fontSize: '48px', lineHeight: 1 }}>
                            {test.title}
                        </Title>
                        <div style={{ marginTop: '16px', maxWidth: '800px' }}>
                            <Text style={{ fontSize: '18px', fontWeight: 600, color: '#444' }}>
                                {test.description || 'Ushbu test uchun tavsif kiritilmagan.'}
                            </Text>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', marginTop: '24px', flexWrap: 'wrap' }}>
                            <Tag style={{ border: '3px solid #000', padding: '4px 12px', fontWeight: 900, backgroundColor: '#dbeafe' }}>
                                FAN: {test.subject?.toUpperCase()}
                            </Tag>
                            <Tag style={{ border: '3px solid #000', padding: '4px 12px', fontWeight: 900, backgroundColor: '#fef9c3' }}>
                                SAVOLLAR: {test.total_questions} TA
                            </Tag>
                            <Tag style={{ border: '3px solid #000', padding: '4px 12px', fontWeight: 900, backgroundColor: '#ffedd5' }}>
                                VAQT: {test.time_limit} DAQIQA
                            </Tag>
                            <Tag style={{ border: '3px solid #000', padding: '4px 12px', fontWeight: 900, backgroundColor: test.is_active ? '#000' : '#fff', color: test.is_active ? '#fff' : '#000' }}>
                                HOLAT: {test.is_active ? 'FAOL' : 'NOFAOL'}
                            </Tag>
                        </div>
                    </div>

                    <div style={{ minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <Button
                            type="primary"
                            icon={<AssessmentIcon />}
                            onClick={() => navigate(`/content-manager/edit-test/${testId}`)}
                            size="large"
                            style={{ height: '60px', border: '4px solid #000', boxShadow: '8px 8px 0px #000', fontWeight: 900, textTransform: 'uppercase', fontSize: '18px' }}
                        >
                            Testni Tahrirlash
                        </Button>
                    </div>
                </div>

                {/* Statistics Grid */}
                <Row gutter={[24, 24]} style={{ marginBottom: '48px' }}>
                    {[
                        { title: 'TOPSHIRDILAR', value: totalAttempts, suffix: 'TA', icon: <PeopleIcon />, color: '#dbeafe' },
                        { title: 'O\'RTACHA BALL', value: averageScore, suffix: '%', icon: <TrendingUpIcon />, color: '#f0fdf4' },
                        { title: 'ENG YUQORI', value: highestScore, suffix: '%', icon: <EmojiEventsIcon />, color: '#fef9c3' },
                        { title: 'ENG PAST', value: lowestScore, suffix: '%', icon: <TrendingDownIcon />, color: '#fef2f2' }
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

                {/* Attempts Table */}
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                        <div style={{ width: '12px', height: '40px', backgroundColor: '#000' }}></div>
                        <Title level={2} style={{ margin: 0, fontWeight: 900, textTransform: 'uppercase' }}>
                            Barcha Urinishlar ({attempts.length})
                        </Title>
                    </div>

                    {attempts.length === 0 ? (
                        <div style={{ border: '4px dashed #ccc', padding: '60px', textAlign: 'center' }}>
                            <InfoCircleOutlined style={{ fontSize: '48px', color: '#ccc', marginBottom: '16px' }} />
                            <Title level={4} style={{ color: '#aaa', margin: 0 }}>Hali hech kim bu testdan o'tmadi</Title>
                        </div>
                    ) : (
                        <div style={{ border: '4px solid #000', boxShadow: '12px 12px 0px rgba(0,0,0,0.1)' }}>
                            <Table
                                columns={columns}
                                dataSource={attempts}
                                rowKey="id"
                                pagination={{
                                    pageSize: 10,
                                    // Simplified pagination for brutalist look
                                }}
                                scroll={{ x: 1000 }}
                            />
                        </div>
                    )}
                </div>

                <style>{`
          .ant-table-thead > tr > th {
            background: #000 !important;
            color: #fff !important;
            border-radius: 0 !important;
            font-weight: 900 !important;
            padding: 20px !important;
            text-transform: uppercase !important;
            border-bottom: 4px solid #000 !important;
          }
          .ant-table-tbody > tr > td {
            padding: 16px 20px !important;
            border-bottom: 2px solid #000 !important;
          }
          .ant-table-tbody > tr:hover > td {
            background: #f8fafc !important;
          }
          .ant-pagination-item-active {
            border-color: #000 !important;
            background: #000 !important;
          }
          .ant-pagination-item-active a {
            color: #fff !important;
          }
          .ant-pagination-item, .ant-pagination-prev, .ant-pagination-next {
            border: 2px solid #000 !important;
            border-radius: 0 !important;
            font-weight: 800 !important;
          }
        `}</style>
            </div>
        </ConfigProvider>
    );
};

export default ContentManagerTestDetails;
