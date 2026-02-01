import React from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { Layout, Breadcrumb } from 'antd';
import { HomeOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
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

const { Content } = Layout;

const StudentDashboard = () => {
  const { isBanned } = useAuth();
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
  };

  const getBreadcrumbItems = () => {
    const items = [
      {
        title: <Link to="/student" style={{ color: '#2563eb', fontWeight: 900, textTransform: 'uppercase', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}><HomeOutlined /> ASOSIY SAHIFA</Link>,
        key: 'home',
      }
    ];

    if (location.pathname.includes('/student-profile/')) {
      items.push({
        key: 'classmates',
        title: <Link to="/student/classmates" style={{ color: '#000', fontWeight: 800, textTransform: 'uppercase', fontSize: '12px' }}>Sinfdoshlar</Link>
      });
      items.push({
        key: 'profile',
        title: <span style={{ color: '#000', fontWeight: 800, textTransform: 'uppercase', fontSize: '12px' }}>Sinfdosh profili</span>
      });
    } else if (location.pathname.includes('/teacher-details/')) {
      items.push({
        key: 'search',
        title: <Link to="/student/search" style={{ color: '#000', fontWeight: 800, textTransform: 'uppercase', fontSize: '12px' }}>O'qituvchilar</Link>
      });
      items.push({
        key: 'teacher',
        title: <span style={{ color: '#000', fontWeight: 800, textTransform: 'uppercase', fontSize: '12px' }}>Ustoz ma'lumotlari</span>
      });
    } else {
      const pathSnippets = location.pathname.split('/').filter((i) => i);
      pathSnippets.forEach((_, index) => {
        const url = `/${pathSnippets.slice(0, index + 1).join('/')}`;
        const title = breadcrumbNameMap[url];
        if (title && url !== '/student') {
          items.push({
            key: url,
            title: <Link to={url} style={{ color: '#000', fontWeight: 800, textTransform: 'uppercase', fontSize: '12px' }}>{title}</Link>
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
            padding: '32px',
            flex: 1,
            height: 'calc(100vh - 96px)',
            border: '4px solid #000',
            boxShadow: '12px 12px 0px #000',
            borderRadius: 0,
            transition: 'all 0.8s cubic-bezier(0.19, 1, 0.22, 1)',
            willChange: 'height, min-height',
            position: 'relative',
            overflowY: 'auto'
          }}
        >
          <div style={{
            position: 'sticky',
            top: '-32px',
            zIndex: 100,
            backgroundColor: '#ffffff',
            paddingBottom: '16px',
            paddingTop: '32px',
            marginTop: '-32px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            borderBottom: '4px solid #000'
          }}>
            <div style={{
              backgroundColor: '#fff',
              padding: '6px 16px',
              border: '2px solid #000',
              boxShadow: '4px 4px 0px rgba(0,0,0,0.1)',
              display: 'inline-block'
            }}>
              <Breadcrumb
                items={breadcrumbItems}
                separator={<span style={{ color: '#000', fontWeight: 900 }}>/</span>}
                style={{ color: '#000' }}
              />
            </div>
          </div>
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

      <UnbanModal
        open={isBanned}
        onClose={() => { }} // Modal cannot be closed manually
      />
    </Layout>
  );
};

export default StudentDashboard;