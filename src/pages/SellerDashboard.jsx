import React, { useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Button, Typography, Avatar, Dropdown, Space, Grid } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  HomeOutlined,
  UsergroupAddOutlined,
  DollarOutlined,
  LogoutOutlined,
  SettingOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import 'antd/dist/reset.css';

// Import seller sub-pages
import SellerOverview from './seller/SellerOverview';
import ManageStudents from './seller/ManageStudents';
import ManagePrices from './seller/ManagePrices';

const { Header, Sider, Content } = Layout;
const { useBreakpoint } = Grid;

const SellerDashboard = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const screens = useBreakpoint();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    {
      key: '/seller',
      icon: <HomeOutlined />,
      label: 'Umumiy',
    },
    {
      key: '/seller/students',
      icon: <UsergroupAddOutlined />,
      label: "O'quvchilarni boshqarish",
    },
    {
      key: '/seller/prices',
      icon: <DollarOutlined />,
      label: "Narxlarni boshqarish",
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
          
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Space style={{ cursor: 'pointer' }}>
              <Avatar
                size="small"
                icon={<UserOutlined />}
                style={{ backgroundColor: '#1890ff' }}
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
                <Route path="/" element={<SellerOverview />} />
                <Route path="/students" element={<ManageStudents />} />
                <Route path="/prices" element={<ManagePrices />} />
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

export default SellerDashboard;