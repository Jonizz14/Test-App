import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Layout } from 'antd';
import { useAuth } from '../context/AuthContext';
import 'antd/dist/reset.css';

// Import seller sub-pages
import SellerOverview from './seller/SellerOverview';
import ManageStudents from './seller/ManageStudents';
import ManagePrices from './seller/ManagePrices';

// Import header
import CustomHeader from '../components/Header';

const { Content } = Layout;

const SellerDashboard = () => {
  const { currentUser } = useAuth();

  return (
    <Layout style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <CustomHeader />
      
      <Content
        style={{
          padding: '120px 24px 40px',
          maxWidth: '1900px',
          margin: '0 auto',
          width: '100%',
        }}
      >
        <div
          style={{
            background: '#ffffff',
            padding: '32px',
            minHeight: 'calc(100vh - 200px)',
            border: '4px solid #000',
            boxShadow: '12px 12px 0px #000',
            borderRadius: 0,
            transition: 'all 0.8s cubic-bezier(0.19, 1, 0.22, 1)',
            willChange: 'height, min-height',
            position: 'relative'
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
  );
};

export default SellerDashboard;