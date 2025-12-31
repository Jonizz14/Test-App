import React, { useState, useEffect, useRef } from 'react';
import 'animate.css';
import {
  Table,
  Card,
  Button,
  Tag,
  Alert,
  Modal,
  Typography,
  Space,
  Popconfirm,
  Input,
  Avatar,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  SearchOutlined,
  InfoCircleOutlined,
  DownloadOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import apiService from '../../data/apiService';
import * as XLSX from 'xlsx';

const { Title, Text } = Typography;

const ManageTeachers = () => {
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState([]);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [importing, setImporting] = useState(false);
  const [pageSize, setPageSize] = useState(10);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      // Load teachers from API
      const allUsers = await apiService.getUsers();
      const allTeachers = allUsers.filter((user) => user.role === 'teacher');
      setTeachers(allTeachers);

      // Load tests
      const allTests = await apiService.getTests();
      setTests(allTests);
    } catch (error) {
      console.error('Failed to load data:', error);
      setError('Ma\'lumotlarni yuklashda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const generateTeacherId = (firstName, lastName, randomDigits) => {
    const lastNameUpper = lastName.toUpperCase().replace("'", '');
    const firstNameUpper = firstName.toUpperCase().replace("'", '');
    return `${lastNameUpper}${firstNameUpper}USTOZ${randomDigits}@test`;
  };

  const generateTeacherUsername = (firstName, lastName) => {
    const lastNameLower = lastName.toLowerCase();
    const firstNameInitial = firstName.charAt(0).toLowerCase();
    return `${lastNameLower}${firstNameInitial}oqituvchi`;
  };

  const generateTeacherEmail = (firstName, lastName) => {
    const username = generateTeacherUsername(firstName, lastName);
    return `${username}@teacher.testplatform.com`;
  };

  const handleExportToExcel = () => {
    const exportData = teachers.map((teacher, index) => ({
      '№': index + 1,
      'Ism': teacher.name || '',
      'Familiya': teacher.name ? teacher.name.split(' ').slice(1).join(' ') : '',
      'Fanlar': teacher.subjects ? teacher.subjects.join(', ') : '',
      'Kurator': teacher.is_curator ? 'Ha' : 'Yo\'q',
      'Kurator sinfi': teacher.curator_class || '',
      'Testlar soni': tests.filter((test) => test.teacher === teacher.id).length,
      'Display ID': teacher.display_id || teacher.username || '',
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const colWidths = [
      { wch: 5 }, // №
      { wch: 15 }, // Ism
      { wch: 15 }, // Familiya
      { wch: 20 }, // Fanlar
      { wch: 10 }, // Kurator
      { wch: 15 }, // Kurator sinfi
      { wch: 12 }, // Testlar soni
      { wch: 20 }, // Display ID
    ];
    ws['!cols'] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'O\'qituvchilar');

    const currentDate = new Date().toISOString().split('T')[0];
    const filename = `oqituvchilar_${currentDate}.xlsx`;

    XLSX.writeFile(wb, filename);
    setExportModalVisible(false);
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

      let successCount = 0;
      let errorCount = 0;
      const errors = [];

      for (const row of jsonData) {
        try {
          // Handle teacher import format: №, Ism, Familiya, Fanlar, Kurator, Kurator sinfi
          const rowIndex = jsonData.indexOf(row) + 2;

          // Get values - could be by column name or by position
          let firstName, lastName, subjects, isCurator, curatorClass;

          if (row.Ism && row.Familiya && row.Fanlar) {
            // Named columns
            firstName = row.Ism;
            lastName = row.Familiya;
            subjects = row.Fanlar;
            isCurator = row.Kurator ? (row.Kurator.toLowerCase() === 'ha' || row.Kurator === '1') : false;
            curatorClass = row['Kurator sinfi'] || '';
          } else {
            // Try positional access
            const values = Object.values(row);
            if (values.length >= 5) {
              firstName = values[1]; // Index 1 = Ism
              lastName = values[2];  // Index 2 = Familiya
              subjects = values[3];  // Index 3 = Fanlar
              isCurator = values[4] ? (String(values[4]).toLowerCase() === 'ha' || values[4] === '1') : false;
              curatorClass = values[5] || ''; // Index 5 = Kurator sinfi
            }
          }

          // Validate required fields
          if (!firstName || !lastName || !subjects) {
            errors.push(`Qator ${rowIndex}: Ism, Familiya va Fanlar maydonlari majburiy`);
            errorCount++;
            continue;
          }

          const fullName = `${firstName} ${lastName}`;
          const subjectsArray = subjects.split(',').map(s => s.trim()).filter(s => s);

          // Generate credentials
          const randomDigits = Math.floor(Math.random() * 900) + 100;
          const displayId = generateTeacherId(firstName, lastName, randomDigits);
          const username = generateTeacherUsername(firstName, lastName);
          const email = generateTeacherEmail(firstName, lastName);

          // Check if teacher already exists
          const existingTeacher = teachers.find(t => t.username === username);
          if (existingTeacher) {
            errors.push(`Qator ${rowIndex}: ${fullName} - bu o'qituvchi allaqachon mavjud`);
            errorCount++;
            continue;
          }

          // Create teacher
          const teacherData = {
            email: email,
            password: 'temp_password',
            name: fullName,
            role: 'teacher',
            subjects: subjectsArray,
            is_curator: isCurator,
            curator_class: isCurator ? curatorClass : '',
          };

          await apiService.post('/users/', teacherData);
          successCount++;

        } catch (error) {
          errors.push(`Qator ${jsonData.indexOf(row) + 2}: ${error.message || 'Xatolik'}`);
          errorCount++;
        }
      }

      // Reload data
      const allUsers = await apiService.getUsers();
      const allTeachers = allUsers.filter((user) => user.role === 'teacher');
      setTeachers(allTeachers);

      // Show results
      let message = `Import yakunlandi!\nMuvaffaqiyatli: ${successCount}\nXatoliklar: ${errorCount}`;
      if (errors.length > 0) {
        message += '\n\nXatoliklar:\n' + errors.slice(0, 5).join('\n');
        if (errors.length > 5) {
          message += `\n...va yana ${errors.length - 5} ta xatolik`;
        }
      }
      setSuccess(message);
      setImportModalVisible(false);

    } catch (error) {
      console.error('Import error:', error);
      setError('Excel faylini o\'qishda xatolik yuz berdi: ' + error.message);
    } finally {
      setImporting(false);
    }

    // Clear file input
    event.target.value = '';
  };

  const handleDelete = async (teacherId) => {
    try {
      await apiService.deleteUser(teacherId);
      setTeachers(teachers.filter((teacher) => teacher.id !== teacherId));
      setSuccess('O\'qituvchi muvaffaqiyatli o\'chirildi!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Failed to delete teacher:', error);
      setError('O\'qituvchini o\'chirishda xatolik yuz berdi');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleEditClick = (teacher) => {
    navigate(`/admin/edit-teacher/${teacher.id}`);
  };

  // Filter teachers based on search term
  const filteredTeachers = teachers.filter((teacher) => {
    if (!searchTerm) return true;

    const searchLower = searchTerm.toLowerCase();
    const name = teacher.name || '';
    const displayId = teacher.display_id || teacher.username || '';

    return (
      name.toLowerCase().includes(searchLower) ||
      displayId.toLowerCase().includes(searchLower)
    );
  });

  const columns = [
    {
      title: 'Ism',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space>
          <Avatar
            style={{
              backgroundColor: '#f0f0f0',
              color: '#666',
              fontWeight: 600,
            }}
          >
            {text ? text.charAt(0) : 'T'}
          </Avatar>
          <Text strong style={{ color: '#1e293b' }}>
            {text}
          </Text>
        </Space>
      ),
    },
    {
      title: 'ID',
      dataIndex: 'display_id',
      key: 'display_id',
      render: (text) => (
        <Text
          style={{
            fontFamily: 'monospace',
            fontWeight: 600,
            fontSize: '12px',
            backgroundColor: '#f1f5f9',
            padding: '4px 8px',
            borderRadius: '6px',
            color: '#475569',
          }}
        >
          {text}
        </Text>
      ),
    },
    {
      title: 'Fanlar',
      dataIndex: 'subjects',
      key: 'subjects',
      render: (subjects) => (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {subjects?.map((subject) => (
            <Tag
              key={subject}
              style={{
                backgroundColor: '#eff6ff',
                color: '#1d4ed8',
                fontSize: '12px',
                fontWeight: 500,
                borderRadius: '6px',
                border: 'none',
                margin: 0,
              }}
            >
              {subject}
            </Tag>
          ))}
        </div>
      ),
    },
    {
      title: 'Kurator',
      dataIndex: 'is_curator',
      key: 'is_curator',
      render: (isCurator) => (
        <Tag
          color={isCurator ? 'green' : 'default'}
          style={{
            backgroundColor: isCurator ? '#ecfdf5' : '#f1f5f9',
            color: isCurator ? '#059669' : '#64748b',
            fontWeight: 600,
            borderRadius: '6px',
          }}
        >
          {isCurator ? 'Ha' : 'Yo\'q'}
        </Tag>
      ),
    },
    {
      title: 'Kurator sinfi',
      dataIndex: 'curator_class',
      key: 'curator_class',
      render: (text) => (
        <Text
          style={{
            fontWeight: 500,
            color: text ? '#1e293b' : '#64748b',
          }}
        >
          {text || '-'}
        </Text>
      ),
    },
    {
      title: 'Yaratgan testlari',
      key: 'test_count',
      render: (_, record) => (
        <Text
          style={{
            fontWeight: 700,
            color: '#2563eb',
            fontSize: '18px',
          }}
        >
          {tests.filter((test) => test.teacher === record.id).length}
        </Text>
      ),
    },
    {
      title: 'Harakatlar',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<InfoCircleOutlined />}
            onClick={() => navigate(`/admin/teacher-details/${record.id}`)}
            style={{ color: '#2563eb' }}
          >
            Batafsil
          </Button>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEditClick(record)}
            style={{ color: '#059669' }}
          />
          <Popconfirm
            title="O'qituvchini o'chirishni tasdiqlang"
            description={
              <div>
                <div>Haqiqatan ham ushbu o'qituvchini o'chirishni xohlaysizmi?</div>
                <div style={{ marginTop: '8px', fontWeight: 'bold' }}>{record.name}</div>
                <div style={{ fontSize: '12px', color: '#666' }}>ID: {record.display_id || record.username}</div>
                <div style={{ fontSize: '12px', color: '#666' }}>Fanlar: {record.subjects?.join(', ') || 'Aniqlanmagan'}</div>
              </div>
            }
            onConfirm={() => handleDelete(record.id)}
            okText="Ha, o'chirish"
            cancelText="Yo'q"
            okButtonProps={{ danger: true }}
            placement="topRight"
          >
            <Button
              type="text"
              icon={<DeleteOutlined />}
              style={{ color: '#dc2626' }}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="animate__animated animate__fadeIn" style={{ padding: '24px 0' }}>
      {/* Header */}
      <div className="animate__animated animate__slideInDown" style={{
        marginBottom: '24px',
        paddingBottom: '16px',
        borderBottom: '1px solid #e2e8f0'
      }}>
        <Title level={1} style={{ margin: 0, color: '#1e293b', marginBottom: '8px' }}>
          O'qituvchilarni boshqarish
        </Title>
        <Text style={{ fontSize: '18px', color: '#64748b' }}>
          O'qituvchilar ma'lumotlarini boshqaring
        </Text>
      </div>

      {/* Alerts */}
      {success && (
        <div className="animate__animated animate__slideInRight">
          <Alert
            message={success}
            type="success"
            showIcon
            style={{ marginBottom: '16px' }}
            closable
            onClose={() => setSuccess('')}
          />
        </div>
      )}

      {error && (
        <div className="animate__animated animate__slideInRight">
          <Alert
            message={error}
            type="error"
            showIcon
            style={{ marginBottom: '16px' }}
            closable
            onClose={() => setError('')}
          />
        </div>
      )}

      {/* Controls */}
      <div className="animate__animated animate__fadeInUp" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <Input
          placeholder="O'qituvchi nomini qidirish..."
          prefix={<SearchOutlined />}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            borderRadius: '8px',
            marginRight: '8px'
          }}
        />
        <Space>
          <Button
            type="default"
            icon={<FileTextOutlined />}
            onClick={() => setImportModalVisible(true)}
            style={{ borderColor: '#7c3aed', color: '#7c3aed' }}
          >
            Excel fayldan import
          </Button>
          <Button
            type="default"
            icon={<DownloadOutlined />}
            onClick={() => setExportModalVisible(true)}
            style={{ borderColor: '#059669', color: '#059669' }}
          >
            Excel faylga export
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/admin/add-teacher')}
            style={{
              backgroundColor: '#2563eb',
              borderColor: '#2563eb',
              fontWeight: 600,
            }}
          >
            O'qituvchi qo'shish
          </Button>
        </Space>
      </div>

      {/* Search Results Info */}
      {searchTerm && (
        <Text style={{ marginBottom: '16px', color: '#64748b' }}>
          {filteredTeachers.length} ta o'qituvchi topildi
        </Text>
      )}

      {/* Table */}
      <div className="animate__animated animate__fadeInUpBig" style={{ animationDelay: '300ms' }}>
        <Table
          columns={columns}
          dataSource={filteredTeachers}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: pageSize,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `Jami ${total} ta o'qituvchi`,
            pageSizeOptions: ['10', '20', '50', '100'],
            onShowSizeChange: (current, size) => setPageSize(size),
          }}
          locale={{
            emptyText: 'O\'qituvchilar mavjud emas'
          }}
          onRow={(record, index) => ({
            className: 'animate__animated animate__fadeInLeft',
            style: { 
              animationDelay: `${index * 100}ms`,
              transition: 'all 0.3s ease'
            },
            onMouseEnter: (e) => {
              e.currentTarget.style.transform = 'scale(1.02)';
            },
            onMouseLeave: (e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }
          })}
        />
      </div>

      {/* Empty State */}
      {filteredTeachers.length === 0 && !loading && (
        <div className="animate__animated animate__zoomIn" style={{ textAlign: 'center', padding: '48px 0' }}>
          <Text style={{ fontSize: '16px', color: '#64748b' }}>
            {searchTerm ? 'Qidiruv bo\'yicha o\'qituvchilar topilmadi' : 'Hech qanday o\'qituvchi mavjud emas'}
          </Text>
          <br />
          {!searchTerm && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate('/admin/add-teacher')}
              style={{ marginTop: '16px' }}
            >
              Birinchi o'qituvchini qo'shish
            </Button>
          )}
        </div>
      )}


      {/* Export Modal */}
      <Modal
        title="Excel faylga export qilish"
        open={exportModalVisible}
        onOk={handleExportToExcel}
        onCancel={() => setExportModalVisible(false)}
        okText="Export qilish"
        cancelText="Bekor qilish"
      >
        <div>
          <Text>Quyidagi ma'lumotlar Excel faylga export qilinadi. Jami {teachers.length} ta o'qituvchi.</Text>
          <Alert
            message="Eslatma"
            description="Export qilish uchun Export qilish tugmasini bosing. Fayl avtomatik tarzda yuklab olinadi."
            type="info"
            showIcon
            style={{ marginTop: '16px' }}
          />
        </div>
      </Modal>

      {/* Import Modal */}
      <Modal
        title="Excel fayldan import qilish"
        open={importModalVisible}
        onCancel={() => !importing && setImportModalVisible(false)}
        width={800}
        style={{ top: 20 }}
        footer={[
          <Button key="cancel" onClick={() => setImportModalVisible(false)} disabled={importing}>
            Bekor qilish
          </Button>,
          <Button
            key="upload"
            type="primary"
            loading={importing}
            disabled={importing}
            onClick={() => fileInputRef.current?.click()}
            className={importing ? 'animate__animated animate__pulse' : ''}
          >
            {importing ? 'Import qilinmoqda...' : 'Fayl tanlash (.xlsx)'}
          </Button>
        ]}
        maskClosable={!importing}
        closable={!importing}
      >
        <div>
          <Text>O'qituvchilarni Excel fayldan import qilish uchun fayl quyidagi formatda bo'lishi kerak:</Text>

          <div style={{ marginTop: '16px', marginBottom: '16px' }}>
            <Text strong style={{ display: 'block', marginBottom: '8px' }}>Excel fayl namunasi:</Text>
            <div style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '16px',
              fontSize: '12px',
              fontFamily: 'monospace'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '50px 100px 100px 120px 80px 100px', gap: '8px', marginBottom: '8px' }}>
                <div style={{ fontWeight: 'bold', backgroundColor: '#e2e8f0', padding: '4px', textAlign: 'center' }}>№</div>
                <div style={{ fontWeight: 'bold', backgroundColor: '#e2e8f0', padding: '4px', textAlign: 'center' }}>Ism</div>
                <div style={{ fontWeight: 'bold', backgroundColor: '#e2e8f0', padding: '4px', textAlign: 'center' }}>Familiya</div>
                <div style={{ fontWeight: 'bold', backgroundColor: '#e2e8f0', padding: '4px', textAlign: 'center' }}>Fanlar</div>
                <div style={{ fontWeight: 'bold', backgroundColor: '#e2e8f0', padding: '4px', textAlign: 'center' }}>Kurator</div>
                <div style={{ fontWeight: 'bold', backgroundColor: '#e2e8f0', padding: '4px', textAlign: 'center' }}>Kurator sinfi</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '50px 100px 100px 120px 80px 100px', gap: '8px' }}>
                <div style={{ padding: '4px', textAlign: 'center' }}>1</div>
                <div style={{ padding: '4px', textAlign: 'center' }}>Ahmad</div>
                <div style={{ padding: '4px', textAlign: 'center' }}>Karimov</div>
                <div style={{ padding: '4px', textAlign: 'center' }}>Matematika, Fizika</div>
                <div style={{ padding: '4px', textAlign: 'center' }}>Ha</div>
                <div style={{ padding: '4px', textAlign: 'center' }}>9-01-A</div>
              </div>
            </div>
          </div>

          <Alert
            message="Fayl formati"
            description=".xlsx (Excel 2007 va undan keyingi versiyalar)"
            type="info"
            showIcon
            style={{ marginBottom: '16px' }}
          />

          <Alert
            message="Eslatma"
            description={
              <div>
                <div>• Fanlar vergul bilan ajratilgan bo'lishi kerak</div>
                <div>• Kurator maydoni: "Ha" yoki "Yo'q"</div>
                <div>• Kurator sinfi faqat kurator bo'lsa to'ldiriladi</div>
                <div>• Import jarayonida mavjud o'qituvchilar tekshiriladi</div>
                <div>• Agar o'qituvchi allaqachon mavjud bo'lsa, u o'tkazib yuboriladi</div>
                <div>• Har bir o'qituvchi uchun avtomatik ID va parol generatsiya qilinadi</div>
              </div>
            }
            type="warning"
            showIcon
          />
        </div>
      </Modal>

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".xlsx"
        style={{ display: 'none' }}
        onChange={handleImportFromExcel}
      />
    </div>
  );
};

export default ManageTeachers;
