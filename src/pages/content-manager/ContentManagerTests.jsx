import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Typography,
    Card,
    Button,
    Tag,
    Modal,
    Alert,
    Table,
    Space,
    Tooltip,
    Spin,
    Input,
    ConfigProvider
} from 'antd';
import {
    PlusOutlined as AddIcon,
    EditOutlined as EditIcon,
    DeleteOutlined as DeleteIcon,
    BarChartOutlined as AssessmentIcon,
    ReloadOutlined as RefreshIcon,
    EyeOutlined as ViewIcon,
    GlobalOutlined,
    SearchOutlined
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../data/apiService';

const { Title, Text } = Typography;

const ContentManagerTests = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [tests, setTests] = useState([]);
    const [testAttempts, setTestAttempts] = useState({});
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTest, setSelectedTest] = useState(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    useEffect(() => {
        loadData();
    }, [currentUser.id]);

    const loadData = async () => {
        try {
            setLoading(true);
            const response = await apiService.getTests({ teacher: currentUser.id });
            const managerTests = response.results || response;
            setTests(managerTests);

            const attemptsResponse = await apiService.getAttempts();
            const allAttempts = attemptsResponse.results || attemptsResponse;
            const attemptsByTest = {};
            allAttempts.forEach(attempt => {
                if (!attemptsByTest[attempt.test]) attemptsByTest[attempt.test] = [];
                attemptsByTest[attempt.test].push(attempt);
            });
            setTestAttempts(attemptsByTest);
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getTestStats = (testId) => {
        const attempts = testAttempts[testId] || [];
        const averageScore = attempts.length > 0
            ? Math.round(attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length)
            : 0;
        return { totalAttempts: attempts.length, averageScore };
    };

    const toggleTestStatus = async (testId) => {
        try {
            const test = tests.find(t => t.id === testId);
            if (test) {
                const newStatus = !test.is_active;
                await apiService.updateTest(testId, { is_active: newStatus });
                setTests(prev => prev.map(t => t.id === testId ? { ...t, is_active: newStatus } : t));

                window.dispatchEvent(new CustomEvent('testAction', {
                    detail: {
                        title: "Test holati o'zgardi",
                        message: `${test.title}: ${newStatus ? 'FAOL' : 'NOFAOL'}`,
                        icon: 'notifications_active'
                    }
                }));
            }
        } catch (error) {
            console.error('Failed to toggle status:', error);
            window.dispatchEvent(new CustomEvent('saveError', {
                detail: {
                    title: "Xatolik",
                    message: "Holatni o'zgartirib bo'lmadi",
                    icon: 'error'
                }
            }));
        }
    };

    const confirmDelete = async () => {
        if (!selectedTest) return;
        try {
            await apiService.deleteTest(selectedTest.id);
            setTests(prev => prev.filter(t => t.id !== selectedTest.id));
            setDeleteDialogOpen(false);

            window.dispatchEvent(new CustomEvent('testAction', {
                detail: {
                    title: "Global test o'chirildi",
                    message: selectedTest.title,
                    icon: 'delete'
                }
            }));
        } catch (error) {
            console.error('Delete failed:', error);
            window.dispatchEvent(new CustomEvent('saveError', {
                detail: {
                    title: "Xatolik",
                    message: "Testni o'chirib bo'lmadi",
                    icon: 'error'
                }
            }));
        }
    };

    const filteredTests = tests.filter(test =>
        test.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        test.subject?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <ConfigProvider theme={{ token: { borderRadius: 0, colorPrimary: '#000' } }}>
            <div style={{ paddingBottom: '40px' }}>
                <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '20px' }}>
                    <div>
                        <div style={{ display: 'inline-block', backgroundColor: '#000', color: '#fff', padding: '6px 12px', fontWeight: 900, fontSize: '12px', textTransform: 'uppercase', marginBottom: '12px' }}>
                            Testlar Royxati
                        </div>
                        <Title level={1} style={{ margin: 0, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-1px' }}>
                            Mening Global Testlarim
                        </Title>
                        <div style={{ width: '60px', height: '8px', backgroundColor: '#000', marginTop: '20px' }}></div>
                    </div>
                    <Button
                        type="primary"
                        icon={<AddIcon />}
                        onClick={() => navigate('/content-manager/create-test')}
                        size="large"
                        style={{ height: '54px', border: '4px solid #000', boxShadow: '6px 6px 0px #000', fontWeight: 900, textTransform: 'uppercase' }}
                    >
                        Yangi Test Yaratish
                    </Button>
                </div>

                <div style={{ marginBottom: '24px' }}>
                    <Input
                        placeholder="QIDIRISH..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        size="large"
                        prefix={<SearchOutlined style={{ fontWeight: 900 }} />}
                        style={{ border: '4px solid #000', borderRadius: 0, fontWeight: 800 }}
                        allowClear
                    />
                </div>

                <Table
                    dataSource={filteredTests}
                    rowKey="id"
                    loading={loading}
                    style={{ border: '4px solid #000' }}
                    columns={[
                        {
                            title: 'SARLAVHA',
                            dataIndex: 'title',
                            key: 'title',
                            render: (text, record) => (
                                <div>
                                    <Text style={{ fontWeight: 900 }}>{text}</Text>
                                    <div style={{ fontSize: '11px', color: '#666', fontWeight: 700 }}>{record.subject}</div>
                                </div>
                            )
                        },
                        {
                            title: 'URINISHLAR',
                            key: 'attempts',
                            render: (_, r) => <Text style={{ fontWeight: 800 }}>{getTestStats(r.id).totalAttempts}</Text>
                        },
                        {
                            title: 'O\'RTACHA',
                            key: 'score',
                            render: (_, r) => (
                                <div style={{ display: 'inline-block', border: '2px solid #000', padding: '2px 8px', fontWeight: 900, backgroundColor: getTestStats(r.id).averageScore >= 60 ? '#ecfdf5' : '#fef2f2' }}>
                                    {getTestStats(r.id).averageScore}%
                                </div>
                            )
                        },
                        {
                            title: 'HOLAT',
                            dataIndex: 'is_active',
                            render: (active) => (
                                <Tag style={{ borderRadius: 0, fontWeight: 900, border: '2px solid #000', backgroundColor: active ? '#000' : '#fff', color: active ? '#fff' : '#000' }}>
                                    {active ? 'FAOL' : 'NOFAOL'}
                                </Tag>
                            )
                        },
                        {
                            title: 'AMALLAR',
                            key: 'actions',
                            render: (_, record) => (
                                <Space>
                                    <Button type="text" icon={<ViewIcon />} onClick={() => navigate(`/content-manager/test-details/${record.id}`)} />
                                    <Button type="text" icon={<EditIcon />} onClick={() => navigate(`/content-manager/edit-test/${record.id}`)} />
                                    <Button type="text" icon={<AssessmentIcon />} onClick={() => toggleTestStatus(record.id)} />
                                    <Button type="text" danger icon={<DeleteIcon />} onClick={() => { setSelectedTest(record); setDeleteDialogOpen(true); }} />
                                </Space>
                            )
                        }
                    ]}
                />

                <Modal
                    title={<Text style={{ fontWeight: 900, textTransform: 'uppercase' }}>Testni o'chirish</Text>}
                    open={deleteDialogOpen}
                    onOk={confirmDelete}
                    onCancel={() => setDeleteDialogOpen(false)}
                    okText="O'chirish"
                    cancelText="Bekor qilish"
                    okButtonProps={{ danger: true, style: { borderRadius: 0, border: '2px solid #000', fontWeight: 800 } }}
                    cancelButtonProps={{ style: { borderRadius: 0, border: '2px solid #000', fontWeight: 800 } }}
                    style={{ borderRadius: 0 }}
                >
                    <p style={{ fontWeight: 600 }}>Haqiqatdan ham "<b>{selectedTest?.title}</b>" testini o'chirmoqchimisiz?</p>
                </Modal>
            </div>

            <style>{`
        .ant-table-thead > tr > th {
          background: #000 !important;
          color: #fff !important;
          border-radius: 0 !important;
          font-weight: 900 !important;
          text-transform: uppercase !important;
        }
        .ant-table-tbody > tr > td {
          border-bottom: 2px solid #000 !important;
        }
      `}</style>
        </ConfigProvider>
    );
};

export default ContentManagerTests;
