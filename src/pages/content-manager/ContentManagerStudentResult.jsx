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
    ConfigProvider,
    Spin
} from 'antd';
import {
    ArrowLeftOutlined as ArrowBackIcon,
    PersonOutlined as PersonIcon,
    BarChartOutlined as AssessmentIcon,
    StarOutlined as StarIcon,
    CheckCircleOutlined,
    CloseCircleOutlined,
    InfoCircleOutlined
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../data/apiService';

const { Title, Text } = Typography;

const ContentManagerStudentResult = () => {
    const { attemptId } = useParams();
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [attempt, setAttempt] = useState(null);
    const [student, setStudent] = useState(null);
    const [test, setTest] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadStudentResult();
    }, [attemptId]);

    const loadStudentResult = async () => {
        try {
            setLoading(true);
            const foundAttempt = await apiService.getAttempt(attemptId);

            if (!foundAttempt) {
                setError('Natija topilmadi');
                setLoading(false);
                return;
            }

            setAttempt(foundAttempt);

            const foundTest = await apiService.getTest(foundAttempt.test);
            setTest(foundTest);

            const usersResponse = await apiService.getUsers();
            const allUsers = usersResponse.results || usersResponse;
            const foundStudent = allUsers.find(user => user.id === foundAttempt.student && user.role === 'student');
            setStudent(foundStudent);

            const questionsResponse = await apiService.getQuestions({ test: foundAttempt.test });
            let testQuestions = questionsResponse.results || questionsResponse;

            if (testQuestions.length === 0 && foundAttempt.answers) {
                const answerKeys = Object.keys(foundAttempt.answers);
                testQuestions = answerKeys.map((questionId, index) => ({
                    id: questionId,
                    test: foundAttempt.test,
                    question_text: `Savol ${index + 1}`,
                    question_type: 'short_answer',
                    options: [],
                    correct_answer: 'Noma\'lum',
                    explanation: 'Savol tafsilotlari mavjud emas'
                }));
            }

            setQuestions(testQuestions);
            setLoading(false);
        } catch (err) {
            console.error('Failed to load student result:', err);
            setError('Ma\'lumotlarni yuklashda xatolik yuz berdi');
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

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
                <Spin size="large" />
            </div>
        );
    }

    if (error || !attempt || !test) {
        return (
            <div style={{ padding: '20px' }}>
                <Alert
                    message={<Text style={{ fontWeight: 900 }}>XATOLIK</Text>}
                    description={error || 'Ma\'lumot topilmadi'}
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
            title: 'SAVOL',
            key: 'question',
            render: (_, record, index) => (
                <div style={{ maxWidth: '600px' }}>
                    <Text style={{ fontWeight: 900 }}>{index + 1}.</Text> {record.question_text}
                </div>
            )
        },
        {
            title: 'O\'QUVCHI JAVOBI',
            key: 'studentAnswer',
            render: (record) => {
                const answer = attempt.answers?.[record.id] || 'Javob berilmagan';
                const isCorrect = answer === record.correct_answer || answer === record.correctAnswer;
                return (
                    <div style={{
                        padding: '4px 12px',
                        border: '2px solid #000',
                        fontWeight: 800,
                        backgroundColor: isCorrect ? '#ecfdf5' : '#fef2f2'
                    }}>
                        {answer}
                    </div>
                );
            }
        },
        {
            title: 'TO\'G\'RI JAVOB',
            key: 'correctAnswer',
            render: (record) => (
                <Text style={{ fontWeight: 900, color: '#059669' }}>
                    {record.correct_answer || record.correctAnswer}
                </Text>
            )
        },
        {
            title: 'STAUTS',
            key: 'status',
            render: (record) => {
                const answer = attempt.answers?.[record.id] || '';
                const isCorrect = answer === record.correct_answer || answer === record.correctAnswer;
                return (
                    <Tag style={{ border: '2px solid #000', borderRadius: 0, fontWeight: 900, backgroundColor: isCorrect ? '#000' : '#fff', color: isCorrect ? '#fff' : '#000' }}>
                        {isCorrect ? 'TO\'G\'RI' : 'NOTO\'G\'RI'}
                    </Tag>
                );
            }
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
                                onClick={() => navigate(-1)}
                                style={{ border: '3px solid #000', boxShadow: '4px 4px 0px #000', height: '44px', width: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            />
                            <div style={{ backgroundColor: '#000', color: '#fff', padding: '4px 12px', fontWeight: 900, fontSize: '14px', textTransform: 'uppercase' }}>
                                Natija Tafsilotlari
                            </div>
                        </div>
                        <Title level={1} style={{ margin: 0, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-2px', fontSize: '48px', lineHeight: 1 }}>
                            O'QUVCHI <span style={{ color: '#2563eb' }}>NATIJASI</span>
                        </Title>
                    </div>
                </div>

                {/* Info Cards Row */}
                <Row gutter={[24, 24]} style={{ marginBottom: '40px' }}>
                    <Col xs={24} md={12}>
                        <div style={{ backgroundColor: '#fff', border: '4px solid #000', padding: '24px', boxShadow: '8px 8px 0px #000', height: '100%' }}>
                            <div style={{ backgroundColor: '#000', color: '#fff', padding: '4px 12px', fontWeight: 900, fontSize: '12px', textTransform: 'uppercase', display: 'inline-block', marginBottom: '16px' }}>
                                O'QUVCHI MA'LUMOTLARI
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <Avatar size={64} icon={<PersonIcon />} style={{ border: '3px solid #000', backgroundColor: '#dbeafe' }} src={student?.profile_photo} />
                                <div>
                                    <Title level={3} style={{ margin: 0, fontWeight: 900, textTransform: 'uppercase' }}>
                                        {student?.first_name} {student?.last_name}
                                    </Title>
                                    <Text style={{ fontWeight: 700, opacity: 0.6 }}>ID: #{student?.id}</Text>
                                    <div style={{ marginTop: '8px' }}>
                                        <Tag style={{ border: '2px solid #000', borderRadius: 0, fontWeight: 900 }}>{student?.class_group || 'NOMA\'LUM'} SINF</Tag>
                                        <Tag style={{ border: '2px solid #000', borderRadius: 0, fontWeight: 900 }}>{student?.direction?.toUpperCase() || 'YO\'NALISHSIZ'}</Tag>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Col>
                    <Col xs={24} md={12}>
                        <div style={{ backgroundColor: '#fff', border: '4px solid #000', padding: '24px', boxShadow: '8px 8px 0px #000', height: '100%' }}>
                            <div style={{ backgroundColor: '#000', color: '#fff', padding: '4px 12px', fontWeight: 900, fontSize: '12px', textTransform: 'uppercase', display: 'inline-block', marginBottom: '16px' }}>
                                TEST MA'LUMOTLARI
                            </div>
                            <Title level={3} style={{ margin: 0, fontWeight: 900, textTransform: 'uppercase' }}>
                                {test?.title}
                            </Title>
                            <div style={{ marginTop: '12px' }}>
                                <div style={{ marginBottom: '4px' }}><Text style={{ fontWeight: 800 }}>FAN:</Text> <Text style={{ fontWeight: 900, textTransform: 'uppercase' }}>{test?.subject}</Text></div>
                                <div style={{ marginBottom: '4px' }}><Text style={{ fontWeight: 800 }}>SANA:</Text> <Text style={{ fontWeight: 900 }}>{new Date(attempt?.submitted_at || attempt?.submittedAt).toLocaleString('uz-UZ')}</Text></div>
                                <div><Text style={{ fontWeight: 800 }}>SARFLANGAN VAQT:</Text> <Text style={{ fontWeight: 900 }}>{Math.floor(attempt?.timeTaken / 60)}:{(attempt?.timeTaken % 60).toString().padStart(2, '0')}</Text></div>
                            </div>
                        </div>
                    </Col>
                </Row>

                {/* Big Score Card */}
                <div style={{
                    backgroundColor: getScoreColor(attempt.score),
                    border: '8px solid #000',
                    padding: '40px',
                    boxShadow: '16px 16px 0px #000',
                    marginBottom: '48px',
                    textAlign: 'center'
                }}>
                    <Title level={4} style={{ margin: 0, fontWeight: 900, textTransform: 'uppercase', opacity: 0.5 }}>UMUMIY NATIJA</Title>
                    <div style={{ fontSize: '120px', fontWeight: 1000, lineHeight: 1, letterSpacing: '-6px', margin: '10px 0' }}>
                        {attempt.score}%
                    </div>
                    <div style={{
                        display: 'inline-block',
                        backgroundColor: '#000',
                        color: '#fff',
                        padding: '8px 24px',
                        fontWeight: 900,
                        fontSize: '24px',
                        textTransform: 'uppercase',
                        marginTop: '10px'
                    }}>
                        {getScoreText(attempt.score)}
                    </div>
                    <div style={{ marginTop: '24px', fontWeight: 800, fontSize: '18px' }}>
                        {questions.length} TA SAVOLDAN {Object.keys(attempt.answers || {}).length} TASIGA JAVOB BERILDI
                    </div>
                </div>

                {/* Detailed Breakdown */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                    <div style={{ width: '12px', height: '40px', backgroundColor: '#000' }}></div>
                    <Title level={2} style={{ margin: 0, fontWeight: 900, textTransform: 'uppercase' }}>
                        Savollar Boyicha Tahlil
                    </Title>
                </div>

                <div style={{ border: '4px solid #000', boxShadow: '12px 12px 0px rgba(0,0,0,0.1)' }}>
                    <Table
                        columns={columns}
                        dataSource={questions}
                        rowKey="id"
                        pagination={false}
                        scroll={{ x: 1000 }}
                    />
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
        `}</style>
            </div>
        </ConfigProvider>
    );
};

export default ContentManagerStudentResult;
