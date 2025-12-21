import React from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Button, Typography, Dropdown, Space, Grid } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  HomeOutlined,
  FileTextOutlined,
  PlusOutlined,
  BarChartOutlined,
  LogoutOutlined,
  BookOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import NotificationCenter from '../components/NotificationCenter';

// Import teacher sub-pages
import TeacherOverview from './teacher/TeacherOverview';
import CreateTest from './teacher/CreateTest';
import MyTests from './teacher/MyTests';
import TeacherStatistics from './teacher/TeacherStatistics';
import TestDetails from './teacher/TestDetails';
import StudentResult from './teacher/StudentResult';
import SentLessons from './teacher/SentLessons';
import StudentProfileView from './student/StudentProfileView';

const { Header, Sider, Content } = Layout;
const { useBreakpoint } = Grid;

const TeacherDashboard = () => {
  const [collapsed, setCollapsed] = React.useState(false);
  const { currentUser, logout } = useAuth();
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

  const menuItems = [
    {
      key: '/teacher',
      icon: <HomeOutlined />,
      label: 'Asosiy',
    },
    {
      key: '/teacher/create-test',
      icon: <PlusOutlined />,
      label: 'Test yaratish',
    },
    {
      key: '/teacher/my-tests',
      icon: <FileTextOutlined />,
      label: 'Mening testlarim',
    },
    {
      key: '/teacher/sent-lessons',
      icon: <BookOutlined />,
      label: 'Yuborilgan darslar',
    },
    {
      key: '/teacher/statistics',
      icon: <BarChartOutlined />,
      label: 'Statistika',
    },
  ];

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
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Space style={{ cursor: 'pointer' }}>
              <Button type="text" icon={<LogoutOutlined />} />
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
                <Route path="/" element={<TeacherOverview />} />
                <Route path="/create-test" element={<CreateTest />} />
                <Route path="/edit-test/:testId" element={<CreateTest />} />
                <Route path="/my-tests" element={<MyTests />} />
                <Route path="/test-details/:testId" element={<TestDetails />} />
                <Route path="/student-result/:attemptId" element={<StudentResult />} />
                <Route path="/student-profile/:id" element={<StudentProfileView />} />
                <Route path="/sent-lessons" element={<SentLessons />} />
                <Route path="/statistics" element={<TeacherStatistics />} />
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
    </Layout>
  );
};

export default TeacherDashboard;
