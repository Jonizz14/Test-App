import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Typography,
  Card,
  Button,
  Input,
  Select,
  Alert,
  Form,
  Row,
  Col,
  Checkbox,
  Space,
  Divider,
  Upload,
} from 'antd';
import {
  PlusOutlined as AddIcon,
  DeleteOutlined as DeleteIcon,
  CheckCircleOutlined as CorrectIcon,
  ArrowLeftOutlined as ArrowBackIcon,
  CameraOutlined as PhotoCameraIcon,
  CloseOutlined as ClearIcon,
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../data/apiService';
import MathSymbols from '../../components/MathSymbols';
import LaTeXPreview from '../../components/LaTeXPreview';

const CreateTest = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { testId } = useParams();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    subject: 'Matematika',
    description: '',
    time_limit: 30,
    target_grades: [], // Empty array means all grades
    difficulty: 'medium', // easy, medium, hard
  });
  const [questions, setQuestions] = useState([{
    question_text: '',
    question_type: 'multiple_choice',
    question_image: null,
    options: [
      { text: 'A)', image: null },
      { text: 'B)', image: null },
      { text: 'C)', image: null },
      { text: 'D)', image: null }
    ],
    correct_answer: '',
    explanation: '',
    formula: '',
    code: ''
  }]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [mathSymbolsOpen, setMathSymbolsOpen] = useState(false);
  const [currentField, setCurrentField] = useState({ questionIndex: null, field: null });

  // Load test data if editing
  useEffect(() => {
    if (testId) {
      loadTestForEditing();
    }
  }, [testId]);

  const loadTestForEditing = async () => {
    try {
      const test = await apiService.getTest(testId);
      
      if (test && test.teacher === currentUser.id) {
        setIsEditing(true);

        // Parse target_grades properly
        let parsedGrades = [];
        if (Array.isArray(test.target_grades)) {
          parsedGrades = test.target_grades;
        } else if (typeof test.target_grades === 'string') {
          try {
            parsedGrades = JSON.parse(test.target_grades);
            if (!Array.isArray(parsedGrades)) {
              parsedGrades = [];
            }
          } catch {
            // If not JSON, treat as comma separated
            parsedGrades = test.target_grades.split(',').map(g => g.trim()).filter(g => g);
          }
        }

        setFormData({
          title: test.title,
          subject: test.subject,
          description: test.description || '',
          time_limit: test.time_limit,
          target_grades: parsedGrades,
          difficulty: test.difficulty || 'medium',
        });
        
        // Load questions
        const questionsData = await apiService.getQuestions({ test: testId });
        const questionsList = questionsData.results || questionsData;
        setQuestions(questionsList.map(q => {
          let parsedOptions = q.options || ['A)', 'B)', 'C)', 'D)'];
          if (typeof parsedOptions === 'string') {
            try {
              parsedOptions = JSON.parse(parsedOptions);
            } catch {
              parsedOptions = ['A)', 'B)', 'C)', 'D)'];
            }
          }

          return {
            id: q.id,
            question_text: q.question_text,
            question_type: q.question_type,
            question_image: null, // Will be loaded separately if needed
            options: Array.isArray(parsedOptions) ? parsedOptions.map((opt, idx) => {
              if (typeof opt === 'object' && opt !== null) {
                return { text: opt.text || `(${String.fromCharCode(65 + idx)})` };
              }
              return { text: opt };
            }) : [
              { text: 'A)' },
              { text: 'B)' },
              { text: 'C)' },
              { text: 'D)' }
            ],
            correct_answer: q.correct_answer,
            explanation: q.explanation || '',
            formula: q.formula || '',
            code: q.code || ''
          };
        }));
      } else {
        setError('Test not found or access denied');
      }
    } catch (err) {
      console.error('Failed to load test for editing:', err);
      setError('Failed to load test for editing');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleGradeChange = (classGroup) => {
    const updatedGrades = formData.target_grades.includes(classGroup)
      ? formData.target_grades.filter(g => g !== classGroup)
      : [...formData.target_grades, classGroup];
    setFormData({
      ...formData,
      target_grades: updatedGrades
    });
  };

  const addQuestion = () => {
    setQuestions([...questions, {
      question_text: '',
      question_type: 'multiple_choice',
      question_image: null,
      options: [
        { text: 'A)', image: null },
        { text: 'B)', image: null },
        { text: 'C)', image: null },
        { text: 'D)', image: null }
      ],
      correct_answer: '',
      explanation: '',
      formula: '',
      code: ''
    }]);
  };

  const updateQuestion = (index, field, value) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index][field] = value;
    setQuestions(updatedQuestions);
  };

  const updateQuestionOption = (questionIndex, optionIndex, value) => {
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex].options[optionIndex].text = value;
    setQuestions(updatedQuestions);
  };

  const handleOptionImageUpload = (questionIndex, optionIndex, file) => {
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex].options[optionIndex].image = file;
    setQuestions(updatedQuestions);
  };

  const removeOptionImage = (questionIndex, optionIndex) => {
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex].options[optionIndex].image = null;
    setQuestions(updatedQuestions);
  };

  const handleQuestionImageUpload = (questionIndex, file) => {
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex].question_image = file;
    setQuestions(updatedQuestions);
  };

  const removeQuestionImage = (questionIndex) => {
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex].question_image = null;
    setQuestions(updatedQuestions);
  };


  const toggleCorrectAnswer = (questionIndex, optionIndex) => {
    const updatedQuestions = [...questions];
    const question = updatedQuestions[questionIndex];
    const optionValue = question.options[optionIndex].text;

    question.correct_answer = optionValue;
    setQuestions(updatedQuestions);
  };

  const removeQuestion = (index) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== index));
    }
  };

  const handleOpenMathSymbols = (questionIndex, field) => {
    setCurrentField({ questionIndex, field });
    setMathSymbolsOpen(true);
  };

  const handleSymbolSelect = (symbol) => {
    if (currentField.questionIndex !== null && currentField.field) {
      if (currentField.questionIndex === 'form') {
        // For form fields (title, description)
        setFormData(prev => ({
          ...prev,
          [currentField.field]: prev[currentField.field] + symbol
        }));
      } else if (currentField.field.startsWith('option_')) {
        // For option fields
        const optionIndex = parseInt(currentField.field.split('_')[1]);
        updateQuestionOption(currentField.questionIndex, optionIndex, questions[currentField.questionIndex].options[optionIndex].text + symbol);
      } else {
        // For question fields
        updateQuestion(currentField.questionIndex, currentField.field, questions[currentField.questionIndex][currentField.field] + symbol);
      }
    }
    setMathSymbolsOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!formData.title || !formData.subject) {
      setError('Test nomi va fani talab qilinadi');
      return;
    }

    if (questions.length === 0) {
      setError('Kamida bitta savol kerak');
      return;
    }

    // Validate questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question_text.trim()) {
        setError(`Savol ${i + 1} matni talab qilinadi`);
        return;
      }
      if (q.question_type === 'multiple_choice') {
        if (q.options.some(opt => !opt.text || opt.text.trim() === '')) {
          setError(`Savol ${i + 1} barcha variantlarni to'ldirish kerak`);
          return;
        }
        if (!q.correct_answer || q.correct_answer.trim() === '') {
          setError(`Savol ${i + 1} to'g'ri javobni belgilash kerak`);
          return;
        }
      } else if (q.question_type === 'short_answer') {
        if (!q.correct_answer || q.correct_answer.trim() === '') {
          setError(`Savol ${i + 1} to'g'ri javobni kiritish kerak`);
          return;
        }
      } else if (q.question_type === 'formula') {
        if (!q.formula || q.formula.trim() === '') {
          setError(`Savol ${i + 1} formulani kiritish kerak`);
          return;
        }
      } else if (q.question_type === 'code') {
        if (!q.code || q.code.trim() === '') {
          setError(`Savol ${i + 1} kod namunasi kerak`);
          return;
        }
      }
    }

    setLoading(true);

    try {
      if (isEditing) {
        // Update existing test
        await apiService.updateTest(testId, {
          title: formData.title,
          subject: formData.subject,
          description: formData.description,
          time_limit: parseInt(formData.time_limit),
          target_grades: formData.target_grades,
          total_questions: questions.length,
          difficulty: formData.difficulty,
        });
        
        // Update questions (delete old ones and create new ones)
        const questionsData = await apiService.getQuestions({ test: testId });
        const existingQuestions = questionsData.results || questionsData;
        
        // Delete existing questions
        for (const question of existingQuestions) {
          await apiService.deleteQuestion(question.id);
        }
        
        // Create new questions
        for (const question of questions) {
          const questionData = new FormData();
          questionData.append('test', testId);
          questionData.append('question_text', question.question_text);
          questionData.append('question_type', question.question_type);
          questionData.append('options', JSON.stringify(question.options.map(opt =>
            typeof opt === 'object' ? { text: opt.text } : { text: opt }
          )));
          questionData.append('correct_answer', question.correct_answer);
          questionData.append('explanation', question.explanation || '');
          if (question.formula) questionData.append('formula', question.formula);
          if (question.code) questionData.append('code', question.code);

          // Add question image
          if (question.question_image) {
            questionData.append('image', question.question_image);
          }

          // Add option images
          question.options.forEach((option, index) => {
            if (option.image) {
              const imageFieldName = `option_${String.fromCharCode(97 + index)}_image`; // option_a_image, option_b_image, etc.
              questionData.append(imageFieldName, option.image);
            }
          });

          await apiService.createQuestion(questionData);
        }
        
        setSuccess('Test muvaffaqiyatli yangilandi!');
        setTimeout(() => {
          navigate('/teacher/my-tests');
        }, 2000);
        
      } else {
        // Create new test
        console.log('Creating test with data:', {
          subject: formData.subject,
          title: formData.title,
          description: formData.description,
          time_limit: parseInt(formData.time_limit),
          target_grades: formData.target_grades,
          total_questions: questions.length,
        });

        console.log('target_grades type:', typeof formData.target_grades, 'value:', formData.target_grades);

        const testData = await apiService.createTest({
          subject: formData.subject,
          title: formData.title,
          description: formData.description,
          time_limit: parseInt(formData.time_limit),
          target_grades: formData.target_grades,
          total_questions: questions.length,
          difficulty: formData.difficulty,
        });

        console.log('Test created successfully:', testData);
        const newTestId = testData.id;

        // Create questions for the new test
        for (const question of questions) {
          const questionData = new FormData();
          questionData.append('test', newTestId);
          questionData.append('question_text', question.question_text);
          questionData.append('question_type', question.question_type);
          questionData.append('options', JSON.stringify(question.options.map(opt =>
            typeof opt === 'object' ? { text: opt.text } : { text: opt }
          )));
          questionData.append('correct_answer', question.correct_answer);
          questionData.append('explanation', question.explanation || '');
          if (question.formula) questionData.append('formula', question.formula);
          if (question.code) questionData.append('code', question.code);

          // Add question image
          if (question.question_image) {
            questionData.append('image', question.question_image);
          }

          // Add option images
          question.options.forEach((option, index) => {
            if (option.image) {
              const imageFieldName = `option_${String.fromCharCode(97 + index)}_image`; // option_a_image, option_b_image, etc.
              questionData.append(imageFieldName, option.image);
            }
          });

          await apiService.createQuestion(questionData);
        }

        setSuccess(`"${formData.title}" testi muvaffaqiyatli yaratildi!`);
        setTimeout(() => {
          navigate('/teacher/my-tests');
        }, 2000);
      }

    } catch (err) {
      console.error('Failed to save test:', err);
      const errorMessage = err.message || 'Noma\'lum xatolik';
      setError(isEditing ? `Testni yangilashda xatolik: ${errorMessage}` : `Test yaratishda xatolik: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      width: '100%',
      padding: '32px 0',
      backgroundColor: '#ffffff'
    }}>
      <div style={{
        marginBottom: '48px',
        paddingBottom: '32px',
        borderBottom: '1px solid #e2e8f0'
      }}>
        <Typography.Title
          level={1}
          style={{
            fontSize: '40px',
            fontWeight: 700,
            color: '#1e293b',
            marginBottom: '16px',
            margin: 0
          }}
        >
          {isEditing ? 'Testni tahrirlash' : 'Yangi test yaratish'}
        </Typography.Title>
        <Typography.Text
          style={{
            fontSize: '18px',
            color: '#64748b',
            fontWeight: 400
          }}
        >
          {isEditing ? 'Mavjud testni o\'zgartiring va yangilang' : 'Yangi test yarating va o\'quvchilarga taqdim eting'}
        </Typography.Text>
      </div>

      <Card
        style={{
          width: '100%',
          minHeight: '600px',
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
        }}
      >
        {error && (
          <Alert
            message={error}
            type="error"
            style={{ marginBottom: '16px' }}
          />
        )}

        {success && (
          <Alert
            message={success}
            type="success"
            style={{ marginBottom: '16px' }}
          />
        )}

        <div style={{ padding: '32px' }}>
          <Form onFinish={handleSubmit} layout="vertical">
            <Row gutter={24}>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Test nomi"
                  name="title"
                  rules={[{ required: true, message: 'Test nomi talab qilinadi' }]}
                >
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="Test nomini kiriting"
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  label="Fan"
                  name="subject"
                  rules={[{ required: true, message: 'Fan tanlash talab qilinadi' }]}
                >
                  <Select
                    value={formData.subject}
                    onChange={(value) => setFormData({...formData, subject: value})}
                  >
                    <Select.Option value="Matematika">Matematika</Select.Option>
                    <Select.Option value="O'zbek tili">O'zbek tili</Select.Option>
                    <Select.Option value="Ingliz tili">Ingliz tili</Select.Option>
                    <Select.Option value="Rus tili">Rus tili</Select.Option>
                    <Select.Option value="Fizika">Fizika</Select.Option>
                    <Select.Option value="Kimyo">Kimyo</Select.Option>
                    <Select.Option value="Biologiya">Biologiya</Select.Option>
                    <Select.Option value="Tarix">Tarix</Select.Option>
                    <Select.Option value="Geografiya">Geografiya</Select.Option>
                    <Select.Option value="Adabiyot">Adabiyot</Select.Option>
                    <Select.Option value="Informatika">Informatika</Select.Option>
                    <Select.Option value="Tasviriy san'at">Tasviriy san'at</Select.Option>
                    <Select.Option value="Musiqa">Musiqa</Select.Option>
                    <Select.Option value="Jismoniy tarbiya">Jismoniy tarbiya</Select.Option>
                    <Select.Option value="Texnologiya">Texnologiya</Select.Option>
                  </Select>
                </Form.Item>
              </Col>

              <Col xs={24}>
                <Form.Item label="Tavsif" name="description">
                  <Input.TextArea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Test mazmuni haqida qisqa ma'lumot"
                    rows={3}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  label="Vaqt limiti (daqiqa)"
                  name="time_limit"
                  rules={[{ required: true, message: 'Vaqt limiti talab qilinadi' }]}
                >
                  <Input
                    type="number"
                    value={formData.time_limit}
                    onChange={(e) => setFormData({...formData, time_limit: parseInt(e.target.value) || 30})}
                    min={5}
                    max={180}
                    placeholder="30"
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item label="Test qiyinligi" name="difficulty">
                  <Select
                    value={formData.difficulty}
                    onChange={(value) => setFormData({...formData, difficulty: value})}
                  >
                    <Select.Option value="easy">Oson</Select.Option>
                    <Select.Option value="medium">O'rtacha</Select.Option>
                    <Select.Option value="hard">Qiyin</Select.Option>
                  </Select>
                </Form.Item>
              </Col>

            </Row>

            <div style={{ marginTop: '24px' }}>
              <Typography.Text strong style={{ display: 'block', marginBottom: '16px' }}>
                Maqsadlangan sinf guruhlari (barcha guruhlar uchun test yaratish uchun hech narsa tanlamang)
              </Typography.Text>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                {[5, 6, 7, 8, 9, 10, 11].flatMap((grade) =>
                  [1, 2, 3, 4].map((num) => {
                    const classGroup = `${grade}-${String(num).padStart(2, '0')}`;
                    return (
                      <Checkbox
                        key={classGroup}
                        checked={formData.target_grades.includes(classGroup)}
                        onChange={() => handleGradeChange(classGroup)}
                        style={{
                          color: currentUser.curator_class === classGroup ? '#f59e0b' : undefined,
                        }}
                      >
                        {classGroup}
                      </Checkbox>
                    );
                  })
                )}
              </div>
            </div>

          <Divider style={{ margin: '24px 0' }} />

          <Typography.Title level={4} style={{ marginBottom: '16px' }}>
            Savollar ({questions.length})
          </Typography.Title>

          {questions.map((question, index) => (
            <Card key={index} style={{ marginBottom: '24px' }}>
              <div style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <Typography.Title level={5} style={{ margin: 0 }}>Savol {index + 1}</Typography.Title>
                  <Button
                    type="text"
                    danger
                    icon={<DeleteIcon />}
                    onClick={() => removeQuestion(index)}
                    disabled={questions.length === 1}
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                    <Typography.Text style={{ flex: 1 }}>
                      Savol matni
                    </Typography.Text>
                    <Space>
                      <Button
                        size="small"
                        onClick={() => handleOpenMathSymbols(index, 'question_text')}
                        style={{
                          minWidth: 'auto',
                          padding: '4px 8px',
                          fontSize: '12px'
                        }}
                      >
                        🧮 Belgilar
                      </Button>
                      <Upload
                        accept="image/*"
                        showUploadList={false}
                        beforeUpload={(file) => {
                          handleQuestionImageUpload(index, file);
                          return false; // Prevent automatic upload
                        }}
                      >
                        <Button
                          size="small"
                          icon={<PhotoCameraIcon />}
                          style={{ padding: '4px' }}
                        />
                      </Upload>
                      {question.question_image && (
                        <Button
                          size="small"
                          danger
                          icon={<ClearIcon />}
                          onClick={() => removeQuestionImage(index)}
                          style={{ padding: '4px' }}
                        />
                      )}
                    </Space>
                  </div>

                  {/* Question Image Preview */}
                  {question.question_image && (
                    <div style={{ marginBottom: '16px' }}>
                      <img
                        src={URL.createObjectURL(question.question_image)}
                        alt={`Question ${index + 1}`}
                        style={{
                          maxWidth: '100%',
                          maxHeight: '200px',
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0',
                          objectFit: 'contain'
                        }}
                      />
                    </div>
                  )}

                  <Input.TextArea
                    rows={2}
                    value={question.question_text}
                    onChange={(e) => updateQuestion(index, 'question_text', e.target.value)}
                    placeholder="Savol matnini kiriting... (LaTeX uchun $...$ yoki $$...$$ dan foydalaning)"
                  />
                  {question.question_text && (
                    <Card size="small" style={{
                      marginTop: '8px',
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0'
                    }}>
                      <Typography.Text style={{ color: '#64748b', fontWeight: 500, marginBottom: '8px', display: 'block' }}>
                        LaTeX ko'rinishi:
                      </Typography.Text>
                      <LaTeXPreview text={question.question_text} />
                    </Card>
                  )}
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <Select
                    style={{ width: '100%' }}
                    value={question.question_type}
                    onChange={(value) => updateQuestion(index, 'question_type', value)}
                    placeholder="Savol turini tanlang"
                  >
                    <Select.Option value="multiple_choice">Ko'p variantli</Select.Option>
                    <Select.Option value="short_answer">Ochiq javob</Select.Option>
                    <Select.Option value="formula">Formula</Select.Option>
                    <Select.Option value="code">Kod</Select.Option>
                  </Select>
                </div>

                {question.question_type === 'multiple_choice' && (
                  <>
                    <Typography.Text strong style={{ display: 'block', marginBottom: '16px' }}>
                      Variantlar (A, B, C, D):
                    </Typography.Text>

                    {question.options.map((option, optionIndex) => (
                      <div key={optionIndex} style={{ marginBottom: '16px', padding: '16px', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                          <Button
                            type={question.correct_answer === option.text ? "primary" : "text"}
                            size="small"
                            icon={<CorrectIcon />}
                            onClick={() => toggleCorrectAnswer(index, optionIndex)}
                            style={{ marginRight: '8px' }}
                          />
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                            <Input
                              size="small"
                              value={option.text}
                              onChange={(e) => updateQuestionOption(index, optionIndex, e.target.value)}
                              placeholder={`Variant ${String.fromCharCode(65 + optionIndex)} (LaTeX uchun $...$)`}
                              style={{ flex: 1 }}
                            />
                            <Button
                              size="small"
                              onClick={() => handleOpenMathSymbols(index, `option_${optionIndex}`)}
                              style={{ padding: '4px' }}
                            >
                              🧮
                            </Button>
                            <Button
                              size="small"
                              icon={<PhotoCameraIcon />}
                              style={{ padding: '4px' }}
                            >
                              <input
                                type="file"
                                accept="image/*"
                                style={{ display: 'none' }}
                                onChange={(e) => {
                                  const file = e.target.files[0];
                                  if (file) {
                                    handleOptionImageUpload(index, optionIndex, file);
                                  }
                                }}
                              />
                            </Button>
                            {option.image && (
                              <Button
                                size="small"
                                danger
                                icon={<ClearIcon />}
                                onClick={() => removeOptionImage(index, optionIndex)}
                                style={{ padding: '4px' }}
                              />
                            )}
                          </div>
                        </div>

                        {/* Image Preview */}
                        {option.image && (
                          <div style={{ marginBottom: '8px' }}>
                            <img
                              src={URL.createObjectURL(option.image)}
                              alt={`Option ${String.fromCharCode(65 + optionIndex)}`}
                              style={{
                                maxWidth: '100px',
                                maxHeight: '60px',
                                borderRadius: '4px',
                                border: '1px solid #e2e8f0',
                                objectFit: 'contain'
                              }}
                            />
                          </div>
                        )}

                        {/* LaTeX Preview */}
                        {option.text && option.text.trim() && (
                          <Card size="small" style={{
                            backgroundColor: '#f8fafc',
                            border: '1px solid #e2e8f0'
                          }}>
                            <Typography.Text style={{ color: '#64748b', fontWeight: 500, marginBottom: '4px', display: 'block' }}>
                              Ko'rinishi:
                            </Typography.Text>
                            <LaTeXPreview text={option.text} />
                          </Card>
                        )}
                      </div>
                    ))}

                    <Typography.Text style={{ fontSize: '12px', color: '#64748b', marginTop: '8px', display: 'block' }}>
                      To'g'ri javobni belgilash uchun checkbox belgisini bosing
                    </Typography.Text>
                  </>
                )}

                {question.question_type === 'short_answer' && (
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                      <Typography.Text style={{ flex: 1 }}>
                        To'g'ri javob
                      </Typography.Text>
                      <Button
                        size="small"
                        onClick={() => handleOpenMathSymbols(index, 'correct_answer')}
                        style={{
                          minWidth: 'auto',
                          padding: '4px 8px',
                          fontSize: '12px'
                        }}
                      >
                        🧮 Belgilar
                      </Button>
                    </div>
                    <Input.TextArea
                      rows={2}
                      value={question.correct_answer}
                      onChange={(e) => updateQuestion(index, 'correct_answer', e.target.value)}
                      placeholder="O'quvchi javob berishi kerak bo'lgan to'g'ri javob (LaTeX uchun $...$ dan foydalaning)"
                    />
                    {question.correct_answer && (
                      <Card size="small" style={{
                        marginTop: '8px',
                        backgroundColor: '#f8fafc',
                        border: '1px solid #e2e8f0'
                      }}>
                        <Typography.Text style={{ color: '#64748b', fontWeight: 500, marginBottom: '8px', display: 'block' }}>
                          Javob ko'rinishi:
                        </Typography.Text>
                        <LaTeXPreview text={question.correct_answer} />
                      </Card>
                    )}
                  </div>
                )}

                {question.question_type === 'formula' && (
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                      <Typography.Text style={{ flex: 1 }}>
                        Formula
                      </Typography.Text>
                      <Button
                        size="small"
                        onClick={() => handleOpenMathSymbols(index, 'formula')}
                        style={{
                          minWidth: 'auto',
                          padding: '4px 8px',
                          fontSize: '12px'
                        }}
                      >
                        🧮 Belgilar
                      </Button>
                    </div>
                    <Input.TextArea
                      rows={3}
                      value={question.formula}
                      onChange={(e) => updateQuestion(index, 'formula', e.target.value)}
                      placeholder="Matematik formulani kiriting (LaTeX: \frac{a}{b}, x^2, \sqrt{x}, etc.)"
                    />
                    {question.formula && (
                      <Card size="small" style={{
                        marginTop: '8px',
                        backgroundColor: '#f8fafc',
                        border: '1px solid #e2e8f0'
                      }}>
                        <Typography.Text style={{ color: '#64748b', fontWeight: 500, marginBottom: '8px', display: 'block' }}>
                          Formula ko'rinishi:
                        </Typography.Text>
                        <LaTeXPreview text={question.formula} />
                      </Card>
                    )}
                  </div>
                )}

                {question.question_type === 'code' && (
                  <Input.TextArea
                    rows={4}
                    value={question.code}
                    onChange={(e) => updateQuestion(index, 'code', e.target.value)}
                    placeholder="Kod namunasi yozing"
                    style={{ marginBottom: '16px', fontFamily: 'monospace' }}
                  />
                )}

                <Input.TextArea
                  rows={2}
                  value={question.explanation}
                  onChange={(e) => updateQuestion(index, 'explanation', e.target.value)}
                  placeholder="Tushuntirish (ixtiyoriy)"
                  style={{ marginTop: '16px' }}
                />
              </div>
            </Card>
          ))}

          <Button
            type="dashed"
            icon={<AddIcon />}
            onClick={addQuestion}
            style={{ marginBottom: '24px', width: '100%' }}
          >
            Savol qo'shish
          </Button>

          <div style={{ display: 'flex', gap: '16px' }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              style={{ flex: 1 }}
            >
              {loading ? (isEditing ? 'Yangilanmoqda...' : 'Yaratilmoqda...') : (isEditing ? 'Testni yangilash' : 'Test yaratish')}
            </Button>
            <Button
              onClick={() => navigate('/teacher/my-tests')}
              style={{ flex: 1 }}
            >
              Bekor qilish
            </Button>
          </div>
          </Form>
        </div>
      </Card>

      {/* Math Symbols Dialog */}
      <MathSymbols
        open={mathSymbolsOpen}
        onClose={() => setMathSymbolsOpen(false)}
        onSymbolSelect={handleSymbolSelect}
      />
    </div>
  );
};

export default CreateTest;

