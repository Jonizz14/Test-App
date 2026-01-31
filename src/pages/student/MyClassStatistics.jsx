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
  Switch,
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
  TeamOutlined,
  BarChartOutlined,
  PieChartOutlined,
  LineChartOutlined,
  StarOutlined,
  SafetyCertificateOutlined,
  FundOutlined,
  ThunderboltOutlined,
  ReadOutlined,
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
import { Line, Bar, Pie, Doughnut, Radar } from 'react-chartjs-2';
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

const MyClassStatistics = () => {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeStudents: 0,
    classAverageScore: 0,
    highestScore: 0,
    totalTests: 0,
    totalAttempts: 0,
    subjectPerformance: [],
    monthlyProgress: [],
    difficultyAnalysis: [],
    topStudents: [],
    recentActivity: [],
    classmates: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Chart visibility states
  const [visibleCharts, setVisibleCharts] = useState({
    studentRanking: true,
    subjectAverage: true,
    classNotifications: true,
    classPerformance: true,
  });

  // Toggle chart helper
  const toggleChart = (key) => {
    setVisibleCharts(prev => ({ ...prev, [key]: !prev[key] }));
  };

  useEffect(() => {
    const fetchClassStatistics = async () => {
      try {
        setLoading(true);

        const classGroup = currentUser?.class_group;
        if (!classGroup) {
          setError('Siz sinfga tegishli emassiz');
          setLoading(false);
          return;
        }

        const [usersData, attemptsData, testsData] = await Promise.all([
          apiService.getUsers(),
          apiService.getAttempts(),
          apiService.getTests()
        ]);

        const users = usersData.results || usersData;
        const attempts = attemptsData.results || attemptsData;
        const tests = testsData.results || testsData;

        const classStudents = users.filter(
          user => user.role === 'student' && user.class_group === classGroup
        );

        const totalStudents = classStudents.length;
        const activeStudents = classStudents.filter(s => !s.is_banned).length;

        const classAttempts = attempts.filter(
          attempt => classStudents.some(student => student.id === attempt.student)
        );

        const totalAttempts = classAttempts.length;
        const scores = classAttempts.map(attempt => attempt.score || 0);
        const classAverageScore = scores.length > 0
          ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
          : 0;

        const highestScore = scores.length > 0 ? Math.max(...scores) : 0;

        // Subject performance
        const subjectGroups = {};
        classAttempts.forEach(attempt => {
          const test = tests.find(t => t.id === attempt.test);
          const subject = test?.subject || 'Noma\'lum fan';
          if (!subjectGroups[subject]) {
            subjectGroups[subject] = { total: 0, scores: [] };
          }
          subjectGroups[subject].scores.push(attempt.score || 0);
        });

        const subjectPerformance = Object.entries(subjectGroups).map(([subject, data]) => ({
          subject,
          averageScore: Math.round(data.scores.reduce((sum, s) => sum + s, 0) / data.scores.length),
        })).sort((a, b) => b.averageScore - a.averageScore);

        // Top students
        const studentAnalytics = classStudents.map(student => {
          const studentAttempts = attempts.filter(a => a.student === student.id);
          const avgScore = studentAttempts.length > 0
            ? Math.round(studentAttempts.reduce((sum, a) => sum + (a.score || 0), 0) / studentAttempts.length)
            : 0;

          return {
            id: student.id,
            name: student.name || student.username,
            averageScore: avgScore,
            testCount: studentAttempts.length
          };
        }).sort((a, b) => b.averageScore - a.averageScore);

        setStats({
          totalStudents,
          activeStudents,
          classAverageScore,
          highestScore,
          totalAttempts,
          subjectPerformance,
          topStudents: studentAnalytics.slice(0, 10),
          classmates: studentAnalytics,
          recentActivity: classAttempts.slice(0, 10).map(a => {
            const student = classStudents.find(s => s.id === a.student);
            return {
              studentName: student?.name || 'Noma\'lum',
              score: a.score || 0,
              date: a.submitted_at ? new Date(a.submitted_at).toLocaleDateString('uz-UZ') : '-'
            };
          })
        });

      } catch (error) {
        console.error('Error fetching class statistics:', error);
        setError('Ma\'lumotlarni yuklashda xatolik yuz berdi');
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchClassStatistics();
    }
  }, [currentUser]);

  const StatCard = ({ title, value, icon, description }) => (
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{
          backgroundColor: '#000',
          width: '40px',
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff'
        }}>
          {React.cloneElement(icon, { style: { fontSize: '20px' } })}
        </div>
      </div>
      <Text style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#666', display: 'block' }}>
        {title}
      </Text>
      <Title level={2} style={{ margin: '4px 0', fontWeight: 900, fontSize: '2.5rem', lineHeight: 1 }}>
        {value}
      </Title>
      {description && (
        <Text style={{ fontSize: '10px', fontWeight: 700, color: '#999', textTransform: 'uppercase' }}>
          {description}
        </Text>
      )}
    </Card>
  );

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px', flexDirection: 'column' }}>
        <Spin size="large" />
        <Text style={{ marginTop: 16, fontWeight: 700, textTransform: 'uppercase' }}>Sinf statistikasi yuklanmoqda...</Text>
      </div>
    );
  }

  return (
    <ConfigProvider theme={{ token: { borderRadius: 0, colorPrimary: '#000' } }}>
      <div className="animate__animated animate__fadeIn" style={{ padding: '40px 0' }}>
        {/* Header */}
        <div style={{ marginBottom: '60px' }}>
          <div style={{ backgroundColor: '#000', color: '#fff', padding: '8px 16px', fontWeight: 700, fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '16px', display: 'inline-block' }}>
            Sinf Statistikasi
          </div>
          <Title level={1} style={{ fontWeight: 900, fontSize: '3rem', lineHeight: 0.9, textTransform: 'uppercase', letterSpacing: '-0.05em', color: '#000' }}>
            Sinfdoshlar ko'rsatkichlari
          </Title>
          <div style={{ width: '80px', height: '10px', backgroundColor: '#000', margin: '24px 0' }}></div>
          <Paragraph style={{ fontSize: '1.2rem', fontWeight: 600, color: '#333', maxWidth: '600px' }}>
            Sinfingizning umumiy natijalari, fanlar bo'yicha o'rtacha ballar va faol o'quvchilar reytingi.
          </Paragraph>
        </div>

        {/* Info Alerts (The Black Card) */}
        <Row gutter={[24, 24]} style={{ marginBottom: '40px' }}>
          <Col span={24}>
            <div className="animate__animated animate__fadeInUp" style={{
              backgroundColor: '#000',
              color: '#fff',
              padding: '24px',
              border: '4px solid #000',
              boxShadow: '10px 10px 0px rgba(0,0,0,0.2)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ position: 'relative', zIndex: 1 }}>
                <Title level={3} style={{ color: '#fff', margin: 0, fontWeight: 900, textTransform: 'uppercase' }}>
                  Sinf guruhingiz: {currentUser?.class_group || 'Noma\'lum'}
                </Title>
                <Text style={{ color: '#aaa', fontWeight: 700 }}>
                  Jami {stats.totalStudents} o'quvchi, shundan {stats.activeStudents} nafari faol.
                </Text>
              </div>
              <TeamOutlined style={{ position: 'absolute', right: '-20px', bottom: '-20px', fontSize: '120px', color: 'rgba(255,255,255,0.1)' }} />
            </div>
          </Col>
        </Row>

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
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Sinf o'rtachasi"
              value={`${stats.classAverageScore}%`}
              icon={<RiseOutlined />}
              description="Barcha o'quvchilar bo'yicha"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Eng yuqori ball"
              value={`${stats.highestScore}%`}
              icon={<TrophyOutlined />}
              description="Sinfning rekord natijasi"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Jami urinishlar"
              value={stats.totalAttempts}
              icon={<ThunderboltOutlined />}
              description="Sinf bo'yicha jami test"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Faollik"
              value={`${Math.round((stats.activeStudents / stats.totalStudents) * 100)}%`}
              icon={<TeamOutlined />}
              description="O'quvchilar ishtiroki"
            />
          </Col>
        </Row>

        <Row gutter={[32, 32]} style={{ marginBottom: '60px' }}>
          {/* Top Students Table */}
          {visibleCharts.studentRanking && (
            <Col xs={24} lg={14}>
              <Card title={<Text style={{ fontWeight: 900, textTransform: 'uppercase' }}>O'quvchi reytingi</Text>} style={{ border: '4px solid #000', boxShadow: '12px 12px 0px #000', height: '100%' }}>
                <Table
                  columns={[
                    {
                      title: '№',
                      key: 'index',
                      render: (_, __, index) => <Text style={{ fontWeight: 900 }}>{index + 1}</Text>,
                      width: 50
                    },
                    {
                      title: 'O\'quvchi',
                      dataIndex: 'name',
                      key: 'name',
                      render: (name, record) => (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ backgroundColor: '#000', width: '24px', height: '24px', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 900 }}>
                            {name.charAt(0)}
                          </div>
                          <Text style={{ fontWeight: 700 }}>{name} {record.id === currentUser.id && <Tag color="black" style={{ fontSize: '9px', marginLeft: '4px' }}>SIZ</Tag>}</Text>
                        </div>
                      )
                    },
                    {
                      title: 'Testlar',
                      dataIndex: 'testCount',
                      key: 'testCount',
                      render: (count) => <Text style={{ fontWeight: 700 }}>{count}</Text>
                    },
                    {
                      title: 'O\'rtacha Ball',
                      dataIndex: 'averageScore',
                      key: 'averageScore',
                      render: (score) => (
                        <div style={{ border: '2px solid #000', padding: '2px 8px', display: 'inline-block', backgroundColor: score >= 80 ? '#ecfdf5' : score >= 60 ? '#eff6ff' : '#fff' }}>
                          <Text style={{ fontWeight: 900 }}>{score}%</Text>
                        </div>
                      )
                    }
                  ]}
                  dataSource={stats.topStudents}
                  pagination={false}
                  size="middle"
                  rowKey="id"
                />
              </Card>
            </Col>
          )}

          {/* Subject Performance Bar Chart */}
          {visibleCharts.subjectAverage && (
            <Col xs={24} lg={10}>
              <Card title={<Text style={{ fontWeight: 900, textTransform: 'uppercase' }}>Fanlar o'rtachasi</Text>} style={{ border: '4px solid #000', boxShadow: '12px 12px 0px #000', height: '100%' }}>
                <div style={{ height: '400px' }}>
                  <Bar
                    data={{
                      labels: stats.subjectPerformance.map(s => s.subject),
                      datasets: [{
                        label: 'O\'rtacha Ball',
                        data: stats.subjectPerformance.map(s => s.averageScore),
                        backgroundColor: '#000',
                        borderWidth: 0,
                        barThickness: 25
                      }]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { display: false } },
                      scales: {
                        x: { grid: { display: false }, ticks: { font: { weight: 800 }, color: '#000' } },
                        y: { beginAtZero: true, max: 100, grid: { borderDash: [5, 5] }, ticks: { font: { weight: 800 }, color: '#000' } }
                      }
                    }}
                  />
                </div>
              </Card>
            </Col>
          )}
        </Row>

        {/* Recently Activity and Pie Chart */}
        <Row gutter={[32, 32]}>
          {visibleCharts.classNotifications && (
            <Col xs={24} lg={12}>
              <Card title={<Text style={{ fontWeight: 900, textTransform: 'uppercase' }}>Sinf xabarnomalari</Text>} style={{ border: '4px solid #000', boxShadow: '12px 12px 0px #000' }}>
                {stats.recentActivity.length === 0 ? (
                  <div style={{ padding: '40px', textAlign: 'center' }}>
                    <Text style={{ fontWeight: 800, color: '#999' }}>Hozircha harakatlar yo'q</Text>
                  </div>
                ) : (
                  <Timeline
                    items={stats.recentActivity.slice(0, 6).map((activity, index) => ({
                      children: (
                        <div style={{ backgroundColor: '#fff', border: '2px solid #000', padding: '10px 15px', boxShadow: '4px 4px 0px #000', marginBottom: '10px' }}>
                          <Text style={{ fontWeight: 900 }}>{activity.studentName}</Text>
                          <Text style={{ margin: '0 8px', color: '#666' }}>test topshirdi:</Text>
                          <Tag style={{ borderRadius: 0, border: '1.5px solid #000', fontWeight: 800, backgroundColor: activity.score >= 80 ? '#ecfdf5' : '#fff' }}>{activity.score}%</Tag>
                          <div style={{ fontSize: '10px', fontWeight: 700, color: '#999', marginTop: '4px' }}>{activity.date}</div>
                        </div>
                      ),
                      dot: <ThunderboltOutlined style={{ fontSize: '16px', color: '#000' }} />
                    }))}
                  />
                )}
              </Card>
            </Col>
          )}

          {visibleCharts.classPerformance && (
            <Col xs={24} lg={12}>
              <Card title={<Text style={{ fontWeight: 900, textTransform: 'uppercase' }}>Sinf o'zlashtirishi</Text>} style={{ border: '4px solid #000', boxShadow: '12px 12px 0px #000' }}>
                <div style={{ height: '350px' }}>
                  <Doughnut
                    data={{
                      labels: ['A\'lo (80%+)', 'Yaxshi (60-80%)', 'Past (<60%)'],
                      datasets: [{
                        data: [
                          stats.classmates.filter(c => c.averageScore >= 80).length,
                          stats.classmates.filter(c => c.averageScore >= 60 && c.averageScore < 80).length,
                          stats.classmates.filter(c => c.averageScore < 60).length
                        ],
                        backgroundColor: ['#000', '#666', '#ccc'],
                        borderColor: '#000',
                        borderWidth: 2
                      }]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom',
                          labels: { font: { weight: 800 }, color: '#000', usePointStyle: true }
                        }
                      }
                    }}
                  />
                </div>
              </Card>
            </Col>
          )}
        </Row>
      </div>
    </ConfigProvider >
  );
};

export default MyClassStatistics;
