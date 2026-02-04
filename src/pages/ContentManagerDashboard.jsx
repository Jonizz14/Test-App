import React from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Button, Typography, Dropdown, Space, Breadcrumb, ConfigProvider } from 'antd';
import {
    HomeOutlined,
    FileTextOutlined,
    PlusOutlined,
    BarChartOutlined,
    LogoutOutlined,
    UserOutlined,
    GlobalOutlined
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import NotificationCenter from '../components/NotificationCenter';
import 'animate.css';

// Import specialized content-manager sub-pages
import ContentManagerOverview from './content-manager/ContentManagerOverview';
import ContentManagerCreateTest from './content-manager/ContentManagerCreateTest';
import ContentManagerTests from './content-manager/ContentManagerTests';
import ContentManagerStatistics from './content-manager/ContentManagerStatistics';
import TestDetails from './teacher/TestDetails';
import StudentResult from './teacher/StudentResult';
import StudentProfileView from './student/StudentProfileView';

const { Header, Content } = Layout;

const ContentManagerDashboard = () => {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const breadcrumbNameMap = {
        '/content-manager': 'Bosh sahifa',
        '/content-manager/create-test': 'Test yaratish',
        '/content-manager/my-tests': 'Mening testlarim',
        '/content-manager/statistics': 'Statistika',
    };

    const getBreadcrumbItems = () => {
        const items = [
            {
                title: <Link to="/content-manager" style={{ color: '#2563eb', fontWeight: 900, textTransform: 'uppercase', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}><HomeOutlined /> ASOSIY SAHIFA</Link>,
                key: 'home',
            }
        ];

        const pathSnippets = location.pathname.split('/').filter((i) => i);
        pathSnippets.forEach((_, index) => {
            const url = `/${pathSnippets.slice(0, index + 1).join('/')}`;
            const title = breadcrumbNameMap[url];
            if (title && url !== '/content-manager') {
                items.push({
                    key: url,
                    title: <Link to={url} style={{ color: '#000', fontWeight: 800, textTransform: 'uppercase', fontSize: '12px' }}>{title}</Link>
                });
            }
        });
        return items;
    };

    return (
        <ConfigProvider
            theme={{
                token: {
                    borderRadius: 0,
                    colorPrimary: '#000',
                },
            }}
        >
            <Layout style={{ height: '100vh', backgroundColor: '#f8fafc', overflow: 'hidden' }}>
                <Content
                    style={{
                        padding: '24px',
                        maxWidth: '1900px',
                        margin: '0 auto',
                        marginTop: '120px',
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column'
                    }}
                >
                    <div
                        id="dashboard-content-container"
                        data-lenis-prevent
                        className="animate__animated animate__fadeIn"
                        style={{
                            background: '#ffffff',
                            paddingTop: '28px',
                            paddingBottom: '28px',
                            flex: 1,
                            height: 'calc(100vh - 128px)',
                            border: '4px solid #000',
                            boxShadow: '12px 12px 0px #000',
                            borderRadius: 0,
                            position: 'relative',
                            overflow: 'auto'
                        }}
                    >
                        <div style={{
                            position: 'sticky',
                            top: '-28px',
                            zIndex: 100,
                            backgroundColor: '#ffffff',
                            paddingBottom: '16px',
                            paddingTop: '28px',
                            paddingLeft: '28px',
                            paddingRight: '28px',
                            marginTop: '-28px',
                            marginBottom: '16px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '16px'
                        }}>
                            <div style={{
                                backgroundColor: '#fff',
                                padding: '6px 16px',
                                border: '2px solid #000',
                                boxShadow: '4px 4px 0px rgba(0,0,0,0.1)',
                                display: 'inline-block',
                                alignSelf: 'flex-start'
                            }}>
                                <Breadcrumb
                                    items={getBreadcrumbItems()}
                                    separator={<span style={{ color: '#000', fontWeight: 900 }}>/</span>}
                                />
                            </div>
                            <div style={{ width: 'calc(100% + 56px)', marginLeft: '-28px', height: '4px', backgroundColor: '#000' }}></div>
                        </div>

                        <div style={{ padding: '0 28px' }}>
                            <Routes>
                                <Route path="/" element={<ContentManagerOverview />} />
                                <Route path="/create-test" element={<ContentManagerCreateTest />} />
                                <Route path="/edit-test/:testId" element={<ContentManagerCreateTest />} />
                                <Route path="/my-tests" element={<ContentManagerTests />} />
                                <Route path="/test-details/:testId" element={<TestDetails />} />
                                <Route path="/student-result/:attemptId" element={<StudentResult />} />
                                <Route path="/student-profile/:id" element={<StudentProfileView />} />
                                <Route path="/statistics" element={<ContentManagerStatistics />} />
                            </Routes>
                        </div>
                    </div>
                </Content>
            </Layout>
        </ConfigProvider>
    );
};

export default ContentManagerDashboard;
