import React from 'react';
import { Spin, Typography, Card } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

const { Text } = Typography;

const StudentLoader = ({ 
  loading = true, 
  message = "Ma'lumotlar yuklanmoqda...", 
  size = "large",
  showBackground = true,
  customHeight = "400px"
}) => {
  const antIcon = <LoadingOutlined style={{ fontSize: 32, color: '#3b82f6' }} spin />;

  const loaderContainer = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: customHeight,
    flexDirection: 'column',
    backgroundColor: showBackground ? '#f8fafc' : 'transparent',
    borderRadius: showBackground ? '12px' : '0',
    padding: showBackground ? '48px 24px' : '0',
    margin: showBackground ? '16px 0' : '0',
  };

  const cardStyle = {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: '16px',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
    padding: '48px',
    textAlign: 'center',
    maxWidth: '400px',
    width: '100%',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
  };

  const spinnerContainer = {
    position: 'relative',
    marginBottom: '24px',
  };

  const pulseDots = (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '8px',
      marginTop: '24px',
    }}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#3b82f6',
            animation: `pulse ${1.5 + i * 0.2}s infinite`,
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}
    </div>
  );

  const progressBar = (
    <div style={{
      width: '100%',
      height: '4px',
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderRadius: '2px',
      overflow: 'hidden',
      marginTop: '24px',
    }}>
      <div
        style={{
          width: '70%',
          height: '100%',
          background: 'linear-gradient(90deg, #3b82f6, #8b5cf6, #06b6d4)',
          borderRadius: '2px',
          animation: 'progress 2s ease-in-out infinite',
        }}
      />
    </div>
  );

  return (
    <div style={loaderContainer}>
      <style>{`
        @keyframes pulse {
          0%, 80%, 100% {
            transform: scale(0.8);
            opacity: 0.5;
          }
          40% {
            transform: scale(1);
            opacity: 1;
          }
        }
        
        @keyframes progress {
          0% {
            transform: translateX(-100%);
          }
          50% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        
        .loader-card {
          animation: float 3s ease-in-out infinite;
        }
        
        .ant-spin-dot-item {
          background-color: #3b82f6 !important;
        }
      `}</style>

      <Card style={cardStyle} className="loader-card" bodyStyle={{ padding: '0' }}>
        <div style={spinnerContainer}>
          <Spin 
            indicator={antIcon} 
            size={size}
            style={{ color: '#3b82f6' }}
          />
        </div>
        
        <Text style={{
          color: '#ffffff',
          fontSize: '16px',
          fontWeight: 500,
          display: 'block',
          marginBottom: '16px',
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        }}>
          {message}
        </Text>
        
        {pulseDots}
        {progressBar}
      </Card>
      
      {/* Additional decorative elements */}
      <div style={{
        position: 'absolute',
        top: '20%',
        left: '10%',
        width: '60px',
        height: '60px',
        borderRadius: '50%',
        background: 'linear-gradient(45deg, #3b82f6, #06b6d4)',
        opacity: '0.1',
        animation: 'float 4s ease-in-out infinite',
        animationDelay: '0.5s',
      }} />
      
      <div style={{
        position: 'absolute',
        bottom: '20%',
        right: '10%',
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        background: 'linear-gradient(45deg, #8b5cf6, #ec4899)',
        opacity: '0.1',
        animation: 'float 4s ease-in-out infinite',
        animationDelay: '1s',
      }} />
    </div>
  );
};

// Simple inline loader for quick usage
export const SimpleLoader = ({ message = "Yuklanmoqda...", height = "200px" }) => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: height,
    flexDirection: 'column',
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    margin: '16px 0',
  }}>
    <Spin size="large" style={{ color: '#3b82f6' }} />
    <Text style={{ 
      marginTop: '16px', 
      color: '#64748b',
      fontSize: '14px',
      fontWeight: 500,
    }}>
      {message}
    </Text>
  </div>
);

// Card-based loader for content sections
export const CardLoader = ({ title = "Ma'lumotlar yuklanmoqda", rows = 3 }) => (
  <div style={{
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '24px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  }}>
    <div style={{
      display: 'flex',
      alignItems: 'center',
      marginBottom: '24px',
    }}>
      <div style={{
        width: '32px',
        height: '32px',
        backgroundColor: '#e2e8f0',
        borderRadius: '8px',
        marginRight: '16px',
        animation: 'pulse 1.5s infinite',
      }} />
      <div style={{
        width: '150px',
        height: '20px',
        backgroundColor: '#e2e8f0',
        borderRadius: '4px',
        animation: 'pulse 1.5s infinite',
        animationDelay: '0.2s',
      }} />
    </div>
    
    {[...Array(rows)].map((_, i) => (
      <div
        key={i}
        style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: '16px',
          animation: 'pulse 1.5s infinite',
          animationDelay: `${i * 0.1}s`,
        }}
      >
        <div style={{
          width: '16px',
          height: '16px',
          backgroundColor: '#e2e8f0',
          borderRadius: '50%',
          marginRight: '12px',
        }} />
        <div style={{
          width: `${80 + Math.random() * 20}%`,
          height: '16px',
          backgroundColor: '#e2e8f0',
          borderRadius: '4px',
        }} />
      </div>
    ))}
    
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      marginTop: '24px',
    }}>
      <Spin size="small" style={{ color: '#3b82f6' }} />
    </div>
  </div>
);

export default StudentLoader;