import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Layout } from 'antd';
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

  return (
    <Layout style={{ height: '100vh', backgroundColor: '#f8fafc', overflow: 'hidden' }}>

      <Content
        style={{
          padding: '64px 24px 32px',
          maxWidth: '1900px',
          margin: '0 auto',
          marginTop: '40px',
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