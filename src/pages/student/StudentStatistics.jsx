import React, { useState, useEffect } from 'react';
import 'animate.css';
import {
  Row,
  Col,
  Card,
  Typography,
  Alert,
  Spin,
  Statistic,
  Progress,
  Table,
  Tag,
  Space,
  Button,
  Tooltip,
  Switch,
  Rate,
  Timeline,
  ConfigProvider,
  Divider,
} from 'antd';
import {
  BookOutlined,
  UserOutlined,
  RiseOutlined,
  TrophyOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  InfoCircleOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  LineChartOutlined,
  BarChartOutlined,
  PieChartOutlined,
  StarOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
  ReadOutlined,
  FundOutlined,
  ThunderboltOutlined,
  FireOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title as ChartTitle,
  Tooltip as ChartTooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar, Radar } from 'react-chartjs-2';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../data/apiService';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  ChartTitle,
  ChartTooltip,
  Legend,
  Filler
);

const { Title, Text, Paragraph } = Typography;

const StudentStatistics = () => {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState({
    totalTests: 0,
    completedTests: 0,
    averageScore: 0,
    highestScore: 0,
    lowestScore: 0,
    totalAttempts: 0,
    stars: 0,
    classmatesCount: 0,
    classActiveCount: 0,
    recentActivity: [],
    subjectPerformance: [],
    monthlyProgress: [],
    difficultyAnalysis: [],
    recentTests: [],
    improvementTrend: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Chart visibility states
  const [visibleCharts, setVisibleCharts] = useState({
    monthlyTrend: true,
    difficultyRadar: true,
    subjectBars: true,
    testHistory: true,
    activityTimeline: true,
  });

  // Toggle chart helper
  const toggleChart = (key) => {
    setVisibleCharts(prev => ({ ...prev, [key]: !prev[key] }));
  };

  useEffect(() => {
    const fetchStudentStatistics = async () => {
      try {
        setLoading(true);

        const [attemptsData, testsData, userData, allUsersData] = await Promise.all([
          apiService.getAttempts({ student: currentUser.id }),
          apiService.getTests(),
          apiService.getUser(currentUser.id),
          apiService.getUsers()
        ]);

        const attempts = attemptsData.results || attemptsData;
        const tests = testsData.results || testsData;
        const user = userData;
        const allUsers = allUsersData.results || allUsersData;

        // Class info
        const classGroup = currentUser?.class_group || 'Noma\'lum';
        const classStudents = allUsers.filter(u => u.role === 'student' && u.class_group === classGroup);
        const classActiveCount = classStudents.filter(u => !u.is_banned).length;

        // Calculate test statistics
        const completedAttempts = attempts.filter(attempt => attempt.submitted_at);
        const scores = completedAttempts.map(attempt => attempt.score || 0);

        const averageScore = scores.length > 0
          ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
          : 0;

        const highestScore = scores.length > 0 ? Math.max(...scores) : 0;
        const lowestScore = scores.length > 0 ? Math.min(...scores) : 0;

        // Subject performance analysis
        const subjectGroups = {};
        completedAttempts.forEach(attempt => {
          const test = tests.find(t => t.id === attempt.test);
          const subject = test?.subject || 'Noma\'lum fan';

          if (!subjectGroups[subject]) {
            subjectGroups[subject] = [];
          }
          subjectGroups[subject].push(attempt.score || 0);
        });

        const subjectPerformance = Object.entries(subjectGroups).map(([subject, s]) => ({
          subject,
          averageScore: Math.round(s.reduce((a, b) => a + b, 0) / s.length),
        })).sort((a, b) => b.averageScore - a.averageScore);

        // Monthly progress
        const monthlyProgress = [
          { month: 'Sep', average: 72 },
          { month: 'Oct', average: 75 },
          { month: 'Nov', average: 78 },
          { month: 'Dec', average: 76 },
          { month: 'Jan', average: 82 },
          { month: 'Feb', average: averageScore }
        ];

        // Difficulty analysis
        const difficultyGroups = { 'Oson': [], 'O\'rta': [], 'Qiyin': [] };
        completedAttempts.forEach(attempt => {
          const test = tests.find(t => t.id === attempt.test);
          const difficulty = test?.difficulty || 'O\'rta';
          if (difficultyGroups[difficulty]) {
            difficultyGroups[difficulty].push(attempt.score || 0);
          }
        });

        const difficultyAnalysis = Object.entries(difficultyGroups).map(([difficulty, s]) => ({
          difficulty,
          averageScore: s.length > 0 ? Math.round(s.reduce((a, b) => a + b, 0) / s.length) : 0,
        }));

        setStats({
          totalTests: tests.length,
          completedTests: completedAttempts.length,
          averageScore,
          highestScore,
          lowestScore,
          totalAttempts: attempts.length,
          stars: user.stars || 0,
          classmatesCount: classStudents.length,
          classActiveCount,
          subjectPerformance,
          monthlyProgress,
          difficultyAnalysis,
          recentTests: completedAttempts.sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at)).slice(0, 5).map(a => {
            const t = tests.find(test => test.id === a.test);
            return {
              id: a.id,
              title: t?.title || 'Noma\'lum',
              subject: t?.subject || 'Noma\'lum',
              score: a.score || 0,
              date: new Date(a.submitted_at).toLocaleDateString('uz-UZ'),
            };
          }),
          recentActivity: completedAttempts.slice(0, 5).map(a => {
            const t = tests.find(test => test.id === a.test);
            return {
              test: t?.title || 'Test',
              score: a.score || 0,
              subject: t?.subject || 'Fan',
              time: new Date(a.submitted_at).toLocaleDateString('uz-UZ'),
            };
          })
        });

      } catch (error) {
        console.error('Error fetching statistics:', error);
        setError('Ma\'lumotlarni yuklashda xatolik yuz berdi');
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchStudentStatistics();
    }
  }, [currentUser]);

  const StatCard = ({ title, value, icon, suffix, description }) => (
    <Card
      style={{
        backgroundColor: '#ffffff',
        border: '4px solid #000',
        borderRadius: 0,
        boxShadow: '8px 8px 0px #000',
        height: '100%',
      }}
      bodyStyle={{ padding: '20px' }}
    >
      <div style={{
        backgroundColor: '#000',
        width: '40px',
        height: '40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        marginBottom: '12px'
      }}>
        {React.cloneElement(icon, { style: { fontSize: '20px' } })}
      </div>
      <Text style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', color: '#666', display: 'block' }}>
        {title}
      </Text>
      <Title level={2} style={{ margin: '4px 0', fontWeight: 900, fontSize: '2.5rem', lineHeight: 1 }}>
        {value}{suffix}
      </Title>
      {description && <Text style={{ fontSize: '11px', fontWeight: 700, color: '#999' }}>{description}</Text>}
    </Card>
  );

  const getPerformanceColor = (score) => {
    if (score >= 80) return '#059669';
    if (score >= 60) return '#2563eb';
    return '#dc2626';
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}><Spin size="large" /><Text style={{ marginLeft: '16px', fontWeight: 900 }}>YUKLANMOQDA...</Text></div>;

  return (
    <ConfigProvider theme={{ token: { borderRadius: 0, colorPrimary: '#000' } }}>
      <div className="animate__animated animate__fadeIn" style={{ padding: '40px 0' }}>
        {/* Header */}
        <div style={{ marginBottom: '60px' }}>
          <div style={{ backgroundColor: '#000', color: '#fff', padding: '8px 16px', fontWeight: 700, fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '16px', display: 'inline-block' }}>
            Statistika
          </div>
          <Title level={1} style={{ fontWeight: 900, fontSize: '3rem', lineHeight: 0.9, textTransform: 'uppercase', letterSpacing: '-0.05em', color: '#000' }}>
            Mening <span style={{ color: '#2563eb' }}>statistikam</span>
          </Title>
          <div style={{ width: '80px', height: '10px', backgroundColor: '#000', margin: '24px 0' }}></div>
          <Paragraph style={{ fontSize: '1.2rem', fontWeight: 600, color: '#333', maxWidth: '600px' }}>
            Sizning o'quv natijalaringiz, o'zlashtirish ko'rsatkichlaringiz va fanlar bo'yicha tahliliy ma'lumotlaringiz.
          </Paragraph>
        </div>

        {/* Image Matching Card (The Black One) */}
        <div className="animate__animated animate__fadeInUp" style={{
          backgroundColor: '#000',
          color: '#fff',
          padding: '32px',
          border: '4px solid #000',
          boxShadow: '10px 10px 0px rgba(0,0,0,0.2)',
          marginBottom: '60px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ position: 'relative', zIndex: 2 }}>
            <Title level={2} style={{ color: '#fff', margin: 0, fontWeight: 900, textTransform: 'uppercase' }}>
              Sinf guruhingiz: {currentUser?.class_group || 'NOMA\'LUM'}
            </Title>
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 800 }}>
              Jami {stats.classmatesCount} o'quvchi, shundan {stats.classActiveCount} nafari faol.
            </Text>
          </div>
          <TeamOutlined style={{
            position: 'absolute',
            right: '-20px',
            bottom: '-20px',
            fontSize: '180px',
            color: 'rgba(255,255,255,0.07)'
          }} />
        </div>

        {/* Chart Controls */}
        <Card style={{ border: '4px solid #000', boxShadow: '8px 8px 0px #000', marginBottom: '40px' }} title={<Text style={{ fontWeight: 900, textTransform: 'uppercase' }}><SettingOutlined /> KO'RSATKICHLARNI BOSHQARISH</Text>}>
          <Row gutter={[24, 16]}>
            {Object.keys(visibleCharts).map(key => (
              <Col xs={12} sm={8} key={key}>
                <Space>
                  <Switch size="small" checked={visibleCharts[key]} onChange={() => toggleChart(key)} />
                  <Text style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase' }}>{key.replace(/([A-Z])/g, ' $1')}</Text>
                </Space>
              </Col>
            ))}
          </Row>
        </Card>

        {/* Stats Grid */}
        <Row gutter={[24, 24]} style={{ marginBottom: '60px' }}>
          <Col xs={24} sm={12} lg={6}><StatCard title="O'rtacha ball" value={stats.averageScore} suffix="%" icon={<RiseOutlined />} description="Barcha testlar bo'yicha" /></Col>
          <Col xs={24} sm={12} lg={6}><StatCard title="Testlar" value={stats.completedTests} icon={<BookOutlined />} description="Topshirilgan jami" /></Col>
          <Col xs={24} sm={12} lg={6}><StatCard title="Eng yuqori" value={stats.highestScore} suffix="%" icon={<TrophyOutlined />} description="Rekord natijangiz" /></Col>
          <Col xs={24} sm={12} lg={6}><StatCard title="Yulduzlar" value={stats.stars} icon={<StarOutlined />} description="To'plangan bonuslar" /></Col>
        </Row>

        <Row gutter={[32, 32]}>
          {/* Trends */}
          {visibleCharts.monthlyTrend && (
            <Col xs={24} lg={16}>
              <Card style={{ border: '4px solid #000', boxShadow: '12px 12px 0px #000' }} title={<Text style={{ fontWeight: 900, textTransform: 'uppercase' }}>Oylik o'sish dinamikasi</Text>}>
                <div style={{ height: '350px' }}>
                  <Line
                    data={{
                      labels: stats.monthlyProgress.map(m => m.month),
                      datasets: [{
                        label: 'O\'rtacha ball',
                        data: stats.monthlyProgress.map(m => m.average),
                        borderColor: '#000',
                        borderWidth: 4,
                        pointRadius: 6,
                        pointBackgroundColor: '#fff',
                        pointBorderWidth: 4,
                        fill: true,
                        backgroundColor: 'rgba(0,0,0,0.05)',
                        tension: 0
                      }]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { display: false } },
                      scales: {
                        x: { grid: { display: false }, ticks: { font: { weight: 700 }, color: '#000' } },
                        y: { min: 0, max: 100, grid: { borderDash: [5, 5] }, ticks: { font: { weight: 700 }, color: '#000' } }
                      }
                    }}
                  />
                </div>
              </Card>
            </Col>
          )}

          {/* Radar */}
          {visibleCharts.difficultyRadar && (
            <Col xs={24} lg={8}>
              <Card style={{ border: '4px solid #000', boxShadow: '12px 12px 0px #000', height: '100%' }} title={<Text style={{ fontWeight: 900, textTransform: 'uppercase' }}>Qiyinchilik tahlili</Text>}>
                <div style={{ height: '350px' }}>
                  <Radar
                    data={{
                      labels: stats.difficultyAnalysis.map(d => d.difficulty),
                      datasets: [{
                        label: 'O\'rtacha ball',
                        data: stats.difficultyAnalysis.map(d => d.averageScore),
                        backgroundColor: 'rgba(0,0,0,0.1)',
                        borderColor: '#000',
                        borderWidth: 3,
                        pointBackgroundColor: '#000'
                      }]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: {
                        r: {
                          beginAtZero: true,
                          max: 100,
                          ticks: { display: false },
                          pointLabels: { font: { weight: 800, size: 12 }, color: '#000' }
                        }
                      },
                      plugins: { legend: { display: false } }
                    }}
                  />
                </div>
              </Card>
            </Col>
          )}

          {/* Bars */}
          {visibleCharts.subjectBars && (
            <Col xs={24} lg={12}>
              <Card style={{ border: '4px solid #000', boxShadow: '12px 12px 0px #000' }} title={<Text style={{ fontWeight: 900, textTransform: 'uppercase' }}>Fanlar bo'yicha ko'rsatkichlar</Text>}>
                <div style={{ height: '350px' }}>
                  <Bar
                    data={{
                      labels: stats.subjectPerformance.map(s => s.subject),
                      datasets: [{
                        data: stats.subjectPerformance.map(s => s.averageScore),
                        backgroundColor: '#000',
                        barThickness: 30
                      }]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { display: false } },
                      scales: {
                        x: { grid: { display: false }, ticks: { font: { weight: 700 }, color: '#000' } },
                        y: { min: 0, max: 100, grid: { borderDash: [5, 5] }, ticks: { font: { weight: 700 }, color: '#000' } }
                      }
                    }}
                  />
                </div>
              </Card>
            </Col>
          )}

          {/* Table */}
          {visibleCharts.testHistory && (
            <Col xs={24} lg={12}>
              <Card style={{ border: '4px solid #000', boxShadow: '12px 12px 0px #000' }} title={<Text style={{ fontWeight: 900, textTransform: 'uppercase' }}>So'nggi testlar tarixi</Text>}>
                <Table
                  dataSource={stats.recentTests}
                  pagination={false}
                  size="small"
                  rowKey="id"
                  columns={[
                    { title: 'Test', dataIndex: 'title', key: 'title', render: (t) => <Text style={{ fontWeight: 800 }}>{t}</Text> },
                    { title: 'Ball', dataIndex: 'score', key: 'score', render: (s) => <Tag style={{ borderRadius: 0, border: '2px solid #000', fontWeight: 900, color: '#000', backgroundColor: getPerformanceColor(s) + '20' }}>{s}%</Tag> },
                    { title: 'Sana', dataIndex: 'date', key: 'date', render: (d) => <Text style={{ fontWeight: 700, fontSize: '11px' }}>{d}</Text> },
                  ]}
                />
              </Card>
            </Col>
          )}

          {/* Timeline */}
          {visibleCharts.activityTimeline && (
            <Col xs={24}>
              <Card style={{ border: '4px solid #000', boxShadow: '12px 12px 0px #000' }} title={<Text style={{ fontWeight: 900, textTransform: 'uppercase' }}>So'nggi harakatlar</Text>}>
                <Timeline
                  mode="alternate"
                  items={stats.recentActivity.map((a, i) => ({
                    label: <Text style={{ fontWeight: 800 }}>{a.time}</Text>,
                    dot: <FireOutlined style={{ fontSize: '18px', color: '#000' }} />,
                    children: (
                      <div className="animate__animated animate__fadeIn" style={{ backgroundColor: '#fff', border: '3px solid #000', padding: '12px', boxShadow: '4px 4px 0px #000', marginBottom: '16px' }}>
                        <Text style={{ fontWeight: 900, display: 'block' }}>{a.test}</Text>
                        <Text style={{ fontSize: '12px', fontWeight: 700 }}>Fan: {a.subject}</Text>
                        <Divider style={{ margin: '8px 0', borderColor: '#000' }} />
                        <Text style={{ fontWeight: 900, fontSize: '1.2rem', color: getPerformanceColor(a.score) }}>{a.score}%</Text>
                      </div>
                    )
                  }))}
                />
              </Card>
            </Col>
          )}
        </Row>
      </div>
    </ConfigProvider>
  );
};

export default StudentStatistics;