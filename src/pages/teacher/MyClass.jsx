import React, { useState, useEffect } from 'react';
import {
    Row,
    Col,
    Card,
    Typography,
    Table,
    Tag,
    Spin,
    Alert,
    Space,
    Avatar,
    Input,
    Select,
    Button,
    Tooltip,
    Statistic,
} from 'antd';
import {
    TeamOutlined,
    UserOutlined,
    SearchOutlined,
    MailOutlined,
    PhoneOutlined,
    BookOutlined,
    TrophyOutlined,
    EyeOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../data/apiService';

const { Title, Text } = Typography;
const { Search } = Input;

const MyClass = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [students, setStudents] = useState([]);
    const [filteredStudents, setFilteredStudents] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedClass, setSelectedClass] = useState(null);
    const [classGroups, setClassGroups] = useState([]);
    const [stats, setStats] = useState({
        totalStudents: 0,
        totalClasses: 0,
        mySubject: '',
    });

    useEffect(() => {
        loadData();
    }, [currentUser.id]);

    useEffect(() => {
        filterStudents();
    }, [searchTerm, selectedClass, students]);

    const loadData = async () => {
        try {
            setLoading(true);

            const [testsData, attemptsData, usersData, teacherProfile] = await Promise.all([
                apiService.getTests({ teacher: currentUser.id }),
                apiService.getAttempts(),
                apiService.getUsers(),
                apiService.getUser(currentUser.id)
            ]);

            const tests = (testsData.results || testsData).filter(t => t.teacher === currentUser.id);
            const allAttempts = attemptsData.results || attemptsData;
            const users = usersData.results || usersData;

            // Initial student list
            let allStudents = users.filter(u => u.role === 'student');

            // API driven filtering based on teacher's specific profile data
            const assignedClass = teacherProfile.class_group || teacherProfile.curator_class || teacherProfile.assigned_class;

            if (assignedClass) {
                const teacherClasses = assignedClass.toString().split(',').map(c => c.trim());
                if (teacherClasses.length > 0) {
                    allStudents = allStudents.filter(s => teacherClasses.includes(s.class_group));
                }
            } else {
                allStudents = [];
                console.warn("Teacher has no assigned class in API profile");
            }

            // Get teacher's subject
            const mySubject = tests.length > 0 ? tests[0].subject : "Noma'lum";

            // Filter attempts for teacher's tests
            const testIds = tests.map(t => t.id);
            const attempts = allAttempts.filter(a => testIds.includes(a.test));

            // Get unique student IDs who attempted teacher's tests
            const studentIdsWithAttempts = new Set(attempts.map(a => a.student));

            // Calculate student stats
            const studentStats = {};
            attempts.forEach(attempt => {
                if (!studentStats[attempt.student]) {
                    studentStats[attempt.student] = {
                        testCount: 0,
                        totalScore: 0,
                        highestScore: 0,
                    };
                }
                studentStats[attempt.student].testCount++;
                studentStats[attempt.student].totalScore += attempt.score || 0;
                if ((attempt.score || 0) > studentStats[attempt.student].highestScore) {
                    studentStats[attempt.student].highestScore = attempt.score || 0;
                }
            });

            // Build student list with stats - ALL students, not just those with attempts
            const studentsWithStats = allStudents
                .map(student => {
                    const stats = studentStats[student.id] || { testCount: 0, totalScore: 0, highestScore: 0 };
                    return {
                        ...student,
                        key: student.id,
                        name: student.name || student.username || `${student.first_name || ''} ${student.last_name || ''}`.trim() || 'Noma\'lum',
                        classGroup: student.class_group || "Noma'lum",
                        testCount: stats.testCount,
                        averageScore: stats.testCount > 0 ? Math.round(stats.totalScore / stats.testCount) : null,
                        highestScore: stats.highestScore || null,
                        hasAttempts: stats.testCount > 0,
                    };
                })
                .sort((a, b) => {
                    // Sort by class group first, then by name
                    if (a.classGroup !== b.classGroup) return a.classGroup.localeCompare(b.classGroup);
                    return a.name.localeCompare(b.name);
                });

            // Get unique class groups
            const uniqueClasses = [...new Set(studentsWithStats.map(s => s.classGroup))].sort();

            setStudents(studentsWithStats);
            setFilteredStudents(studentsWithStats);
            setClassGroups(uniqueClasses);

            // Auto-select first class to avoid showing mixed students
            if (uniqueClasses.length > 0) {
                setSelectedClass(uniqueClasses[0]);
            }
            setStats({
                totalStudents: studentsWithStats.length,
                totalClasses: uniqueClasses.length,
                mySubject,
            });

        } catch (err) {
            console.error('Error loading class data:', err);
            setError('Ma\'lumotlarni yuklashda xatolik yuz berdi');
        } finally {
            setLoading(false);
        }
    };

    const filterStudents = () => {
        let filtered = [...students];

        if (searchTerm) {
            filtered = filtered.filter(s =>
                s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.username?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (selectedClass && selectedClass !== 'all') {
            filtered = filtered.filter(s => s.classGroup === selectedClass);
        }

        setFilteredStudents(filtered);
    };

    const columns = [
        {
            title: '#',
            key: 'index',
            width: 60,
            render: (_, __, index) => (
                <Text style={{ fontWeight: 600, color: '#64748b' }}>{index + 1}</Text>
            ),
        },
        {
            title: 'O\'quvchi',
            dataIndex: 'name',
            key: 'name',
            render: (text, record) => (
                <Space>
                    <Avatar
                        style={{
                            backgroundColor: record.averageScore === null ? '#94a3b8' :
                                record.averageScore >= 70 ? '#16a34a' :
                                    record.averageScore >= 50 ? '#f59e0b' : '#dc2626'
                        }}
                        icon={<UserOutlined />}
                    />
                    <div>
                        <Text strong style={{ color: '#1e293b', display: 'block' }}>{text}</Text>
                        <Text style={{ color: '#64748b', fontSize: '12px' }}>{record.username}</Text>
                    </div>
                </Space>
            ),
        },
        {
            title: 'Sinf',
            dataIndex: 'classGroup',
            key: 'classGroup',
            render: (text) => (
                <Tag color="blue" style={{ borderRadius: '6px' }}>{text}</Tag>
            ),
        },
        {
            title: 'Testlar',
            dataIndex: 'testCount',
            key: 'testCount',
            render: (count) => (
                <Space>
                    <BookOutlined style={{ color: count > 0 ? '#7c3aed' : '#94a3b8' }} />
                    <Text style={{ fontWeight: 600, color: count > 0 ? '#7c3aed' : '#94a3b8' }}>
                        {count > 0 ? `${count} ta` : '-'}
                    </Text>
                </Space>
            ),
        },
        {
            title: 'O\'rtacha ball',
            dataIndex: 'averageScore',
            key: 'averageScore',
            sorter: (a, b) => (a.averageScore || 0) - (b.averageScore || 0),
            render: (score) => (
                score !== null ? (
                    <Tag
                        color={score >= 80 ? 'green' : score >= 60 ? 'orange' : score >= 40 ? 'gold' : 'red'}
                        style={{ fontWeight: 600, fontSize: '14px', padding: '4px 12px' }}
                    >
                        {score}%
                    </Tag>
                ) : (
                    <Text style={{ color: '#94a3b8', fontWeight: 500 }}>—</Text>
                )
            ),
        },
        {
            title: 'Eng yuqori ball',
            dataIndex: 'highestScore',
            key: 'highestScore',
            render: (score) => (
                score !== null ? (
                    <Space>
                        <TrophyOutlined style={{ color: '#eab308' }} />
                        <Text style={{ fontWeight: 600, color: '#16a34a' }}>{score}%</Text>
                    </Space>
                ) : (
                    <Text style={{ color: '#94a3b8', fontWeight: 500 }}>—</Text>
                )
            ),
        },
        {
            title: 'Amallar',
            key: 'actions',
            render: (_, record) => (
                <Tooltip title="Profilni ko'rish">
                    <Button
                        type="text"
                        icon={<EyeOutlined />}
                        onClick={() => navigate(`/teacher/student-profile/${record.id}`)}
                        style={{ color: '#2563eb' }}
                    />
                </Tooltip>
            ),
        },
    ];

    const StatCard = ({ title, value, icon, color }) => (
        <Card
            style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            }}
            styles={{ body: { padding: '20px' } }}
        >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <Text style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', color: '#64748b', display: 'block', marginBottom: '4px' }}>
                        {title}
                    </Text>
                    <Text style={{ fontSize: '28px', fontWeight: 700, color: '#1e293b' }}>{value}</Text>
                </div>
                <div style={{ backgroundColor: color, borderRadius: '10px', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {React.cloneElement(icon, { style: { fontSize: '24px', color: '#ffffff' } })}
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

    if (error) {
        return (
            <div style={{ padding: '24px' }}>
                <Alert message={error} type="error" showIcon />
            </div>
        );
    }

    return (
        <div style={{ padding: '24px 0' }}>
            {/* Header */}
            <div style={{ marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #e2e8f0' }}>
                <Title level={1} style={{ margin: 0, color: '#1e293b', marginBottom: '8px' }}>Sinfim</Title>
                <Text style={{ fontSize: '18px', color: '#64748b' }}>
                    {stats.mySubject} fanidan dars olayotgan o'quvchilar ro'yxati
                </Text>
            </div>

            {/* Stats Cards */}
            <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
                <Col xs={24} sm={12} md={8}>
                    <StatCard title="Jami o'quvchilar" value={stats.totalStudents} icon={<UserOutlined />} color="#2563eb" />
                </Col>
                <Col xs={24} sm={12} md={8}>
                    <StatCard title="Sinflar soni" value={stats.totalClasses} icon={<TeamOutlined />} color="#16a34a" />
                </Col>
                <Col xs={24} sm={12} md={8}>
                    <StatCard title="Fani" value={stats.mySubject} icon={<BookOutlined />} color="#7c3aed" />
                </Col>
            </Row>

            {/* Filters */}
            <Card style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', marginBottom: '24px' }}>
                <Row gutter={[16, 16]} align="middle">
                    <Col xs={24} md={12}>
                        <Search
                            placeholder="O'quvchi ismini qidiring..."
                            allowClear
                            size="large"
                            prefix={<SearchOutlined style={{ color: '#64748b' }} />}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ width: '100%' }}
                        />
                    </Col>
                    <Col xs={24} md={8}>
                        <Select
                            placeholder="Sinf bo'yicha filter"
                            size="large"
                            value={selectedClass}
                            onChange={setSelectedClass}
                            style={{ width: '100%' }}
                        >
                            {/* Removed 'All Classes' option to enforce single class view */}
                            {classGroups.map(cls => (
                                <Select.Option key={cls} value={cls}>{cls}</Select.Option>
                            ))}
                        </Select>
                    </Col>
                    <Col xs={24} md={4}>
                        <Text style={{ color: '#64748b' }}>
                            <strong>{filteredStudents.length}</strong> ta o'quvchi
                        </Text>
                    </Col>
                </Row>
            </Card>

            {/* Students Table */}
            <Card style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }}>
                <Title level={3} style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <TeamOutlined style={{ color: '#2563eb' }} /> O'quvchilar ro'yxati
                </Title>

                {filteredStudents.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '48px' }}>
                        <UserOutlined style={{ fontSize: '48px', color: '#d1d5db', marginBottom: '16px' }} />
                        <Title level={4} style={{ color: '#64748b', margin: 0 }}>O'quvchilar topilmadi</Title>
                        <Text style={{ color: '#94a3b8' }}>Hozircha testlaringizni ishlagan o'quvchilar yo'q</Text>
                    </div>
                ) : (
                    <Table
                        dataSource={filteredStudents}
                        columns={columns}
                        pagination={{
                            pageSize: 10,
                            showSizeChanger: true,
                            showTotal: (total, range) => `${range[0]}-${range[1]} / ${total} ta o'quvchi`,
                        }}
                        rowKey="id"
                    />
                )}
            </Card>
        </div>
    );
};

export default MyClass;
