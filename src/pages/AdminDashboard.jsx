import React from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Button, Typography, Avatar, Dropdown, Space, Grid, Badge } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  HomeOutlined,
  TeamOutlined,
  UserOutlined,
  BookOutlined,
  RiseOutlined,
  TrophyOutlined,
  LogoutOutlined,
  SafetyCertificateOutlined,
  BellOutlined,
  LeftOutlined,
  RightOutlined,
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { useLoading } from '../context/LoadingContext';
import enhancedApiService from '../data/enhancedApiService';

// Import admin sub-pages
import AdminOverview from './admin/AdminOverview';
import ManageTeachers from './admin/ManageTeachers';
import ManageStudents from './admin/ManageStudents';
import AddStudent from './admin/AddStudent';
import AddTeacher from './admin/AddTeacher';
import TeacherDetails from './admin/TeacherDetails';
import StudentDetails from './admin/StudentDetails';
import StudentProfileView from '../pages/student/StudentProfileView';
import TestDetails from './admin/TestDetails';
import TestStatistics from './admin/TestStatistics';
import StudentRatings from './admin/StudentRatings';
import ClassDetails from './admin/ClassDetails';
import ClassStatistics from './admin/ClassStatistics';
import ClassesPage from './admin/ClassesPage';
import StudentsPage from './admin/StudentsPage';
import TestsPage from './admin/TestsPage';
import StatisticsPage from './admin/StatisticsPage';

// Import components
import BannedStudentsModal from '../components/BannedStudentsModal';

const { Header, Sider, Content } = Layout;
const { useBreakpoint } = Grid;

const AdminDashboard = () => {
  const [collapsed, setCollapsed] = React.useState(false);
  const [bannedStudents, setBannedStudents] = React.useState([]);
  const [modalOpen, setModalOpen] = React.useState(false);
  const { currentUser, logout } = useAuth();
  const { setLoading, isLoading } = useLoading();
  const navigate = useNavigate();
  const location = useLocation();
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const handleToggle = () => {
    setCollapsed(!collapsed);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Fetch banned students
  React.useEffect(() => {
    const fetchBannedStudents = async () => {
      setLoading('banned_students', true);
      try {
        const usersData = await enhancedApiService.getUsers((loading) => setLoading('users_list', loading));
        const users = usersData.results || usersData;
        // Ensure users is an array
        const usersArray = Array.isArray(users) ? users : [];
        const banned = usersArray.filter(user => user.role === 'student' && user.is_banned);
        setBannedStudents(banned);
      } catch (error) {
        console.error('Failed to fetch banned students:', error);
      } finally {
        setLoading('banned_students', false);
      }
    };

    fetchBannedStudents();
  }, [setLoading]);

  // Handle unbanning a student
  const handleUnbanStudent = async (studentId) => {
    setLoading('unban_student', true);
    try {
      await enhancedApiService.unbanUser(studentId);
      // Refresh banned students list
      const usersData = await enhancedApiService.getUsers((loading) => setLoading('users_list', loading));
      const users = usersData.results || usersData;
      const banned = users.filter(user => user.role === 'student' && user.is_banned);
      setBannedStudents(banned);
    } catch (error) {
      console.error('Failed to unban student:', error);
    } finally {
      setLoading('unban_student', false);
    }
  };

  const menuItems = [
    {
      key: '/admin',
      icon: <HomeOutlined />,
      label: 'Umumiy',
    },
    {
      key: '/admin/teachers',
      icon: <TeamOutlined />,
      label: 'O\'qituvchilarni boshqarish',
    },
    {
      key: '/admin/students',
      icon: <UserOutlined />,
      label: 'O\'quvchilarni boshqarish',
    },
        {
      key: 'statistics',
      icon: <RiseOutlined />,
      label: 'Statistika',
      children: [
        {
          key: '/admin/statistics',
          icon: <RiseOutlined />,
          label: 'Jami statistika',
        },
        {
          key: '/admin/classes',
          icon: <RiseOutlined />,
          label: 'Sinflar statistikasi',
        },
        {
          key: '/admin/students-page',
          icon: <RiseOutlined />,
          label: 'O\'quvchilar statistikasi',
        },
        {
          key: '/admin/tests-page',
          icon: <RiseOutlined />,
          label: 'Testlar statistikasi',
        },
      ],
    },
    {
      key: 'ratings',
      icon: <TrophyOutlined />,
      label: 'Reytinglar',
      children: [
        {
          key: '/admin/class-stats',
          icon: <TrophyOutlined />,
          label: 'Sinflar reytingi',
        },
        {
          key: '/admin/student-ratings',
          icon: <TrophyOutlined />,
          label: 'O\'quvchilar reytingi',
        },
        {
          key: '/admin/test-stats',
          icon: <TrophyOutlined />,
          label: 'Testlar reytingi',
        },
      ],
    },
  ];


  // If admin has pending plan approval, show processing message
  if (currentUser?.admin_premium_pending) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#f8fafc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px'
      }}>
        <div style={{ maxWidth: '800px', width: '100%' }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
            textAlign: 'center'
          }}>
            <Typography.Title level={2} style={{ color: '#1e293b' }}>
              Sizning so'rovingiz bajarilmoqda
            </Typography.Title>
            <Typography.Title level={4} style={{ color: '#64748b' }}>
              {currentUser.admin_premium_plan} tarifi uchun so'rovingiz head admin tomonidan ko'rib chiqilmoqda.
            </Typography.Title>
            <Typography.Text style={{ color: '#64748b' }}>
              Tasdiqlanishini kutib turing. Bu bir necha daqiqa davom etishi mumkin.
            </Typography.Text>
            <Button
              type="default"
              onClick={handleLogout}
              icon={<LogoutOutlined />}
              style={{ marginTop: '12px' }}
            >
              Chiqish
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const userMenuItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Chiqish',
      onClick: handleLogout,
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Header */}
      <Header
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          padding: '0 24px',
          background: '#ffffff',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {isMobile ? (
            <Button
              type="text"
              icon={<MenuFoldOutlined />}
              onClick={handleToggle}
              style={{ marginRight: 16 }}
            />
          ) : (
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={handleToggle}
              style={{ marginRight: 16 }}
            />
          )}
        </div>

        <Space>
          {bannedStudents.length > 0 && (
            <Button
              type="text"
              icon={<BellOutlined />}
              onClick={() => setModalOpen(true)}
              style={{ color: '#dc2626' }}
              title={`${bannedStudents.length} ta bloklangan o'quvchi bor`}
              loading={isLoading('banned_students')}
            >
              <Badge count={bannedStudents.length} />
            </Button>
          )}
        
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Space style={{ cursor: 'pointer' }}>
              <Avatar
                size="small"
                icon={<UserOutlined />}
                style={{ backgroundColor: '#dc2626' }}
              />
            </Space>
          </Dropdown>
        </Space>
      </Header>

      <Layout>
        {/* Sidebar */}
        <Sider
          trigger={null}
          collapsible
          collapsed={collapsed}
          width={280}
          style={{
            position: 'fixed',
            left: 0,
            top: 64,
            bottom: 0,
            background: '#ffffff',
            borderRight: '1px solid #f0f0f0',
            overflow: 'auto',
            paddingTop: 16,
          }}
          breakpoint="md"
          onBreakpoint={(broken) => {
            if (broken) {
              setCollapsed(true);
            }
          }}
        >
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            style={{
              border: 'none',
              background: 'transparent',
            }}
            items={menuItems}
            onClick={({ key }) => navigate(key)}
          />
        </Sider>

        {/* Main Content */}
        <Layout
          style={{
            marginLeft: collapsed ? 80 : 280,
            marginTop: 64,
            minHeight: 'calc(100vh - 64px)',
            transition: 'margin-left 0.2s',
          }}
        >
          <Content
            style={{
              background: '#f8fafc',
              padding: 24,
              minHeight: 'calc(100vh - 64px)',
              overflow: 'auto',
            }}
          >
            <div
              style={{
                background: '#ffffff',
                borderRadius: 8,
                padding: 24,
                minHeight: 'calc(100vh - 112px)',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              }}
            >
              <Routes>
                <Route path="/" element={<AdminOverview />} />
                <Route path="/classes" element={<ClassesPage />} />
                <Route path="/students-page" element={<StudentsPage />} />
                <Route path="/tests-page" element={<TestsPage />} />
                <Route path="/statistics" element={<StatisticsPage />} />
                <Route path="/teachers" element={<ManageTeachers />} />
                <Route path="/teacher-details/:id" element={<TeacherDetails />} />
                <Route path="/add-teacher" element={<AddTeacher />} />
                <Route path="/edit-teacher/:id" element={<AddTeacher />} />
                <Route path="/students" element={<ManageStudents />} />
                <Route path="/add-student" element={<AddStudent />} />
                <Route path="/edit-student/:id" element={<AddStudent />} />
                <Route path="/class-stats" element={<ClassStatistics />} />
                <Route path="/class-details/:classGroup" element={<ClassDetails />} />
                <Route path="/student-details/:id" element={<StudentDetails />} />
                <Route path="/student-profile/:id" element={<StudentProfileView />} />
                <Route path="/test-stats" element={<TestStatistics />} />
                <Route path="/test-details/:id" element={<TestDetails />} />
                <Route path="/student-ratings" element={<StudentRatings />} />
              </Routes>
            </div>
          </Content>
        </Layout>

        {/* Mobile Overlay */}
        {isMobile && !collapsed && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              zIndex: 999,
            }}
            onClick={() => setCollapsed(true)}
          />
        )}
      </Layout>

      {/* Banned Students Modal */}
      <BannedStudentsModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        bannedStudents={bannedStudents}
        onUnbanStudent={handleUnbanStudent}
      />
    </Layout>
  );
};

export default AdminDashboard;