import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Typography,
    Card,
    Button,
    Input,
    Select,
    Form,
    Row,
    Col,
    Space,
    Modal,
    message,
    ConfigProvider,
    InputNumber,
    Checkbox,
    Divider,
} from 'antd';
import {
    PlusOutlined as AddIcon,
    DeleteOutlined as DeleteIcon,
    CheckCircleOutlined as CorrectIcon,
    ArrowLeftOutlined as ArrowBackIcon,
    CameraOutlined as PhotoCameraIcon,
    CloseOutlined as ClearIcon,
    UploadOutlined as ImportIcon,
    DownloadOutlined,
    SaveOutlined,
} from '@ant-design/icons';
import * as XLSX from 'xlsx';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../data/apiService';
import MathSymbols from '../../components/MathSymbols';
import LaTeXPreview from '../../components/LaTeXPreview';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const ContentManagerCreateTest = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const { testId } = useParams();
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [form] = Form.useForm();

    // Questions state
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

    const [mathSymbolsOpen, setMathSymbolsOpen] = useState(false);
    const [currentField, setCurrentField] = useState({ questionIndex: null, field: null });

    useEffect(() => {
        if (testId) {
            loadTestData();
        }
    }, [testId]);

    const loadTestData = async () => {
        try {
            setLoading(true);
            const test = await apiService.getTest(testId);
            setIsEditing(true);

            form.setFieldsValue({
                title: test.title,
                subject: test.subject,
                description: test.description,
                time_limit: test.time_limit,
                difficulty: test.difficulty || 'medium',
                target_grades: typeof test.target_grades === 'string' ? test.target_grades.split(',') : test.target_grades
            });

            // Load questions
            const questionsData = await apiService.getQuestions({ test: testId });
            const list = questionsData.results || questionsData;

            setQuestions(list.map(q => ({
                id: q.id,
                question_text: q.question_text,
                question_type: q.question_type,
                options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options,
                correct_answer: q.correct_answer,
                explanation: q.explanation || '',
                formula: q.formula || '',
                code: q.code || ''
            })));
        } catch (error) {
            console.error('Test yuklashda xatolik:', error);
            message.error('Test ma\'lumotlarini yuklab bo\'lmadi');
        } finally {
            setLoading(false);
        }
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

    const removeQuestion = (index) => {
        if (questions.length > 1) {
            setQuestions(questions.filter((_, i) => i !== index));
        }
    };

    const updateQuestion = (index, field, value) => {
        const newQuestions = [...questions];
        newQuestions[index][field] = value;
        setQuestions(newQuestions);
    };

    const updateOption = (qIndex, oIndex, value) => {
        const newQuestions = [...questions];
        newQuestions[qIndex].options[oIndex].text = value;
        setQuestions(newQuestions);
    };

    const setCorrectAnswer = (qIndex, answer) => {
        const newQuestions = [...questions];
        newQuestions[qIndex].correct_answer = answer;
        setQuestions(newQuestions);
    };

    const handleSubmit = async (values) => {
        // Validation
        if (questions.some(q => !q.question_text || !q.correct_answer)) {
            message.error('Barcha savollar va to\'g\'ri javoblar to\'ldirilishi shart!');
            return;
        }

        try {
            setLoading(true);
            const testData = {
                ...values,
                target_grades: values.target_grades ? values.target_grades.join(',') : '',
                total_questions: questions.length
            };

            let test;
            if (isEditing) {
                test = await apiService.updateTest(testId, testData);
                // Clear old questions
                const oldQuestions = await apiService.getQuestions({ test: testId });
                const oldList = oldQuestions.results || oldQuestions;
                for (const q of oldList) await apiService.deleteQuestion(q.id);
            } else {
                test = await apiService.createTest(testData);
            }

            // Create questions
            for (const q of questions) {
                const qData = new FormData();
                qData.append('test', test.id);
                qData.append('question_text', q.question_text);
                qData.append('question_type', q.question_type);
                qData.append('options', JSON.stringify(q.options));
                qData.append('correct_answer', q.correct_answer);
                qData.append('explanation', q.explanation);
                if (q.formula) qData.append('formula', q.formula);
                if (q.code) qData.append('code', q.code);

                await apiService.createQuestion(qData);
            }

            message.success(isEditing ? 'Test yangilandi!' : 'Yangi test yaratildi!');
            navigate('/content-manager/my-tests');
        } catch (error) {
            console.error('Xatolik:', error);
            message.error('Saqlashda xatolik yuz berdi');
        } finally {
            setLoading(false);
        }
    };

    // Brutalist Switch for Grades
    const GradeSelector = ({ value, onChange }) => {
        const grades = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'];
        return (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {grades.map(grade => (
                    <div
                        key={grade}
                        onClick={() => {
                            const val = value || [];
                            const newValue = val.includes(grade)
                                ? val.filter(v => v !== grade)
                                : [...val, grade];
                            onChange(newValue);
                        }}
                        style={{
                            padding: '8px 16px',
                            border: '3px solid #000',
                            cursor: 'pointer',
                            fontWeight: 900,
                            backgroundColor: (value || []).includes(grade) ? '#000' : '#fff',
                            color: (value || []).includes(grade) ? '#fff' : '#000',
                            boxShadow: (value || []).includes(grade) ? 'none' : '4px 4px 0px #000',
                            transform: (value || []).includes(grade) ? 'translate(2px, 2px)' : 'none',
                            transition: 'all 0.1s'
                        }}
                    >
                        {grade}-SINF
                    </div>
                ))}
            </div>
        );
    };

    return (
        <ConfigProvider theme={{ token: { borderRadius: 0, colorPrimary: '#000' } }}>
            <div style={{ paddingBottom: '100px' }}>
                <div style={{ marginBottom: '40px' }}>
                    <div style={{ display: 'inline-block', backgroundColor: '#000', color: '#fff', padding: '6px 12px', fontWeight: 900, fontSize: '12px', textTransform: 'uppercase', marginBottom: '12px' }}>
                        {isEditing ? 'TAHRIRLASH' : 'YANGI'}
                    </div>
                    <Title level={1} style={{ margin: 0, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-2px' }}>
                        Global Test Yaratish
                    </Title>
                    <div style={{ width: '80px', height: '10px', backgroundColor: '#000', marginTop: '20px' }}></div>
                </div>

                <Form form={form} layout="vertical" onFinish={handleSubmit}>
                    <Row gutter={40}>
                        <Col span={16}>
                            <Card style={{ border: '4px solid #000', boxShadow: '12px 12px 0px #000', marginBottom: '40px' }}>
                                <Title level={4} style={{ fontWeight: 900, textTransform: 'uppercase' }}>Asosiy Ma'lumotlar</Title>
                                <Divider style={{ borderColor: '#000', borderWidth: '2px' }} />

                                <Form.Item name="title" label={<Text strong style={{ textTransform: 'uppercase' }}>Test Nomi</Text>} rules={[{ required: true }]}>
                                    <Input size="large" style={{ border: '3px solid #000', fontWeight: 800 }} placeholder="Masalan: Ona tili va adabiyot 1-qism" />
                                </Form.Item>

                                <Row gutter={16}>
                                    <Col span={12}>
                                        <Form.Item name="subject" label={<Text strong style={{ textTransform: 'uppercase' }}>Fan</Text>} rules={[{ required: true }]}>
                                            <Select size="large" style={{ border: '3px solid #000' }}>
                                                <Option value="Matematika">Matematika</Option>
                                                <Option value="Fizika">Fizika</Option>
                                                <Option value="Ona tili">Ona tili</Option>
                                                <Option value="Ingliz tili">Ingliz tili</Option>
                                                <Option value="Tarix">Tarix</Option>
                                                <Option value="Biologiya">Biologiya</Option>
                                                <Option value="Kimyo">Kimyo</Option>
                                            </Select>
                                        </Form.Item>
                                    </Col>
                                    <Col span={6}>
                                        <Form.Item name="time_limit" label={<Text strong style={{ textTransform: 'uppercase' }}>Vaqt (Daqiqa)</Text>} rules={[{ required: true }]}>
                                            <InputNumber min={1} size="large" style={{ width: '100%', border: '3px solid #000', fontWeight: 800 }} />
                                        </Form.Item>
                                    </Col>
                                    <Col span={6}>
                                        <Form.Item name="difficulty" label={<Text strong style={{ textTransform: 'uppercase' }}>Qiyinchilik</Text>} initialValue="medium">
                                            <Select size="large" style={{ border: '3px solid #000' }}>
                                                <Option value="easy">OSON</Option>
                                                <Option value="medium">O'RTA</Option>
                                                <Option value="hard">QIYIN</Option>
                                            </Select>
                                        </Form.Item>
                                    </Col>
                                </Row>

                                <Form.Item name="description" label={<Text strong style={{ textTransform: 'uppercase' }}>Tavsif (Ixtiyoriy)</Text>}>
                                    <TextArea rows={4} style={{ border: '3px solid #000', fontWeight: 600 }} placeholder="Test haqida qo'shimcha ma'lumot..." />
                                </Form.Item>

                                <Form.Item name="target_grades" label={<Text strong style={{ textTransform: 'uppercase' }}>Mo'ljallangan Sinflar</Text>}>
                                    <GradeSelector />
                                </Form.Item>
                            </Card>

                            <Title level={3} style={{ fontWeight: 900, textTransform: 'uppercase', marginBottom: '24px' }}>Savollar ({questions.length})</Title>

                            {questions.map((q, qIdx) => (
                                <Card
                                    key={qIdx}
                                    style={{
                                        border: '4px solid #000',
                                        boxShadow: '12px 12px 0px #000',
                                        marginBottom: '32px',
                                        position: 'relative',
                                        overflow: 'visible'
                                    }}
                                >
                                    <div style={{ position: 'absolute', left: '-20px', top: '-20px', backgroundColor: '#000', color: '#fff', padding: '10px 20px', fontWeight: 900, fontSize: '18px' }}>
                                        #{qIdx + 1}
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
                                        <Button
                                            danger
                                            icon={<DeleteIcon />}
                                            onClick={() => removeQuestion(qIdx)}
                                            style={{ border: '3px solid #ff4d4f', fontWeight: 900, boxShadow: '4px 4px 0px #000' }}
                                        >
                                            SAVOLNI O'CHIRISH
                                        </Button>
                                    </div>

                                    <Form.Item label={<Text strong style={{ textTransform: 'uppercase' }}>Savol Matni</Text>}>
                                        <TextArea
                                            rows={3}
                                            value={q.question_text}
                                            onChange={(e) => updateQuestion(qIdx, 'question_text', e.target.value)}
                                            style={{ border: '3px solid #000', fontWeight: 700 }}
                                        />
                                    </Form.Item>

                                    <Row gutter={16}>
                                        <Col span={24}>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                                                {q.options.map((opt, oIdx) => (
                                                    <div
                                                        key={oIdx}
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '8px',
                                                            padding: '12px',
                                                            border: '3px solid #000',
                                                            backgroundColor: q.correct_answer === opt.text ? '#f0fdf4' : '#fff',
                                                            boxShadow: '4px 4px 0px #000'
                                                        }}
                                                    >
                                                        <div
                                                            onClick={() => setCorrectAnswer(qIdx, opt.text)}
                                                            style={{
                                                                width: '24px',
                                                                height: '24px',
                                                                border: '3px solid #000',
                                                                cursor: 'pointer',
                                                                backgroundColor: q.correct_answer === opt.text ? '#000' : '#fff',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center'
                                                            }}
                                                        >
                                                            {q.correct_answer === opt.text && <CorrectIcon style={{ color: '#fff' }} />}
                                                        </div>
                                                        <Input
                                                            variant="borderless"
                                                            value={opt.text}
                                                            onChange={(e) => updateOption(qIdx, oIdx, e.target.value)}
                                                            style={{ fontWeight: 800 }}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </Col>
                                    </Row>

                                    <Form.Item label={<Text strong style={{ textTransform: 'uppercase', fontSize: '11px' }}>Tushuntirish (Yechim)</Text>}>
                                        <TextArea
                                            rows={2}
                                            value={q.explanation}
                                            onChange={(e) => updateQuestion(qIdx, 'explanation', e.target.value)}
                                            style={{ border: '2px solid #000', fontWeight: 600 }}
                                        />
                                    </Form.Item>
                                </Card>
                            ))}

                            <Button
                                type="dashed"
                                block
                                size="large"
                                onClick={addQuestion}
                                icon={<AddIcon />}
                                style={{ height: '60px', border: '4px dashed #000', fontWeight: 900, textTransform: 'uppercase' }}
                            >
                                Yangi Savol Qo'shish
                            </Button>
                        </Col>

                        <Col span={8}>
                            <div style={{ position: 'sticky', top: '24px' }}>
                                <Card style={{ border: '4px solid #000', boxShadow: '12px 12px 0px #000' }}>
                                    <Title level={4} style={{ fontWeight: 900 }}>AMALLAR</Title>
                                    <Divider style={{ borderColor: '#000' }} />

                                    <Button
                                        type="primary"
                                        block
                                        size="large"
                                        loading={loading}
                                        icon={<SaveOutlined />}
                                        onClick={() => form.submit()}
                                        style={{ height: '60px', backgroundColor: '#000', border: '3px solid #000', fontWeight: 900, boxShadow: '6px 6px 0px rgba(0,0,0,0.1)', marginBottom: '16px' }}
                                    >
                                        TESTNI SAQLASH
                                    </Button>

                                    <Button
                                        block
                                        size="large"
                                        icon={<ArrowBackIcon />}
                                        onClick={() => navigate('/content-manager/my-tests')}
                                        style={{ height: '60px', border: '3px solid #000', fontWeight: 900 }}
                                    >
                                        BEKOR QILISH
                                    </Button>

                                    <Divider style={{ borderColor: '#000' }} />

                                    <div style={{ padding: '16px', backgroundColor: '#f8fafc', border: '2px solid #000' }}>
                                        <Text strong>STATISTIKA:</Text>
                                        <div style={{ marginTop: '8px' }}>
                                            <div>Savollar: <Text strong>{questions.length} ta</Text></div>
                                            <div>Davomiyligi: <Text strong>{form.getFieldValue('time_limit') || 0} daqiqa</Text></div>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        </Col>
                    </Row>
                </Form>
            </div>
        </ConfigProvider>
    );
};

export default ContentManagerCreateTest;
