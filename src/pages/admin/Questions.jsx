import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Typography,
  Select,
  Input,
  Alert,
  Collapse,
  Space,
  Tag,
} from 'antd';
import {
  LockOutlined,
  SearchOutlined,
  ClearOutlined,
  DownOutlined,
  UpOutlined,
} from '@ant-design/icons';
import apiService from '../../data/apiService';

const { Title, Text } = Typography;
const { Option } = Select;
const { Panel } = Collapse;

const Questions = () => {
  const [tests, setTests] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Sorting and filtering states
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [teacherFilter, setTeacherFilter] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Always require password on page load/refresh
    // No persistent authentication
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      // Load tests and questions using public endpoints (no authentication required)
      const [testsResponse, questionsResponse] = await Promise.all([
        apiService.getPublicTests(),
        apiService.getPublicQuestions()
      ]);

      const allTests = testsResponse.results || testsResponse;
      const allQuestions = questionsResponse.results || questionsResponse;

      setTests(allTests);
      setQuestions(allQuestions);

      console.log('Questions page data loaded:', {
        tests: allTests.length,
        questions: allQuestions.length
      });
    } catch (err) {
      console.error('Failed to load questions data:', err);
      setError('Ma\'lumotlarni yuklashda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    setPasswordError('');

    if (password === 'katya2010') {
      setIsAuthenticated(true);
      loadData();
    } else {
      setPasswordError('Noto\'g\'ri parol');
    }
  };

  // Get unique subjects, teachers, and grades for filters
  const subjects = [...new Set(tests.map(test => test.subject).filter(Boolean))];
  const teachers = [...new Set(tests.map(test => test.teacher_name).filter(Boolean))];

  // Safely extract grades from all tests
  const allGrades = [];
  tests.forEach(test => {
    if (test && test.target_grades && Array.isArray(test.target_grades)) {
      test.target_grades.forEach(grade => {
        if (grade && typeof grade === 'string' && grade.trim()) {
          allGrades.push(grade.trim());
        }
      });
    }
  });
  const grades = [...new Set(allGrades)].sort((a, b) => {
    const aNum = parseInt(a) || 0;
    const bNum = parseInt(b) || 0;
    return aNum - bNum;
  });

  // Filter and sort tests
  const filteredAndSortedTests = tests
    .filter(test => {
      const matchesSubject = !subjectFilter || test.subject === subjectFilter;
      const matchesTeacher = !teacherFilter || test.teacher_name === teacherFilter;
      const matchesGrade = !gradeFilter || (test.target_grades && Array.isArray(test.target_grades) && test.target_grades.includes(gradeFilter));
      const matchesSearch = !searchQuery ||
        test.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        test.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (test.teacher_name && test.teacher_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (test.target_grades && Array.isArray(test.target_grades) && test.target_grades.some(grade => grade.toLowerCase().includes(searchQuery.toLowerCase())));

      return matchesSubject && matchesTeacher && matchesGrade && matchesSearch;
    })
    .sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'subject':
          aValue = a.subject.toLowerCase();
          bValue = b.subject.toLowerCase();
          break;
        case 'teacher':
          aValue = (a.teacher_name || '').toLowerCase();
          bValue = (b.teacher_name || '').toLowerCase();
          break;
        case 'target_grades':
          // Sort by first grade in the array, or 0 if no grades
          const aGrades = (a.target_grades && Array.isArray(a.target_grades) && a.target_grades.length > 0) ? a.target_grades : [];
          const bGrades = (b.target_grades && Array.isArray(b.target_grades) && b.target_grades.length > 0) ? b.target_grades : [];
          aValue = aGrades.length > 0 ? (parseInt(aGrades[0]) || 0) : 0;
          bValue = bGrades.length > 0 ? (parseInt(bGrades[0]) || 0) : 0;
          break;
        case 'created_at':
        default:
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
          break;
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

  // Get questions for a specific test
  const getTestQuestions = (testId) => {
    return questions.filter(q => q.test === testId);
  };

  // Get correct answer for a question
  const getCorrectAnswer = (question) => {
    // First check if there's a direct correct_answer field and it's not empty
    if (question.correct_answer && question.correct_answer.trim()) {
      return question.correct_answer.trim();
    }

    // Then check options array for multiple choice questions
    if (question.options && Array.isArray(question.options) && question.options.length > 0) {
      const correctOption = question.options.find(option => option.is_correct === true);
      if (correctOption) {
        return correctOption.text || correctOption.option_text || correctOption.answer || 'Noma\'lum';
      }
    }

    // If no correct answer found, return unknown
    return 'Noma\'lum';
  };

  // Password protection
  if (!isAuthenticated) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#f8fafc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px'
      }}>
        <Card
          style={{
            maxWidth: 400,
            width: '100%',
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            boxShadow: '0 8px 25px -5px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden'
          }}
        >
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            padding: '32px',
            textAlign: 'center'
          }}>
            <LockOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
            <Title level={4} style={{ margin: 0, color: 'white', fontWeight: 700 }}>
              Parol kiritish
            </Title>
            <Text style={{ opacity: 0.9, display: 'block', marginTop: '8px', color: 'white' }}>
              Davom etish uchun parolni kiriting
            </Text>
          </div>

          <Card style={{ border: 'none', boxShadow: 'none' }} bodyStyle={{ padding: '32px' }}>
            {passwordError && (
              <Alert
                message={passwordError}
                type="error"
                showIcon
                style={{ marginBottom: '24px' }}
              />
            )}

            <form onSubmit={handlePasswordSubmit}>
              <Input.Password
                placeholder="Parol"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
                style={{
                  marginBottom: '24px',
                  borderRadius: '12px',
                  padding: '12px'
                }}
              />

              <Button
                type="primary"
                htmlType="submit"
                block
                size="large"
                style={{
                  backgroundColor: '#2563eb',
                  borderColor: '#2563eb',
                  padding: '12px',
                  fontSize: '16px',
                  fontWeight: 600,
                  borderRadius: '12px',
                  height: 'auto'
                }}
              >
                Kirish
              </Button>
            </form>
          </Card>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{
        padding: '24px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px'
      }}>
        <div>Yuklanmoqda...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '24px' }}>
        <Title level={1} style={{ marginBottom: '24px', color: '#1e293b' }}>
          Savollar
        </Title>
        <Alert
          message={error}
          type="error"
          showIcon
        />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{
        marginBottom: '24px',
        paddingBottom: '16px',
        borderBottom: '1px solid #e2e8f0'
      }}>
        <Title level={1} style={{ margin: 0, color: '#1e293b' }}>
          Barcha Savollar
        </Title>
        <Text style={{ fontSize: '18px', color: '#64748b', display: 'block', marginTop: '8px' }}>
          Barcha testlar va ularning to'g'ri javoblari
        </Text>
      </div>

      <Card
        style={{
          marginBottom: '24px',
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
        }}
        bodyStyle={{ padding: '24px' }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
          <Input
            placeholder="Qidirish..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            prefix={<SearchOutlined />}
            style={{
              minWidth: 250,
              borderRadius: '8px'
            }}
          />

          <Select
            value={subjectFilter}
            onChange={(value) => setSubjectFilter(value)}
            placeholder="Barcha fanlar"
            style={{ minWidth: 150 }}
          >
            <Option value="">Barcha fanlar</Option>
            {subjects.map(subject => (
              <Option key={subject} value={subject}>{subject}</Option>
            ))}
          </Select>

          <Select
            value={teacherFilter}
            onChange={(value) => setTeacherFilter(value)}
            placeholder="Barcha ustozlar"
            style={{ minWidth: 150 }}
          >
            <Option value="">Barcha ustozlar</Option>
            {teachers.map(teacher => (
              <Option key={teacher} value={teacher}>{teacher}</Option>
            ))}
          </Select>

          <Select
            value={gradeFilter}
            onChange={(value) => setGradeFilter(value)}
            placeholder="Barcha sinflar"
            style={{ minWidth: 120 }}
          >
            <Option value="">Barcha sinflar</Option>
            {grades.map(grade => (
              <Option key={grade} value={grade}>{grade}-sinf</Option>
            ))}
          </Select>

          <Select
            value={`${sortBy}_${sortOrder}`}
            onChange={(value) => {
              const [field, order] = value.split('_');
              setSortBy(field);
              setSortOrder(order);
            }}
            placeholder="Saralash"
            style={{ minWidth: 180 }}
          >
            <Option value="created_at_desc">Yangi avval</Option>
            <Option value="created_at_asc">Eski avval</Option>
            <Option value="title_asc">Sarlavha (A-Z)</Option>
            <Option value="title_desc">Sarlavha (Z-A)</Option>
            <Option value="subject_asc">Fan (A-Z)</Option>
            <Option value="subject_desc">Fan (Z-A)</Option>
            <Option value="target_grades_asc">Sinflar (1-11)</Option>
            <Option value="target_grades_desc">Sinflar (11-1)</Option>
          </Select>

          <Button
            icon={<ClearOutlined />}
            onClick={() => {
              setSubjectFilter('');
              setTeacherFilter('');
              setGradeFilter('');
              setSearchQuery('');
              setSortBy('created_at');
              setSortOrder('desc');
            }}
            style={{
              borderColor: '#e2e8f0',
              color: '#374151'
            }}
          >
            Tozalash
          </Button>
        </div>
      </Card>

      {/* Results Summary */}
      <div style={{ marginBottom: '24px' }}>
        <Text style={{ color: '#64748b' }}>
          Jami: {filteredAndSortedTests.length} ta test topildi
        </Text>
      </div>

      {/* Tests List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {filteredAndSortedTests.map((test) => {
          const testQuestions = getTestQuestions(test.id);

          return (
            <Card
              key={test.id}
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
              }}
            >
              <Collapse
                ghost
                expandIcon={({ isActive }) => isActive ? <UpOutlined /> : <DownOutlined />}
              >
                <Panel
                  header={
                    <div style={{ width: '100%' }}>
                      <Title level={4} style={{ margin: 0, marginBottom: '8px', color: '#1e293b' }}>
                        {test.title}
                      </Title>
                      <Space wrap>
                        <Tag
                          color={test.subject === 'Ingliz tili' ? 'blue' : 'default'}
                          style={{ fontWeight: 600 }}
                        >
                          {test.subject}
                        </Tag>
                        <Text style={{ color: '#64748b' }}>
                          {test.teacher_name || 'Noma\'lum ustoz'}
                        </Text>
                        <Text style={{ color: '#64748b' }}>
                          {test.total_questions} ta savol
                        </Text>
                        <Text style={{ color: '#64748b' }}>
                          Sinflar: {test.target_grades && Array.isArray(test.target_grades) && test.target_grades.length > 0 ? test.target_grades.join(', ') : 'Barcha sinflar'}
                        </Text>
                        <Text style={{ color: '#64748b' }}>
                          {new Date(test.created_at).toLocaleDateString('uz-UZ')}
                        </Text>
                      </Space>
                    </div>
                  }
                  key={test.id}
                >
                  {testQuestions.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingTop: '16px' }}>
                      {testQuestions.map((question, qIndex) => (
                        <Card
                          key={question.id}
                          size="small"
                          style={{
                            backgroundColor: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                          }}
                        >
                          <Title level={5} style={{ margin: 0, marginBottom: '16px', color: '#1e293b' }}>
                            {qIndex + 1}. {question.text}
                          </Title>

                          {question.image && (
                            <div style={{ marginBottom: '16px' }}>
                              <img
                                src={question.image}
                                alt="Savol rasmi"
                                style={{
                                  maxWidth: '100%',
                                  maxHeight: '200px',
                                  borderRadius: '8px',
                                  border: '1px solid #e2e8f0'
                                }}
                              />
                            </div>
                          )}

                          {question.options && question.options.length > 0 && (
                            <div style={{ marginBottom: '16px' }}>
                              <Text style={{
                                fontSize: '14px',
                                fontWeight: 600,
                                color: '#64748b',
                                marginBottom: '8px',
                                display: 'block'
                              }}>
                                Variantlar:
                              </Text>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {question.options.map((option, oIndex) => {
                                  const optionImageField = ['option_a_image', 'option_b_image', 'option_c_image', 'option_d_image'][oIndex];
                                  const optionImage = question[optionImageField];

                                  return (
                                    <div
                                      key={oIndex}
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        padding: '8px',
                                        borderRadius: '4px',
                                        backgroundColor: option.is_correct ? '#ecfdf5' : '#ffffff',
                                        border: option.is_correct ? '1px solid #10b981' : '1px solid #e2e8f0'
                                      }}
                                    >
                                      <Text style={{
                                        fontSize: '14px',
                                        fontWeight: option.is_correct ? 600 : 400,
                                        color: option.is_correct ? '#059669' : '#374151'
                                      }}>
                                        {String.fromCharCode(65 + oIndex)}. {option.text || option.option_text || option.answer || 'Variant yo\'q'}
                                        {option.is_correct && ' ✓'}
                                      </Text>
                                      {optionImage && (
                                        <img
                                          src={optionImage}
                                          alt={`Option ${String.fromCharCode(65 + oIndex)}`}
                                          style={{
                                            maxWidth: '60px',
                                            maxHeight: '40px',
                                            borderRadius: '4px',
                                            border: '1px solid #e2e8f0',
                                            objectFit: 'contain'
                                          }}
                                          onError={(e) => {
                                            console.error('Option image failed to load:', optionImage);
                                            e.target.style.display = 'none';
                                          }}
                                        />
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          <Card
                            size="small"
                            style={{
                              backgroundColor: getCorrectAnswer(question) === 'Noma\'lum' ? '#fefce8' : '#ecfdf5',
                              border: `1px solid ${getCorrectAnswer(question) === 'Noma\'lum' ? '#eab308' : '#10b981'}`,
                              borderRadius: '6px',
                            }}
                          >
                            <Text style={{
                              fontSize: '14px',
                              fontWeight: 600,
                              color: getCorrectAnswer(question) === 'Noma\'lum' ? '#92400e' : '#059669',
                              marginBottom: '8px',
                              display: 'block'
                            }}>
                              To'g'ri javob:
                            </Text>
                            <Text style={{
                              fontSize: '16px',
                              fontWeight: 600,
                              color: getCorrectAnswer(question) === 'Noma\'lum' ? '#b45309' : '#047857'
                            }}>
                              {getCorrectAnswer(question)}
                            </Text>
                            {getCorrectAnswer(question) === 'Noma\'lum' && (
                              <Text style={{
                                fontSize: '12px',
                                color: '#92400e',
                                marginTop: '8px',
                                fontStyle: 'italic',
                                display: 'block'
                              }}>
                                ⚠️ Bu savol uchun to'g'ri javob o'rnatilmagan
                              </Text>
                            )}
                          </Card>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Text style={{ color: '#64748b', fontStyle: 'italic' }}>
                      Bu test uchun savollar topilmadi
                    </Text>
                  )}
                </Panel>
              </Collapse>
            </Card>
          );
        })}
      </div>

      {filteredAndSortedTests.length === 0 && (
        <div style={{ textAlign: 'center', marginTop: '32px' }}>
          <Text style={{ fontSize: '16px', color: '#64748b' }}>
            Testlar topilmadi
          </Text>
        </div>
      )}
    </div>
  );
};

export default Questions;