import React, { useState, useEffect, useRef, useCallback } from 'react';
// import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'; // Unused in this version
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
  Modal,
  message,
  Table,
} from 'antd';
import {
  PlusOutlined as AddIcon,
  DeleteOutlined as DeleteIcon,
  CheckCircleOutlined as CorrectIcon,
  ArrowLeftOutlined as ArrowBackIcon,
  CameraOutlined as PhotoCameraIcon,
  CloseOutlined as ClearIcon,
  UploadOutlined as ImportIcon,
  // FileExcelOutlined,
  DownloadOutlined,
  FileSearchOutlined as PreviewIcon,
} from '@ant-design/icons';
import * as XLSX from 'xlsx';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../data/apiService';
import MathSymbols from '../../components/MathSymbols';
import LaTeXPreview from '../../components/LaTeXPreview';
import { SUBJECTS } from '../../data/subjects';

const { Title, Text } = Typography;

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
    is_premium: false,
    star_price: 0
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
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [importedQuestions, setImportedQuestions] = useState([]);
  const [importing, setImporting] = useState(false);

  // Load test data if editing
  useEffect(() => {
    if (testId) {
      console.log('Loading test for editing, testId:', testId);
      loadTestForEditing();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testId]);

  // Log form data changes
  useEffect(() => {
    // Form data updated
  }, [formData]);

  const loadTestForEditing = async () => {
    try {
      console.log('Loading test for editing:', testId);
      const test = await apiService.getTest(testId);
      console.log('Test data loaded:', test);

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

        const newFormData = {
          title: test.title || '',
          subject: test.subject || 'Matematika',
          description: test.description || '',
          time_limit: test.time_limit || 30,
          target_grades: parsedGrades,
          difficulty: test.difficulty || 'medium',
          is_premium: test.is_premium || false,
          star_price: test.star_price || 0,
        };

        console.log('Setting form data:', newFormData);
        setFormData(newFormData);

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
    } catch (_err) {
      console.error('Failed to load test for editing:', _err);
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

  // Import functionality
  const downloadSampleTemplate = () => {
    try {
      const sampleData = [
        {
          '№': 1,
          'Savol matni': '2 + 2 nechaga teng?',
          'A': '3',
          'B': '4',
          'C': '5',
          'D': '6',
          'To\'g\'ri javob (A, B, C yoki D)': 'B',
          'Tushuntirish': '2 + 2 = 4',
          'Formula': '',
          'Kod': ''
        },
        {
          '№': 2,
          'Savol matni': 'Poytaxtimiz qaysi shahar?',
          'A': 'Samarqand',
          'B': 'Buxoro',
          'C': 'Toshkent',
          'D': 'Xiva',
          'To\'g\'ri javob (A, B, C yoki D)': 'C',
          'Tushuntirish': 'O\'zbekiston poytaxti Toshkent',
          'Formula': '',
          'Kod': ''
        }
      ];

      const ws = XLSX.utils.json_to_sheet(sampleData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Savollar');
      XLSX.writeFile(wb, 'test_import_namuna.xlsx');
      message.success('Namuna fayl yuklab olindi!');
    } catch (error) {
      console.error('Error downloading template:', error);
      message.error('Fayl yuklab olishda xatolik yuz berdi');
    }
  };

  const handleImportFile = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setImporting(true);
      setError('');

      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        message.error('Fayl bo\'sh yoki ma\'lumotlar topilmadi');
        return;
      }

      const newImportedQuestions = jsonData.map((row, index) => {
        const optionA = row['Variant A'] || row['A'] || row['Option A'] || row['A)'];
        const optionB = row['Variant B'] || row['B'] || row['Option B'] || row['B)'];
        const optionC = row['Variant C'] || row['C'] || row['Option C'] || row['C)'];
        const optionD = row['Variant D'] || row['D'] || row['Option D'] || row['D)'];
        const correctKey = String(row['To\'g\'ri javob (A, B, C yoki D)'] || row['To\'g\'ri javob'] || row['Javob'] || '').trim().toUpperCase();

        const options = [
          { text: String(optionA || '').trim() },
          { text: String(optionB || '').trim() },
          { text: String(optionC || '').trim() },
          { text: String(optionD || '').trim() }
        ];

        let correctAnswer = '';
        if (correctKey === 'A') correctAnswer = options[0].text;
        else if (correctKey === 'B') correctAnswer = options[1].text;
        else if (correctKey === 'C') correctAnswer = options[2].text;
        else if (correctKey === 'D') correctAnswer = options[3].text;
        else correctAnswer = correctKey;

        return {
          key: index,
          question_text: row['Savol matni'] || row['Savol'] || '',
          question_type: 'multiple_choice',
          options,
          correct_answer: correctAnswer,
          explanation: row['Tushuntirish'] || '',
          formula: row['Formula'] || '',
          code: row['Kod'] || ''
        };
      });

      setImportedQuestions(newImportedQuestions);
      setImportModalVisible(false);
      setReviewModalVisible(true);
    } catch (error) {
      console.error('Import error:', error);
      message.error('Faylni o\'qishda xatolik yuz berdi. Formatni tekshiring.');
    } finally {
      setImporting(false);
      event.target.value = '';
    }
  };

  const confirmImport = () => {
    if (importedQuestions.length === 0) {
      message.warning('Import qilish uchun savollar yo\'q');
      return;
    }

    const cleaned = importedQuestions.map(({ key, ...rest }) => rest);
    setQuestions(cleaned);
    setReviewModalVisible(false);
    setImportedQuestions([]);
    message.success(`${cleaned.length} ta savol editorga yuklandi`);
  };

  const removeFromImport = (key) => {
    setImportedQuestions(importedQuestions.filter(q => q.key !== key));
  };

  // Manual test function for debugging
  const _testFormSubmission = async () => {
    console.log('Manual test function called');
    // Create a mock event
    const mockEvent = {
      preventDefault: () => console.log('preventDefault called')
    };
    await handleSubmit(mockEvent);
  };

  const handleSubmit = async (_values) => {
    // e.preventDefault(); // Not needed for Ant Design onFinish

    // Check authentication
    if (!currentUser) {
      setError('Siz tizimga kirmagansiz');
      return;
    }

    if (currentUser.role !== 'teacher' && currentUser.role !== 'admin' && currentUser.role !== 'content_manager') {
      setError('Faqat o\'qituvchilar va kontent menejerlar test yarata oladi');
      return;
    }

    setError('');
    setSuccess('');

    // Validation
    if (!formData.title || !formData.title.trim()) {
      setError('Test nomi talab qilinadi');
      return;
    }

    if (!formData.subject || !formData.subject.trim()) {
      setError('Fan tanlash talab qilinadi');
      return;
    }

    if (questions.length === 0) {
      setError('Kamida bitta savol kerak');
      return;
    }

    if (questions.some(q => !q.question_text || !q.question_text.trim())) {
      setError('Barcha savollar uchun savol matni talab qilinadi');
      return;
    }

    // Validate questions (only multiple choice)
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question_text.trim()) {
        setError(`Savol ${i + 1} matni talab qilinadi`);
        return;
      }
      // Only multiple choice questions are allowed
      if (q.options.some(opt => !opt.text || opt.text.trim() === '')) {
        setError(`Savol ${i + 1} barcha variantlarni to'ldirish kerak`);
        return;
      }
      if (!q.correct_answer || q.correct_answer.trim() === '') {
        setError(`Savol ${i + 1} to'g'ri javobni belgilash kerak`);
        return;
      }
    }

    setLoading(true);

    // TEMPORARY: Mock test to check if frontend works
    if (formData.title === 'TEST_FRONTEND_ONLY') {
      console.log('Mock test submission successful!');
      setSuccess('Mock test yaratildi (frontend test)');
      setLoading(false);
      return;
    }

    try {
      if (isEditing) {
        // Update existing test
        await apiService.updateTest(testId, {
          title: formData.title,
          subject: formData.subject,
          description: formData.description,
          time_limit: parseInt(formData.time_limit),
          target_grades: Array.isArray(formData.target_grades) ? formData.target_grades.join(',') : formData.target_grades,
          total_questions: questions.length,
          difficulty: formData.difficulty,
          is_premium: !!formData.is_premium,
          star_price: formData.star_price || 0,
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
          target_grades: Array.isArray(formData.target_grades) ? formData.target_grades.join(',') : formData.target_grades,
          total_questions: questions.length,
          difficulty: formData.difficulty,
          is_premium: !!formData.is_premium,
          star_price: formData.star_price || 0,
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
      console.error('Error details:', {
        message: err.message,
        stack: err.stack,
        response: err.response,
        status: err.status
      });

      let errorMessage = 'Noma\'lum xatolik';

      if (err.response && err.response.data) {
        // Prioritize server validation errors
        errorMessage = typeof err.response.data === 'object'
          ? JSON.stringify(err.response.data, null, 2)
          : String(err.response.data);
      } else if (err.message) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      }

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

      {/* Import Section */}
      {!isEditing && (
        <Card
          style={{
            width: '100%',
            marginBottom: '24px',
            backgroundColor: '#f8fafc',
            border: '2px dashed #cbd5e1',
            borderRadius: '12px',
          }}
        >
          <div style={{ padding: '24px', textAlign: 'center' }}>
            <Typography.Title level={4} style={{ color: '#475569', marginBottom: '16px' }}>
              📥 Testni import qilish
            </Typography.Title>
            <Typography.Text style={{ color: '#64748b', display: 'block', marginBottom: '20px' }}>
              Excel fayldan test savollarini avtomatik import qiling
            </Typography.Text>
            <Space size="large">
              <Button
                type="primary"
                icon={<ImportIcon />}
                size="large"
                onClick={() => {
                  console.log('Import button clicked, setting modal to visible');
                  setImportModalVisible(true);
                  console.log('ImportModalVisible state set to true');
                }}
                style={{
                  backgroundColor: '#2563eb',
                  borderColor: '#2563eb',
                  fontWeight: 600,
                }}
              >
                Excel fayldan import
              </Button>
              <Button
                icon={<DownloadOutlined />}
                size="large"
                onClick={downloadSampleTemplate}
                style={{
                  borderColor: '#059669',
                  color: '#059669',
                  fontWeight: 600,
                }}
              >
                Namuna fayl yuklab olish
              </Button>
            </Space>
          </div>
        </Card>
      )}

      <Row gutter={24}>
        <Col xs={24} lg={16}>
          {error && (
            <Alert
              message={error}
              type="error"
              style={{ marginBottom: '16px' }}
              closable
              onClose={() => setError('')}
            />
          )}

          {success && (
            <Alert
              message={success}
              type="success"
              style={{ marginBottom: '16px' }}
            />
          )}

          <Card
            style={{
              width: '100%',
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              marginBottom: '24px'
            }}
          >
            <div style={{ padding: '24px' }}>
              <Title level={4} style={{ marginBottom: '20px', fontWeight: 700 }}>Asosiy ma'lumotlar</Title>
              <Form layout="vertical">
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      label="Test nomi"
                      required
                    >
                      <Input
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="Masalan: 9-sinf Fizika 1-bob"
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      label="Fan"
                      required
                    >
                      <Select
                        value={formData.subject}
                        onChange={(value) => setFormData({ ...formData, subject: value })}
                        showSearch
                        placeholder="Fanni tanlang"
                      >
                        {SUBJECTS.map(subject => (
                          <Select.Option key={subject} value={subject}>{subject}</Select.Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      label="Vaqt limiti (daqiqa)"
                      required
                    >
                      <Input
                        type="number"
                        value={formData.time_limit}
                        onChange={(e) => setFormData({ ...formData, time_limit: parseInt(e.target.value) || 30 })}
                        min={5}
                        max={180}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="Test qiyinligi">
                      <Select
                        value={formData.difficulty}
                        onChange={(value) => setFormData({ ...formData, difficulty: value })}
                      >
                        <Select.Option value="easy">Oson</Select.Option>
                        <Select.Option value="medium">O'rtacha</Select.Option>
                        <Select.Option value="hard">Qiyin</Select.Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item label="Premium Status">
                      <Checkbox
                        checked={formData.is_premium}
                        onChange={(e) => setFormData({ ...formData, is_premium: e.target.checked })}
                      >
                        Faqat Premium foydalanuvchilar uchun
                      </Checkbox>
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="Yulduzli Narxi (0 bo'lsa tekin)">
                      <Input
                        type="number"
                        value={formData.star_price}
                        onChange={(e) => setFormData({ ...formData, star_price: parseInt(e.target.value) || 0 })}
                        min={0}
                        placeholder="Masalan: 50"
                      />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={16}>
                  <Col span={24}>
                    <Form.Item label="Tavsif">
                      <Input.TextArea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Test mazmuni haqida qisqa ma'lumot"
                        rows={2}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <div style={{ marginBottom: '16px' }}>
                      <Typography.Text strong style={{ display: 'block', marginBottom: '8px' }}>
                        Mo'ljallangan sinflar:
                      </Typography.Text>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {[5, 6, 7, 8, 9, 10, 11].map((grade) => (
                          <Button
                            key={grade}
                            size="small"
                            type={formData.target_grades.some(g => g.startsWith(`${grade}-`)) ? "primary" : "default"}
                            onClick={() => {
                              // Simple toggle for whole grade
                              const classesInGrade = [1, 2, 3, 4].map(n => `${grade}-${String(n).padStart(2, '0')}`);
                              const alreadySelected = classesInGrade.every(c => formData.target_grades.includes(c));
                              if (alreadySelected) {
                                setFormData(prev => ({ ...prev, target_grades: prev.target_grades.filter(g => !g.startsWith(`${grade}-`)) }));
                              } else {
                                setFormData(prev => ({ ...prev, target_grades: [...new Set([...prev.target_grades, ...classesInGrade])] }));
                              }
                            }}
                          >
                            {grade}-sinf
                          </Button>
                        ))}
                      </div>
                      <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {[5, 6, 7, 8, 9, 10, 11].flatMap((grade) =>
                          [1, 2, 3, 4].map((num) => {
                            const classGroup = `${grade}-${String(num).padStart(2, '0')}`;
                            return (
                              <Checkbox
                                key={classGroup}
                                checked={formData.target_grades.includes(classGroup)}
                                onChange={() => handleGradeChange(classGroup)}
                                style={{ fontSize: '12px' }}
                              >
                                {classGroup}
                              </Checkbox>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </Col>
                </Row>
              </Form>
            </div>
          </Card>

          <Title level={4} style={{ marginBottom: '20px', fontWeight: 700 }}>
            Savollar ({questions.length})
          </Title>

          {questions.map((question, index) => (
            <Card
              key={index}
              style={{
                marginBottom: '24px',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                position: 'relative'
              }}
              bodyStyle={{ padding: '20px' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <Typography.Title level={5} style={{ margin: 0, color: '#334155' }}>Savol {index + 1}</Typography.Title>
                <Button
                  type="text"
                  danger
                  icon={<DeleteIcon />}
                  onClick={() => removeQuestion(index)}
                  disabled={questions.length === 1}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px', gap: '8px' }}>
                  <Input.TextArea
                    rows={2}
                    value={question.question_text}
                    onChange={(e) => updateQuestion(index, 'question_text', e.target.value)}
                    placeholder="Savol matnini kiriting..."
                    style={{ flex: 1 }}
                  />
                  <Space direction="vertical" size={4}>
                    <Button
                      size="small"
                      onClick={() => handleOpenMathSymbols(index, 'question_text')}
                      icon={<span>🧮</span>}
                    />
                    <Upload
                      accept="image/*"
                      showUploadList={false}
                      beforeUpload={(file) => {
                        handleQuestionImageUpload(index, file);
                        return false;
                      }}
                    >
                      <Button size="small" icon={<PhotoCameraIcon />} />
                    </Upload>
                  </Space>
                </div>

                {question.question_image && (
                  <div style={{ marginBottom: '16px', position: 'relative', width: 'fit-content' }}>
                    <img
                      src={URL.createObjectURL(question.question_image)}
                      alt={`Question ${index + 1}`}
                      style={{ maxWidth: '100%', maxHeight: '150px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                    />
                    <Button
                      size="small"
                      danger
                      shape="circle"
                      icon={<ClearIcon />}
                      onClick={() => removeQuestionImage(index)}
                      style={{ position: 'absolute', top: -10, right: -10 }}
                    />
                  </div>
                )}

                {question.question_text && (
                  <div style={{ backgroundColor: '#f8fafc', padding: '8px', borderRadius: '4px', fontSize: '12px', border: '1px solid #e2e8f0', marginBottom: '12px' }}>
                    <LaTeXPreview text={question.question_text} />
                  </div>
                )}
              </div>

              {question.question_type === 'multiple_choice' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {question.options.map((option, optionIndex) => (
                    <div
                      key={optionIndex}
                      style={{
                        padding: '12px',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        backgroundColor: question.correct_answer === option.text ? '#eff6ff' : '#fff'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Button
                          type={question.correct_answer === option.text ? "primary" : "default"}
                          size="small"
                          shape="circle"
                          onClick={() => toggleCorrectAnswer(index, optionIndex)}
                          style={{ minWidth: '24px', height: '24px' }}
                        >
                          {String.fromCharCode(65 + optionIndex)}
                        </Button>
                        <Input
                          size="small"
                          value={option.text}
                          onChange={(e) => updateQuestionOption(index, optionIndex, e.target.value)}
                          placeholder="Variant matni..."
                          variant="borderless"
                          style={{ padding: 0, fontWeight: 500 }}
                        />
                      </div>

                      {option.text && (
                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                          <LaTeXPreview text={option.text} />
                        </div>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '4px' }}>
                        <Button
                          size="small"
                          type="text"
                          onClick={() => handleOpenMathSymbols(index, `option_${optionIndex}`)}
                          style={{ padding: 0, fontSize: '10px' }}
                        >
                          🧮
                        </Button>
                        <Upload
                          showUploadList={false}
                          beforeUpload={(file) => {
                            handleOptionImageUpload(index, optionIndex, file);
                            return false;
                          }}
                        >
                          <Button size="small" type="text" icon={<PhotoCameraIcon style={{ fontSize: '12px' }} />} />
                        </Upload>
                        {option.image && (
                          <Button size="small" type="text" danger icon={<ClearIcon style={{ fontSize: '12px' }} />} onClick={() => removeOptionImage(index, optionIndex)} />
                        )}
                      </div>

                      {option.image && (
                        <img src={URL.createObjectURL(option.image)} alt="Option" style={{ maxWidth: '60px', maxHeight: '40px', borderRadius: '4px' }} />
                      )}
                    </div>
                  ))}
                </div>
              )}

              <Input.TextArea
                rows={1}
                value={question.explanation}
                onChange={(e) => updateQuestion(index, 'explanation', e.target.value)}
                placeholder="Tushuntirish (ixtiyoriy)"
                style={{ marginTop: '12px', fontSize: '12px' }}
              />
            </Card>
          ))}

          <Button
            type="dashed"
            icon={<AddIcon />}
            onClick={addQuestion}
            style={{ marginBottom: '48px', width: '100%', height: '50px', borderRadius: '12px' }}
          >
            Yangi savol qo'shish
          </Button>
        </Col>

        <Col xs={24} lg={8}>
          <div style={{ position: 'sticky', top: '24px' }}>
            <Card
              style={{
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
              }}
              title={<span style={{ fontWeight: 700 }}>Amallar</span>}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <Button
                  type="primary"
                  size="large"
                  onClick={handleSubmit}
                  loading={loading}
                  icon={<CorrectIcon />}
                  style={{ height: '50px', fontWeight: 600 }}
                >
                  {isEditing ? 'Testni yangilash' : 'Testni saqlash'}
                </Button>

                <Button
                  size="large"
                  onClick={() => navigate('/teacher/my-tests')}
                  style={{ height: '50px', fontWeight: 600 }}
                >
                  Bekor qilish
                </Button>

                <Divider style={{ margin: '12px 0' }} />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <Button
                    icon={<ImportIcon />}
                    onClick={() => setImportModalVisible(true)}
                  >
                    Import
                  </Button>
                  <Button
                    icon={<DownloadOutlined />}
                    onClick={downloadSampleTemplate}
                  >
                    Shablon
                  </Button>
                </div>

                <Divider style={{ margin: '12px 0' }} />

                <div style={{ padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <Typography.Text type="secondary" style={{ fontSize: '12px' }}>Statistika:</Typography.Text>
                  <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between' }}>
                    <Text strong>Savollar:</Text>
                    <Text strong>{questions.length} ta</Text>
                  </div>
                  <div style={{ marginTop: '4px', display: 'flex', justifyContent: 'space-between' }}>
                    <Text strong>Vaqt:</Text>
                    <Text strong>{formData.time_limit} daqiqa</Text>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </Col>
      </Row>

      {/* Import Modal */}
      <Modal
        title={<span style={{ fontWeight: 700 }}>Test savollarini import qilish</span>}
        open={importModalVisible}
        onCancel={() => setImportModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setImportModalVisible(false)}>BEKOR QILISH</Button>,
          <Button
            key="download"
            icon={<DownloadOutlined />}
            onClick={downloadSampleTemplate}
          >
            NAMUNA YUKLASH
          </Button>,
          <Button
            key="upload"
            type="primary"
            icon={<ImportIcon />}
            loading={importing}
            onClick={() => document.getElementById('teacher-excel-input').click()}
            style={{ backgroundColor: '#2563eb' }}
          >
            FAYLNI TANLASH
          </Button>
        ]}
        width={700}
      >
        <div style={{ padding: '16px 0' }}>
          <Typography.Text strong style={{ display: 'block', marginBottom: '12px' }}>
            CSV YOKI EXCEL FAYL QUYIDAGI FORMATDA BO'LISHI SHART:
          </Typography.Text>
          <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px', marginBottom: '16px' }}>
            <Table
              size="small"
              pagination={false}
              dataSource={[{ key: 1, text: '2+2=?', a: '3', b: '4', c: '5', d: '6', ans: 'B' }]}
              columns={[
                { title: 'Savol matni', dataIndex: 'text' },
                { title: 'A', dataIndex: 'a' },
                { title: 'B', dataIndex: 'b' },
                { title: 'C', dataIndex: 'c' },
                { title: 'D', dataIndex: 'd' },
                { title: 'Javob', dataIndex: 'ans' },
              ]}
            />
          </div>
          <Alert
            message="Eslatma"
            description="Javob ustuniga faqat A, B, C yoki D harfini yozing. Keyingi bosqichda savollarni saralab olishingiz mumkin."
            type="info"
            showIcon
          />
          <input
            type="file"
            id="teacher-excel-input"
            style={{ display: 'none' }}
            accept=".xlsx, .xls, .csv"
            onChange={handleImportFile}
          />
        </div>
      </Modal>

      {/* Review Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <PreviewIcon style={{ fontSize: '20px', color: '#2563eb' }} />
            <span style={{ fontWeight: 700 }}>Import qilingan savollarni saralash</span>
          </div>
        }
        open={reviewModalVisible}
        onCancel={() => setReviewModalVisible(false)}
        width={900}
        footer={[
          <div key="stats" style={{ float: 'left', lineHeight: '32px' }}>
            <Text strong>{importedQuestions.length} ta savol tayyor</Text>
          </div>,
          <Button key="back" onClick={() => setReviewModalVisible(false)}>BEKOR QILISH</Button>,
          <Button
            key="done"
            type="primary"
            onClick={confirmImport}
            style={{ backgroundColor: '#2563eb', fontWeight: 600 }}
          >
            TAYYOR (EDITORGA O'TKAZISH)
          </Button>
        ]}
      >
        <div style={{ padding: '16px 0' }}>
          <Table
            dataSource={importedQuestions}
            size="small"
            pagination={{ pageSize: 6 }}
            scroll={{ y: 400 }}
            columns={[
              {
                title: '№',
                width: 50,
                render: (_, __, i) => i + 1
              },
              {
                title: 'Savol matni',
                dataIndex: 'question_text',
                key: 'text',
                render: (t) => <Text strong style={{ fontSize: '13px' }}>{t}</Text>
              },
              {
                title: 'Variantlar',
                key: 'options',
                width: 250,
                render: (_, r) => (
                  <div style={{ fontSize: '11px' }}>
                    {r.options.map((o, i) => (
                      <div key={i} style={{ color: r.correct_answer === o.text ? '#16a34a' : '#000', fontWeight: r.correct_answer === o.text ? 700 : 400 }}>
                        {String.fromCharCode(65 + i)}) {o.text}
                      </div>
                    ))}
                  </div>
                )
              },
              {
                title: 'O\'chirish',
                key: 'del',
                width: 80,
                align: 'center',
                render: (_, r) => (
                  <Button type="text" danger icon={<DeleteIcon />} onClick={() => removeFromImport(r.key)} />
                )
              }
            ]}
          />
        </div>
      </Modal>

      {/* Math Symbols Dialog */}
      <MathSymbols
        open={mathSymbolsOpen}
        onClose={() => setMathSymbolsOpen(false)}
        onSymbolSelect={handleSymbolSelect}
      />
    </div >
  );
};

export default CreateTest;

