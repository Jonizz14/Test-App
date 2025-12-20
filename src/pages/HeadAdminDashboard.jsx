import React, { useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Button, Typography, Avatar, Dropdown, Space, Grid, Badge } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  HomeOutlined,
  UserOutlined,
  MailOutlined,
  LogoutOutlined,
  SettingOutlined,
  SafetyCertificateOutlined,
  BellOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import apiService from '../data/apiService';
import NotificationCenter from '../components/NotificationCenter';
import BannedStudentsModal from '../components/BannedStudentsModal';
import 'antd/dist/reset.css';

// Import head admin sub-pages
import HeadAdminOverview from './headadmin/HeadAdminOverview';
import ManageAdmins from './headadmin/ManageAdmins';
import AddAdmin from './headadmin/AddAdmin';
import AdminDetails from './headadmin/AdminDetails';
import ContactMessages from './headadmin/ContactMessages';

const { Header, Sider, Content } = Layout;
const { useBreakpoint } = Grid;

const HeadAdminDashboard = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [bannedStudents, setBannedStudents] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const screens = useBreakpoint();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Fetch banned students
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const usersData = await apiService.getUsers();
        const users = usersData.results || usersData;
        const banned = users.filter(user => user.role === 'student' && user.is_banned);
        setBannedStudents(banned);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };

    fetchData();
  }, []);

  // Handle unbanning a student
  const handleUnbanStudent = async (studentId) => {
    try {
      await apiService.unbanUser(studentId);
      // Refresh banned students list
      const usersData = await apiService.getUsers();
      const users = usersData.results || usersData;
      const banned = users.filter(user => user.role === 'student' && user.is_banned);
      setBannedStudents(banned);
    } catch (error) {
      console.error('Failed to unban student:', error);
    }
  };

  const menuItems = [
    {
      key: '/headadmin',
      icon: <HomeOutlined />,
      label: 'Umumiy',
    },
    {
      key: '/headadmin/admins',
      icon: <TeamOutlined />,
      label: 'Adminlarni boshqarish',
    },
    {
      key: '/headadmin/messages',
      icon: <MailOutlined />,
      label: 'Xabarlar',
    },
  ];

  const handleMenuClick = ({ key }) => {
    navigate(key);
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profil',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Sozlamalar',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Chiqish',
      onClick: handleLogout,
    },
  ];

  const isMobile = !screens.md;

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
              onClick={() => setCollapsed(!collapsed)}
              style={{ marginRight: 16 }}
            />
          ) : (
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ marginRight: 16 }}
            />
          )}
          
        </div>

        <Space size="middle">
          {bannedStudents.length > 0 && (
            <Badge count={bannedStudents.length} size="small">
              <Button
                type="text"
                icon={<BellOutlined style={{ color: '#dc2626' }} />}
                onClick={() => setModalOpen(true)}
                style={{ 
                  color: '#dc2626',
                  fontSize: '16px'
                }}
                title={`${bannedStudents.length} ta bloklangan o'quvchi bor`}
              />
            </Badge>
          )}
          
          <NotificationCenter />
          
          <Typography.Text style={{ color: '#6b7280' }}>
            Welcome, {currentUser?.name} (Head Admin)
          </Typography.Text>
          
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Space style={{ cursor: 'pointer' }}>
              <Avatar
                size="small"
                icon={<UserOutlined />}
                style={{ backgroundColor: '#dc2626' }}
              />
              <Typography.Text style={{ color: '#374151' }}>
                {currentUser?.name}
              </Typography.Text>
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
            onClick={handleMenuClick}
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
                <Route path="/" element={<HeadAdminOverview />} />
                <Route path="/admins" element={<ManageAdmins />} />
                <Route path="/add-admin" element={<AddAdmin />} />
                <Route path="/edit-admin/:id" element={<AddAdmin />} />
                <Route path="/admin-details/:id" element={<AdminDetails />} />
                <Route path="/messages" element={<ContactMessages />} />
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

export default HeadAdminDashboard;