import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Table,
  Card,
  Typography,
  Tag,
  Button,
  Modal,
  Space,
  Alert,
  Spin,
  Input,
  Select,
  Row,
  Col,
  ConfigProvider,
  Divider,
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  SearchOutlined,
  SortAscendingOutlined,
  EyeOutlined,
  CalendarOutlined,
  BookOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../data/apiService';
import LaTeXPreview from '../../components/LaTeXPreview';
import 'animate.css';

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;
const { Option } = Select;

const TestResults = () => {
  const { currentUser } = useAuth();
  const [results, setResults] = useState([]);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedResult, setSelectedResult] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [pageSize, setPageSize] = useState(10);
  const [searchParams] = useSearchParams();
  const [highlightId, setHighlightId] = useState(null);

  useEffect(() => {
    const highlight = searchParams.get('highlight');
    if (highlight) {
      setHighlightId(highlight);
      const timer = setTimeout(() => {
        setHighlightId(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  useEffect(() => {
    if (currentUser?.id) {
      loadResults();
    }
  }, [currentUser?.id]);

  const loadResults = async () => {
    try {
      setLoading(true);
      const attemptsResponse = await apiService.getAttempts({ student: currentUser.id });
      const studentAttempts = attemptsResponse.results || attemptsResponse;
      setResults(studentAttempts);

      const testsResponse = await apiService.getTests();
      const allTests = testsResponse.results || testsResponse;
      setTests(allTests);
    } catch (error) {
      console.error('Failed to load test results:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTestById = (testId) => {
    return tests.find(test => test.id === testId);
  };

  const loadQuestions = async (testId) => {
    try {
      setQuestionsLoading(true);
      const questionsResponse = await apiService.getQuestions({ test: testId });
      const testQuestions = questionsResponse.results || questionsResponse;
      setQuestions(testQuestions);
    } catch (error) {
      console.error('Failed to load questions:', error);
      setQuestions([]);
    } finally {
      setQuestionsLoading(false);
    }
  };

  const handleViewDetails = async (result) => {
    setSelectedResult(result);
    setDialogOpen(true);
    await loadQuestions(result.test);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedResult(null);
  };

  const getScoreColor = (score) => {
    if (score >= 90) return '#059669'; // Green
    if (score >= 70) return '#2563eb'; // Blue
    if (score >= 50) return '#d97706'; // Orange
    return '#dc2626'; // Red
  };

  const getScoreLabel = (score) => {
    if (score >= 90) return 'A\'lo';
    if (score >= 70) return 'Yaxshi';
    if (score >= 50) return 'Qoniqarli';
    return 'Qoniqarsiz';
  };

  const getFilteredResults = () => {
    if (!searchTerm) return results;
    const searchLower = searchTerm.toLowerCase();
    return results.filter(result => {
      const test = getTestById(result.test);
      const testTitle = test?.title || '';
      const testSubject = test?.subject || '';
      return testTitle.toLowerCase().includes(searchLower) ||
        testSubject.toLowerCase().includes(searchLower);
    });
  };

  const getSortedResults = () => {
    const filteredResults = getFilteredResults();
    if (sortBy === 'score_high') return filteredResults.sort((a, b) => b.score - a.score);
    if (sortBy === 'score_low') return filteredResults.sort((a, b) => a.score - b.score);
    if (sortBy === 'subject') {
      return filteredResults.sort((a, b) => {
        const testA = getTestById(a.test);
        const testB = getTestById(b.test);
        return (testA?.subject || '').localeCompare(testB?.subject || '');
      });
    }
    if (sortBy === 'name') {
      return filteredResults.sort((a, b) => {
        const testA = getTestById(a.test);
        const testB = getTestById(b.test);
        return (testA?.title || '').localeCompare(testB?.title || '');
      });
    }
    return filteredResults.sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at));
  };

  const columns = [
    {
      title: 'Test',
      dataIndex: 'test',
      key: 'test',
      render: (testId) => {
        const test = getTestById(testId);
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ backgroundColor: '#000', color: '#fff', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>R</div>
            <Text style={{ fontWeight: 700, fontSize: '0.9rem' }}>{test?.title || 'Noma\'lum test'}</Text>
          </div>
        );
      },
    },
    {
      title: 'Fan',
      dataIndex: 'test',
      key: 'subject',
      render: (testId) => {
        const test = getTestById(testId);
        return (
          <Tag style={{ borderRadius: 0, border: '2px solid #000', fontWeight: 700, backgroundColor: '#fff', color: '#000', textTransform: 'uppercase', fontSize: '10px' }}>
            {test?.subject || 'Noma\'lum'}
          </Tag>
        );
      },
    },
    {
      title: 'Sana',
      dataIndex: 'submitted_at',
      key: 'date',
      render: (date) => (
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          border: '2px solid #000',
          padding: '6px 12px',
          backgroundColor: '#fff',
          boxShadow: '4px 4px 0px #000',
          fontWeight: 700,
          fontSize: '12px'
        }}>
          <CalendarOutlined />
          {new Date(date).toLocaleDateString('uz-UZ')}
        </div>
      ),
    },
    {
      title: 'Ball / Baho',
      key: 'score_grade',
      render: (_, record) => (
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          border: '2px solid #000',
          padding: '4px 8px',
          backgroundColor: '#fff',
          boxShadow: '4px 4px 0px #000'
        }}>
          <Text style={{ fontWeight: 900, fontSize: '1rem', color: getScoreColor(record.score) }}>{record.score}%</Text>
          <div style={{
            border: '2px solid #000',
            padding: '1px 6px',
            fontWeight: 900,
            fontSize: '9px',
            textTransform: 'uppercase',
            backgroundColor: '#000',
            color: '#fff'
          }}>
            {getScoreLabel(record.score)}
          </div>
        </div>
      ),
    },
    {
      title: 'Harakat',
      key: 'actions',
      render: (_, record) => (
        <Button
          size="small"
          onClick={() => handleViewDetails(record)}
          style={{
            borderRadius: 0,
            border: '2px solid #000',
            boxShadow: '4px 4px 0px #000',
            backgroundColor: '#fff',
            color: '#000',
            fontWeight: 900,
            textTransform: 'uppercase',
            fontSize: '11px',
            height: '32px'
          }}
          icon={<EyeOutlined />}
        >
          Ko'rish
        </Button>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px', flexDirection: 'column' }}>
        <Spin size="large" />
        <Text style={{ marginTop: 16, fontWeight: 700, textTransform: 'uppercase' }}>Natijalar yuklanmoqda...</Text>
      </div>
    );
  }

  return (
    <ConfigProvider theme={{ token: { borderRadius: 0, colorPrimary: '#000' } }}>
      <div style={{ padding: '40px 0' }}>
        <div className="animate__animated animate__fadeIn" style={{ marginBottom: '60px' }}>
          <div style={{ backgroundColor: '#000', color: '#fff', padding: '8px 16px', fontWeight: 700, fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '16px', display: 'inline-block' }}>
            Natijalar
          </div>
          <Title level={1} style={{ fontWeight: 900, fontSize: '2.5rem', lineHeight: 0.9, textTransform: 'uppercase', letterSpacing: '-0.05em', color: '#000' }}>
            Mening natijalarim
          </Title>
          <div style={{ width: '80px', height: '10px', backgroundColor: '#000', margin: '24px 0' }}></div>
          <Paragraph style={{ fontSize: '1.2rem', fontWeight: 600, color: '#333', maxWidth: '600px' }}>
            Barcha topshirilgan testlar natijalarini kuzatib boring va xatolaringiz ustida ishlang.
          </Paragraph>
        </div>

        <div className="animate__animated animate__fadeIn" style={{ marginBottom: '40px' }}>
          <Card style={{ borderRadius: 0, border: '4px solid #000', boxShadow: '10px 10px 0px #000' }}>
            <Row gutter={[24, 16]} align="middle">
              <Col xs={24} md={18}>
                <Search
                  placeholder="Test nomi yoki fanini qidirish..."
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
                    <Option value="date">Sana</Option>
                    <Option value="name">Nomi</Option>
                    <Option value="subject">Fan</Option>
                    <Option value="score_high">Eng baland ball</Option>
                    <Option value="score_low">Eng past ball</Option>
                  </Select>
                </div>
              </Col>
            </Row>
          </Card>
        </div>

        <div className="animate__animated animate__fadeIn" style={{ animationDelay: '0.3s' }}>
          {results.length === 0 ? (
            <Card style={{ borderRadius: 0, border: '4px solid #000', boxShadow: '10px 10px 0px #000', textAlign: 'center', padding: '40px' }}>
              <BookOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
              <Title level={4} style={{ fontWeight: 800 }}>Siz hali test topshirmagansiz</Title>
              <Button type="primary" size="large" onClick={() => navigate('/student/take-test')} style={{ borderRadius: 0, border: '4px solid #000', boxShadow: '5px 5px 0px #000', fontWeight: 900, marginTop: '20px', height: '56px' }}>Hozir topshirish</Button>
            </Card>
          ) : (
            <Table
              columns={columns}
              dataSource={getSortedResults().map(r => ({ ...r, key: r.id }))}
              pagination={{
                pageSize: pageSize,
                showSizeChanger: true,
                pageSizeOptions: ['10', '20', '50'],
                onShowSizeChange: (_, size) => setPageSize(size),
              }}
              rowHoverable={false}
              style={{ border: '4px solid #000', boxShadow: '10px 10px 0px #000' }}
              scroll={{ x: 800 }}
              onRow={(record) => ({
                style: record.test === highlightId ? {
                  animation: 'brutalist-flash 0.5s infinite alternate',
                  backgroundColor: '#fef9c3' // Light yellow
                } : {}
              })}
            />
          )}
        </div>

        {/* Details Modal */}
        <Modal
          title={<Title level={4} style={{ margin: 0, fontWeight: 900, textTransform: 'uppercase' }}>Natija tafsilotlari</Title>}
          open={dialogOpen}
          onCancel={handleCloseDialog}
          width={900}
          centered
          styles={{ mask: { backdropFilter: 'blur(4px)' } }}
          footer={[<Button key="close" onClick={handleCloseDialog} style={{ borderRadius: 0, border: '3px solid #000', fontWeight: 900, height: '44px' }}>YOPISh</Button>]}
        >
          {selectedResult && (
            <div style={{ padding: '20px 0' }}>
              {(() => {
                const test = getTestById(selectedResult.test);
                return (
                  <>
                    <div style={{ backgroundColor: '#000', color: '#fff', padding: '24px', marginBottom: '24px', border: '4px solid #000' }}>
                      <Row gutter={24} align="middle">
                        <Col span={16}>
                          <Title level={3} style={{ color: '#fff', margin: 0, fontWeight: 900, textTransform: 'uppercase' }}>{test?.title || 'Noma\'lum test'}</Title>
                          <Text style={{ color: '#ccc', fontWeight: 700, fontSize: '14px' }}>FAN: {test?.subject || 'Noma\'lum'}</Text>
                        </Col>
                        <Col span={8} style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '3rem', fontWeight: 900, lineHeight: 1 }}>{selectedResult.score}%</div>
                          <div style={{ fontWeight: 900, textTransform: 'uppercase', fontSize: '12px' }}>{getScoreLabel(selectedResult.score)}</div>
                        </Col>
                      </Row>
                    </div>

                    <Title level={4} style={{ fontWeight: 900, textTransform: 'uppercase', marginBottom: '24px', fontSize: '16px' }}>Savollar tahlili</Title>

                    {questionsLoading ? (
                      <div style={{ textAlign: 'center', padding: '40px' }}><Spin size="large" /></div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {questions.map((question, index) => {
                          const studentAnswer = selectedResult.answers?.[question.id];
                          const isCorrect = studentAnswer && question.correct_answer &&
                            studentAnswer.toString().trim().toLowerCase() === question.correct_answer.toString().trim().toLowerCase();

                          return (
                            <Card
                              key={question.id}
                              style={{
                                borderRadius: 0,
                                border: '3px solid #000',
                                borderLeft: `12px solid ${isCorrect ? '#059669' : '#dc2626'}`,
                                backgroundColor: isCorrect ? '#f0fdf4' : '#fef2f2'
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                <Tag style={{ borderRadius: 0, border: '2px solid #000', fontWeight: 900, backgroundColor: '#000', color: '#fff' }}>SAVOL {index + 1}</Tag>
                                <Tag color={isCorrect ? 'green' : 'red'} style={{ borderRadius: 0, border: '2px solid #000', fontWeight: 900, textTransform: 'uppercase' }}>
                                  {isCorrect ? 'TO\'G\'RI' : 'NOTO\'G\'RI'}
                                </Tag>
                              </div>

                              <div style={{ marginBottom: '16px' }}>
                                <LaTeXPreview text={question.question_text} style={{ fontSize: '1.1rem', fontWeight: 700, color: '#000' }} />
                              </div>

                              {question.image && (
                                <div style={{ marginBottom: '16px', border: '2px solid #000', padding: '8px', display: 'inline-block', backgroundColor: '#fff' }}>
                                  <img src={question.image} alt="Savol rasmi" style={{ maxWidth: '100%', maxHeight: '300px' }} />
                                </div>
                              )}

                              <div style={{ padding: '12px', border: '2px solid #000', backgroundColor: '#fff' }}>
                                <Text style={{ display: 'block', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', color: '#666' }}>Sizning javobingiz:</Text>
                                <Text style={{ fontWeight: 700, color: isCorrect ? '#059669' : '#dc2626' }}>{studentAnswer || 'Javob berilmagan'}</Text>
                              </div>

                              {question.explanation && (
                                <div style={{ marginTop: '16px', padding: '12px', border: '2px dashed #000', backgroundColor: '#fff' }}>
                                  <Text style={{ display: 'block', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', color: '#666', marginBottom: '4px' }}>Tushuntirish:</Text>
                                  <Text style={{ fontWeight: 600 }}>{question.explanation}</Text>
                                </div>
                              )}
                            </Card>
                          );
                        })}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          )}
        </Modal>
        <style>{`
          @keyframes brutalist-flash {
            from { opacity: 1; transform: scale(1); }
            to { opacity: 0.7; transform: scale(1.02); }
          }
        `}</style>
      </div>
    </ConfigProvider>
  );
};

export default TestResults;