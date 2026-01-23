import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Layout } from 'antd';
import { useAuth } from '../context/AuthContext';
import apiService from '../data/apiService';
import BannedStudentsModal from '../components/BannedStudentsModal';
import 'antd/dist/reset.css';

// Import head admin sub-pages
import HeadAdminOverview from './headadmin/HeadAdminOverview';
import ManageAdmins from './headadmin/ManageAdmins';
import AddAdmin from './headadmin/AddAdmin';
import AdminDetails from './headadmin/AdminDetails';
import ContactMessages from './headadmin/ContactMessages';
import AppSettings from './headadmin/AppSettings';
import ManageNews from './headadmin/ManageNews';

const { Content } = Layout;

const HeadAdminDashboard = () => {
  const [bannedStudents, setBannedStudents] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const { currentUser } = useAuth();

  useEffect(() => {
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

  const handleUnbanStudent = async (studentId) => {
    try {
      await apiService.unbanUser(studentId);
      const usersData = await apiService.getUsers();
      const users = usersData.results || usersData;
      setBannedStudents(users.filter(user => user.role === 'student' && user.is_banned));
    } catch (error) {
      console.error('Failed to unban student:', error);
    }
  };

  return (
    <Layout style={{ height: '100vh', backgroundColor: '#f8fafc', overflow: 'hidden' }}>

      <Content
        style={{
          padding: '64px 24px 32px',
          maxWidth: '1900px',
          margin: '0 auto',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <div
          id="dashboard-content-container"
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
            <Route path="/" element={<HeadAdminOverview />} />
            <Route path="/admins" element={<ManageAdmins />} />
            <Route path="/add-admin" element={<AddAdmin />} />
            <Route path="/edit-admin/:id" element={<AddAdmin />} />
            <Route path="/admin-details/:id" element={<AdminDetails />} />
            <Route path="/messages" element={<ContactMessages />} />
            <Route path="/updates" element={<ManageNews />} />
            <Route path="/settings" element={<AppSettings />} />
          </Routes>
        </div>
      </Content>

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