import React, { useState, useEffect, useRef } from 'react';
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
  Tabs,
  Checkbox,
  Row,
  Col,
  Tooltip,
  Spin,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  SearchOutlined,
  InfoCircleOutlined,
  DownloadOutlined,
  FileTextOutlined,
  UserOutlined,
  BlockOutlined,
  CheckCircleOutlined,
  TeamOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import apiService from '../../data/apiService';
import * as XLSX from 'xlsx';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const ManageStudents = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('students');
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedClasses, setExpandedClasses] = useState(new Set());
  const [importing, setImporting] = useState(false);
  const [deleteAllModalVisible, setDeleteAllModalVisible] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);
  const [exportPreviewData, setExportPreviewData] = useState([]);
  const [isExporting, setIsExporting] = useState(false);
  const [pageSize, setPageSize] = useState(10);
  const [classesPageSize, setClassesPageSize] = useState(10);
  const fileInputRef = useRef(null);

  // Cache system for data
  const [cache, setCache] = useState({
    users: null,
    attempts: null,
    lastUpdated: null
  });
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  // Check if cache is valid
  const isCacheValid = (lastUpdated) => {
    if (!lastUpdated) return false;
    return Date.now() - lastUpdated < CACHE_DURATION;
  };

  // Load data with caching
  const loadData = async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError('');

      // Check if we can use cached data
      if (!forceRefresh && cache.users && cache.attempts && isCacheValid(cache.lastUpdated)) {
        console.log('Using cached data');
        setStudents(cache.users.filter(user => user.role === 'student'));
        setTeachers(cache.users.filter(user => user.role === 'teacher'));
        setAttempts(cache.attempts);
        return;
      }

      console.log('Loading fresh data from API');

      const [allUsersResponse, allAttemptsResponse] = await Promise.all([
        apiService.getUsers(),
        apiService.getAttempts()
      ]);

      // Handle both possible response formats
      const allUsers = allUsersResponse.results || allUsersResponse;
      const allAttempts = allAttemptsResponse.results || allAttemptsResponse;

      console.log('Loaded users:', allUsers.length);
      console.log('Loaded attempts:', allAttempts.length);

      const allStudents = allUsers.filter(user => user.role === 'student');
      const allTeachers = allUsers.filter(user => user.role === 'teacher');

      console.log('Filtered students:', allStudents.length);
      console.log('Filtered teachers:', allTeachers.length);

      // Update cache
      setCache({
        users: allUsers,
        attempts: allAttempts,
        lastUpdated: Date.now()
      });

      setStudents(allStudents);
      setTeachers(allTeachers);
      setAttempts(allAttempts);
    } catch (error) {
      console.error('Failed to load data:', error);
      setError('Ma\'lumotlarni yuklashda xatolik yuz berdi: ' + (error.message || 'Noma\'lum xatolik'));
    } finally {
      setLoading(false);
    }
  };

  const generateStudentId = (firstName, lastName, classGroup, direction, randomDigits) => {
    const lastNameUpper = lastName.toUpperCase().replace("'", '');
    const firstNameInitial = firstName.charAt(0).toUpperCase();
    const grade = classGroup.split('-').slice(0, 2).join('');
    const directionCode = direction === 'natural' ? 'N' : 'E';
    return `${lastNameUpper}${firstNameInitial}T${grade}${directionCode}${randomDigits}@test`;
  };

  const generateStudentUsername = (firstName, lastName, classGroup, direction) => {
    const lastNameLower = lastName.toLowerCase();
    const firstNameInitial = firstName.charAt(0).toLowerCase();
    const classCode = classGroup.split('-').slice(0, 2).join('');
    const directionCode = direction === 'natural' ? 'n' : 'e';
    return `${lastNameLower}${firstNameInitial}${classCode}${directionCode}`;
  };

  const generateStudentEmail = (firstName, lastName, classGroup, direction) => {
    const username = generateStudentUsername(firstName, lastName, classGroup, direction);
    return `${username}@student.testplatform.com`;
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (studentId) => {
    try {
      await apiService.deleteUser(studentId);
      setStudents(students.filter(student => student.id !== studentId));
      // Reload data to refresh the view
      const [allUsers, allAttempts] = await Promise.all([
        apiService.getUsers(),
        apiService.getAttempts()
      ]);
      const allStudents = allUsers.filter(user => user.role === 'student');
      const allTeachers = allUsers.filter(user => user.role === 'teacher');
      setStudents(allStudents);
      setTeachers(allTeachers);
      setAttempts(allAttempts.results || allAttempts);
      setSuccess('O\'quvchi muvaffaqiyatli o\'chirildi!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Failed to delete student:', error);
      setError('O\'quvchini o\'chirishda xatolik yuz berdi');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleDeleteAllStudents = async () => {
    try {
      setDeletingAll(true);
      setError('');
      
      // Get all student IDs
      const studentIds = students.map(s => s.id);
      
      // Delete each student
      for (const studentId of studentIds) {
        await apiService.deleteUser(studentId);
      }
      
      // Reload data
      const [allUsers, allAttempts] = await Promise.all([
        apiService.getUsers(),
        apiService.getAttempts()
      ]);
      
      const allStudents = allUsers.filter(user => user.role === 'student');
      const allTeachers = allUsers.filter(user => user.role === 'teacher');
      
      setStudents(allStudents);
      setTeachers(allTeachers);
      setAttempts(allAttempts.results || allAttempts);
      
      setSuccess(`Barcha o'quvchilar muvaffaqiyatli o'chirildi! (${studentIds.length} ta)`);
      setTimeout(() => setSuccess(''), 5000);
      setDeleteAllModalVisible(false);
    } catch (error) {
      console.error('Failed to delete all students:', error);
      setError('Barcha o\'quvchilarni o\'chirishda xatolik yuz berdi: ' + (error.message || 'Noma\'lum xatolik'));
      setTimeout(() => setError(''), 5000);
    } finally {
      setDeletingAll(false);
    }
  };


  const handleEditClick = (student) => {
    navigate(`/admin/edit-student/${student.id}`);
  };

  const handleBanStudent = async (studentId) => {
    try {
      await apiService.banUser(studentId, 'Admin tomonidan bloklandi');
      // Reload students
      const [allUsers, allAttempts] = await Promise.all([
        apiService.getUsers(),
        apiService.getAttempts()
      ]);
      const allStudents = allUsers.filter(user => user.role === 'student');
      const allTeachers = allUsers.filter(user => user.role === 'teacher');
      setStudents(allStudents);
      setTeachers(allTeachers);
      setAttempts(allAttempts.results || allAttempts);
      setSuccess('O\'quvchi muvaffaqiyatli bloklandi!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Failed to ban student:', error);
      setError('O\'quvchini bloklashda xatolik yuz berdi');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleUnbanStudent = async (studentId) => {
    try {
      await apiService.unbanUser(studentId);
      // Reload students
      const [allUsers, allAttempts] = await Promise.all([
        apiService.getUsers(),
        apiService.getAttempts()
      ]);
      const allStudents = allUsers.filter(user => user.role === 'student');
      const allTeachers = allUsers.filter(user => user.role === 'teacher');
      setStudents(allStudents);
      setTeachers(allTeachers);
      setAttempts(allAttempts.results || allAttempts);
      setSuccess('O\'quvchi muvaffaqiyatli blokdan chiqarildi!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Failed to unban student:', error);
      setError('O\'quvchini blokdan chiqarishda xatolik yuz berdi');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleExportToExcel = () => {
    const exportData = students.map((student, index) => ({
      '№': index + 1,
      'Ism': student.name || '',
      'Familiya': student.name ? student.name.split(' ').slice(1).join(' ') : '',
      'Sinf': student.class_group || '',
      'Yo\'nalish': getDirectionLabel(student.direction),
      'Testlar soni': getStudentAttemptCount(student.id),
      'O\'rtacha ball': getStudentAverageScore(student.id),
      'Status': student.is_banned ? 'Bloklangan' : 'Faol',
      'Ro\'yxatdan o\'tgan sana': student.registration_date ? new Date(student.registration_date).toLocaleDateString('uz-UZ') : '',
      'Oxirgi faollik': getStudentLastActivity(student.id) || '',
      'Display ID': student.display_id || student.username || ''
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const colWidths = [
      { wch: 5 },  // №
      { wch: 15 }, // Ism
      { wch: 15 }, // Familiya
      { wch: 10 }, // Sinf
      { wch: 15 }, // Yo'nalish
      { wch: 12 }, // Testlar soni
      { wch: 12 }, // O'rtacha ball
      { wch: 10 }, // Status
      { wch: 15 }, // Ro'yxatdan o'tgan sana
      { wch: 15 }, // Oxirgi faollik
      { wch: 20 }  // Display ID
    ];
    ws['!cols'] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'O\'quvchilar');

    const currentDate = new Date().toISOString().split('T')[0];
    const filename = `oquvchilar_${currentDate}.xlsx`;

    XLSX.writeFile(wb, filename);
    setExportModalVisible(false);
  };

  const showExportPreview = () => {
    // Generate preview data (first 10 rows)
    const previewData = students.slice(0, 10).map((student, index) => ({
      key: index,
      '№': index + 1,
      'Ism': student.name || '',
      'Familiya': student.name ? student.name.split(' ').slice(1).join(' ') : '',
      'Sinf': student.class_group || '',
      'Yo\'nalish': getDirectionLabel(student.direction),
      'Testlar': getStudentAttemptCount(student.id),
      'Ball': getStudentAverageScore(student.id),
      'Status': student.is_banned ? 'Bloklangan' : 'Faol',
    }));
    setExportPreviewData(previewData);
    setExportModalVisible(true);
  };

  const handleImportFromExcel = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setImporting(true);
      setError('');

      // Read file with progress tracking
      const data = await file.arrayBuffer();
      
      // Use streaming-like approach with large file handling
      const workbook = XLSX.read(data, {
        cellStyles: true,
        cellFormulae: false,
        cellDates: false,
        cellNF: false,
        cellText: true,
      });
      
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Get total rows for progress tracking
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
      const totalRows = range.e.r - range.s.r; // Total rows (excluding header)
      
      if (totalRows <= 0) {
        setError('Excel faylda ma\'lumotlar topilmadi');
        setImporting(false);
        return;
      }

      // Process data with chunking for large files
      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        header: 1, // Get as array of arrays for faster processing
        defval: ''
      });
      
      // Skip header row
      const dataRows = jsonData.slice(1).filter(row => row && row.some(cell => cell));
      
      if (dataRows.length === 0) {
        setError('Excel faylda ma\'lumotlar topilmadi');
        setImporting(false);
        return;
      }

      let successCount = 0;
      let errorCount = 0;
      const errors = [];
      
      // Process in batches to avoid browser memory issues
      const BATCH_SIZE = 50;
      for (let i = 0; i < dataRows.length; i += BATCH_SIZE) {
        const batch = dataRows.slice(i, i + BATCH_SIZE);
        
        for (let j = 0; j < batch.length; j++) {
          const row = batch[j];
          const rowIndex = i + j + 2; // +2 because: +1 for header skip, +1 for 1-based indexing
          
          try {
            // Get values by position: Index 1 = Ism, Index 2 = Familiya, Index 3 = Sinf
            const firstName = String(row[1] || '').trim();
            const lastName = String(row[2] || '').trim();
            const classGroup = String(row[3] || '').trim();

            if (!firstName || !lastName || !classGroup) {
              errors.push(`Qator ${rowIndex}: Ism, Familiya va Sinf maydonlari majburiy`);
              errorCount++;
              continue;
            }

            // Normalize names: convert Cyrillic letters that look like Latin to proper Latin
            const normalizeName = (name) => {
              if (!name) return name;
              return name.replace(/О/g, 'O').replace(/о/g, 'o')
                         .replace(/А/g, 'A').replace(/а/g, 'a')
                         .replace(/Е/g, 'E').replace(/е/g, 'e')
                         .replace(/К/g, 'K').replace(/к/g, 'k')
                         .replace(/М/g, 'M').replace(/м/g, 'm')
                         .replace(/Т/g, 'T').replace(/т/g, 't')
                         .replace(/Н/g, 'N').replace(/н/g, 'n')
                         .replace(/Х/g, 'H').replace(/х/g, 'h')
                         .replace(/В/g, 'V').replace(/в/g, 'v')
                         .replace(/С/g, 'S').replace(/с/g, 's')
                         .replace(/Р/g, 'R').replace(/р/g, 'r')
                         .replace(/У/g, 'Y').replace(/у/g, 'y')
                         .replace(/З/g, 'Z').replace(/з/g, 'z')
                         .replace(/Л/g, 'L').replace(/л/g, 'l')
                         .replace(/Д/g, 'D').replace(/д/g, 'd')
                         .replace(/Г/g, 'G').replace(/г/g, 'g')
                         .replace(/Б/g, 'B').replace(/б/g, 'b')
                         .replace(/П/g, 'P').replace(/п/g, 'p');
            };
            
            const normalizedFirstName = normalizeName(firstName);
            const normalizedLastName = normalizeName(lastName);
            const fullName = `${normalizedFirstName} ${normalizedLastName}`;
            const direction = classGroup.endsWith('-A') ? 'exact' : classGroup.endsWith('-T') ? 'natural' : 'natural';

            // Generate credentials
            const randomDigits = Math.floor(Math.random() * 900) + 100;
            const displayId = generateStudentId(normalizedFirstName, normalizedLastName, classGroup, direction, randomDigits);
            const username = generateStudentUsername(normalizedFirstName, normalizedLastName, classGroup, direction);
            const email = generateStudentEmail(normalizedFirstName, normalizedLastName, classGroup, direction);

            // Check if student already exists
            const existingStudent = students.find(s => s.username === username && s.class_group === classGroup);
            if (existingStudent) {
              errors.push(`Qator ${rowIndex}: ${fullName} (${classGroup}) - bu o'quvchi allaqachon mavjud`);
              errorCount++;
              continue;
            }

            // Create student
            const studentData = {
              username: username,
              email: email,
              password: 'temp_password',
              name: fullName,
              role: 'student',
              class_group: classGroup,
              direction: direction,
              registration_date: new Date().toISOString().split('T')[0],
            };

            await apiService.post('/users/', studentData);
            successCount++;

          } catch (error) {
            errors.push(`Qator ${rowIndex}: ${error.message || 'Xatolik'}`);
            errorCount++;
          }
        }
        
        // Small delay between batches to prevent browser freeze
        if (i + BATCH_SIZE < dataRows.length) {
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      }

      // Reload data
      const [allUsersResponse, allAttemptsResponse] = await Promise.all([
        apiService.getUsers(),
        apiService.getAttempts()
      ]);
      
      const allUsers = allUsersResponse.results || allUsersResponse;
      const allAttempts = allAttemptsResponse.results || allAttemptsResponse;
      const allStudents = allUsers.filter(user => user.role === 'student');
      const allTeachers = allUsers.filter(user => user.role === 'teacher');
      
      setStudents(allStudents);
      setTeachers(allTeachers);
      setAttempts(allAttempts);

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

  const getDirectionLabel = (direction) => {
    return direction === 'natural' ? 'Tabiiy fanlar' : 'Aniq fanlar';
  };

  const getStudentAttemptCount = (studentId) => {
    return attempts.filter(attempt => attempt.student === studentId).length;
  };

  const getStudentAverageScore = (studentId) => {
    const studentAttempts = attempts.filter(attempt => attempt.student === studentId);
    if (studentAttempts.length === 0) return 0;

    const averageScore = studentAttempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0) / studentAttempts.length;
    return Math.round(averageScore);
  };

  const getStudentLastActivity = (studentId) => {
    const studentAttempts = attempts.filter(attempt => attempt.student === studentId);
    if (studentAttempts.length === 0) return null;

    const lastAttempt = studentAttempts.sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at))[0];
    return new Date(lastAttempt.completed_at).toLocaleString('uz-UZ');
  };

  // Group students by class
  const groupStudentsByClass = () => {
    const classGroups = {};
    students.forEach(student => {
      const classGroup = student.class_group || 'Noma\'lum';
      if (!classGroups[classGroup]) {
        classGroups[classGroup] = [];
      }
      classGroups[classGroup].push(student);
    });
    return classGroups;
  };

  // Get class statistics
  const getClassStatistics = (classStudents) => {
    if (classStudents.length === 0) return { totalStudents: 0, averageScore: 0, totalAttempts: 0 };

    let totalScore = 0;
    let totalAttempts = 0;
    let studentsWithAttempts = 0;

    classStudents.forEach(student => {
      const studentAttempts = attempts.filter(attempt => attempt.student === student.id);
      totalAttempts += studentAttempts.length;

      if (studentAttempts.length > 0) {
        const studentAverage = studentAttempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0) / studentAttempts.length;
        totalScore += studentAverage;
        studentsWithAttempts++;
      }
    });

    return {
      totalStudents: classStudents.length,
      averageScore: studentsWithAttempts > 0 ? Math.round(totalScore / studentsWithAttempts) : 0,
      totalAttempts: totalAttempts
    };
  };

  // Get class curator
  const getClassCurator = (classGroup) => {
    const baseClass = classGroup.split('-').slice(0, 2).join('-');
    return teachers.find(teacher => teacher.curator_class === baseClass);
  };

  // Toggle class expansion
  const toggleClassExpansion = (classGroup) => {
    const newExpanded = new Set(expandedClasses);
    if (newExpanded.has(classGroup)) {
      newExpanded.delete(classGroup);
    } else {
      newExpanded.add(classGroup);
    }
    setExpandedClasses(newExpanded);
  };

  const classGroups = groupStudentsByClass();
  const sortedClasses = Object.keys(classGroups).sort();

  // Filter students and classes based on search term
  const filteredStudents = students.filter(student => {
    if (!searchTerm) return true;

    const searchLower = searchTerm.toLowerCase();
    const name = student.name || '';
    const displayId = student.display_id || student.username || '';

    return name.toLowerCase().includes(searchLower) ||
      displayId.toLowerCase().includes(searchLower);
  });

  const filteredClasses = sortedClasses.filter(classGroup => {
    if (!searchTerm) return true;

    const searchLower = searchTerm.toLowerCase();
    const classStudents = classGroups[classGroup];

    // Check class name
    if (classGroup.toLowerCase().includes(searchLower)) return true;

    // Check curator name
    const curator = getClassCurator(classGroup);
    if (curator && curator.name && curator.name.toLowerCase().includes(searchLower)) return true;

    // Check student names
    return classStudents.some(student => {
      const name = student.name || '';
      const displayId = student.display_id || student.username || '';
      return name.toLowerCase().includes(searchLower) || displayId.toLowerCase().includes(searchLower);
    });
  });

  // Students table columns
  const studentColumns = [
    {
      title: 'O\'quvchi',
      key: 'student',
      render: (_, record) => (
        <Space>
          <Avatar
            style={{
              backgroundColor: '#f0f0f0',
              color: '#666',
              fontWeight: 600,
            }}
          >
            {record.name ? record.name.charAt(0) : 'S'}
          </Avatar>
          <div>
            <Text strong style={{ color: '#1e293b' }}>
              {record.name}
            </Text>
            <br />
            <Text style={{ color: '#64748b', fontSize: '12px', fontFamily: 'monospace' }}>
              {record.display_id || record.username}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Sinf',
      dataIndex: 'class_group',
      key: 'class_group',
      render: (text) => (
        <Text style={{ color: '#64748b', fontWeight: 600 }}>
          {text || '-'}
        </Text>
      ),
    },
    {
      title: 'Yo\'nalish',
      dataIndex: 'direction',
      key: 'direction',
      render: (direction) => (
        <Tag
          color={direction === 'natural' ? 'green' : 'blue'}
          style={{
            backgroundColor: direction === 'natural' ? '#ecfdf5' : '#eff6ff',
            color: direction === 'natural' ? '#059669' : '#2563eb',
            fontWeight: 600
          }}
        >
          {getDirectionLabel(direction)}
        </Tag>
      ),
    },
    {
      title: 'Test urinishlari',
      key: 'attempts',
      render: (_, record) => (
        <Text style={{ color: '#64748b', fontWeight: 600 }}>
          {getStudentAttemptCount(record.id)}
        </Text>
      ),
    },
    {
      title: 'O\'rtacha ball',
      key: 'average',
      render: (_, record) => (
        <Text style={{ color: '#64748b', fontWeight: 600 }}>
          {getStudentAverageScore(record.id)}%
        </Text>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'is_banned',
      key: 'status',
      render: (isBanned) => (
        <Tag color={isBanned ? 'red' : 'green'}>
          {isBanned ? 'Bloklangan' : 'Faol'}
        </Tag>
      ),
    },
    {
      title: 'Amallar',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="Batafsil">
            <Button
              type="text"
              icon={<InfoCircleOutlined />}
              onClick={() => navigate(`/admin/student-details/${record.id}`)}
              style={{ color: '#2563eb' }}
            />
          </Tooltip>
          <Tooltip title="Tahrirlash">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEditClick(record)}
              style={{ color: '#059669' }}
            />
          </Tooltip>
          {record.is_banned ? (
            <Tooltip title="Blokdan chiqarish">
              <Button
                type="text"
                icon={<CheckCircleOutlined />}
                onClick={() => handleUnbanStudent(record.id)}
                style={{ color: '#059669' }}
              />
            </Tooltip>
          ) : (
            <Tooltip title="Bloklash">
              <Button
                type="text"
                icon={<BlockOutlined />}
                onClick={() => handleBanStudent(record.id)}
                style={{ color: '#dc2626' }}
              />
            </Tooltip>
          )}
          <Popconfirm
            title="O'quvchini o'chirishni tasdiqlang"
            description={
              <div>
                <div>Haqiqatan ham ushbu o'quvchini o'chirishni xohlaysizmi?</div>
                <div style={{ marginTop: '8px', fontWeight: 'bold' }}>{record.name}</div>
                <div style={{ fontSize: '12px', color: '#666' }}>ID: {record.display_id || record.username}</div>
              </div>
            }
            onConfirm={() => handleDelete(record.id)}
            okText="Ha, o'chirish"
            cancelText="Yo'q"
            okButtonProps={{ danger: true }}
            placement="topRight"
          >
            <Tooltip title="O'chirish">
              <Button
                type="text"
                icon={<DeleteOutlined />}
                style={{ color: '#dc2626' }}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // Classes table columns
  const classColumns = [
    {
      title: 'Sinf',
      key: 'class',
      render: (_, record) => {
        const isExpanded = expandedClasses.has(record.classGroup);
        return (
          <Space>
            <TeamOutlined style={{ color: '#64748b' }} />
            <Text strong style={{ color: '#1e293b' }}>
              {record.classGroup}
            </Text>
            <Button
              type="text"
              icon={isExpanded ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
              onClick={() => toggleClassExpansion(record.classGroup)}
              style={{ color: '#64748b' }}
            />
          </Space>
        );
      },
    },
    {
      title: 'Sinf rahbari',
      key: 'curator',
      render: (_, record) => {
        const curator = getClassCurator(record.classGroup);
        return (
          <Text style={{ color: curator ? '#64748b' : '#94a3b8', fontStyle: curator ? 'normal' : 'italic' }}>
            {curator ? curator.name : 'Rahbar yo\'q'}
          </Text>
        );
      },
    },
    {
      title: 'O\'quvchilar soni',
      key: 'studentCount',
      render: (_, record) => (
        <Text style={{ color: '#64748b', fontWeight: 600 }}>
          {record.stats.totalStudents}
        </Text>
      ),
    },
    {
      title: 'Jami testlar',
      key: 'totalTests',
      render: (_, record) => (
        <Text style={{ color: '#64748b', fontWeight: 600 }}>
          {record.stats.totalAttempts}
        </Text>
      ),
    },
    {
      title: 'O\'rtacha ball',
      key: 'averageScore',
      render: (_, record) => (
        <Text style={{ color: '#64748b', fontWeight: 600 }}>
          {record.stats.averageScore}%
        </Text>
      ),
    },
    {
      title: 'Amallar',
      key: 'actions',
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          icon={<InfoCircleOutlined />}
          onClick={() => navigate(`/admin/class-details/${record.classGroup}`)}
          style={{ backgroundColor: '#2563eb', borderColor: '#2563eb' }}
        >
          Batafsil
        </Button>
      ),
    },
  ];

  // Prepare classes data for table
  const classesData = filteredClasses.map(classGroup => {
    const classStudents = classGroups[classGroup];
    const stats = getClassStatistics(classStudents);
    return {
      key: classGroup,
      classGroup,
      stats,
      students: classStudents
    };
  });

  return (
    <div style={{ padding: '24px 0' }}>
      {/* Header */}
      <div style={{
        marginBottom: '24px',
        paddingBottom: '16px',
        borderBottom: '1px solid #e2e8f0'
      }}>
        <Title level={1} style={{ margin: 0, color: '#1e293b', marginBottom: '8px' }}>
          O'quvchilarni boshqarish
        </Title>
        <Text style={{ fontSize: '18px', color: '#64748b' }}>
          O'quvchilar va sinflar ma'lumotlarini boshqaring
        </Text>
      </div>

      {/* Alerts */}
      {success && (
        <div >
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
        <div >
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
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <Input
          placeholder="O'quvchi yoki sinf nomini qidirish..."
          prefix={<SearchOutlined />}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            borderRadius: '8px',
            marginRight: '10px'
          }}
        />
        <Space>
          <Button
            type="default"
            icon={<FileTextOutlined />}
            onClick={() => setImportModalVisible(true)}
            style={{
              borderColor: '#7c3aed',
              color: '#7c3aed',
            }}
          >
            Excel fayldan import
          </Button>
          <Button
            type="default"
            icon={<DownloadOutlined />}
            onClick={showExportPreview}
            style={{ borderColor: '#059669', color: '#059669' }}
          >
            Excel faylga export
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/admin/add-student')}
            style={{
              backgroundColor: '#2563eb',
              borderColor: '#2563eb',
              fontWeight: 600,
            }}
          >
            O'quvchi qo'shish
          </Button>
          <Popconfirm
            title="Barcha o'quvchilarni o'chirish"
            description={
              <div>
                <div style={{ color: '#dc2626', fontWeight: 'bold', marginBottom: '8px' }}>⚠️ DIQQAT!</div>
                <div>Siz haqiqatan ham barcha o'quvchilarni o'chirishni xohlaysizmi?</div>
                <div style={{ marginTop: '8px', fontWeight: 'bold' }}>{students.length} ta o'quvchi o'chiriladi</div>
                <div style={{ fontSize: '12px', color: '#666' }}>Bu amallarni bekor qilib bo'lmaydi!</div>
              </div>
            }
            onConfirm={handleDeleteAllStudents}
            okText="Ha, barchasini o'chirish"
            cancelText="Yo'q"
            okButtonProps={{ danger: true, loading: deletingAll }}
            placement="topRight"
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              style={{ fontWeight: 600 }}
            >
              Barchasini o'chirish
            </Button>
          </Popconfirm>
        </Space>
      </div>

      {/* Search Results Info */}
      {searchTerm && (
        <Text style={{ marginBottom: '16px', color: '#64748b' }}>
          {activeTab === 'students' ? filteredStudents.length : filteredClasses.length} ta natija topildi
        </Text>
      )}

      {/* Tabs */}
      <div style={{}}>
        <Tabs activeKey={activeTab} onChange={setActiveTab} style={{ marginBottom: '24px' }}>
          <TabPane tab="👥 O'quvchilar" key="students">
            <Table
              columns={studentColumns}
              dataSource={filteredStudents}
              rowKey="id"
              loading={loading}
              pagination={{
                pageSize: pageSize,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `Jami ${total} ta o'quvchi`,
                pageSizeOptions: ['10', '20', '50', '100'],
                onShowSizeChange: (current, size) => setPageSize(size),
              }}
              locale={{
                emptyText: 'O\'quvchilar mavjud emas'
              }}
              onRow={(record, index) => ({
                style: {
                  animationDelay: `${index * 50}ms`,
                  transition: 'all 0.3s ease'
                }
              })}
            />

          </TabPane>

          <TabPane tab="🏫 Sinflar" key="classes">
            <Table
              columns={classColumns}
              dataSource={classesData}
              rowKey="classGroup"
              loading={loading}
              pagination={{
                pageSize: classesPageSize,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `Jami ${total} ta sinf`,
                pageSizeOptions: ['10', '20', '50', '100'],
                onShowSizeChange: (current, size) => setClassesPageSize(size),
              }}
              locale={{
                emptyText: 'Sinflar mavjud emas'
              }}
              expandable={{
                expandedRowKeys: Array.from(expandedClasses),
                onExpandedRowsChange: (keys) => setExpandedClasses(new Set(keys)),
                expandedRowRender: (record) => (
                  <div style={{ padding: '16px', backgroundColor: '#f8fafc' }}>
                    <Text strong style={{ marginBottom: '16px', display: 'block' }}>
                      {record.classGroup} sinfi o'quvchilari:
                    </Text>
                    <Row gutter={[16, 16]}>
                      {record.students.map((student) => (
                        <Col xs={24} sm={12} md={8} lg={6} key={student.id}>
                          <Card size="small" style={{ backgroundColor: '#ffffff' }}>
                            <Space>
                              <Avatar
                                size="small"
                                style={{
                                  backgroundColor: '#f0f0f0',
                                  color: '#666',
                                }}
                              >
                                {student.name ? student.name.charAt(0) : 'S'}
                              </Avatar>
                              <div>
                                <Text strong style={{ fontSize: '14px' }}>
                                  {student.name}
                                </Text>
                                <br />
                                <Text style={{ color: '#64748b', fontSize: '12px' }}>
                                  {getStudentAverageScore(student.id)}% | {getStudentAttemptCount(student.id)} test
                                </Text>
                              </div>
                            </Space>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  </div>
                ),
              }}
            />
          </TabPane>
        </Tabs>
      </div>

      {/* Empty State */}
      {((activeTab === 'students' && filteredStudents.length === 0) ||
        (activeTab === 'classes' && filteredClasses.length === 0)) && !loading && (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <Text style={{ fontSize: '16px', color: '#64748b' }}>
              {searchTerm ? 'Qidiruv bo\'yicha natijalar topilmadi' : 'Ma\'lumotlar mavjud emas'}
            </Text>
            <br />
            {!searchTerm && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => navigate('/admin/add-student')}
                style={{ marginTop: '16px' }}
              >
                Birinchi o'quvchini qo'shish
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
        okText="Yuklab olish"
        cancelText="Bekor qilish"
        width={900}
      >
        <div>
          <Alert
            message={`Jami ${students.length} ta o'quvchi export qilinadi`}
            description="Quyida ma'lumotlarning preview (namuna) ko'rinishi keltirilgan. Faylni yuklab olish uchun 'Yuklab olish' tugmasini bosing."
            type="info"
            showIcon
            style={{ marginBottom: '16px' }}
          />
          
          {/* Preview Table */}
          <div style={{ marginTop: '16px', marginBottom: '16px' }}>
            <Text strong style={{ display: 'block', marginBottom: '8px' }}>Preview (birinchi 10 ta o'quvchi):</Text>
            <Table
              dataSource={exportPreviewData}
              columns={[
                { title: '№', dataIndex: '№', key: '№', width: 50 },
                { title: 'Ism', dataIndex: 'Ism', key: 'Ism', width: 120 },
                { title: 'Familiya', dataIndex: 'Familiya', key: 'Familiya', width: 120 },
                { title: 'Sinf', dataIndex: 'Sinf', key: 'Sinf', width: 80 },
                { title: 'Yo\'nalish', dataIndex: 'Yo\'nalish', key: 'direction', width: 100 },
                { title: 'Testlar', dataIndex: 'Testlar', key: 'Testlar', width: 70 },
                { title: 'Ball', dataIndex: 'Ball', key: 'Ball', width: 70 },
                { title: 'Status', dataIndex: 'Status', key: 'Status', width: 100 },
              ]}
              pagination={false}
              size="small"
              scroll={{ x: 700 }}
              rowKey="key"
            />
          </div>
          
          <Alert
            message="Eslatma"
            description="Fayl .xlsx formatida yuklab olinadi va Excel, Google Sheets yoki boshqa dasturlarda ochilishi mumkin."
            type="success"
            showIcon
          />
        </div>
      </Modal>

      {/* Import Modal */}
      <Modal
        title="Excel fayldan import qilish"
        open={importModalVisible}
        onCancel={() => !importing && setImportModalVisible(false)}
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

          >
            {importing ? 'Import qilinmoqda...' : 'Fayl tanlash (.xlsx)'}
          </Button>
        ]}
        maskClosable={!importing}
        closable={!importing}
      >
        <div>
          <Text>O'quvchilarni Excel fayldan import qilish uchun fayl quyidagi formatda bo'lishi kerak:</Text>

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
              <div style={{ display: 'grid', gridTemplateColumns: '50px 100px 100px 100px', gap: '8px', marginBottom: '8px' }}>
                <div style={{ fontWeight: 'bold', backgroundColor: '#e2e8f0', padding: '4px', textAlign: 'center' }}>№</div>
                <div style={{ fontWeight: 'bold', backgroundColor: '#e2e8f0', padding: '4px', textAlign: 'center' }}>Ism</div>
                <div style={{ fontWeight: 'bold', backgroundColor: '#e2e8f0', padding: '4px', textAlign: 'center' }}>Familiya</div>
                <div style={{ fontWeight: 'bold', backgroundColor: '#e2e8f0', padding: '4px', textAlign: 'center' }}>Sinf</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '50px 100px 100px 100px', gap: '8px' }}>
                <div style={{ padding: '4px', textAlign: 'center' }}>1</div>
                <div style={{ padding: '4px', textAlign: 'center' }}>Ahmad</div>
                <div style={{ padding: '4px', textAlign: 'center' }}>Karimov</div>
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
                <div>• Sinf formati: 9-01-A (aniq fanlar) yoki 9-01-T (tabiiy fanlar)</div>
                <div>• Import jarayonida mavjud o'quvchilar tekshiriladi</div>
                <div>• Agar o'quvchi allaqachon mavjud bo'lsa, u o'tkazib yuboriladi</div>
                <div>• Har bir o'quvchi uchun avtomatik ID va parol generatsiya qilinadi</div>
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

export default ManageStudents;
