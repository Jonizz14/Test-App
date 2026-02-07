import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Typography, Button, Avatar, Statistic, Row, Col, Tag, Spin, Alert } from 'antd';
import {
    ArrowLeftOutlined,
    UserOutlined,
    TrophyOutlined,
    BarChartOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../data/apiService';
import { shouldShowPremiumFeatures } from '../../utils/premiumVisibility';
import 'animate.css';

const { Title, Text } = Typography;

const StatCard = ({ title, value, icon, color, suffix, valueComponent, iconColor = '#ffffff' }) => (
    <Card
        style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            height: '100%',
            transition: 'all 0.3s ease',
        }}
        bodyStyle={{ padding: '24px' }}
    >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ flex: 1 }}>
                <Text
                    style={{
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        color: '#64748b',
                        display: 'block',
                        marginBottom: '8px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                    }}
                >
                    {title}
                </Text>
                {valueComponent || (
                    <Statistic
                        value={value}
                        suffix={suffix}
                        valueStyle={{
                            fontSize: '2rem',
                            fontWeight: 700,
                            color: '#1e293b',
                            lineHeight: 1.2
                        }}
                    />
                )}
            </div>
            <div
                style={{
                    backgroundColor: color,
                    borderRadius: '12px',
                    padding: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginLeft: '16px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
            >
                {React.cloneElement(icon, {
                    style: {
                        fontSize: '24px',
                        color: iconColor
                    }
                })}
            </div>
        </div>
    </Card>
);

const StudentProfileDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth();

    const [student, setStudent] = useState(null);
    const [attempts, setAttempts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [emojiPositions, setEmojiPositions] = useState([]);

    useEffect(() => {
        const loadStudentProfile = async () => {
            try {
                setLoading(true);

                const users = await apiService.getUsers();
                // Use loose equality for id comparison
                const studentData = users.find(user => user.id == id);

                if (!studentData) {
                    setError('O\'quvchi topilmadi');
                    setLoading(false);
                    return;
                }

                setStudent(studentData);

                const allAttempts = await apiService.getAttempts({ student: id });
                setAttempts(allAttempts);

                const emojis = studentData.selected_emojis || [];
                if (emojis.length > 0) {
                    setEmojiPositions(generateRandomPositions(emojis.length));
                }

            } catch (error) {
                console.error('Failed to load student profile:', error);
                setError('Ma\'lumotlarni yuklashda xatolik yuz berdi');
            } finally {
                setLoading(false);
            }
        };
        loadStudentProfile();
    }, [id]);

    const generateRandomPositions = (emojiCount) => {
        const positions = [];
        for (let i = 0; i < emojiCount; i++) {
            positions.push({
                left: Math.random() * 100,
                top: Math.random() * 100,
                delay: Math.random() * 5,
                duration: 15 + Math.random() * 10,
                scale: 0.7 + Math.random() * 0.6,
                rotation: Math.random() * 360
            });
        }
        return positions;
    };

    const totalTests = attempts.length;
    const scores = attempts.map(attempt => attempt.score || 0);
    const averageScore = scores.length > 0
        ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
        : 0;
    const highestScore = scores.length > 0
        ? Math.round(Math.max(...scores))
        : 0;

    if (loading) {
        return <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}><Spin size="large" /></div>;
    }

    if (error || !student) {
        return <Alert message={error || "O'quvchi topilmadi"} type="error" />;
    }

    const profileBackgroundStyle = shouldShowPremiumFeatures(student, currentUser) && student.background_gradient
        ? {
            background: (typeof student.background_gradient === 'string'
                ? JSON.parse(student.background_gradient).css
                : student.background_gradient.css)
        }
        : shouldShowPremiumFeatures(student, currentUser)
            ? {
                background: `
            radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%),
            linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)
          `
            }
            : { background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' };

    return (
        <div className="animate__animated animate__fadeIn" style={{ paddingTop: '0', paddingBottom: '24px' }}>
            {/* Header */}
            <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <Title level={2} style={{ margin: 0, color: '#1e293b' }}>O'quvchi Profili</Title>
                    <Text type="secondary">O'quvchi haqida batafsil ma'lumotlar</Text>
                </div>
                <Button
                    icon={<ArrowLeftOutlined />}
                    onClick={() => navigate(-1)}
                    size="large"
                    style={{ borderRadius: '8px' }}
                >
                    Orqaga
                </Button>
            </div>

            {/* Profile Card */}
            <Card style={{
                marginBottom: '24px',
                ...profileBackgroundStyle,
                borderRadius: '16px',
                border: 'none',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                overflow: 'hidden',
                position: 'relative',
                minHeight: '220px',
            }}
                bodyStyle={{ padding: '32px', position: 'relative' }}
            >
                {/* Badge */}
                {student.is_premium && (
                    <Tag color="gold" style={{ position: 'absolute', top: 20, right: 20, zIndex: 10, padding: '4px 12px', borderRadius: '20px', border: 'none', fontWeight: 700 }}>
                        PREMIUM
                    </Tag>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '32px', position: 'relative', zIndex: 2, flexWrap: 'wrap' }}>
                    <Avatar
                        size={140}
                        src={student.profile_photo}
                        icon={<UserOutlined />}
                        style={{
                            backgroundColor: '#ffffff',
                            color: '#2563eb',
                            border: '4px solid rgba(255,255,255,0.8)',
                            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                        }}
                    />
                    <div style={{ color: student.is_premium ? '#fff' : '#1e293b' }}>
                        <Title level={1} style={{ margin: 0, color: 'inherit', fontWeight: 800 }}>{student.name}</Title>
                        {student.profile_status && (
                            <Text style={{ display: 'block', fontSize: '1.1rem', opacity: 0.9, marginTop: 4, fontStyle: 'italic', color: 'inherit' }}>
                                "{student.profile_status}"
                            </Text>
                        )}
                        <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
                            <Tag color={student.is_premium ? 'rgba(255,255,255,0.2)' : 'blue'} style={{ border: 'none', color: 'inherit' }}>
                                {student.class_group || 'Sinf yo\'q'}
                            </Tag>
                            <Tag color={student.is_premium ? 'rgba(255,255,255,0.2)' : 'default'} style={{ border: 'none', color: 'inherit' }}>
                                {student.direction === 'natural' ? 'Tabiiy fanlar' : student.direction === 'exact' ? 'Aniq fanlar' : '-'}
                            </Tag>
                        </div>
                    </div>
                </div>

                {/* Animations (Background Emojis) */}
                <style>{`
            ${Array.from({ length: 20 }).map((_, i) => `
              @keyframes swimAllEmojis-${i} {
                0% { 
                  transform: translateX(${(i % 4 - 2) * 25}%) translateY(0%) rotate(${i * 18}deg) scale(${0.7 + (i % 3) * 0.1}); 
                }
                25% { 
                  transform: translateX(${(i % 4 - 1) * 25}%) translateY(-20%) rotate(${i * 18 + 90}deg) scale(${0.7 + ((i + 1) % 3) * 0.1}); 
                }
                50% { 
                  transform: translateX(${(i % 4) * 25}%) translateY(-40%) rotate(${i * 18 + 180}deg) scale(${0.7 + ((i + 2) % 3) * 0.1}); 
                }
                75% { 
                  transform: translateX(${(i % 4 + 1) * 25}%) translateY(-20%) rotate(${i * 18 + 270}deg) scale(${0.7 + ((i + 1) % 3) * 0.1}); 
                }
                100% { 
                  transform: translateX(${(i % 4 - 2) * 25}%) translateY(0%) rotate(${i * 18 + 360}deg) scale(${0.7 + (i % 3) * 0.1}); 
                }
              }
            `).join('')}
          `}</style>

                {shouldShowPremiumFeatures(student, currentUser) && student.selected_emojis && student.selected_emojis.length > 0 && (
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        pointerEvents: 'none',
                        zIndex: 1,
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            animation: 'swimEmojis 25s infinite linear'
                        }}>
                            {student.selected_emojis.map((emoji, index) => {
                                const position = emojiPositions[index] || {
                                    left: Math.random() * 100,
                                    top: Math.random() * 100,
                                    delay: Math.random() * 5,
                                    duration: 15 + Math.random() * 10,
                                    scale: 0.7 + Math.random() * 0.6,
                                    rotation: Math.random() * 360
                                };
                                return (
                                    <div
                                        key={`emoji-${index}`}
                                        style={{
                                            position: 'absolute',
                                            fontSize: '3rem',
                                            opacity: 0.25 + (index % 3) * 0.05,
                                            color: 'rgba(255, 255, 255, 0.9)',
                                            filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.5))',
                                            left: `${position.left}%`,
                                            top: `${position.top}%`,
                                            transform: `rotate(${position.rotation}deg) scale(${position.scale})`,
                                            animation: `swimAllEmojis-${index % 20} ${position.duration}s infinite ease-in-out`,
                                            animationDelay: `${position.delay}s`,
                                            zIndex: 1
                                        }}
                                    >
                                        {emoji}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

            </Card>

            {/* Stats */}
            <Row gutter={[24, 24]}>
                <Col xs={24} sm={8}>
                    <StatCard
                        title="Jami testlar"
                        value={totalTests}
                        icon={<BarChartOutlined />}
                        color="#eff6ff"
                        iconColor="#2563eb"
                    />
                </Col>
                <Col xs={24} sm={8}>
                    <StatCard
                        title="O'rtacha ball"
                        value={averageScore}
                        suffix="%"
                        icon={<TrophyOutlined />}
                        color="#f0fdf4"
                        iconColor="#16a34a"
                    />
                </Col>
                <Col xs={24} sm={8}>
                    <StatCard
                        title="Eng yuqori ball"
                        value={highestScore}
                        suffix="%"
                        icon={<TrophyOutlined />}
                        color="#fffbeb"
                        iconColor="#d97706"
                    />
                </Col>
            </Row>
        </div>
    );
};

export default StudentProfileDetails;
