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
    ConfigProvider,
    InputNumber,
    Checkbox,
    Divider,
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
    DownloadOutlined,
    SaveOutlined,
    FileSearchOutlined as PreviewIcon,
} from '@ant-design/icons';
import * as XLSX from 'xlsx';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../data/apiService';
import MathSymbols from '../../components/MathSymbols';
import LaTeXPreview from '../../components/LaTeXPreview';
import { SUBJECTS } from '../../data/subjects';

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
    const [importModalOpen, setImportModalOpen] = useState(false);
    const [reviewModalOpen, setReviewModalOpen] = useState(false);
    const [importedQuestions, setImportedQuestions] = useState([]);
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

    const handleExportExcel = () => {
        if (questions.length === 0) {
            message.warning("Export qilish uchun savollar yo'q!");
            return;
        }

        const data = questions.map((q, index) => {
            const letterMap = ['A', 'B', 'C', 'D'];
            let correctLetter = '';

            // Find which option matches the correct_answer text
            const correctIndex = q.options.findIndex(opt => opt.text === q.correct_answer);
            if (correctIndex !== -1) {
                correctLetter = letterMap[correctIndex];
            }

            return {
                '№': index + 1,
                'Savol matni': q.question_text,
                'A': q.options[0]?.text || '',
                'B': q.options[1]?.text || '',
                'C': q.options[2]?.text || '',
                'D': q.options[3]?.text || '',
                'To\'g\'ri javob (A, B, C yoki D)': correctLetter,
                'Tushuntirish': q.explanation || '',
                'Formula': q.formula || '',
                'Kod': q.code || ''
            };
        });

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Savollar");

        const wscols = [
            { wch: 5 }, { wch: 50 }, { wch: 25 }, { wch: 25 }, { wch: 25 }, { wch: 25 }, { wch: 25 }, { wch: 30 }, { wch: 20 }, { wch: 20 }
        ];
        ws['!cols'] = wscols;

        XLSX.writeFile(wb, `${form.getFieldValue('title') || 'test'}_savollari.xlsx`);
        message.success("Test Excel formatida (A, B, C, D) yuklab olindi!");
    };

    const handleImportFile = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const dataRaw = new Uint8Array(evt.target.result);
                const wb = XLSX.read(dataRaw, { type: 'array' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws);

                if (data.length === 0) {
                    message.error("Fayl bo'sh yoki ma'lumot topilmadi");
                    return;
                }

                const newQuestions = data.map((item, index) => {
                    const options = [
                        { text: String(item['A'] || item['Variant A'] || '').trim(), image: null },
                        { text: String(item['B'] || item['Variant B'] || '').trim(), image: null },
                        { text: String(item['C'] || item['Variant C'] || '').trim(), image: null },
                        { text: String(item['D'] || item['Variant D'] || '').trim(), image: null }
                    ];

                    const correctKey = String(item['To\'g\'ri javob (A, B, C yoki D)'] || item['Javob'] || item['To\'g\'ri javob'] || '').trim().toUpperCase();
                    let correctAnswer = '';

                    if (correctKey === 'A') correctAnswer = options[0].text;
                    else if (correctKey === 'B') correctAnswer = options[1].text;
                    else if (correctKey === 'C') correctAnswer = options[2].text;
                    else if (correctKey === 'D') correctAnswer = options[3].text;
                    else correctAnswer = correctKey;

                    return {
                        key: index,
                        question_text: item['Savol matni'] || item['Savol'] || '',
                        question_type: 'multiple_choice',
                        options,
                        correct_answer: correctAnswer,
                        explanation: item['Tushuntirish'] || '',
                        formula: item['Formula'] || '',
                        code: item['Kod'] || ''
                    };
                });

                setImportedQuestions(newQuestions);
                setImportModalOpen(false);
                setReviewModalOpen(true);
            } catch (error) {
                console.error("Import xatosi:", error);
                message.error("Faylni o'qishda muammo yuz berdi. Iltimos formatni tekshiring.");
            }
        };
        reader.readAsArrayBuffer(file);
        e.target.value = '';
    };

    const confirmImport = () => {
        if (importedQuestions.length === 0) {
            message.warning("Import qilish uchun savollar yo'q");
            return;
        }

        // Clean internal keys used for table
        const cleanedQuestions = importedQuestions.map(({ key, ...rest }) => rest);

        // Merge or replace? Let's replace they can always add more
        setQuestions(cleanedQuestions);
        setReviewModalOpen(false);
        setImportedQuestions([]);

        window.dispatchEvent(new CustomEvent('testAction', {
            detail: {
                title: "Test savollari yuklandi",
                message: `${cleanedQuestions.length} ta savol asosiy tahrirchiga o'tkazildi`,
                icon: 'auto_awesome'
            }
        }));
    };

    const removeFromImport = (key) => {
        setImportedQuestions(importedQuestions.filter(q => q.key !== key));
    };

    const handleDownloadTemplate = () => {
        const templateData = [
            {
                '№': 1,
                'Savol matni': "O'zbekistonning poytaxti qaysi shahar?",
                'A': "Toshkent",
                'B': "Samarqand",
                'C': "Buxoro",
                'D': "Xiva",
                'To\'g\'ri javob (A, B, C yoki D)': "A",
                'Tushuntirish': "O'zbekiston Respublikasi poytaxti Toshkent shahridir.",
                'Formula': "",
                'Kod': ""
            },
            {
                '№': 2,
                'Savol matni': "2 + 2 = ?",
                'A': "3",
                'B': "4",
                'C': "5",
                'D': "6",
                'To\'g\'ri javob (A, B, C yoki D)': "B",
                'Tushuntirish': "Arifmetik amal natijasi 4 ga teng.",
                'Formula': "2+2=4",
                'Kod': ""
            }
        ];

        const ws = XLSX.utils.json_to_sheet(templateData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Template");

        const instrData = [
            ['KO\'RSATMA'],
            ['1. Barcha savollar 4 ta variantli bo\'lishi shart (A, B, C, D).'],
            ['2. To\'g\'ri javob ustuniga javob matnini emas, faqat mos harfni yozing (A, B, C yoki D).'],
            ['3. Agar variantlar kamroq bo\'lsa, qolganlarini bo\'sh qoldiring.'],
            ['4. Formula va Kod ustunlariga ixtiyoriy ma\'lumot kiritishingiz mumkin.']
        ];
        const wsInstr = XLSX.utils.aoa_to_sheet(instrData);
        XLSX.utils.book_append_sheet(wb, wsInstr, "Yo'riqnoma");

        XLSX.writeFile(wb, "test_shabloni_A_B_C_D.xlsx");
        message.info("A, B, C, D formatidagi shablon yuklab olindi!");
    };

    const handleSubmit = async (values) => {
        // Validation
        if (questions.some(q => !q.question_text || !q.correct_answer)) {
            window.dispatchEvent(new CustomEvent('saveError', {
                detail: {
                    title: "To'ldirilmagan maydonlar",
                    message: "Barcha savollarni to'ldiring",
                    icon: 'warning'
                }
            }));
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

            // Trigger header notification
            window.dispatchEvent(new CustomEvent('testAction', {
                detail: {
                    title: isEditing ? "Global test yangilandi" : "Yangi global test yaratildi",
                    message: values.title,
                    icon: isEditing ? 'edit' : 'plus'
                }
            }));

            navigate('/content-manager/my-tests');
        } catch (error) {
            console.error('Xatolik:', error);

            window.dispatchEvent(new CustomEvent('saveError', {
                detail: {
                    title: "Xatolik yuz berdi",
                    message: "Testni saqlash imkonsiz",
                    icon: 'error'
                }
            }));
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
                                            <Select size="large" style={{ border: '3px solid #000' }} showSearch placeholder="Fanni tanlang">
                                                {SUBJECTS.map(subject => (
                                                    <Option key={subject} value={subject}>{subject}</Option>
                                                ))}
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
                                                                width: '32px',
                                                                height: '32px',
                                                                border: '3px solid #000',
                                                                cursor: 'pointer',
                                                                backgroundColor: q.correct_answer === opt.text ? '#000' : '#fff',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                fontWeight: 900,
                                                                color: q.correct_answer === opt.text ? '#fff' : '#000',
                                                                fontSize: '16px',
                                                                flexShrink: 0
                                                            }}
                                                        >
                                                            {['A', 'B', 'C', 'D'][oIdx]}
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
                                        style={{ height: '60px', border: '3px solid #000', fontWeight: 900, marginBottom: '16px' }}
                                    >
                                        BEKOR QILISH
                                    </Button>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                        <Button
                                            block
                                            size="large"
                                            icon={<DownloadOutlined />}
                                            onClick={handleExportExcel}
                                            style={{ height: '50px', border: '3px solid #000', fontWeight: 900, fontSize: '10px' }}
                                        >
                                            EXPORT (EXCEL)
                                        </Button>
                                        <Button
                                            block
                                            size="large"
                                            icon={<ImportIcon />}
                                            onClick={() => setImportModalOpen(true)}
                                            style={{ height: '50px', border: '3px solid #000', fontWeight: 900, fontSize: '10px', backgroundColor: '#f0fdf4' }}
                                        >
                                            IMPORT (CSV/EXCEL)
                                        </Button>
                                    </div>
                                    <input
                                        type="file"
                                        id="excel-import-input"
                                        style={{ display: 'none' }}
                                        accept=".xlsx, .xls, .csv"
                                        onChange={handleImportFile}
                                    />

                                    <Modal
                                        title={<span style={{ fontWeight: 900, textTransform: 'uppercase' }}>Import Namuna (CSV/Excel)</span>}
                                        open={importModalOpen}
                                        onCancel={() => setImportModalOpen(false)}
                                        width={800}
                                        footer={[
                                            <Button key="cancel" onClick={() => setImportModalOpen(false)} style={{ border: '2px solid #000', fontWeight: 700 }}>BEKOR QILISH</Button>,
                                            <Button
                                                key="download"
                                                icon={<DownloadOutlined />}
                                                onClick={handleDownloadTemplate}
                                                style={{ border: '2px solid #000', fontWeight: 700 }}
                                            >
                                                SHABLONNI YUKLASH
                                            </Button>,
                                            <Button
                                                key="upload"
                                                type="primary"
                                                icon={<ImportIcon />}
                                                onClick={() => document.getElementById('excel-import-input').click()}
                                                style={{ backgroundColor: '#000', border: '2px solid #000', fontWeight: 700 }}
                                            >
                                                FAYLNI TANLASH
                                            </Button>
                                        ]}
                                    >
                                        <div style={{ padding: '20px 0' }}>
                                            <Text strong style={{ display: 'block', marginBottom: '10px' }}>CSV YOKI EXCEL FAYL QUYIDAGI FORMATDA BO'LISHI SHART:</Text>
                                            <div style={{ overflowX: 'auto', border: '2px solid #000', marginBottom: '20px' }}>
                                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
                                                    <thead>
                                                        <tr style={{ backgroundColor: '#f4f4f5' }}>
                                                            <th style={{ border: '1px solid #000', padding: '8px' }}>Savol matni</th>
                                                            <th style={{ border: '1px solid #000', padding: '8px' }}>A</th>
                                                            <th style={{ border: '1px solid #000', padding: '8px' }}>B</th>
                                                            <th style={{ border: '1px solid #000', padding: '8px' }}>C</th>
                                                            <th style={{ border: '1px solid #000', padding: '8px' }}>D</th>
                                                            <th style={{ border: '1px solid #000', padding: '8px' }}>Javob</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        <tr>
                                                            <td style={{ border: '1px solid #000', padding: '8px' }}>2+2 nechaga teng?</td>
                                                            <td style={{ border: '1px solid #000', padding: '8px' }}>3</td>
                                                            <td style={{ border: '1px solid #000', padding: '8px' }}>4</td>
                                                            <td style={{ border: '1px solid #000', padding: '8px' }}>5</td>
                                                            <td style={{ border: '1px solid #000', padding: '8px' }}>6</td>
                                                            <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 900 }}>B</td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                            <ul style={{ paddingLeft: '20px', fontWeight: 600 }}>
                                                <li>CSV fayl ishlatishingiz mumkin (Vergul bilan ajratilgan).</li>
                                                <li>Javob ustuniga faqat <Text code>A</Text>, <Text code>B</Text>, <Text code>C</Text> yoki <Text code>D</Text> harfini yozing.</li>
                                                <li>YUKLANGAN FAYLNI KEYINGI BOSQICHDA TAHRIRLASHINGIZ MUMKIN.</li>
                                            </ul>
                                        </div>
                                    </Modal>

                                    {/* Review Modal */}
                                    <Modal
                                        title={
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <PreviewIcon style={{ fontSize: '24px' }} />
                                                <span style={{ fontWeight: 900, textTransform: 'uppercase' }}>Savollarni Tekshirish va Saralash</span>
                                            </div>
                                        }
                                        open={reviewModalOpen}
                                        onCancel={() => setReviewModalOpen(false)}
                                        width={1000}
                                        style={{ top: 20 }}
                                        footer={[
                                            <div key="footer-info" style={{ float: 'left', lineHeight: '32px', fontWeight: 700 }}>
                                                Jami: {importedQuestions.length} ta savol
                                            </div>,
                                            <Button key="cancel" onClick={() => setReviewModalOpen(false)} style={{ border: '2px solid #000', fontWeight: 700 }}>BEKOR QILISH</Button>,
                                            <Button
                                                key="submit"
                                                type="primary"
                                                onClick={confirmImport}
                                                style={{ backgroundColor: '#000', border: '2px solid #000', fontWeight: 900, textTransform: 'uppercase' }}
                                            >
                                                TAYYOR (EDITORGA O'TKAZISH)
                                            </Button>
                                        ]}
                                    >
                                        <div style={{ padding: '10px 0' }}>
                                            <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#fffbe6', border: '2px solid #ffe58f', borderRadius: '4px' }}>
                                                <Text strong>Eslatma:</Text> Bu yerda keraksiz yoki noto'g'ri savollarni o'chirib yuboring. Tayyor tugmasini bossangiz barcha savollar asosiy tahrirlash oynasiga o'tadi.
                                            </div>

                                            <Table
                                                dataSource={importedQuestions}
                                                pagination={{ pageSize: 5 }}
                                                scroll={{ y: 400 }}
                                                bordered
                                                style={{ border: '2px solid #000' }}
                                                columns={[
                                                    {
                                                        title: '№',
                                                        dataIndex: 'key',
                                                        key: 'num',
                                                        width: 60,
                                                        render: (val, record, index) => index + 1
                                                    },
                                                    {
                                                        title: 'Savol matni',
                                                        dataIndex: 'question_text',
                                                        key: 'text',
                                                        render: (text) => <Text strong style={{ fontSize: '13px' }}>{text}</Text>
                                                    },
                                                    {
                                                        title: 'Variantlar',
                                                        key: 'options',
                                                        width: 300,
                                                        render: (_, record) => (
                                                            <div style={{ fontSize: '11px' }}>
                                                                {record.options.map((opt, i) => (
                                                                    <div key={i} style={{ color: record.correct_answer === opt.text ? '#16a34a' : '#000', fontWeight: record.correct_answer === opt.text ? 800 : 400 }}>
                                                                        {['A', 'B', 'C', 'D'][i]}) {opt.text}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )
                                                    },
                                                    {
                                                        title: 'Amal',
                                                        key: 'action',
                                                        width: 100,
                                                        align: 'center',
                                                        render: (_, record) => (
                                                            <Button
                                                                danger
                                                                type="text"
                                                                icon={<DeleteIcon />}
                                                                onClick={() => removeFromImport(record.key)}
                                                                style={{ fontWeight: 800 }}
                                                            />
                                                        )
                                                    }
                                                ]}
                                            />
                                        </div>
                                    </Modal>

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
