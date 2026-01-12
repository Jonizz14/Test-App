import React, { useState, useEffect } from 'react';
import 'animate.css';
import { Typography, Button, Input, Alert, Modal, Row, Col, Card, Table, Tag, Space, Select, ConfigProvider } from 'antd';
import { SearchOutlined, StarOutlined, StarFilled } from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../data/apiService';
import PremiumModal from '../../components/PremiumModal';
import { useCountdown } from '../../hooks/useCountdown';

const { Title, Text, Paragraph } = Typography;

// Component for countdown timer
const StudentCountdown = ({ expiryDate }) => {
  const { formattedTime, isExpired } = useCountdown(expiryDate);

  if (isExpired) {
    return <Text style={{ color: '#000', fontWeight: 900, textTransform: 'uppercase' }}>Tugagan</Text>;
  }

  return (
    <Text style={{ color: '#000', fontWeight: 900, fontFamily: 'monospace', fontSize: '14px' }}>
      {formattedTime}
    </Text>
  );
};

const ManageStudents = () => {
  const { currentUser } = useAuth();
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [premiumModalOpen, setPremiumModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [starPackages, setStarPackages] = useState([]);
  const [starsDialogOpen, setStarsDialogOpen] = useState(false);
  const [givingStars, setGivingStars] = useState(false);
  const [pricingPlans, setPricingPlans] = useState([]);

  useEffect(() => {
    loadStudents();
  }, []);

  useEffect(() => {
    filterStudents();
  }, [students, searchTerm]);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const [usersData, packagesResponse, pricingResponse] = await Promise.all([
        apiService.getUsers(),
        apiService.get('/star-packages/'),
        apiService.get('/pricing/')
      ]);
      const users = usersData.results || usersData;
      const studentUsers = users.filter(user => user.role === 'student');
      setStudents(studentUsers);
      setStarPackages(packagesResponse.results || packagesResponse || []);
      setPricingPlans(pricingResponse.results || pricingResponse || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterStudents = () => {
    if (!searchTerm) {
      setFilteredStudents(students);
    } else {
      const filtered = students.filter(student =>
        student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.display_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.class_group?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredStudents(filtered);
    }
  };

  const handleTogglePremium = (student, currentStatus) => {
    if (currentStatus) {
      revokePremium(student.id);
    } else {
      setSelectedStudent(student);
      setPremiumModalOpen(true);
    }
  };

  const handleGrantPremium = async (studentId, pricingPlan) => {
    try {
      await apiService.grantPremium(studentId, pricingPlan.id);
      await loadStudents();
      setSuccessMessage(`MAVJUD: ${pricingPlan.plan_name}`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Failed to grant premium:', error);
    }
  };

  const revokePremium = async (studentId) => {
    try {
      await apiService.revokePremium(studentId);
      await loadStudents();
      setSuccessMessage('PREMIUM OLIB TASHLANDI');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Failed to revoke premium:', error);
    }
  };

  const giveStarsToStudent = async (student, packageData) => {
    try {
      setGivingStars(true);
      const response = await apiService.giveStars(student.id, { stars: packageData.stars });
      await loadStudents();
      setSuccessMessage(`${packageData.stars} YULDUZ BERILDI!`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Failed to give stars:', error);
    } finally {
      setGivingStars(false);
    }
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
      <div className="animate__animated animate__fadeIn" style={{ padding: '40px 0' }}>
        {/* Header */}
        <div className="animate__animated animate__fadeIn" style={{ marginBottom: '60px' }}>
          <div style={{ 
            display: 'inline-block', 
            backgroundColor: '#000', 
            color: '#fff', 
            padding: '8px 16px', 
            fontWeight: 900, 
            fontSize: '14px',
            textTransform: 'uppercase',
            letterSpacing: '0.2em',
            marginBottom: '16px'
          }}>
            Oquvchilarni boshqarish
          </div>
          <Title level={1} style={{ 
            margin: 0, 
            fontWeight: 900, 
            fontSize: '2.5rem', 
            lineHeight: 0.9, 
            textTransform: 'uppercase',
            letterSpacing: '-0.05em',
            color: '#000'
          }}>
            O'quvchilar Ro'yxati
          </Title>
          <div style={{ 
            width: '80px', 
            height: '10px', 
            backgroundColor: '#000', 
            margin: '24px 0' 
          }}></div>
          <Paragraph style={{ fontSize: '1.2rem', fontWeight: 600, color: '#333', maxWidth: '600px' }}>
            O'quvchilarga premium status bering, yulduzlar qo'shing yoki ularning holatini kuzatib boring.
          </Paragraph>
        </div>

        {successMessage && (
          <Alert
            message={successMessage}
            type="success"
            showIcon
            style={{ 
              borderRadius: 0, 
              border: '3px solid #000', 
              boxShadow: '6px 6px 0px #000',
              fontWeight: 900,
              marginBottom: '24px',
              backgroundColor: '#fff'
            }}
          />
        )}

        {/* Search Input */}
        <div className="animate__animated animate__fadeIn" style={{ marginBottom: '32px' }}>
          <Input
            placeholder="QIDIRISH..."
            size="large"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            prefix={<SearchOutlined style={{ color: '#000' }} />}
            style={{ 
              borderRadius: 0, 
              border: '4px solid #000', 
              boxShadow: '8px 8px 0px #000',
              height: '60px',
              fontSize: '18px',
              fontWeight: 800
            }}
          />
        </div>

        {/* Table Section */}
        <div className="animate__animated animate__fadeIn" style={{ border: '4px solid #000', boxShadow: '12px 12px 0px #000', backgroundColor: '#fff' }}>
          <Table
            dataSource={filteredStudents}
            loading={loading}
            rowKey="id"
            pagination={{ pageSize: 10, position: ['bottomCenter'] }}
            columns={[
              {
                title: 'O\'QUVCHI',
                dataIndex: 'name',
                key: 'name',
                render: (name) => <Text style={{ fontWeight: 900, textTransform: 'uppercase' }}>{name || 'Noma\'lum'}</Text>,
              },
              {
                title: 'ID / LOGIN',
                dataIndex: 'display_id',
                key: 'display_id',
                render: (id, rec) => <Text style={{ fontFamily: 'monospace', fontWeight: 700 }}>{id || rec.username}</Text>,
              },
              {
                title: 'SINF',
                dataIndex: 'class_group',
                key: 'class_group',
                render: (txt) => <Text style={{ fontWeight: 800 }}>{txt || '-'}</Text>,
              },
              {
                title: 'YULDUZLAR',
                dataIndex: 'stars',
                key: 'stars',
                render: (stars) => (
                  <Space>
                    <StarFilled style={{ color: '#000' }} />
                    <Text style={{ fontWeight: 900 }}>{stars || 0}</Text>
                  </Space>
                ),
              },
              {
                title: 'STATUS',
                dataIndex: 'is_premium',
                key: 'is_premium',
                render: (is_p, record) => (
                  <div style={{ 
                    border: '2px solid #000', 
                    padding: '4px 8px', 
                    backgroundColor: is_p ? '#000' : '#fff',
                    color: is_p ? '#fff' : '#000',
                    fontWeight: 900,
                    textAlign: 'center',
                    fontSize: '12px',
                    textTransform: 'uppercase'
                  }}>
                    {is_p ? (record.premium_plan?.plan_name || 'MAXSUS') : 'ODDIY'}
                  </div>
                ),
              },
              {
                title: 'TARIF VAQTI',
                dataIndex: 'premium_expiry_date',
                key: 'premium_expiry_date',
                render: (date, record) => record.is_premium ? (
                  <div style={{ border: '2px solid #000', padding: '4px 8px', display: 'inline-block' }}>
                    <StudentCountdown expiryDate={date} />
                  </div>
                ) : '-',
              },
              {
                title: 'AMALLAR',
                key: 'actions',
                render: (_, record) => (
                  <Space size="middle">
                    {!record.is_premium && (
                      <Select
                        placeholder="TARIF TANLASH"
                        style={{ width: 140 }}
                        size="small"
                        onChange={(val) => {
                          const plan = pricingPlans.find(p => p.id === val);
                          if (plan) handleGrantPremium(record.id, plan);
                        }}
                        options={pricingPlans.map(p => ({ value: p.id, label: p.plan_name }))}
                      />
                    )}
                    {record.is_premium && (
                      <Button 
                        size="small" 
                        onClick={() => handleTogglePremium(record, record.is_premium)}
                        style={{ 
                          borderRadius: 0, 
                          border: '2px solid #000', 
                          fontWeight: 900,
                          backgroundColor: '#fff',
                          color: '#000'
                        }}
                      >
                        OLIB TASHLASH
                      </Button>
                    )}
                    <Select
                      placeholder="+ YULDUZ"
                      style={{ width: 120 }}
                      size="small"
                      onChange={(val) => {
                        const pkg = starPackages.find(p => p.id === val);
                        if (pkg) giveStarsToStudent(record, pkg);
                      }}
                      options={starPackages.map(p => ({ value: p.id, label: `+${p.stars}` }))}
                    />
                  </Space>
                ),
              },
            ]}
            scroll={{ x: 1000 }}
          />
        </div>
      </div>
    </ConfigProvider>
  );
};

export default ManageStudents;