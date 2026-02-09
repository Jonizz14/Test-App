import React from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { Layout, Breadcrumb } from 'antd';
import { HomeOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { useServerTest } from '../context/ServerTestContext';
import UnbanModal from '../components/UnbanModal';
import 'antd/dist/reset.css';

// Import student sub-pages
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
import TestBank from './student/TestBank';

const { Content } = Layout;

const StudentDashboard = () => {
  const { isBanned } = useAuth();
  const { sessionStarted } = useServerTest();
  const location = useLocation();

  const breadcrumbNameMap = {
    '/student': 'Bosh sahifa',
    '/student/search': 'O\'qituvchilar',
    '/student/classmates': 'Sinfdoshlar',
    '/student/take-test': 'Test topshirish',
    '/student/submit-test': 'Test yuborish',
    '/student/results': 'Natijalar',
    '/student/lessons': 'Darslar',
    '/student/statistics': 'Statistika',
    '/student/profile': 'Profil',
    '/student/pricing': 'Premium',
    '/student/my-class-statistics': 'Sinf statistikasi',
    '/student/students-rating': 'O\'quvchilar reytingi',
    '/student/classes-rating': 'Sinflar reytingi',
    '/student/test-bank': 'Markaziy testlar',
  };

  const getBreadcrumbItems = () => {
    const pathSnippets = location.pathname.split('/').filter((i) => i);

    const renderTitle = (url, title, isHome = false) => {
      const baseStyle = {
        fontWeight: isHome ? 900 : 800,
        textTransform: 'uppercase',
        fontSize: '12px',
        display: isHome ? 'flex' : 'inline-block',
        alignItems: isHome ? 'center' : 'initial',
        gap: isHome ? '4px' : '0'
      };

      if (sessionStarted) {
        return (
          <span style={{
            ...baseStyle,
            color: '#64748b',
            cursor: 'not-allowed',
            opacity: 0.7
          }}>
            {isHome && <HomeOutlined />} {title}
          </span>
        );
      }

      return (
        <Link
          to={url}
          style={{
            ...baseStyle,
            color: isHome ? '#2563eb' : '#000'
          }}
        >
          {isHome && <HomeOutlined />} {title}
        </Link>
      );
    };

    const items = [
      {
        title: renderTitle('/student', 'ASOSIY SAHIFA', true),
        key: 'home',
      }
    ];

    if (location.pathname.includes('/student-profile/')) {
      items.push({
        key: 'classmates',
        title: renderTitle('/student/classmates', 'Sinfdoshlar')
      });
      items.push({
        key: 'profile',
        title: <span style={{ color: sessionStarted ? '#64748b' : '#000', fontWeight: 800, textTransform: 'uppercase', fontSize: '12px', opacity: sessionStarted ? 0.7 : 1 }}>Sinfdosh profili</span>
      });
    } else if (location.pathname.includes('/teacher-details/')) {
      items.push({
        key: 'search',
        title: renderTitle('/student/search', 'O\'qituvchilar')
      });
      items.push({
        key: 'teacher',
        title: <span style={{ color: sessionStarted ? '#64748b' : '#000', fontWeight: 800, textTransform: 'uppercase', fontSize: '12px', opacity: sessionStarted ? 0.7 : 1 }}>Ustoz ma'lumotlari</span>
      });
    } else {
      pathSnippets.forEach((_, index) => {
        const url = `/${pathSnippets.slice(0, index + 1).join('/')}`;
        const title = breadcrumbNameMap[url];
        if (title && url !== '/student') {
          items.push({
            key: url,
            title: renderTitle(url, title)
          });
        }
      });
    }
    return items;
  };

  const breadcrumbItems = getBreadcrumbItems();

  return (
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
            height: 'calc(100vh - 96px)',
            border: '4px solid #000',
            boxShadow: '12px 12px 0px #000',
            borderRadius: 0,
            transition: 'all 0.8s cubic-bezier(0.19, 1, 0.22, 1)',
            willChange: 'height, min-height',
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
            <div id="dashboard-breadcrumb" style={{
              backgroundColor: '#fff',
              padding: '6px 16px',
              border: '2px solid #000',
              boxShadow: '4px 4px 0px rgba(0,0,0,0.1)',
              display: 'inline-block',
              alignSelf: 'flex-start'
            }}>
              <Breadcrumb
                items={breadcrumbItems}
                separator={<span style={{ color: '#000', fontWeight: 900 }}>/</span>}
                style={{ color: '#000' }}
              />
            </div>
            <div style={{ width: 'calc(100% + 56px)', marginLeft: '-28px', height: '4px', backgroundColor: '#000' }}></div>
          </div>
          <div style={{ padding: '0 28px' }}>
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
              <Route path="/test-bank" element={<TestBank />} />
            </Routes>
          </div>
        </div>
      </Content>

      <UnbanModal
        open={isBanned}
        onClose={() => { }} // Modal cannot be closed manually
      />
    </Layout>
  );
};

export default StudentDashboard;