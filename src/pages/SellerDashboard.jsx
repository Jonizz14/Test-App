import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Layout } from 'antd';
import { useAuth } from '../context/AuthContext';
import 'antd/dist/reset.css';

// Import seller sub-pages
import SellerOverview from './seller/SellerOverview';
import ManageStudents from './seller/ManageStudents';
import ManagePrices from './seller/ManagePrices';


const { Content } = Layout;

const SellerDashboard = () => {
  const { currentUser } = useAuth();

  return (
    <Layout style={{ height: '100vh', backgroundColor: '#f8fafc', overflow: 'hidden' }}>
      
      <Content
        style={{
          padding: '100px 24px 32px',
          maxWidth: '1900px',
          margin: '0 auto',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <div
          style={{
            background: '#ffffff',
            padding: '32px',
            flex: 1,
            height: 'calc(100vh - 132px)',
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