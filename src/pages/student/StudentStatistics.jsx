import React, { useState, useEffect } from 'react';
import 'animate.css';
import { Typography, Card, Row, Col, Alert, Button, Statistic } from 'antd';
import {
  SearchOutlined,
  BarChartOutlined,
  RiseOutlined,
} from '@ant-design/icons';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  LineElement,
  PointElement,
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import apiService from '../../data/apiService';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  LineElement,
  PointElement
);

const { Title: AntTitle, Text } = Typography;

const StudentStatistics = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [myAttempts, setMyAttempts] = useState([]);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStatistics();
  }, [currentUser.id]);

  const loadStatistics = async () => {
    try {
      setLoading(true);
      setError('');

      // Load student's attempts and all tests from API
      const [attemptsResponse, testsResponse] = await Promise.all([
        apiService.getAttempts({ student: currentUser.id }),
        apiService.getTests()
      ]);

      const studentAttempts = attemptsResponse.results || attemptsResponse;
      const allTests = testsResponse.results || testsResponse;

      setMyAttempts(studentAttempts);
      setTests(allTests);

    } catch (err) {
      console.error('Failed to load student statistics:', err);
      setError('O\'quvchi statistikasini yuklashda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const totalTests = myAttempts.length;
  const scores = myAttempts.map(attempt => attempt.score || 0);
  const averageScore = scores.length > 0
    ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
    : 0;
  const highestScore = scores.length > 0
    ? Math.round(Math.max(...scores))
    : 0;
  const lowestScore = scores.length > 0
    ? Math.round(Math.min(...scores))
    : 0;

  // Score distribution data
  const scoreRanges = {
    '0-20': 0,
    '21-40': 0,
    '41-60': 0,
    '61-80': 0,
    '81-100': 0
  };

  scores.forEach(score => {
    if (score <= 20) scoreRanges['0-20']++;
    else if (score <= 40) scoreRanges['21-40']++;
    else if (score <= 60) scoreRanges['41-60']++;
    else if (score <= 80) scoreRanges['61-80']++;
    else scoreRanges['81-100']++;
  });

  const scoreDistributionData = {
    labels: Object.keys(scoreRanges),
    datasets: [
      {
        label: 'Testlar soni',
        data: Object.values(scoreRanges),
        backgroundColor: [
          'rgba(239, 68, 68, 0.6)',
          'rgba(245, 158, 11, 0.6)',
          'rgba(34, 197, 94, 0.6)',
          'rgba(59, 130, 246, 0.6)',
          'rgba(147, 51, 234, 0.6)',
        ],
        borderColor: [
          'rgba(239, 68, 68, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(34, 197, 94, 1)',
          'rgba(59, 130, 246, 1)',
          'rgba(147, 51, 234, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Score trend over time
  const sortedAttempts = myAttempts
    .sort((a, b) => new Date(a.submitted_at) - new Date(b.submitted_at))
    .slice(-10); // Last 10 attempts

  const scoreTrendData = {
    labels: sortedAttempts.map((_, index) => `Test ${index + 1}`),
    datasets: [
      {
        label: 'Ball',
        data: sortedAttempts.map(attempt => attempt.score || 0),
        borderColor: 'rgba(59, 130, 246, 1)',
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        tension: 0.1,
      },
    ],
  };

  // Performance by subject
  const subjectStats = {};
  myAttempts.forEach(attempt => {
    const test = tests.find(t => t.id === attempt.test);
    if (test) {
      const subject = test.subject;
      if (!subjectStats[subject]) {
        subjectStats[subject] = { total: 0, sum: 0 };
      }
      subjectStats[subject].total++;
      subjectStats[subject].sum += attempt.score || 0;
    }
  });

  const subjectPerformanceData = {
    labels: Object.keys(subjectStats),
    datasets: [
      {
        label: 'O\'rtacha ball',
        data: Object.values(subjectStats).map(stat => Math.round(stat.sum / stat.total)),
        backgroundColor: [
          'rgba(239, 68, 68, 0.6)',
          'rgba(59, 130, 246, 0.6)',
          'rgba(34, 197, 94, 0.6)',
          'rgba(245, 158, 11, 0.6)',
          'rgba(147, 51, 234, 0.6)',
        ],
        borderColor: [
          'rgba(239, 68, 68, 1)',
          'rgba(59, 130, 246, 1)',
          'rgba(34, 197, 94, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(147, 51, 234, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Recent activity
  const recentAttempts = myAttempts
    .sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at))
    .slice(0, 10);

  const StatCard = ({ title, value, icon, color, suffix }) => (
    <Card
      style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        transition: 'all 0.3s ease',
      }}
      styles={{ body: { padding: '24px' } }}
      hoverable
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: '12px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              color: '#64748b',
              display: 'block',
              marginBottom: '8px'
            }}
          >
            {title}
          </Text>
          <Statistic
            value={value}
            suffix={suffix}
            styles={{
              content: {
                fontSize: '32px',
                fontWeight: 700,
                color: '#1e293b',
                lineHeight: 1.2
              }
            }}
          />
        </div>
        <div
          style={{
            backgroundColor: color,
            borderRadius: '12px',
            padding: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginLeft: '16px'
          }}
        >
          {React.cloneElement(icon, {
            style: {
              fontSize: '24px',
              color: '#ffffff'
            }
          })}
        </div>
      </div>
    </Card>
  );

  if (loading) {
    return (
      <div style={{ 
        paddingTop: '16px',
        paddingBottom: '16px',
        backgroundColor: '#ffffff'
      }}>
        <AntTitle level={1} style={{
          fontSize: '2.5rem',
          fontWeight: 700,
          color: '#1e293b'
        }}>
          Mening statistikam
        </AntTitle>
        <Text style={{ color: '#64748b' }}>Yuklanmoqda...</Text>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        paddingTop: '16px',
        paddingBottom: '16px',
        backgroundColor: '#ffffff'
      }}>
        <AntTitle level={1} style={{
          fontSize: '2.5rem',
          fontWeight: 700,
          color: '#1e293b',
          marginBottom: '16px'
        }}>
          Mening statistikam
        </AntTitle>
        <Alert 
          message={error}
          type="error" 
          style={{ 
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#991b1b'
          }}
        />
      </div>
    );
  }

  return (
    <div style={{
      paddingTop: '16px',
      paddingBottom: '16px',
      backgroundColor: '#ffffff'
    }}>
      <div style={{
        marginBottom: '24px',
        paddingBottom: '16px',
        borderBottom: '1px solid #e2e8f0'
      }}
      >
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px'
        }}>
          <AntTitle level={1} style={{
            fontSize: '2.5rem',
            fontWeight: 700,
            color: '#1e293b',
            marginBottom: '8px'
          }}>
            Mening statistikam
          </AntTitle>
          <Button
            type="primary"
            icon={<SearchOutlined />}
            onClick={() => navigate('/student/search')}
            style={{
              backgroundColor: '#2563eb',
              color: '#ffffff',
              padding: '12px 24px',
              borderRadius: '8px',
              fontWeight: 600,
              border: 'none'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#1d4ed8';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#2563eb';
            }}
          >
            O'qituvchilarni topish
          </Button>
        </div>
        <Text style={{
          fontSize: '1.125rem',
          color: '#64748b',
          fontWeight: 400
        }}>
          Test natijalaringiz va statistik ma'lumotlari
        </Text>
      </div>

      {/* Main Statistics Cards */}
      <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <div className="animate__animated animate__zoomIn" style={{ animationDelay: '100ms' }}>
            <StatCard
              title="Topshirilgan testlar"
              value={totalTests}
              icon={<BarChartOutlined />}
              color="#2563eb"
            />
          </div>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <div className="animate__animated animate__zoomIn" style={{ animationDelay: '200ms' }}>
            <StatCard
              title="O'rtacha ball"
              value={averageScore}
              suffix="%"
              icon={<RiseOutlined />}
              color="#16a34a"
            />
          </div>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <div className="animate__animated animate__zoomIn" style={{ animationDelay: '300ms' }}>
            <StatCard
              title="Eng yuqori ball"
              value={highestScore}
              suffix="%"
              icon={<RiseOutlined />}
              color="#059669"
            />
          </div>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <div className="animate__animated animate__zoomIn" style={{ animationDelay: '400ms' }}>
            <StatCard
              title="Eng past ball"
              value={lowestScore}
              suffix="%"
              icon={<RiseOutlined />}
              color="#dc2626"
            />
          </div>
        </Col>
      </Row>

      <div style={{ marginTop: '16px' }}>
        <div style={{
          backgroundColor: '#eff6ff',
          borderRadius: '12px',
          padding: '16px 20px',
          marginBottom: '16px',
          border: '1px solid #e2e8f0'
        }}
        >
          <AntTitle level={3} style={{
            fontSize: '1.25rem',
            fontWeight: 600,
            color: '#1e293b',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: 0
          }}>
            <BarChartOutlined style={{ color: '#2563eb' }} />
            Statistik ma'lumotlar va tahlillar
          </AntTitle>
        </div>

        <Row gutter={[16, 16]}>
        {/* Score Distribution Chart */}
        <Col xs={24} lg={12}>
          <div className="animate__animated animate__fadeInUp" style={{ animationDelay: '100ms' }}>
            <Card style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
              height: '100%',
              minHeight: '400px',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <AntTitle level={4} style={{
                  fontWeight: 600,
                  color: '#1e293b',
                  fontSize: '1.25rem',
                  marginBottom: '12px'
                }}>
                  Ballar taqsimoti
                </AntTitle>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Bar
                    data={scoreDistributionData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'top',
                        },
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: {
                            stepSize: 1
                          }
                        }
                      },
                      animation: {
                        duration: 2000,
                        easing: 'easeOutBounce',
                        delay: (context) => {
                          if (context.type === 'data' && context.mode === 'default') {
                            return context.dataIndex * 100;
                          }
                          return 0;
                        },
                      },
                    }}
                  />
                </div>
              </div>
            </Card>
          </div>
        </Col>

        {/* Performance by Subject */}
        <Col xs={24} lg={12}>
          <div className="animate__animated animate__fadeInUp" style={{ animationDelay: '200ms' }}>
            <Card style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
              height: '100%',
              minHeight: '400px',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <AntTitle level={4} style={{
                  fontWeight: 600,
                  color: '#1e293b',
                  fontSize: '1.25rem',
                  marginBottom: '12px'
                }}>
                  Fanlar bo'yicha natijalar
                </AntTitle>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Pie
                    data={subjectPerformanceData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom',
                        },
                      },
                      animation: {
                        animateRotate: true,
                        animateScale: true,
                        duration: 2500,
                        easing: 'easeOutElastic(1, .6)',
                      },
                    }}
                  />
                </div>
              </div>
            </Card>
          </div>
        </Col>

        {/* Score Trend */}
        <Col span={24}>
          <div className="animate__animated animate__fadeInUp" style={{ animationDelay: '300ms' }}>
            <Card style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
              minHeight: '400px',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <AntTitle level={4} style={{
                  fontWeight: 600,
                  color: '#1e293b',
                  fontSize: '1.25rem',
                  marginBottom: '12px'
                }}>
                  Ballar tendensiyasi (oxirgi 10 ta test)
                </AntTitle>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Line
                    data={scoreTrendData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'top',
                        },
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          max: 100
                        }
                      },
                      animation: {
                        duration: 2000,
                        easing: 'easeInOutQuart',
                        delay: (context) => {
                          if (context.type === 'data' && context.mode === 'default') {
                            return context.dataIndex * 200;
                          }
                          return 0;
                        },
                      },
                    }}
                  />
                </div>
              </div>
            </Card>
          </div>
        </Col>

        {/* Performance Summary */}
        <Col span={24}>
          <div className="animate__animated animate__fadeInUp" style={{ animationDelay: '400ms' }}>
            <Card style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
              height: '100%',
              minHeight: '400px',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <AntTitle level={4} style={{
                  fontWeight: 600,
                  color: '#1e293b',
                  fontSize: '1.25rem',
                  marginBottom: '12px'
                }}>
                  Natija umumlashtiruvi
                </AntTitle>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '8px' }}>
                  <Text style={{ color: '#334155', fontWeight: 500, marginBottom: '8px' }}>
                    <strong>Jami testlar:</strong> {totalTests}
                  </Text>
                  <Text style={{ color: '#334155', fontWeight: 500, marginBottom: '8px' }}>
                    <strong>O'rtacha ball:</strong> {averageScore}%
                  </Text>
                  <Text style={{ color: '#334155', fontWeight: 500, marginBottom: '8px' }}>
                    <strong>Eng yuqori ball:</strong> {highestScore}%
                  </Text>
                  <Text style={{ color: '#334155', fontWeight: 500, marginBottom: '12px' }}>
                    <strong>Eng past ball:</strong> {lowestScore}%
                  </Text>
                  <Text style={{ color: '#64748b', fontWeight: 500 }}>
                    {averageScore >= 80 ? 'Ajoyib natija! Davom eting!' :
                     averageScore >= 60 ? 'Yaxshi natija! Yanada yaxshilashingiz mumkin.' :
                     'Ko\'proq mashq qiling va bilim oling!'}
                  </Text>
                </div>
              </div>
            </Card>
          </div>
        </Col>
      </Row>
      </div>

      {/* Quick Actions */}
      <div style={{
        backgroundColor: '#f8fafc',
        borderRadius: '12px',
        padding: '16px 20px',
        marginTop: '16px',
        border: '1px solid #e2e8f0'
      }}
      >
        <AntTitle level={3} style={{
          fontSize: '1.25rem',
          fontWeight: 600,
          color: '#1e293b',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '16px'
        }}>
          <BarChartOutlined style={{ color: '#2563eb' }} />
          Tezkor amallar
        </AntTitle>
        <Row gutter={[8, 8]}>
          <Col xs={24} md={12} lg={6}>
            <Button
              variant="outlined"
              fullWidth
              icon={<SearchOutlined />}
              onClick={() => navigate('/student/search')}
              style={{
                borderColor: '#e2e8f0',
                color: '#374151',
                borderRadius: '8px',
                padding: '12px 16px',
                fontWeight: 600,
                border: '1px solid #e2e8f0',
                backgroundColor: 'transparent'
              }}
              onMouseEnter={(e) => {
                e.target.style.borderColor = '#2563eb';
                e.target.style.backgroundColor = '#f8fafc';
              }}
              onMouseLeave={(e) => {
                e.target.style.borderColor = '#e2e8f0';
                e.target.style.backgroundColor = 'transparent';
              }}
            >
              O'qituvchilarni topish
            </Button>
          </Col>
          <Col xs={24} md={12} lg={6}>
            <Button
              variant="outlined"
              fullWidth
              icon={<BarChartOutlined />}
              onClick={() => navigate('/student/results')}
              style={{
                borderColor: '#e2e8f0',
                color: '#374151',
                borderRadius: '8px',
                padding: '12px 16px',
                fontWeight: 600,
                border: '1px solid #e2e8f0',
                backgroundColor: 'transparent'
              }}
              onMouseEnter={(e) => {
                e.target.style.borderColor = '#2563eb';
                e.target.style.backgroundColor = '#f8fafc';
              }}
              onMouseLeave={(e) => {
                e.target.style.borderColor = '#e2e8f0';
                e.target.style.backgroundColor = 'transparent';
              }}
            >
              Test natijalari
            </Button>
          </Col>
          <Col xs={24} md={12} lg={6}>
            <Button
              variant="outlined"
              fullWidth
              icon={<RiseOutlined />}
              onClick={() => navigate('/student')}
              style={{
                borderColor: '#e2e8f0',
                color: '#374151',
                borderRadius: '8px',
                padding: '12px 16px',
                fontWeight: 600,
                border: '1px solid #e2e8f0',
                backgroundColor: 'transparent'
              }}
              onMouseEnter={(e) => {
                e.target.style.borderColor = '#2563eb';
                e.target.style.backgroundColor = '#f8fafc';
              }}
              onMouseLeave={(e) => {
                e.target.style.borderColor = '#e2e8f0';
                e.target.style.backgroundColor = 'transparent';
              }}
            >
              Bosh sahifa
            </Button>
          </Col>
          <Col xs={24} md={12} lg={6}>
            <Button
              variant="outlined"
              fullWidth
              icon={<BarChartOutlined />}
              onClick={() => navigate('/student/profile')}
              style={{
                borderColor: '#e2e8f0',
                color: '#374151',
                borderRadius: '8px',
                padding: '12px 16px',
                fontWeight: 600,
                border: '1px solid #e2e8f0',
                backgroundColor: 'transparent'
              }}
              onMouseEnter={(e) => {
                e.target.style.borderColor = '#2563eb';
                e.target.style.backgroundColor = '#f8fafc';
              }}
              onMouseLeave={(e) => {
                e.target.style.borderColor = '#e2e8f0';
                e.target.style.backgroundColor = 'transparent';
              }}
            >
              Mening profilim
            </Button>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default StudentStatistics;