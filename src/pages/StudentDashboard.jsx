import React from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Button, Typography, Avatar, Dropdown, Space, Grid, Badge } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  HomeOutlined,
  SearchOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  BarChartOutlined,
  UserOutlined,
  BookOutlined,
  LogoutOutlined,
  SafetyCertificateOutlined,
  CheckCircleFilled,
  TeamOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { useServerTest } from '../context/ServerTestContext';
import { useLoading } from '../context/LoadingContext';
import NotificationCenter from '../components/NotificationCenter';
import UnbanModal from '../components/UnbanModal';
import { showWarning } from '../utils/antdNotification';

// Import student sub-pages (we'll create these)
import StudentOverview from './student/StudentOverview';
import SearchTeachers from './student/SearchTeachers';
import TakeTest from './student/TakeTest';
import SubmitTest from './student/SubmitTest';
import TestResults from './student/TestResults';
import StudentStatistics from './student/StudentStatistics';
import ReceivedLessons from './student/ReceivedLessons';
import StudentProfile from './student/StudentProfile';
import StudentProfileView from './student/StudentProfileView';
import TeacherDetails from './student/TeacherDetails';
import PricingPage from './student/PricingPage';
import Classmates from './student/Classmates';
import MyClassStatistics from './student/MyClassStatistics';
import StudentsRating from './student/StudentsRating';
import ClassesRating from './student/ClassesRating';

const { Header, Sider, Content } = Layout;
const { useBreakpoint } = Grid;

const StudentDashboard = () => {
  const [collapsed, setCollapsed] = React.useState(false);
  const { currentUser, logout, isBanned } = useAuth();
  const { sessionStarted } = useServerTest();
  const { setLoading, isLoading } = useLoading();
  const navigate = useNavigate();
  const location = useLocation();
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const handleToggle = () => {
    setLoading('sidebar_toggle', true);
    setTimeout(() => {
      setCollapsed(!collapsed);
      setLoading('sidebar_toggle', false);
    }, 200); // Small delay for smooth animation
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNavigation = (path) => {
    if (sessionStarted && path !== '/student/take-test') {
      showWarning('Test topshirayotganingizda boshqa sahifalarga o\'ta olmaysiz. Avval testni yakunlang!');
      return;
    }
    navigate(path);
  };


  const menuItems = [
    {
      key: '/student',
      icon: <HomeOutlined />,
      label: 'Asosiy',
    },
    {
      key: '/student/search',
      icon: <SearchOutlined />,
      label: 'O\'qituvchilarni izlash',
    },
    {
      key: '/student/classmates',
      icon: <UserOutlined />,
      label: 'Sinfdoshlar',
    },
    {
      key: '/student/take-test',
      icon: <PlayCircleOutlined />,
      label: 'Test topshirish',
    },
    {
      key: '/student/results',
      icon: <CheckCircleOutlined />,
      label: 'Mening natijalarim',
    },
    {
      key: '/student/lessons',
      icon: <BookOutlined />,
      label: 'Qabul qilingan darslar',
    },
    {
      key: 'statistics', // Submenu for statistics
      icon: <BarChartOutlined />,
      label: 'Statistika',
      children: [
        {
          key: '/student/statistics',
          icon: <UserOutlined />,
          label: 'Mening statistikam',
        },
        {
          key: '/student/my-class-statistics',
          icon: <TeamOutlined />,
          label: 'Sinf statistikasi',
        },
      ],
    },
    {
      key: 'ratings', // Submenu for ratings
      icon: <TrophyOutlined />,
      label: 'Reytinglar',
      children: [
        {
          key: '/student/students-rating',
          icon: <UserOutlined />,
          label: 'O\'quvchilar reytingi',
        },
        {
          key: '/student/classes-rating',
          icon: <TeamOutlined />,
          label: 'Sinflar reytingi',
        },
      ],
    },
  ];

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profil',
      onClick: () => handleNavigation('/student/profile'),
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Chiqish',
      onClick: () => {
        if (sessionStarted) {
          showWarning('Test topshirayotganingizda chiqa olmaysiz. Avval testni yakunlang!');
        } else {
          logout();
        }
      },
    },
  ];

  return (
    <Layout style={{ height: '100vh', overflow: 'hidden' }}>
      {/* Header */}
      <Header
        style={{
          position: 'fixed',
          top: 64,
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
              loading={isLoading('sidebar_toggle')}
            />
          ) : (
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={handleToggle}
              style={{ marginRight: 16 }}
              loading={isLoading('sidebar_toggle')}
            />
          )}
        </div>

        <Space>
          {sessionStarted && (
            <Typography.Text style={{
              color: '#dc2626',
              fontWeight: 600,
              backgroundColor: '#fef2f2',
              padding: '4px 12px',
              borderRadius: '12px',
              border: '1px solid #dc2626'
            }}>
              ⚠️ Test faol
            </Typography.Text>
          )}
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Space style={{ cursor: 'pointer' }}>
              <Avatar
                size="large"
                src={currentUser?.profile_photo_url}
                style={{
                  backgroundColor: currentUser?.is_premium ? '#ffffff' : '#2563eb',
                  color: currentUser?.is_premium ? '#2563eb' : '#ffffff',
                  border: '2px solid rgba(255, 255, 255, 0.8)',
                }}
              >
                {currentUser?.name.charAt(0).toUpperCase()}
              </Avatar>
            </Space>
          </Dropdown>
        </Space>
      </Header>

      <Layout style={{ height: 'calc(100vh - 128px)', marginTop: 128 }}>
        {/* Sidebar */}
        <Sider
          trigger={null}
          collapsible
          collapsed={collapsed}
          width={280}
          style={{
            position: 'fixed',
            left: 0,
            top: 128,
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
            items={menuItems.map(item => ({
              ...item,
              disabled: sessionStarted && item.key !== '/student/take-test',
            }))}
            onClick={({ key }) => handleNavigation(key)}
          />
        </Sider>

        {/* Main Content */}
        <Layout
          style={{
            marginLeft: collapsed ? 80 : 280,
            transition: 'margin-left 0.2s',
            height: '100%',
            overflow: 'hidden'
          }}
        >
          <Content
            style={{
              background: '#f8fafc',
              padding: 24,
              height: '100%',
            }}
          >
            <div
              id="dashboard-content-container"
              style={{
                background: '#ffffff',
                borderRadius: 8,
                padding: 24,
                height: 'calc(100vh - 112px)',
                overflowY: 'auto',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              }}
            >
              <Routes>
                <Route path="/" element={<StudentOverview />} />
                <Route path="/search" element={<SearchTeachers />} />
                <Route path="/classmates" element={<Classmates />} />
                <Route path="/teacher-details/:teacherId" element={<TeacherDetails />} />
                <Route path="/take-test" element={<TakeTest />} />
                <Route path="/submit-test" element={<SubmitTest />} />
                <Route path="/results" element={<TestResults />} />
                <Route path="/lessons" element={<ReceivedLessons />} />
                <Route path="/statistics" element={<StudentStatistics />} />
                <Route path="/profile" element={<StudentProfile />} />
                <Route path="/student-profile/:id" element={<StudentProfileView />} />
                <Route path="/pricing" element={<PricingPage />} />
                <Route path="/my-class-statistics" element={<MyClassStatistics />} />
                <Route path="/students-rating" element={<StudentsRating />} />
                <Route path="/classes-rating" element={<ClassesRating />} />
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

      {/* Unban Modal for Banned Students */}
      <UnbanModal
        open={isBanned}
        onClose={() => { }} // Modal cannot be closed manually
      />
    </Layout>
  );
};

export default StudentDashboard;