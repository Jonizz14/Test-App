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
    Row,
    Col,
    Table,
    Spin,
    Alert
} from 'antd';
import {
    PlayCircleOutlined,
    SortAscendingOutlined,
    GlobalOutlined
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import { useServerTest } from '../../context/ServerTestContext';
import apiService from '../../data/apiService';
import 'animate.css';

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;

const TestBank = () => {
    const { currentUser } = useAuth();
    const {
        checkActiveSession,
        startTestSession,
        continueTestSession,
        clearSession
    } = useServerTest();

    const navigate = useNavigate();
    const [allTests, setAllTests] = useState([]);
    const [activeTestSessions, setActiveTestSessions] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [takenTests, setTakenTests] = useState(new Set());

    // Filtering states
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('date');
    const [pageSize, setPageSize] = useState(10);

    const difficultyLabels = {
        easy: 'Oson',
        medium: 'O\'rtacha',
        hard: 'Qiyin'
    };

    // Load Global Tests
    useEffect(() => {
        const loadGlobalTests = async () => {
            if (!currentUser) return;
            setLoading(true);
            setError(null);
            try {
                // Fetch all tests available to student (includes teacher's and global)
                const tests = await apiService.getTests({});

                // Filter only for global tests (created by content_manager)
                // Or show ALL tests? User said "Testlar Bazasi", usually implies a public bank.
                // Let's filter for tests where teacher_role === 'content_manager'.
                const globalTests = tests.filter(test => test.teacher_role === 'content_manager' && test.is_active);

                setAllTests(globalTests);

                // Check active sessions
                const sessionsMap = {};
                for (const test of globalTests) {
                    try {
                        const activeSession = await checkActiveSession(test.id);
                        if (activeSession) {
                            sessionsMap[test.id] = activeSession;
                        }
                    } catch (e) {
                        // Ignore errors checking sessions
                    }
                }
                setActiveTestSessions(sessionsMap);

                // Load attempts to mark taken tests
                try {
                    const attempts = await apiService.getAttempts({ student: currentUser.id });
                    const takenTestIds = new Set(attempts.map(attempt => attempt.test));
                    setTakenTests(takenTestIds);
                } catch (error) {
                    console.error('Failed to load taken tests:', error);
                }

            } catch (err) {
                console.error("Failed to load global tests:", err);
                setError("Testlar bazasini yuklashda xatolik yuz berdi.");
            } finally {
                setLoading(false);
            }
        };

        loadGlobalTests();
    }, [currentUser, checkActiveSession]);

    const hasStudentTakenTest = (testId) => {
        return takenTests.has(testId);
    };

    const startTest = async (test) => {
        if (!test || !test.id) return;
        try {
            const session = await startTestSession(test.id);
            if (session) {
                navigate(`/student/take-test?testId=${test.id}`);
            }
        } catch (e) {
            console.error("Failed to start session", e);
            Alert.error("Testni boshlashda xatolik");
        }
    };

    const continueTest = async (test) => {
        // Just navigate, TakeTest handles recovery from URL or checks session
        navigate(`/student/take-test?testId=${test.id}`);
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
            filteredTests.sort((a, b) => a.title.localeCompare(b.title));
        } else {
            filteredTests.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        }

        // Search
        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            filteredTests = filteredTests.filter(t =>
                t.title.toLowerCase().includes(lower) ||
                t.subject.toLowerCase().includes(lower)
            );
        }

        return filteredTests;
    };

    const testColumns = [
        {
            title: 'Test',
            dataIndex: 'title',
            key: 'title',
            render: (title, test) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ backgroundColor: '#000', color: '#fff', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>G</div>
                    <div>
                        <Text style={{ fontWeight: 700, fontSize: '0.9rem' }}>{title}</Text>
                        {test.description && <div style={{ fontSize: '11px', color: '#666' }}>{test.description}</div>}
                    </div>
                </div>
            ),
        },
        {
            title: 'Fan',
            dataIndex: 'subject',
            key: 'subject',
            render: (subject) => (
                <Tag style={{ borderRadius: 0, border: '2px solid #000', fontWeight: 700, backgroundColor: '#fff', color: '#000', textTransform: 'uppercase', fontSize: '10px' }}>{subject}</Tag>
            ),
        },
        {
            title: 'Qiyinchilik',
            dataIndex: 'difficulty',
            key: 'difficulty',
            render: (difficulty) => (
                <Tag color={difficulty === 'easy' ? 'green' : difficulty === 'medium' ? 'orange' : 'red'} style={{ borderRadius: 0, border: '2px solid #000', fontWeight: 800, textTransform: 'uppercase', fontSize: '10px' }}>
                    {difficultyLabels[difficulty] || difficulty}
                </Tag>
            ),
        },
        {
            title: 'Info',
            key: 'info',
            render: (_, test) => (
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <div style={{ backgroundColor: '#000', color: '#fff', padding: '4px 8px', fontWeight: 900, fontSize: '11px', border: '2px solid #000' }}>{test.time_limit}M</div>
                    <div style={{ backgroundColor: '#fff', color: '#000', padding: '4px 8px', fontWeight: 900, fontSize: '11px', border: '2px solid #000' }}>{test.total_questions}Q</div>
                </div>
            ),
        },
        {
            title: 'Harakat',
            key: 'actions',
            width: 150,
            render: (_, test) => {
                const alreadyTaken = hasStudentTakenTest(test.id);
                const hasActive = !!activeTestSessions[test.id];

                if (alreadyTaken) {
                    return (
                        <Button
                            onClick={() => navigate(`/student/results?highlight=${test.id}`)}
                            style={{
                                borderRadius: 0,
                                border: '3px solid #000',
                                backgroundColor: '#e0e7ff', // Light indigo/blue
                                color: '#000',
                                fontWeight: 900,
                                textTransform: 'uppercase',
                                fontSize: '11px',
                                height: '36px',
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            TOPSHIRILGAN
                        </Button>
                    );
                }

                return (
                    <Button
                        type="primary"
                        onClick={hasActive ? () => continueTest(test) : () => startTest(test)}
                        style={{
                            borderRadius: 0,
                            border: '3px solid #000',
                            boxShadow: '4px 4px 0px #000',
                            backgroundColor: hasActive ? '#f59e0b' : '#4f46e5',
                            color: '#fff',
                            fontWeight: 900,
                            textTransform: 'uppercase',
                            fontSize: '11px',
                            height: '36px',
                            width: '100%'
                        }}
                        icon={hasActive ? <PlayCircleOutlined /> : <PlayCircleOutlined />}
                    >
                        {hasActive ? 'Davom etish' : 'Boshlash'}
                    </Button>
                );
            },
        },
    ];

    if (!currentUser) return null;

    return (
        <ConfigProvider theme={{ token: { borderRadius: 0, colorPrimary: '#000' } }}>
            <div style={{ padding: '40px 0' }}>
                <div className="animate__animated animate__fadeIn" style={{ marginBottom: '60px' }}>
                    <div style={{ backgroundColor: '#000', color: '#fff', padding: '8px 16px', fontWeight: 700, fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '16px', display: 'inline-block' }}>
                        TESTLAR BAZASI
                    </div>
                    <Title level={1} style={{ fontWeight: 900, fontSize: '2.5rem', lineHeight: 0.9, textTransform: 'uppercase', letterSpacing: '-0.05em', color: '#000' }}>
                        GLOBAL TESTLAR BAZASI
                    </Title>
                    <div style={{ width: '80px', height: '10px', backgroundColor: '#000', margin: '24px 0' }}></div>
                    <Paragraph style={{ fontSize: '1.2rem', fontWeight: 600, color: '#333', maxWidth: '600px' }}>
                        Platformadagi barcha ochiq testlar to'plami. Reytingingizni oshirish uchun testlarni yeching!
                    </Paragraph>
                </div>

                {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 20 }} />}

                {loading ? (
                    <div style={{ textAlign: 'center', padding: 50 }}><Spin size="large" /></div>
                ) : (
                    <>
                        <div className="animate__animated animate__fadeIn" style={{ marginBottom: '40px' }}>
                            <Card style={{ borderRadius: 0, border: '4px solid #000', boxShadow: '10px 10px 0px #000' }}>
                                <Row gutter={[24, 16]} align="middle">
                                    <Col xs={24} md={18}>
                                        <Search
                                            placeholder="Test nomi yoki fan bo'yicha qidirish..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            style={{ borderRadius: 0, width: '100%' }}
                                            size="large"
                                        />
                                    </Col>
                                    <Col xs={24} md={6}>
                                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', justifyContent: 'flex-end', width: '100%' }}>
                                            <SortAscendingOutlined style={{ fontSize: '20px' }} />
                                            <Select value={sortBy} onChange={setSortBy} style={{ width: '100%' }} size="large">
                                                <Select.Option value="date">Sana</Select.Option>
                                                <Select.Option value="name">Nomi</Select.Option>
                                                <Select.Option value="difficulty">Qiyinchilik</Select.Option>
                                                <Select.Option value="easy">Osonlar</Select.Option>
                                                <Select.Option value="medium">O'rtachalar</Select.Option>
                                                <Select.Option value="hard">Qiyinlar</Select.Option>
                                            </Select>
                                        </div>
                                    </Col>
                                </Row>
                            </Card>
                        </div>

                        <div className="animate__animated animate__fadeIn" style={{ animationDelay: '0.3s' }}>
                            <Table
                                columns={testColumns}
                                dataSource={getSortedTests().map(t => ({ ...t, key: t.id }))}
                                pagination={{
                                    pageSize: pageSize,
                                    showSizeChanger: true,
                                    pageSizeOptions: ['10', '20', '50'],
                                    onShowSizeChange: (_, size) => setPageSize(size),
                                }}
                                rowHoverable={false}
                                style={{ border: '4px solid #000', boxShadow: '10px 10px 0px #000' }}
                                scroll={{ x: 800 }}
                                locale={{ emptyText: 'Global testlar mavjud emas' }}
                            />
                        </div>
                    </>
                )}
            </div>
        </ConfigProvider>
    );
};

export default TestBank;
