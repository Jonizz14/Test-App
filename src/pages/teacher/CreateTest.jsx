import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Typography,
  Box,
  TextField,
  Button,
  Paper,
  Grid,
  Alert,
  Card,
  CardContent,
  RadioGroup,
  FormControlLabel,
  Radio,
  IconButton,
  Divider,
  MenuItem,
  FormControl,
  FormLabel,
  FormGroup,
  FormControlLabel as CheckboxLabel,
  Checkbox,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  CheckCircle as CorrectIcon,
  ArrowBack as ArrowBackIcon,
  PhotoCamera as PhotoCameraIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
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
    <Box sx={{
      width: '100%',
      py: 4,
      backgroundColor: '#ffffff'
    }}>
      <Box sx={{
        mb: 6,
        pb: 4,
        borderBottom: '1px solid #e2e8f0'
      }}>
        <Typography sx={{
          fontSize: '2.5rem',
          fontWeight: 700,
          color: '#1e293b',
          mb: 2
        }}>
          {isEditing ? 'Testni tahrirlash' : 'Yangi test yaratish'}
        </Typography>
        <Typography sx={{
          fontSize: '1.125rem',
          color: '#64748b',
          fontWeight: 400
        }}>
          {isEditing ? 'Mavjud testni o\'zgartiring va yangilang' : 'Yangi test yarating va o\'quvchilarga taqdim eting'}
        </Typography>
      </Box>

      <Card sx={{
        width: '100%',
        minHeight: '600px',
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        '&:hover': {
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
        }
      }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <Box sx={{ p: 4 }} component="form" onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                required
                fullWidth
                label="Test nomi"
                name="title"
                value={formData.title}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                required
                select
                fullWidth
                label="Fan"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                defaultValue="Matematika"
              >
                <MenuItem value="Matematika">Matematika</MenuItem>
                <MenuItem value="O'zbek tili">O'zbek tili</MenuItem>
                <MenuItem value="Ingliz tili">Ingliz tili</MenuItem>
                <MenuItem value="Rus tili">Rus tili</MenuItem>
                <MenuItem value="Fizika">Fizika</MenuItem>
                <MenuItem value="Kimyo">Kimyo</MenuItem>
                <MenuItem value="Biologiya">Biologiya</MenuItem>
                <MenuItem value="Tarix">Tarix</MenuItem>
                <MenuItem value="Geografiya">Geografiya</MenuItem>
                <MenuItem value="Adabiyot">Adabiyot</MenuItem>
                <MenuItem value="Informatika">Informatika</MenuItem>
                <MenuItem value="Tasviriy san'at">Tasviriy san'at</MenuItem>
                <MenuItem value="Musiqa">Musiqa</MenuItem>
                <MenuItem value="Jismoniy tarbiya">Jismoniy tarbiya</MenuItem>
                <MenuItem value="Texnologiya">Texnologiya</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Tavsif"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Test mazmuni haqida qisqa ma'lumot"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                required
                fullWidth
                type="number"
                label="daqiqa"
                name="time_limit"
                value={formData.time_limit}
                onChange={handleChange}
                inputProps={{ min: 5, max: 180 }}
                helperText="Vaqt limiti (daqiqa)"
                placeholder="30"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                select
                fullWidth
                label="Test qiyinligi"
                name="difficulty"
                value={formData.difficulty}
                onChange={handleChange}
              >
                <MenuItem value="easy">Oson</MenuItem>
                <MenuItem value="medium">O'rtacha</MenuItem>
                <MenuItem value="hard">Qiyin</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12}>
              <FormControl component="fieldset" fullWidth>
                <FormLabel component="legend">
                  Maqsadlangan sinf guruhlari (barcha guruhlar uchun test yaratish uchun hech narsa tanlamang)
                </FormLabel>
                <FormGroup row>
                  {[5, 6, 7, 8, 9, 10, 11].flatMap((grade) =>
                    [1, 2, 3, 4].map((num) => {
                      const classGroup = `${grade}-${String(num).padStart(2, '0')}`;
                      return (
                        <FormControlLabel
                          key={classGroup}
                          control={
                            <Checkbox
                              checked={formData.target_grades.includes(classGroup)}
                              onChange={() => handleGradeChange(classGroup)}
                              sx={{
                                color: currentUser.curator_class === classGroup ? 'warning.main' : 'primary.main',
                                '&.Mui-checked': {
                                  color: currentUser.curator_class === classGroup ? 'warning.main' : 'primary.main',
                                }
                              }}
                            />
                          }
                          label={classGroup}
                        />
                      );
                    })
                  )}
                </FormGroup>
              </FormControl>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          <Typography variant="h5" gutterBottom>
            Savollar ({questions.length})
          </Typography>

          {questions.map((question, index) => (
            <Card key={index} sx={{ mb: 3 }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">Savol {index + 1}</Typography>
                  <IconButton
                    color="error"
                    onClick={() => removeQuestion(index)}
                    disabled={questions.length === 1}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2" sx={{ flex: 1 }}>
                      Savol matni
                    </Typography>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => handleOpenMathSymbols(index, 'question_text')}
                      sx={{
                        minWidth: 'auto',
                        px: 2,
                        py: 0.5,
                        fontSize: '0.75rem',
                        textTransform: 'none'
                      }}
                    >
                      🧮 Belgilar
                    </Button>
                  </Box>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    value={question.question_text}
                    onChange={(e) => updateQuestion(index, 'question_text', e.target.value)}
                    placeholder="Savol matnini kiriting... (LaTeX uchun $...$ yoki $$...$$ dan foydalaning)"
                  />
                  {question.question_text && (
                    <Paper sx={{
                      p: 2,
                      mt: 1,
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0'
                    }}>
                      <Typography variant="body2" sx={{ mb: 1, color: '#64748b', fontWeight: 500 }}>
                        LaTeX ko'rinishi:
                      </Typography>
                      <LaTeXPreview text={question.question_text} />
                    </Paper>
                  )}
                </Box>

                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={12}>
                    <TextField
                      select
                      fullWidth
                      label="Savol turi"
                      value={question.question_type}
                      onChange={(e) => updateQuestion(index, 'question_type', e.target.value)}
                    >
                      <MenuItem value="multiple_choice">Ko'p variantli</MenuItem>
                      <MenuItem value="short_answer">Ochiq javob</MenuItem>
                      <MenuItem value="formula">Formula</MenuItem>
                      <MenuItem value="code">Kod</MenuItem>
                    </TextField>
                  </Grid>
                </Grid>

                {question.question_type === 'multiple_choice' && (
                  <>
                    <Typography variant="subtitle1" gutterBottom>
                      Variantlar (A, B, C, D):
                    </Typography>

                    {question.options.map((option, optionIndex) => (
                      <Box key={optionIndex} sx={{ mb: 2, p: 2, border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                        <Box display="flex" alignItems="center" sx={{ mb: 1 }}>
                          <IconButton
                            size="small"
                            color={question.correct_answer === option.text ? "success" : "default"}
                            onClick={() => toggleCorrectAnswer(index, optionIndex)}
                            sx={{ mr: 1 }}
                          >
                            <CorrectIcon />
                          </IconButton>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                            <TextField
                              size="small"
                              value={option.text}
                              onChange={(e) => updateQuestionOption(index, optionIndex, e.target.value)}
                              placeholder={`Variant ${String.fromCharCode(65 + optionIndex)} (LaTeX uchun $...$)`}
                              sx={{ flex: 1 }}
                            />
                            <IconButton
                              size="small"
                              onClick={() => handleOpenMathSymbols(index, `option_${optionIndex}`)}
                              sx={{ p: 0.5 }}
                            >
                              🧮
                            </IconButton>
                            <IconButton
                              size="small"
                              component="label"
                              sx={{ p: 0.5 }}
                            >
                              <PhotoCameraIcon />
                              <input
                                type="file"
                                accept="image/*"
                                hidden
                                onChange={(e) => {
                                  const file = e.target.files[0];
                                  if (file) {
                                    handleOptionImageUpload(index, optionIndex, file);
                                  }
                                }}
                              />
                            </IconButton>
                            {option.image && (
                              <IconButton
                                size="small"
                                onClick={() => removeOptionImage(index, optionIndex)}
                                sx={{ p: 0.5, color: 'error.main' }}
                              >
                                <ClearIcon />
                              </IconButton>
                            )}
                          </Box>
                        </Box>

                        {/* Image Preview */}
                        {option.image && (
                          <Box sx={{ mb: 1 }}>
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
                          </Box>
                        )}

                        {/* LaTeX Preview */}
                        {option.text && option.text.trim() && (
                          <Paper sx={{
                            p: 1.5,
                            backgroundColor: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            borderRadius: '4px'
                          }}>
                            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500, mb: 0.5, display: 'block' }}>
                              Ko'rinishi:
                            </Typography>
                            <LaTeXPreview text={option.text} sx={{ fontSize: '0.9rem' }} />
                          </Paper>
                        )}
                      </Box>
                    ))}

                    <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                      To'g'ri javobni belgilash uchun checkbox belgisini bosing
                    </Typography>
                  </>
                )}

                {question.question_type === 'short_answer' && (
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Typography variant="body2" sx={{ flex: 1 }}>
                        To'g'ri javob
                      </Typography>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleOpenMathSymbols(index, 'correct_answer')}
                        sx={{
                          minWidth: 'auto',
                          px: 2,
                          py: 0.5,
                          fontSize: '0.75rem',
                          textTransform: 'none'
                        }}
                      >
                        🧮 Belgilar
                      </Button>
                    </Box>
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      value={question.correct_answer}
                      onChange={(e) => updateQuestion(index, 'correct_answer', e.target.value)}
                      placeholder="O'quvchi javob berishi kerak bo'lgan to'g'ri javob (LaTeX uchun $...$ dan foydalaning)"
                    />
                    {question.correct_answer && (
                      <Paper sx={{
                        p: 2,
                        mt: 1,
                        backgroundColor: '#f8fafc',
                        border: '1px solid #e2e8f0'
                      }}>
                        <Typography variant="body2" sx={{ mb: 1, color: '#64748b', fontWeight: 500 }}>
                          Javob ko'rinishi:
                        </Typography>
                        <LaTeXPreview text={question.correct_answer} />
                      </Paper>
                    )}
                  </Box>
                )}

                {question.question_type === 'formula' && (
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Typography variant="body2" sx={{ flex: 1 }}>
                        Formula
                      </Typography>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleOpenMathSymbols(index, 'formula')}
                        sx={{
                          minWidth: 'auto',
                          px: 2,
                          py: 0.5,
                          fontSize: '0.75rem',
                          textTransform: 'none'
                        }}
                      >
                        🧮 Belgilar
                      </Button>
                    </Box>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      value={question.formula}
                      onChange={(e) => updateQuestion(index, 'formula', e.target.value)}
                      placeholder="Matematik formulani kiriting (LaTeX: \frac{a}{b}, x^2, \sqrt{x}, etc.)"
                    />
                    {question.formula && (
                      <Paper sx={{
                        p: 2,
                        mt: 1,
                        backgroundColor: '#f8fafc',
                        border: '1px solid #e2e8f0'
                      }}>
                        <Typography variant="body2" sx={{ mb: 1, color: '#64748b', fontWeight: 500 }}>
                          Formula ko'rinishi:
                        </Typography>
                        <LaTeXPreview text={question.formula} />
                      </Paper>
                    )}
                  </Box>
                )}

                {question.question_type === 'code' && (
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="Kod namunasi"
                    value={question.code}
                    onChange={(e) => updateQuestion(index, 'code', e.target.value)}
                    placeholder="Kod namunasi yozing"
                    sx={{ mb: 2, fontFamily: 'monospace' }}
                    InputProps={{
                      style: { fontFamily: 'monospace' }
                    }}
                  />
                )}

                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Tushuntirish (ixtiyoriy)"
                  value={question.explanation}
                  onChange={(e) => updateQuestion(index, 'explanation', e.target.value)}
                  sx={{ mt: 2 }}
                />
              </CardContent>
            </Card>
          ))}

          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={addQuestion}
            sx={{ mb: 3 }}
          >
            Savol qo'shish
          </Button>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              sx={{ flex: 1 }}
            >
              {loading ? (isEditing ? 'Yangilanmoqda...' : 'Yaratilmoqda...') : (isEditing ? 'Testni yangilash' : 'Test yaratish')}
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate('/teacher/my-tests')}
              sx={{ flex: 1 }}
            >
              Bekor qilish
            </Button>
          </Box>
        </Box>
      </Card>

      {/* Math Symbols Dialog */}
      <MathSymbols
        open={mathSymbolsOpen}
        onClose={() => setMathSymbolsOpen(false)}
        onSymbolSelect={handleSymbolSelect}
      />
    </Box>
  );
};

export default CreateTest;

