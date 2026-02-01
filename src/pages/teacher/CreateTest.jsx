import React, { useState, useEffect, useRef, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
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
} from 'antd';
import {
  PlusOutlined as AddIcon,
  DeleteOutlined as DeleteIcon,
  CheckCircleOutlined as CorrectIcon,
  ArrowLeftOutlined as ArrowBackIcon,
  CameraOutlined as PhotoCameraIcon,
  CloseOutlined as ClearIcon,
  UploadOutlined as ImportIcon,
  FileExcelOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import * as XLSX from 'xlsx';
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
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [importing, setImporting] = useState(false);

  // Load test data if editing
  useEffect(() => {
    if (testId) {
      console.log('Loading test for editing, testId:', testId);
      loadTestForEditing();
    }
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

  // Import functionality
  const downloadSampleTemplate = () => {
    console.log('Download template function called');
    try {
      const sampleData = [
        {
          'Savol tartib raqami': 1,
          'Savol matni': '2 + 2 nechaga teng?',
          'Variant A': '3',
          'Variant B': '4',
          'Variant C': '5',
          'Variant D': '6',
          'To\'g\'ri javob': 'B',
          'Tushuntirish': '2 + 2 = 4',
          'Savol turi': 'multiple_choice',
          'Formula': '',
          'Kod': ''
        },
        {
          'Savol tartib raqami': 2,
          'Savol matni': 'Matematik formula yozing: a kvadrat + b kvadrat',
          'Variant A': '',
          'Variant B': '',
          'Variant C': '',
          'Variant D': '',
          'To\'g\'ri javob': 'a² + b²',
          'Tushuntirish': 'Pifagor teoremasi',
          'Savol turi': 'formula',
          'Formula': 'a^2 + b^2',
          'Kod': ''
        }
      ];

      const ws = XLSX.utils.json_to_sheet(sampleData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Test namuna');
      XLSX.writeFile(wb, 'test_import_namuna.xlsx');
      message.success('Namuna fayl yuklab olindi!');
      console.log('Template downloaded successfully');
    } catch (error) {
      console.error('Error downloading template:', error);
      message.error('Fayl yuklab olishda xatolik yuz berdi');
    }
  };

  const handleImportFromExcel = async (event) => {
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
        setError('Excel faylda ma\'lumotlar topilmadi');
        return;
      }

      const importedQuestions = [];
      let successCount = 0;
      let errorCount = 0;
      const errors = [];

      for (const row of jsonData) {
        try {
          const questionNumber = row['Savol tartib raqami'] || row['№'] || importedQuestions.length + 1;
          const questionText = row['Savol matni'] || row['Question'];
          const optionA = row['Variant A'] || row['Option A'] || row['A)'];
          const optionB = row['Variant B'] || row['Option B'] || row['B)'];
          const optionC = row['Variant C'] || row['Option C'] || row['C)'];
          const optionD = row['Variant D'] || row['Option D'] || row['D)'];
          const correctAnswer = row['To\'g\'ri javob'] || row['Correct Answer'];
          const explanation = row['Tushuntirish'] || row['Explanation'] || '';
          const questionType = row['Savol turi'] || row['Question Type'] || 'multiple_choice';
          const formula = row['Formula'] || '';
          const code = row['Kod'] || row['Code'] || '';

          // Validate required fields
          if (!questionText) {
            errors.push(`Qator ${questionNumber}: Savol matni talab qilinadi`);
            errorCount++;
            continue;
          }

          let questionData = {
            question_text: questionText,
            question_type: questionType,
            question_image: null,
            correct_answer: '',
            explanation: explanation,
            formula: formula,
            code: code
          };

          if (questionType === 'multiple_choice') {
            if (!optionA || !optionB || !optionC || !optionD) {
              errors.push(`Qator ${questionNumber}: Barcha variantlar (A, B, C, D) talab qilinadi`);
              errorCount++;
              continue;
            }

            if (!correctAnswer) {
              errors.push(`Qator ${questionNumber}: To'g'ri javob belgilash kerak`);
              errorCount++;
              continue;
            }

            const options = [
              { text: optionA, image: null },
              { text: optionB, image: null },
              { text: optionC, image: null },
              { text: optionD, image: null }
            ];

            // Find correct answer and format it
            let correctAnswerFormatted = '';
            if (correctAnswer.toLowerCase() === 'a' || correctAnswer === 'A)') {
              correctAnswerFormatted = 'A)';
            } else if (correctAnswer.toLowerCase() === 'b' || correctAnswer === 'B)') {
              correctAnswerFormatted = 'B)';
            } else if (correctAnswer.toLowerCase() === 'c' || correctAnswer === 'C)') {
              correctAnswerFormatted = 'C)';
            } else if (correctAnswer.toLowerCase() === 'd' || correctAnswer === 'D)') {
              correctAnswerFormatted = 'D)';
            } else {
              // If it's the actual answer text, find matching option
              const matchingOption = options.find(opt =>
                opt.text.toLowerCase().trim() === correctAnswer.toLowerCase().trim()
              );
              if (matchingOption) {
                correctAnswerFormatted = options.indexOf(matchingOption) === 0 ? 'A)' :
                  options.indexOf(matchingOption) === 1 ? 'B)' :
                    options.indexOf(matchingOption) === 2 ? 'C)' : 'D)';
              }
            }

            questionData.options = options;
            questionData.correct_answer = correctAnswerFormatted;
          } else if (questionType === 'short_answer') {
            if (!correctAnswer) {
              errors.push(`Qator ${questionNumber}: To'g'ri javob talab qilinadi`);
              errorCount++;
              continue;
            }
            questionData.correct_answer = correctAnswer;
          } else if (questionType === 'formula') {
            if (!formula) {
              errors.push(`Qator ${questionNumber}: Formula talab qilinadi`);
              errorCount++;
              continue;
            }
            questionData.correct_answer = formula;
          } else if (questionType === 'code') {
            if (!code) {
              errors.push(`Qator ${questionNumber}: Kod namunasi talab qilinadi`);
              errorCount++;
              continue;
            }
            questionData.correct_answer = code;
          }

          importedQuestions.push(questionData);
          successCount++;

        } catch (error) {
          errors.push(`Qator ${jsonData.indexOf(row) + 2}: ${error.message || 'Xatolik'}`);
          errorCount++;
        }
      }

      if (importedQuestions.length > 0) {
        // Set imported questions
        setQuestions(importedQuestions);

        // Auto-fill form data if not already filled
        if (!formData.title) {
          setFormData(prev => ({
            ...prev,
            title: `Import qilingan test - ${new Date().toLocaleDateString('uz-UZ')}`
          }));
        }

        message.success(`Muvaffaqiyatli import qilindi! ${successCount} ta savol qo'shildi.`);
        setImportModalVisible(false);
      }

      if (errors.length > 0) {
        let errorMessage = `${errorCount} ta xatolik:\n${errors.slice(0, 3).join('\n')}`;
        if (errors.length > 3) {
          errorMessage += `\n...va yana ${errors.length - 3} ta xatolik`;
        }
        setError(errorMessage);
      }

    } catch (error) {
      console.error('Import error:', error);
      setError('Excel faylini o\'qishda xatolik yuz berdi: ' + error.message);
    } finally {
      setImporting(false);
    }

    // Clear file input
    event.target.value = '';
  };

  // Manual test function for debugging
  const testFormSubmission = async () => {
    console.log('Manual test function called');
    // Create a mock event
    const mockEvent = {
      preventDefault: () => console.log('preventDefault called')
    };
    await handleSubmit(mockEvent);
  };

  const handleSubmit = async (values) => {
    // e.preventDefault(); // Not needed for Ant Design onFinish

    // Check authentication
    if (!currentUser) {
      setError('Siz tizimga kirmagansiz');
      return;
    }

    if (currentUser.role !== 'teacher' && currentUser.role !== 'admin') {
      setError('Faqat o\'qituvchilar test yarata oladi');
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
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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
                    onChange={(value) => setFormData({ ...formData, subject: value })}
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
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                    onChange={(e) => setFormData({ ...formData, time_limit: parseInt(e.target.value) || 30 })}
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
                    onChange={(value) => setFormData({ ...formData, difficulty: value })}
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

      {/* Import Modal */}
      <Modal
        title="Excel fayldan test import qilish"
        open={importModalVisible}
        onCancel={() => setImportModalVisible(false)}
        footer={null}
        width={600}
      >
        <div style={{ padding: '16px 0' }}>
          <Alert
            message="Import qoidalari"
            description={
              <ul style={{ marginBottom: 0, paddingLeft: '20px' }}>
                <li>Excel fayl .xlsx yoki .xls formatida bo'lishi kerak</li>
                <li>Birinchi qator ustun nomlari bo'lishi kerak</li>
                <li>Majburiy ustunlar: Savol matni, Variant A, Variant B, Variant C, Variant D, To'g'ri javob</li>
                <li>To'g'ri javob A, B, C, D harflaridan biri yoki javob matni bo'lishi mumkin</li>
              </ul>
            }
            type="info"
            style={{ marginBottom: '16px' }}
          />

          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleImportFromExcel}
              style={{ display: 'none' }}
              id="excel-file-input"
            />
            <Button
              type="primary"
              size="large"
              icon={<ImportIcon />}
              loading={importing}
              onClick={() => document.getElementById('excel-file-input').click()}
              style={{ marginBottom: '12px' }}
            >
              {importing ? 'Import qilinyapti...' : 'Excel faylni tanlang'}
            </Button>
            <br />
            <Button
              icon={<DownloadOutlined />}
              onClick={downloadSampleTemplate}
              size="small"
            >
              Namuna fayl yuklab olish
            </Button>
          </div>

          {error && (
            <Alert
              message={error}
              type="error"
              style={{ marginTop: '16px' }}
              closable
              onClose={() => setError('')}
            />
          )}
        </div>
      </Modal>

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

