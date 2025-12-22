import React, { useState, useEffect } from 'react';
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
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  SearchOutlined,
  SortAscendingOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../data/apiService';

const { Title, Text } = Typography;
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

  useEffect(() => {
    loadResults();
  }, [currentUser.id]);

  const loadResults = async () => {
    try {
      setLoading(true);

      // Load student's attempts from API
      const attemptsResponse = await apiService.getAttempts({ student: currentUser.id });
      const studentAttempts = attemptsResponse.results || attemptsResponse;
      setResults(studentAttempts);

      // Load tests to get titles and subjects
      const testsResponse = await apiService.getTests();
      const allTests = testsResponse.results || testsResponse;
      setTests(allTests);

      console.log('Test results loaded:', {
        attempts: studentAttempts.length,
        tests: allTests.length
      });
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
    if (score >= 90) return '#52c41a';
    if (score >= 70) return '#1890ff';
    if (score >= 50) return '#faad14';
    return '#f5222d';
  };

  const getScoreLabel = (score) => {
    if (score >= 90) return 'A\'lo';
    if (score >= 70) return 'Yaxshi';
    if (score >= 50) return 'Qoniqarli';
    return 'Qoniqarsiz';
  };

  // Filter results based on search term
  const getFilteredResults = () => {
    if (!searchTerm) return results;

    const searchLower = searchTerm.toLowerCase();
    return results.filter(result => {
      const test = getTestById(result.test);
      const testTitle = test?.title || '';
      const testSubject = test?.subject || '';
      const score = result.score?.toString() || '';

      return testTitle.toLowerCase().includes(searchLower) ||
             testSubject.toLowerCase().includes(searchLower) ||
             score.includes(searchLower);
    });
  };

  // Sort results
  const getSortedResults = () => {
    const filteredResults = getFilteredResults();
    
    if (sortBy === 'score_high') {
      return filteredResults.sort((a, b) => b.score - a.score);
    } else if (sortBy === 'score_low') {
      return filteredResults.sort((a, b) => a.score - b.score);
    } else if (sortBy === 'subject') {
      return filteredResults.sort((a, b) => {
        const testA = getTestById(a.test);
        const testB = getTestById(b.test);
        return (testA?.subject || '').localeCompare(testB?.subject || '');
      });
    } else if (sortBy === 'name') {
      return filteredResults.sort((a, b) => {
        const testA = getTestById(a.test);
        const testB = getTestById(b.test);
        return (testA?.title || '').localeCompare(testB?.title || '');
      });
    } else {
      // Default: sort by date (newest first)
      return filteredResults.sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at));
    }
  };

  const columns = [
    {
      title: 'Test nomi',
      dataIndex: 'test',
      key: 'test',
      render: (testId) => {
        const test = getTestById(testId);
        return (
          <Text style={{ fontWeight: 600, color: '#1e293b' }}>
            {test?.title || 'Noma\'lum test'}
          </Text>
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
          <Tag
            style={{
              backgroundColor: test?.subject === 'Ingliz tili' ? '#3b82f6' : '#eff6ff',
              color: test?.subject === 'Ingliz tili' ? '#ffffff' : '#2563eb',
              fontWeight: 600,
              borderRadius: '6px',
              fontSize: '0.75rem',
              border: test?.subject === 'Ingliz tili' ? '#3b82f6' : 'none'
            }}
          >
            {test?.subject || 'Noma\'lum'}
          </Tag>
        );
      },
    },
    {
      title: 'Sana',
      dataIndex: 'submitted_at',
      key: 'date',
      render: (submitted_at, record) => {
        const test = getTestById(record.test);
        return (
          <div>
            <Text style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500, display: 'block' }}>
              Test ishlangan: {new Date(submitted_at).toLocaleDateString('uz-UZ')}
            </Text>
            <Text style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>
              Test chiqgan: {test?.created_at ? new Date(test.created_at).toLocaleDateString('uz-UZ') : 'Noma\'lum'}
            </Text>
          </div>
        );
      },
    },
    {
      title: 'Ball',
      dataIndex: 'score',
      key: 'score',
      render: (score) => (
        <Text
          style={{
            fontWeight: 700,
            fontSize: '1.125rem',
            color: getScoreColor(score)
          }}
        >
          {score}%
        </Text>
      ),
    },
    {
      title: 'Baho',
      dataIndex: 'score',
      key: 'grade',
      render: (score) => (
        <Tag
          style={{
            fontWeight: 600,
            fontSize: '0.75rem',
            backgroundColor: score >= 70 ? '#ecfdf5' : '#fef3c7',
            color: score >= 70 ? '#059669' : '#d97706',
            borderRadius: '6px',
            border: 'none'
          }}
        >
          {getScoreLabel(score)}
        </Tag>
      ),
    },
    {
      title: 'Harakatlar',
      key: 'actions',
      render: (_, record) => (
        <Button
          size="small"
          type="outlined"
          onClick={() => handleViewDetails(record)}
          style={{
            borderColor: '#e2e8f0',
            color: '#374151',
            borderRadius: '6px',
            fontSize: '0.75rem',
            fontWeight: 600
          }}
        >
          Tafsilotlar
        </Button>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ paddingTop: '16px', paddingBottom: '16px', backgroundColor: '#ffffff' }}>
        <div style={{
          marginBottom: '24px',
          paddingBottom: '16px',
          borderBottom: '1px solid #e2e8f0'
        }}>
          <Title level={2} style={{
            fontSize: '2.5rem',
            fontWeight: 700,
            color: '#1e293b',
            marginBottom: '12px'
          }}>
            Mening test natijalarim
          </Title>
          <Text style={{
            fontSize: '1.125rem',
            color: '#64748b',
            fontWeight: 400
          }}>
            Sizning barcha test natijalaringiz va statistikalaringiz
          </Text>
        </div>
        <Spin size="large" />
        <Text style={{ color: '#64748b', marginTop: '16px', display: 'block' }}>Yuklanmoqda...</Text>
      </div>
    );
  }

  return (
    <div style={{ paddingTop: '16px', paddingBottom: '16px', backgroundColor: '#ffffff' }}>
      {/* Header */}
      <div style={{
        marginBottom: '24px',
        paddingBottom: '16px',
        borderBottom: '1px solid #e2e8f0'
      }}>
        {/* Title */}
        <div style={{
          marginBottom: '16px'
        }}>
          <Title level={2} style={{
            fontSize: '2.5rem',
            fontWeight: 700,
            color: '#1e293b',
            marginBottom: '4px'
          }}>
            Mening test natijalarim
          </Title>
        </div>
        
        {/* Description */}
        <Text style={{
          fontSize: '1.125rem',
          color: '#64748b',
          fontWeight: 400
        }}>
          Sizning barcha test natijalaringiz va statistikalaringiz
        </Text>
      </div>

      {/* Search section */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px'
        }}>
          <Title level={4} style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            color: '#1e293b',
            marginBottom: 0
          }}>
            📊 Mening natijalarim
          </Title>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <SortAscendingOutlined style={{ color: '#64748b' }} />
            <Select
              value={sortBy}
              onChange={setSortBy}
              style={{
                minWidth: 120,
              }}
            >
              <Option value="date">Sana bo'yicha</Option>
              <Option value="name">Nomi bo'yicha</Option>
              <Option value="subject">Fan bo'yicha</Option>
              <Option value="score_high">Bal yuqori</Option>
              <Option value="score_low">Bal past</Option>
            </Select>
          </div>
        </div>

        <Search
          placeholder="Test nomi, fan yoki ball bo'yicha qidirish..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          prefix={<SearchOutlined style={{ color: '#64748b' }} />}
          style={{
            borderRadius: '8px',
            backgroundColor: '#ffffff',
            borderColor: '#e2e8f0'
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#2563eb';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = '#e2e8f0';
          }}
        />
      </div>

      {results.length === 0 || getSortedResults().length === 0 ? (
        <Card
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            textAlign: 'center',
            padding: '32px'
          }}
        >
          <Title level={4} style={{ color: '#64748b', marginBottom: '16px' }}>
            {results.length === 0 ? 'Hozircha test natijalari yo\'q' : 'Qidiruv natijasi bo\'yicha natija topilmadi'}
          </Title>
          <Text style={{ color: '#64748b' }}>
            {results.length === 0 
              ? 'Test topshirgandan keyin natijalaringiz shu yerda ko\'rinadi'
              : 'Qidiruv so\'zini o\'zgartirib ko\'ring'
            }
          </Text>
        </Card>
      ) : (
        <Card
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            overflow: 'hidden'
          }}
        >
          <Table
            columns={columns}
            dataSource={getSortedResults()
              .map(result => ({ ...result, key: result.id }))
            }
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => `${range[0]}-${range[1]} / ${total} ta`,
            }}
            scroll={{ x: 800 }}
          />
        </Card>
      )}

      {/* Results Details Modal */}
      <Modal
        title={
          <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '1.25rem' }}>
            Test natijalari tafsilotlari
          </div>
        }
        open={dialogOpen}
        onCancel={handleCloseDialog}
        width={800}
        footer={[
          <Button key="close" onClick={handleCloseDialog}>
            Yopish
          </Button>
        ]}
      >
        {selectedResult && (
          <div>
            {(() => {
              const test = getTestById(selectedResult.test);
              return (
                <div>
                  <Title level={4} style={{ color: '#1e293b', fontWeight: 600, marginBottom: '8px' }}>
                    {test?.title || 'Noma\'lum test'}
                  </Title>
                  <Text style={{ color: '#64748b', marginBottom: '24px', display: 'block' }}>
                    Fan: {test?.subject || 'Noma\'lum'}
                  </Text>

                  <Card
                    style={{
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      marginBottom: '24px'
                    }}
                    bodyStyle={{ padding: '16px' }}
                  >
                    <Title level={5} style={{ color: '#1e293b', fontWeight: 600, marginBottom: '8px' }}>
                      Sizning balingiz: <span style={{ color: getScoreColor(selectedResult.score) }}>{selectedResult.score}%</span> ({getScoreLabel(selectedResult.score)})
                    </Title>
                  </Card>

                  <Title level={5} style={{ color: '#1e293b', fontWeight: 600, marginBottom: '16px' }}>
                    Test ma'lumotlari:
                  </Title>

                  <Card
                    style={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      marginBottom: '24px'
                    }}
                    bodyStyle={{ padding: '16px' }}
                  >
                    <div style={{ marginBottom: '8px' }}>
                      <Text style={{ color: '#334155' }}><strong>Fan:</strong> {test?.subject || 'Noma\'lum'}</Text>
                    </div>
                    <div style={{ marginBottom: '8px' }}>
                      <Text style={{ color: '#334155' }}><strong>Savollar soni:</strong> {test?.total_questions || 'Noma\'lum'}</Text>
                    </div>
                    <div>
                      <Text style={{ color: '#334155' }}><strong>Vaqt limiti:</strong> {test?.time_limit || 'Noma\'lum'} daqiqa</Text>
                    </div>
                  </Card>

                  <Title level={5} style={{ color: '#1e293b', fontWeight: 600, marginBottom: '16px' }}>
                    Savollar va javoblar:
                  </Title>

                  {questionsLoading ? (
                    <Text style={{ color: '#64748b', fontStyle: 'italic' }}>
                      Savollar yuklanmoqda...
                    </Text>
                  ) : questions.length > 0 ? (
                    <div>
                      {questions.map((question, index) => {
                        const studentAnswer = selectedResult.answers?.[question.id];
                        const isCorrect = studentAnswer && question.correct_answer && 
                          studentAnswer.toString().trim().toLowerCase() === question.correct_answer.toString().trim().toLowerCase();

                        return (
                          <Card
                            key={question.id}
                            style={{
                              marginBottom: '16px',
                              border: '1px solid #e2e8f0',
                              borderLeft: `4px solid ${isCorrect ? '#10b981' : '#ef4444'}`
                            }}
                            bodyStyle={{ padding: '16px' }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                              <Tag
                                style={{
                                  marginRight: '8px',
                                  backgroundColor: '#f1f5f9',
                                  color: '#475569',
                                  fontWeight: 600,
                                  border: 'none'
                                }}
                              >
                                {index + 1}-savol
                              </Tag>
                              <div style={{ display: 'flex', alignItems: 'center' }}>
                                {isCorrect ? (
                                  <CheckCircleOutlined style={{ color: '#10b981', marginRight: '4px' }} />
                                ) : (
                                  <CloseCircleOutlined style={{ color: '#ef4444', marginRight: '4px' }} />
                                )}
                                <Text style={{
                                  color: isCorrect ? '#10b981' : '#ef4444',
                                  fontWeight: 600
                                }}>
                                  {isCorrect ? 'To\'g\'ri' : 'Noto\'g\'ri'}
                                </Text>
                              </div>
                            </div>

                            <Title level={5} style={{
                              color: '#1e293b',
                              fontWeight: 600,
                              marginBottom: '16px',
                              fontSize: '1rem'
                            }}>
                              {question.question_text}
                            </Title>

                            {/* Question Image */}
                            {question.image && (
                              <div style={{ marginBottom: '16px', textAlign: 'center' }}>
                                <img
                                  src={question.image}
                                  alt="Question"
                                  style={{
                                    maxWidth: '100%',
                                    maxHeight: '300px',
                                    width: 'auto',
                                    border: '1px solid #e0e0e0',
                                    borderRadius: '8px',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                    objectFit: 'contain'
                                  }}
                                  onError={(e) => {
                                    console.error('Image failed to load:', question.image);
                                    e.target.style.display = 'none';
                                  }}
                                />
                              </div>
                            )}

                            {question.explanation && (
                              <div style={{ marginTop: '16px' }}>
                                <Text style={{
                                  color: '#64748b',
                                  fontWeight: 600,
                                  marginBottom: '8px',
                                  display: 'block'
                                }}>
                                  Tushuntirish:
                                </Text>
                                <div style={{
                                  color: '#334155',
                                  backgroundColor: '#f8fafc',
                                  padding: '16px',
                                  borderRadius: '4px',
                                  border: '1px solid #e2e8f0'
                                }}>
                                  {question.explanation}
                                </div>
                              </div>
                            )}
                          </Card>
                        );
                      })}
                    </div>
                  ) : (
                    <Text style={{ color: '#64748b', fontStyle: 'italic' }}>
                      Bu test uchun savollar topilmadi.
                    </Text>
                  )}
                </div>
              );
            })()}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default TestResults;