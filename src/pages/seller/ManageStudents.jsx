import React, { useState, useEffect } from 'react';
import 'animate.css';
import { Typography, Button, Input, Alert, Modal, Row, Col, Card, Table, Tag, Space, Select } from 'antd';
import { SearchOutlined, StarOutlined, StarFilled } from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../data/apiService';
import PremiumModal from '../../components/PremiumModal';
import { useCountdown } from '../../hooks/useCountdown';
import 'antd/dist/reset.css';

// Component for countdown timer
const StudentCountdown = ({ expiryDate }) => {
  const { formattedTime, isExpired } = useCountdown(expiryDate);

  if (isExpired) {
    return <Typography.Text style={{ color: '#ef4444', fontWeight: 600 }}>Tugagan</Typography.Text>;
  }

  return (
    <Typography.Text style={{ color: '#059669', fontWeight: 600, fontFamily: 'monospace' }}>
      {formattedTime}
    </Typography.Text>
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
  const [selectedPricingPlan, setSelectedPricingPlan] = useState(null);
  const [selectedStarPackage, setSelectedStarPackage] = useState(null);

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
      // Revoke premium directly
      revokePremium(student.id);
    } else {
      // Open modal to grant premium with pricing
      setSelectedStudent(student);
      setPremiumModalOpen(true);
    }
  };

  const handleGrantPremium = async (studentId, pricingPlan) => {
    try {
      // Grant premium with pricing information
      const response = await apiService.grantPremium(studentId, pricingPlan.id);

      // Reload students to get updated data
      await loadStudents();
      setSuccessMessage(`Premium berildi: ${pricingPlan.plan_name} - ${pricingPlan.discounted_price}`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Failed to grant premium:', error);
      showError('Premium berishda xatolik yuz berdi');
    }
  };

  const revokePremium = async (studentId) => {
    try {
      await apiService.revokePremium(studentId);

      // Reload students to get updated data
      await loadStudents();
      setSuccessMessage('Premium olib tashlandi');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Failed to revoke premium:', error);
      showError('Premium olib tashlashda xatolik yuz berdi');
    }
  };

  const handleGiveStars = (student) => {
    setSelectedStudent(student);
    setStarsDialogOpen(true);
  };

  const handleGiveStarsConfirm = async (packageData) => {
    try {
      setGivingStars(true);

      const response = await apiService.giveStars(selectedStudent.id, { stars: packageData.stars });

      // Update the student in the local state with the response data
      if (response && response.student) {
        setStudents(prevStudents =>
          prevStudents.map(student =>
            student.id === selectedStudent.id ? response.student : student
          )
        );
        setFilteredStudents(prevFiltered =>
          prevFiltered.map(student =>
            student.id === selectedStudent.id ? response.student : student
          )
        );
      } else {
        // Fallback to reloading if response doesn't contain student data
        await loadStudents();
      }

      setStarsDialogOpen(false);
      setSelectedStudent(null);
      setSuccessMessage(`${packageData.stars} yulduz ${selectedStudent.name}ga berildi!`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Failed to give stars:', error);
      alert('Yulduz berishda xatolik yuz berdi');
    } finally {
      setGivingStars(false);
    }
  };

  const giveStarsToStudent = async (student, packageData) => {
    try {
      setGivingStars(true);

      const response = await apiService.giveStars(student.id, { stars: packageData.stars });

      // Update the student in the local state with the response data
      if (response && response.student) {
        setStudents(prevStudents =>
          prevStudents.map(s =>
            s.id === student.id ? response.student : s
          )
        );
        setFilteredStudents(prevFiltered =>
          prevFiltered.map(s =>
            s.id === student.id ? response.student : s
          )
        );
      } else {
        // Fallback to reloading if response doesn't contain student data
        await loadStudents();
      }

      setSuccessMessage(`${packageData.stars} yulduz ${student.name}ga berildi!`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Failed to give stars:', error);
      alert('Yulduz berishda xatolik yuz berdi');
    } finally {
      setGivingStars(false);
    }
  };

  return (
    <div className="animate__animated animate__fadeIn" style={{ padding: '24px 0' }}>
      {/* Header */}
      <div className="animate__animated animate__fadeInDown" style={{
        marginBottom: '24px',
        paddingBottom: '16px',
        borderBottom: '1px solid #e2e8f0'
      }}>
        <Typography.Title level={1} style={{ margin: 0, color: '#1e293b', marginBottom: '8px' }}>
          O'quvchilarni boshqarish
        </Typography.Title>
        <Typography.Text style={{ fontSize: '18px', color: '#64748b' }}>
          O'quvchilarga premium status bering yoki olib tashlang
        </Typography.Text>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="animate__animated animate__slideInDown" style={{ animationDelay: '200ms' }}>
          <Alert
            message={successMessage}
            type="success"
            showIcon
            style={{ marginBottom: '16px' }}
          />
        </div>
      )}

      {/* Search */}
      <div className="animate__animated animate__fadeInUp" style={{ animationDelay: '300ms', marginBottom: '16px' }}>
        <Input
          placeholder="O'quvchi nomini, ID yoki sinfini qidiring..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          prefix={<SearchOutlined style={{ color: '#64748b' }} />}
          style={{ borderRadius: '12px' }}
        />
      </div>

      {/* Students Table */}
      <div className="animate__animated animate__fadeInUpBig" style={{ animationDelay: '400ms' }}>
        <Table
          dataSource={filteredStudents}
          loading={loading}
          columns={[
            {
              title: 'Ism Familiya',
              dataIndex: 'name',
              key: 'name',
              render: (name) => <Typography.Text strong>{name || 'Noma\'lum'}</Typography.Text>,
            },
            {
              title: 'Login',
              dataIndex: 'display_id',
              key: 'display_id',
              render: (display_id, record) => (
                <Typography.Text style={{ fontFamily: 'monospace', fontSize: '12px', backgroundColor: '#f8fafc', padding: '2px 4px', borderRadius: '4px' }}>
                  {display_id || record.username}
                </Typography.Text>
              ),
            },
            {
              title: 'Sinf',
              dataIndex: 'class_group',
              key: 'class_group',
              render: (class_group) => class_group || 'Noma\'lum',
            },
            {
              title: 'Yo\'nalish',
              dataIndex: 'direction',
              key: 'direction',
              render: (direction) => direction === 'natural' ? 'Tabiiy fanlar' : direction === 'exact' ? 'Aniq fanlar' : 'Yo\'nalish yo\'q',
            },
            {
              title: 'Yulduzlar',
              dataIndex: 'stars',
              key: 'stars',
              render: (stars) => (
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <StarOutlined style={{ marginRight: '4px', color: '#f59e0b' }} />
                  <Typography.Text strong style={{ color: '#d97706' }}>{stars || 0}</Typography.Text>
                </div>
              ),
            },
            {
              title: 'Premium Status',
              dataIndex: 'is_premium',
              key: 'is_premium',
              render: (is_premium) => (
                <Tag color={is_premium ? 'gold' : 'default'} icon={is_premium ? <StarFilled /> : <StarOutlined />}>
                  {is_premium ? 'Premium bor' : 'Yo\'q'}
                </Tag>
              ),
            },
            {
              title: 'Premium vaqti',
              dataIndex: 'premium_expiry_date',
              key: 'premium_expiry_date',
              render: (expiry_date, record) => record.is_premium && expiry_date ? <StudentCountdown expiryDate={expiry_date} /> : '-',
            },
            {
              title: 'Amallar',
              key: 'actions',
              render: (_, record) => (
                <Space orientation="vertical" size="small">
                  <div>
                    <Typography.Text style={{ fontSize: '12px', color: '#64748b' }}>Premium:</Typography.Text>
                    {record.is_premium ? (
                      <Button
                        size="small"
                        onClick={() => handleTogglePremium(record, record.is_premium)}
                        style={{
                          borderColor: '#d97706',
                          color: '#d97706',
                          fontSize: '11px',
                          padding: '0 8px',
                          height: '20px',
                          marginLeft: '8px'
                        }}
                      >
                        Olib tashlash
                      </Button>
                    ) : (
                      <Select
                        size="small"
                        placeholder="Tanlang"
                        style={{ width: 200, marginLeft: '8px', fontSize: '11px' }}
                        onChange={(value) => {
                          const plan = pricingPlans.find(p => p.id === value);
                          if (plan) {
                            handleGrantPremium(record.id, plan);
                          }
                        }}
                        options={pricingPlans.map(plan => ({
                          value: plan.id,
                          label: `${plan.plan_name} (${plan.discounted_price})`
                        }))}
                      />
                    )}
                  </div>
                  <div>
                    <Typography.Text style={{ fontSize: '12px', color: '#64748b' }}>Yulduz:</Typography.Text>
                    <Select
                      size="small"
                      placeholder="Tanlang"
                      style={{ width: 200, marginLeft: '8px', fontSize: '11px' }}
                      onChange={(value) => {
                        const pkg = starPackages.find(p => p.id === value);
                        if (pkg) {
                          giveStarsToStudent(record, pkg);
                        }
                      }}
                      options={starPackages.map(pkg => ({
                        value: pkg.id,
                        label: `${pkg.stars} yulduz (${pkg.discounted_price})`
                      }))}
                    />
                  </div>
                </Space>
              ),
            },
          ]}
          rowKey="id"
          locale={{
            emptyText: searchTerm ? 'Hech narsa topilmadi' : 'O\'quvchilar yo\'q',
          }}
          onRow={(record, index) => ({
            className: 'animate__animated animate__fadeInLeft',
            style: { 
              animationDelay: `${index * 100}ms`,
              transition: 'all 0.3s ease'
            },
            onMouseEnter: (e) => {
              e.currentTarget.style.transform = 'scale(1.02)';
            },
            onMouseLeave: (e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }
          })}
          scroll={{ x: 800 }}
        />
      </div>

      {/* Premium Modal */}
      <PremiumModal
        open={premiumModalOpen}
        onClose={() => {
          setPremiumModalOpen(false);
          setSelectedStudent(null);
        }}
        student={selectedStudent}
        onConfirm={handleGrantPremium}
      />

      {/* Stars Modal */}
      {selectedStudent && (
        <Modal
          title={`${selectedStudent.name}ga yulduz berish`}
          open={starsDialogOpen}
          onCancel={() => {
            setStarsDialogOpen(false);
            setSelectedStudent(null);
          }}
          footer={[
            <Button key="cancel" onClick={() => {
              setStarsDialogOpen(false);
              setSelectedStudent(null);
            }}>
              Bekor qilish
            </Button>,
          ]}
        >
          <Typography.Text style={{ marginBottom: '16px', color: '#64748b' }}>
            Qaysi yulduz paketini tanlaysiz?
          </Typography.Text>

          <Row gutter={16}>
            {starPackages.map((pkg) => (
              <Col xs={24} sm={12} md={8} key={pkg.id}>
                <Card
                  hoverable
                  style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    textAlign: 'center'
                  }}
                >
                  <div style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                      <StarOutlined style={{ fontSize: '32px', color: '#f59e0b', marginRight: '8px' }} />
                      <Typography.Title level={2} style={{ margin: 0, color: '#d97706' }}>
                        {pkg.stars}
                      </Typography.Title>
                    </div>

                    <Typography.Text strong style={{ display: 'block', marginBottom: '8px' }}>
                      ${pkg.discounted_price}
                    </Typography.Text>

                    {pkg.discount_percentage > 0 && (
                      <Typography.Text style={{ fontSize: '12px', color: '#059669', display: 'block', marginBottom: '16px' }}>
                        {pkg.discount_percentage}% chegirma
                      </Typography.Text>
                    )}

                    <Button
                      type="primary"
                      block
                      onClick={() => giveStarsToStudent(selectedStudent, pkg)}
                      disabled={givingStars}
                      style={{ backgroundColor: '#f59e0b', borderColor: '#f059e0b' }}
                    >
                      {givingStars ? 'Berilmoqda...' : 'Tanlash'}
                    </Button>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </Modal>
      )}
    </div>
  );
};

export default ManageStudents;