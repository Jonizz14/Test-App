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
import ReactECharts from 'echarts-for-react';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../data/apiService';

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

  const StatCard = ({ title, value, icon, description, color = '#2563eb' }) => (
    <Card
      style={{
        backgroundColor: '#ffffff',
        border: `4px solid ${color}`,
        borderRadius: 0,
        boxShadow: `8px 8px 0px ${color}20`,
        height: '100%',
      }}
      styles={{ body: { padding: '20px' } }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{
          backgroundColor: color,
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
      <Text style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', display: 'block' }}>
        {title}
      </Text>
      <Title level={2} style={{ margin: '4px 0', fontWeight: 900, fontSize: '2.5rem', lineHeight: 1, color: '#1e293b' }}>
        {value}
      </Title>
      {description && (
        <Text style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
          {description}
        </Text>
      )}
    </Card>
  );

  // ECharts - Bar Chart for Subject Performance
  const getBarChartOption = () => ({
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#1e293b',
      borderColor: '#1e293b',
      textStyle: { color: '#fff', fontWeight: 700 },
      axisPointer: { type: 'shadow' }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: stats.subjectPerformance.map(s => s.subject),
      axisLine: { lineStyle: { color: '#e2e8f0', width: 2 } },
      axisLabel: { color: '#1e293b', fontWeight: 700, rotate: 30 },
      axisTick: { show: false }
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 100,
      axisLine: { show: false },
      axisLabel: { color: '#1e293b', fontWeight: 700 },
      splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } }
    },
    series: [{
      type: 'bar',
      data: stats.subjectPerformance.map(s => ({
        value: s.averageScore,
        itemStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: '#f59e0b' },
              { offset: 1, color: '#d97706' }
            ]
          }
        }
      })),
      barWidth: 25,
      itemStyle: { borderRadius: [0, 0, 0, 0] }
    }]
  });

  // ECharts - Pie Chart for Class Performance
  const getPieChartOption = () => {
    const excellentCount = stats.classmates.filter(c => c.averageScore >= 80).length;
    const goodCount = stats.classmates.filter(c => c.averageScore >= 60 && c.averageScore < 80).length;
    const lowCount = stats.classmates.filter(c => c.averageScore < 60).length;

    return {
      tooltip: {
        trigger: 'item',
        backgroundColor: '#1e293b',
        borderColor: '#1e293b',
        textStyle: { color: '#fff', fontWeight: 700 }
      },
      legend: {
        bottom: '5%',
        left: 'center',
        textStyle: { fontWeight: 800, color: '#1e293b' }
      },
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 0,
          borderColor: '#fff',
          borderWidth: 4
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 20,
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: [
          { value: excellentCount, name: 'A\'lo (80%+)', itemStyle: { color: '#2563eb' } },
          { value: goodCount, name: 'Yaxshi (60-80%)', itemStyle: { color: '#64748b' } },
          { value: lowCount, name: 'Past (<60%)', itemStyle: { color: '#cbd5e1' } }
        ]
      }]
    };
  };

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
          <div style={{ backgroundColor: '#2563eb', color: '#fff', padding: '8px 16px', fontWeight: 700, fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '16px', display: 'inline-block' }}>
            Statistika
          </div>
          <Title level={1} style={{ fontWeight: 900, fontSize: '3rem', lineHeight: 0.9, textTransform: 'uppercase', letterSpacing: '-0.05em', color: '#1e293b' }}>
            Sinf <span style={{ color: '#2563eb' }}>statistikasi</span>
          </Title>
          <div style={{ width: '80px', height: '10px', backgroundColor: '#2563eb', margin: '24px 0' }}></div>
          <Paragraph style={{ fontSize: '1.2rem', fontWeight: 600, color: '#334155', maxWidth: '600px' }}>
            Sinfingizning umumiy natijalari, fanlar bo'yicha o'rtacha ballar va faol o'quvchilar reytingi.
          </Paragraph>
        </div>

        {/* Info Alerts (The Black Card) */}
        <Row gutter={[24, 24]} style={{ marginBottom: '40px' }}>
          <Col span={24}>
            <div className="animate__animated animate__fadeInUp" style={{
              background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
              color: '#fff',
              padding: '24px',
              border: '4px solid #1e293b',
              boxShadow: '10px 10px 0px rgba(30, 41, 59, 0.2)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ position: 'relative', zIndex: 1 }}>
                <Title level={3} style={{ color: '#fff', margin: 0, fontWeight: 900, textTransform: 'uppercase' }}>
                  Sinf guruhingiz: {currentUser?.class_group || 'Noma\'lum'}
                </Title>
                <Text style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 700 }}>
                  Jami {stats.totalStudents} o'quvchi, shundan {stats.activeStudents} nafari faol.
                </Text>
              </div>
              <TeamOutlined style={{ position: 'absolute', right: '-20px', bottom: '-20px', fontSize: '120px', color: 'rgba(255,255,255,0.1)' }} />
            </div>
          </Col>
        </Row>

        {/* Chart Controls */}
        <Card style={{ border: '4px solid #1e293b', boxShadow: '8px 8px 0px rgba(30, 41, 59, 0.1)', marginBottom: '40px' }} title={<Text style={{ fontWeight: 900, textTransform: 'uppercase', color: '#1e293b' }}><SettingOutlined /> KO'RSATKICHLARNI BOSHQARISH</Text>}>
          <Row gutter={[24, 16]}>
            {[
              { key: 'studentRanking', label: 'O\'quvchilar reytingi' },
              { key: 'subjectAverage', label: 'Fanlar o\'rtachasi' },
              { key: 'classNotifications', label: 'Sinf xabarnomalari' },
              { key: 'classPerformance', label: 'Sinf o\'zlashtirishi' }
            ].map(item => (
              <Col xs={12} sm={8} key={item.key}>
                <Space>
                  <Switch size="small" checked={visibleCharts[item.key]} onChange={() => toggleChart(item.key)} />
                  <Text style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', color: '#1e293b' }}>{item.label}</Text>
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
              color="#2563eb"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Eng yuqori ball"
              value={`${stats.highestScore}%`}
              icon={<TrophyOutlined />}
              description="Sinfning rekord natijasi"
              color="#f59e0b"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Jami urinishlar"
              value={stats.totalAttempts}
              icon={<ThunderboltOutlined />}
              description="Sinf bo'yicha jami test"
              color="#059669"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Faollik"
              value={`${stats.totalStudents > 0 ? Math.round((stats.activeStudents / stats.totalStudents) * 100) : 0}%`}
              icon={<TeamOutlined />}
              description="O'quvchilar ishtiroki"
              color="#7c3aed"
            />
          </Col>
        </Row>

        <Row gutter={[32, 32]} style={{ marginBottom: '60px' }}>
          {/* Top Students Table */}
          {visibleCharts.studentRanking && (
            <Col xs={24} lg={14}>
              <Card title={<Text style={{ fontWeight: 900, textTransform: 'uppercase', color: '#2563eb' }}>O'quvchi reytingi</Text>} style={{ border: '4px solid #2563eb', boxShadow: '12px 12px 0px rgba(37, 99, 235, 0.1)', height: '100%' }}>
                <Table
                  columns={[
                    {
                      title: '№',
                      key: 'index',
                      render: (_, __, index) => <Text style={{ fontWeight: 900, color: '#1e293b' }}>{index + 1}</Text>,
                      width: 50
                    },
                    {
                      title: 'O\'quvchi',
                      dataIndex: 'name',
                      key: 'name',
                      render: (name, record) => (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ backgroundColor: record.id === currentUser.id ? '#2563eb' : '#1e293b', width: '24px', height: '24px', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 900 }}>
                            {name.charAt(0)}
                          </div>
                          <Text style={{ fontWeight: 700, color: '#1e293b' }}>{name} {record.id === currentUser.id && <Tag color="blue" style={{ fontSize: '9px', marginLeft: '4px', borderRadius: 0 }}>SIZ</Tag>}</Text>
                        </div>
                      )
                    },
                    {
                      title: 'Testlar',
                      dataIndex: 'testCount',
                      key: 'testCount',
                      render: (count) => <Text style={{ fontWeight: 700, color: '#1e293b' }}>{count}</Text>
                    },
                    {
                      title: 'O\'rtacha Ball',
                      dataIndex: 'averageScore',
                      key: 'averageScore',
                      render: (score) => (
                        <div style={{ border: '2px solid #2563eb', padding: '2px 8px', display: 'inline-block', backgroundColor: score >= 80 ? '#ecfdf5' : score >= 60 ? '#eff6ff' : '#fff' }}>
                          <Text style={{ fontWeight: 900, color: score >= 80 ? '#059669' : score >= 60 ? '#2563eb' : '#dc2626' }}>{score}%</Text>
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

          {/* Subject Performance Bar Chart - ECharts */}
          {visibleCharts.subjectAverage && (
            <Col xs={24} lg={10}>
              <Card title={<Text style={{ fontWeight: 900, textTransform: 'uppercase', color: '#f59e0b' }}>Fanlar o'rtachasi</Text>} style={{ border: '4px solid #f59e0b', boxShadow: '12px 12px 0px rgba(245, 158, 11, 0.1)', height: '100%' }}>
                <ReactECharts
                  option={getBarChartOption()}
                  style={{ height: '400px' }}
                  opts={{ renderer: 'canvas' }}
                />
              </Card>
            </Col>
          )}
        </Row>

        {/* Recently Activity and Pie Chart */}
        <Row gutter={[32, 32]}>
          {visibleCharts.classNotifications && (
            <Col xs={24} lg={12}>
              <Card title={<Text style={{ fontWeight: 900, textTransform: 'uppercase', color: '#059669' }}>Sinf xabarnomalari</Text>} style={{ border: '4px solid #059669', boxShadow: '12px 12px 0px rgba(5, 150, 105, 0.1)' }}>
                {stats.recentActivity.length === 0 ? (
                  <div style={{ padding: '40px', textAlign: 'center' }}>
                    <Text style={{ fontWeight: 800, color: '#94a3b8' }}>Hozircha harakatlar yo'q</Text>
                  </div>
                ) : (
                  <Timeline
                    items={stats.recentActivity.slice(0, 6).map((activity, index) => ({
                      key: index,
                      children: (
                        <div style={{ backgroundColor: '#fff', border: '2px solid #1e293b', padding: '10px 15px', boxShadow: '4px 4px 0px rgba(30, 41, 59, 0.1)', marginBottom: '10px' }}>
                          <Text style={{ fontWeight: 900, color: '#1e293b' }}>{activity.studentName}</Text>
                          <Text style={{ margin: '0 8px', color: '#64748b' }}>test topshirdi:</Text>
                          <Tag style={{ borderRadius: 0, border: '1.5px solid #2563eb', fontWeight: 800, color: '#2563eb', backgroundColor: activity.score >= 80 ? '#ecfdf5' : '#fff' }}>{activity.score}%</Tag>
                          <div style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', marginTop: '4px' }}>{activity.date}</div>
                        </div>
                      ),
                      dot: <ThunderboltOutlined style={{ fontSize: '16px', color: '#2563eb' }} />
                    }))}
                  />
                )}
              </Card>
            </Col>
          )}

          {visibleCharts.classPerformance && (
            <Col xs={24} lg={12}>
              <Card title={<Text style={{ fontWeight: 900, textTransform: 'uppercase', color: '#7c3aed' }}>Sinf o'zlashtirishi</Text>} style={{ border: '4px solid #7c3aed', boxShadow: '12px 12px 0px rgba(124, 58, 237, 0.1)' }}>
                <ReactECharts
                  option={getPieChartOption()}
                  style={{ height: '350px' }}
                  opts={{ renderer: 'canvas' }}
                />
              </Card>
            </Col>
          )}
        </Row>
      </div>
    </ConfigProvider>
  );
};

export default MyClassStatistics;
