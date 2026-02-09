import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
    Card,
    Typography,
    Button,
    Tag,
    Input,
    Select,
    ConfigProvider,
    Spin,
    Alert,
    Table,
    Space,
    Tooltip,
    Row,
    Col,
    Modal,
    Progress
} from 'antd';
import {
    PlayCircleOutlined,
    SortAscendingOutlined
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import { useServerTest } from '../../context/ServerTestContext';
import { useEconomy } from '../../context/EconomyContext';
import apiService from '../../data/apiService';
import 'animate.css';

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;

const TestBank = () => {
    const { currentUser } = useAuth();
    const {
        checkActiveSession,
        startTestSession,
        continueTestSession
    } = useServerTest();
    const { isTestOwned, stars, purchaseTest } = useEconomy();

    const navigate = useNavigate();
    const [allTests, setAllTests] = useState([]);
    const [activeTestSessions, setActiveTestSessions] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [takenTests, setTakenTests] = useState(new Set());

    // Filtering states
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('date');
    const [showDailyLimitModal, setShowDailyLimitModal] = useState(false);
    const [dailyLimitInfo, setDailyLimitInfo] = useState({ dailyLimit: 5, dailyTestsTaken: 0, isPremium: false });

    const difficultyLabels = {
        easy: 'Oson',
        medium: 'O\'rtacha',
        hard: 'Qiyin'
    };

    // Load Global Tests and check active sessions
    useEffect(() => {
        const loadInitialData = async () => {
            if (!currentUser) return;
            setLoading(true);
            setError(null);
            try {
                // Fetch all tests and attempts in parallel
                const [tests, attempts, activeSessions] = await Promise.all([
                    apiService.getTests({}),
                    apiService.getAttempts({ student: currentUser.id }),
                    apiService.get(`/sessions/?student=${currentUser.id}&active_only=true`)
                ]);

                // Filter for global tests
                const globalTests = tests.filter(test => test.teacher_role === 'content_manager' && test.is_active);
                setAllTests(globalTests);

                // Load attempts
                const takenTestIds = new Set(attempts.map(attempt => attempt.test));
                setTakenTests(takenTestIds);

                // Map active sessions
                const sessionsMap = {};
                if (Array.isArray(activeSessions)) {
                    activeSessions.forEach(session => {
                        sessionsMap[session.test] = session.session_id;
                    });
                }
                setActiveTestSessions(sessionsMap);

            } catch (err) {
                console.error("Failed to load test bank data:", err);
                setError("Ma'lumotlarni yuklashda xatolik yuz berdi.");
            } finally {
                setLoading(false);
            }
        };

        loadInitialData();
    }, [currentUser]);

    const hasStudentTakenTest = (testId) => {
        return takenTests.has(testId);
    };

    const startTest = async (testId) => {
        try {
            const session = await startTestSession(testId);
            if (session) {
                navigate(`/student/take-test?testId=${testId}`);
            }
        } catch (e) {
            console.error("Failed to start session", e);

            // Check for daily limit error
            if (e.response?.data?.error === 'daily_limit_reached') {
                const limitData = e.response.data;
                setDailyLimitInfo({
                    dailyLimit: limitData.daily_limit || 5,
                    dailyTestsTaken: limitData.daily_tests_taken || 0,
                    isPremium: limitData.is_premium || false
                });
                setShowDailyLimitModal(true);
            }
        }
    };

    const continueTest = (testId) => {
        navigate(`/student/take-test?testId=${testId}`);
    };

    // Filtering Logic
    const getSortedTests = () => {
        let filteredTests = [...allTests];

        if (sortBy === 'easy' || sortBy === 'medium' || sortBy === 'hard') {
            filteredTests = filteredTests.filter(test => test.difficulty === sortBy);
        }

        if (sortBy === 'difficulty') {
            const difficultyOrder = { easy: 1, medium: 2, hard: 3 };
            filteredTests.sort((a, b) => (difficultyOrder[a.difficulty] || 0) - (difficultyOrder[b.difficulty] || 0));
        } else if (sortBy === 'name') {
            filteredTests.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
        } else {
            filteredTests.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        }

        // Search
        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            filteredTests = filteredTests.filter(t =>
                (t.title || '').toLowerCase().includes(lower) ||
                (t.subject || '').toLowerCase().includes(lower)
            );
        }

        return filteredTests;
    };

    if (!currentUser) return null;

    return (
        <ConfigProvider theme={{ token: { borderRadius: 0, colorPrimary: '#000' } }}>
            <div style={{ padding: '20px 0' }}>
                <div className="animate__animated animate__fadeIn" style={{ marginBottom: '40px' }}>
                    <div style={{ backgroundColor: 'var(--star-gold)', color: '#000', padding: '8px 16px', fontWeight: 900, fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px', display: 'inline-block', border: '2px solid #000' }}>
                        YULDUZLAR IQTISODIYOTI YOQILGAN
                    </div>
                    <Title id="test-bank-title" level={1} style={{ margin: 0, fontWeight: 900, fontSize: '3rem', lineHeight: 0.9, textTransform: 'uppercase', letterSpacing: '-0.05em', color: '#000' }}>
                        MARKAZIY TESTLAR BAZASI
                    </Title>
                    <div style={{
                        width: '80px',
                        height: '10px',
                        backgroundColor: '#000',
                        margin: '24px 0'
                    }}></div>
                    <Paragraph style={{ fontSize: '1.2rem', fontWeight: 600, color: '#333', maxWidth: '600px' }}>
                        Testlarni topshirib yulduzchalar to'plang. Ulardan premium kontentlar va maxsus imtiyozlarni ochish uchun foydalaning.
                    </Paragraph>
                </div>

                {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 20 }} />}

                <div className="animate__animated animate__fadeIn" style={{ marginBottom: '40px' }}>
                    <Card style={{ borderRadius: 0, border: '3px solid #000', boxShadow: '8px 8px 0px #000' }}>
                        <Row gutter={[24, 16]} align="middle">
                            <Col xs={24} md={18}>
                                <Search
                                    placeholder="Testlarni qidirish..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    style={{ borderRadius: 0, width: '100%' }}
                                    size="large"
                                />
                            </Col>
                            <Col xs={24} md={6}>
                                <Select value={sortBy} onChange={setSortBy} style={{ width: '100%' }} size="large">
                                    <Select.Option value="date">Eng so'nggi</Select.Option>
                                    <Select.Option value="name">Nomi bo'yicha</Select.Option>
                                    <Select.Option value="difficulty">Qiyinchilik bo'yicha</Select.Option>
                                    <Select.Option value="easy">Oson</Select.Option>
                                    <Select.Option value="medium">O'rtacha</Select.Option>
                                    <Select.Option value="hard">Qiyin</Select.Option>
                                </Select>
                            </Col>
                        </Row>
                    </Card>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: 50 }}><Spin size="large" /></div>
                ) : (
                    <div className="animate__animated animate__fadeIn" style={{ animationDelay: '0.2s' }}>
                        <Table
                            dataSource={getSortedTests()}
                            rowKey="id"
                            style={{ border: '4px solid #000' }}
                            pagination={{ pageSize: 10 }}
                            columns={[
                                {
                                    title: 'FAN / SARLAVHA',
                                    key: 'info',
                                    render: (_, test) => (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                            <div style={{ padding: '8px 12px', border: '2px solid #000', backgroundColor: '#000', color: '#fff', fontWeight: 900, fontSize: '12px' }}>
                                                {test.subject}
                                            </div>
                                            <div>
                                                <Text style={{ fontWeight: 900, fontSize: '16px' }}>{test.title}</Text>
                                                <div style={{ fontSize: '11px', color: '#666', fontWeight: 700 }}>{test.total_questions} SAVOL • {test.time_limit} DAQIQA</div>
                                            </div>
                                        </div>
                                    )
                                },
                                {
                                    title: 'QIYINCHILIK',
                                    dataIndex: 'difficulty',
                                    render: (diff) => (
                                        <Tag color={diff === 'hard' ? 'red' : diff === 'medium' ? 'orange' : 'green'} style={{ border: '2px solid #000', fontWeight: 800, borderRadius: 0 }}>
                                            {difficultyLabels[diff]?.toUpperCase()}
                                        </Tag>
                                    )
                                },
                                {
                                    title: 'HOLAT',
                                    key: 'status',
                                    render: (_, test) => {
                                        const owned = isTestOwned(test.id);
                                        const isPaid = test.star_price > 0;
                                        const isPremiumOnly = test.is_premium;
                                        const studentIsPremium = currentUser?.is_premium;

                                        if (isPremiumOnly && !studentIsPremium) {
                                            return <Tag color="purple" style={{ border: '2px solid #000', fontWeight: 800, borderRadius: 0 }}>PREMIUM</Tag>;
                                        }
                                        if (isPaid && !owned) {
                                            return <Tag color="gold" style={{ border: '2px solid #000', fontWeight: 800, borderRadius: 0 }}>{test.star_price} ⭐</Tag>;
                                        }
                                        return <Tag color="blue" style={{ border: '2px solid #000', fontWeight: 800, borderRadius: 0 }}>OCHIQ</Tag>;
                                    }
                                },
                                {
                                    title: 'AMAL',
                                    key: 'action',
                                    align: 'right',
                                    render: (_, test) => {
                                        const owned = isTestOwned(test.id) || test.star_price === 0;
                                        const isPremiumOnly = test.is_premium;
                                        const studentIsPremium = currentUser?.is_premium;
                                        const premiumLocked = isPremiumOnly && !studentIsPremium;
                                        const canAccess = owned && !premiumLocked;
                                        const alreadyTaken = takenTests.has(test.id);

                                        if (premiumLocked) {
                                            return (
                                                <Button
                                                    style={{ border: '2px solid #000', boxShadow: '3px 3px 0px #000', fontWeight: 900, backgroundColor: '#a855f7', color: '#fff' }}
                                                    onClick={() => navigate('/student/pricing')}
                                                >
                                                    PREMIUM OLISH
                                                </Button>
                                            );
                                        }

                                        if (test.star_price > 0 && !owned) {
                                            return (
                                                <Button
                                                    style={{ border: '2px solid #000', boxShadow: '3px 3px 0px #000', fontWeight: 900, backgroundColor: 'var(--star-gold)', color: '#000' }}
                                                    disabled={currentUser?.stars < test.star_price}
                                                    onClick={async () => {
                                                        try {
                                                            await purchaseTest(test.id, test.star_price);
                                                            window.location.reload();
                                                        } catch (e) {
                                                            console.error("Purchase failed", e);
                                                        }
                                                    }}
                                                >
                                                    {test.star_price} ⭐ BILAN OCHISH
                                                </Button>
                                            );
                                        }

                                        if (alreadyTaken) {
                                            return (
                                                <Button
                                                    disabled
                                                    style={{
                                                        border: '2px solid #000',
                                                        fontWeight: 900,
                                                        backgroundColor: '#d1d5db',
                                                        color: '#374151',
                                                        textTransform: 'uppercase',
                                                        cursor: 'not-allowed'
                                                    }}
                                                >
                                                    ISHLANGAN
                                                </Button>
                                            );
                                        }

                                        return (
                                            <Button
                                                type="primary"
                                                icon={<PlayCircleOutlined />}
                                                onClick={() => activeTestSessions[test.id] ? continueTest(test.id) : startTest(test.id)}
                                                style={{ border: '2px solid #000', boxShadow: '3px 3px 0px #000', fontWeight: 900 }}
                                            >
                                                {activeTestSessions[test.id] ? 'DAVOM ETTIRISH' : 'BOSHLASH'}
                                            </Button>
                                        );
                                    }
                                }
                            ]}
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
                    text-transform: uppercase !important;
                    border-bottom: 2px solid #000 !important;
                }
                .ant-table-tbody > tr > td {
                    border-bottom: 2px solid #000 !important;
                    font-weight: 600;
                }
                .ant-table {
                }
            `}</style>

            {/* Daily Limit Modal */}
            <Modal
                open={showDailyLimitModal}
                onCancel={() => setShowDailyLimitModal(false)}
                footer={null}
                centered
                closable={false}
                width={480}
                styles={{
                    content: {
                        borderRadius: 0,
                        border: '6px solid #000',
                        boxShadow: '16px 16px 0px #000',
                        padding: 0,
                    },
                    body: { padding: 0 },
                }}
            >
                <div style={{ padding: '32px' }}>
                    <div style={{
                        display: 'inline-block',
                        backgroundColor: '#ef4444',
                        color: '#fff',
                        padding: '6px 12px',
                        fontWeight: 900,
                        fontSize: '12px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        marginBottom: '16px'
                    }}>
                        Kunlik Limit
                    </div>

                    <Title level={2} style={{
                        margin: 0,
                        fontWeight: 900,
                        fontSize: '1.8rem',
                        lineHeight: 1.1,
                        textTransform: 'uppercase',
                        letterSpacing: '-0.02em',
                        color: '#000',
                        marginBottom: '16px'
                    }}>
                        Bugungi testlar tugadi!
                    </Title>

                    <Paragraph style={{
                        fontSize: '1rem',
                        fontWeight: 600,
                        color: '#333',
                        marginBottom: '24px'
                    }}>
                        Sizning kunlik test ishlash limitingiz tugadi.
                        {!dailyLimitInfo.isPremium && (
                            <> Premium obuna bilan kuniga <strong>30 ta</strong> test ishlang!</>
                        )}
                    </Paragraph>

                    <div style={{
                        backgroundColor: '#f3f4f6',
                        border: '3px solid #000',
                        padding: '20px',
                        marginBottom: '24px'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <Text style={{ fontWeight: 900, fontSize: '14px', textTransform: 'uppercase' }}>
                                    Bugungi testlar
                                </Text>
                            </div>
                            <div>
                                <Text style={{ fontWeight: 900, fontSize: '24px' }}>
                                    {dailyLimitInfo.dailyTestsTaken}/{dailyLimitInfo.dailyLimit}
                                </Text>
                            </div>
                        </div>
                        <Progress
                            percent={100}
                            strokeColor="#ef4444"
                            trailColor="#e5e7eb"
                            showInfo={false}
                            style={{ marginTop: '12px' }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '12px' }}>
                        {!dailyLimitInfo.isPremium && (
                            <Button
                                type="primary"
                                size="large"
                                onClick={() => {
                                    setShowDailyLimitModal(false);
                                    navigate('/student/pricing');
                                }}
                                style={{
                                    flex: 1,
                                    borderRadius: 0,
                                    border: '3px solid #000',
                                    boxShadow: '4px 4px 0px #000',
                                    fontWeight: 800,
                                    textTransform: 'uppercase',
                                    height: '48px',
                                    backgroundColor: '#22c55e',
                                }}
                            >
                                Premium Olish
                            </Button>
                        )}
                        <Button
                            size="large"
                            onClick={() => setShowDailyLimitModal(false)}
                            style={{
                                flex: dailyLimitInfo.isPremium ? 1 : undefined,
                                borderRadius: 0,
                                border: '3px solid #000',
                                boxShadow: '4px 4px 0px #000',
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                height: '48px',
                            }}
                        >
                            Yopish
                        </Button>
                    </div>
                </div>
            </Modal>
        </ConfigProvider>
    );
};

export default TestBank;
