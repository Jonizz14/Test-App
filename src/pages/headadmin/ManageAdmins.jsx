import React, { useState, useEffect } from "react";
import {
  Typography,
  Table,
  Button,
  Tag,
  Input,
  Space,
  Alert,
  Popconfirm,
  Avatar,
  ConfigProvider,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  SearchOutlined,
  EyeOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import apiService from "../../data/apiService";
import 'animate.css';

const { Title, Text, Paragraph } = Typography;

const ManageAdmins = () => {
  const navigate = useNavigate();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const allUsers = await apiService.getUsers();
        const allAdmins = allUsers.filter((user) => user.role === "admin");
        setAdmins(allAdmins);
      } catch (error) {
        console.error("Failed to load data:", error);
        setError("Ma'lumotlarni yuklashda xatolik yuz berdi");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleDelete = async (adminId) => {
    try {
      await apiService.deleteUser(adminId);
      setAdmins(admins.filter((admin) => admin.id !== adminId));
      setSuccess("ADMIN MUVAFFAQIYATLI O'CHIRILDI!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error("Failed to delete admin:", error);
      setError("Adminni o'chirishda xatolik yuz berdi");
    }
  };

  const filteredAdmins = admins.filter(admin => 
    admin.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admin.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    {
      title: 'ISM',
      dataIndex: 'name',
      key: 'name',
      render: (name) => (
        <Space size="middle">
          <Avatar 
            icon={<SafetyCertificateOutlined />} 
            style={{ backgroundColor: '#000', borderRadius: 0, border: '1px solid #000' }}
          />
          <Text style={{ fontWeight: 900, textTransform: 'uppercase' }}>{name}</Text>
        </Space>
      ),
    },
    {
      title: 'EMAIL',
      dataIndex: 'email',
      key: 'email',
      render: (email) => (
        <Text style={{ 
          fontFamily: "monospace", 
          fontWeight: 700,
          border: '1px solid #000',
          padding: '2px 6px',
          backgroundColor: '#eee'
        }}>{email}</Text>
      ),
    },
    {
      title: 'HOLAT',
      key: 'status',
      render: () => (
        <Tag style={{ borderRadius: 0, border: '2px solid #000', fontWeight: 900, backgroundColor: '#000', color: '#fff' }}>FAOL</Tag>
      ),
    },
    {
      title: 'AMALLAR',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Button
            size="small"
            onClick={() => navigate(`/headadmin/admin-details/${record.id}`)}
            icon={<EyeOutlined />}
            style={{ borderRadius: 0, border: '2px solid #000', fontWeight: 800 }}
          >KO'RISH</Button>
          <Button
            size="small"
            onClick={() => navigate(`/headadmin/edit-admin/${record.id}`)}
            icon={<EditOutlined />}
            style={{ borderRadius: 0, border: '2px solid #000', fontWeight: 800 }}
          >TAHRIR</Button>
          <Popconfirm
            title="ADMINNI O'CHIRISH"
            onConfirm={() => handleDelete(record.id)}
            okText="O'CHIRISH"
            cancelText="BEKOR"
          >
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              style={{ borderRadius: 0, border: '2px solid #ff4d4f', fontWeight: 800 }}
            >O'CHIRISH</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <ConfigProvider
      theme={{
        token: {
          borderRadius: 0,
          colorPrimary: '#000',
        },
      }}
    >
      <div style={{ padding: '40px 0' }}>
        {/* Brutalist Header */}
        <div className="animate__animated animate__fadeIn" style={{ marginBottom: '60px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
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
              Boshqaruv
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
              Administratorlar
            </Title>
            <div style={{ 
              width: '80px', 
              height: '10px', 
              backgroundColor: '#000', 
              margin: '24px 0' 
            }}></div>
            <Paragraph style={{ fontSize: '1.2rem', fontWeight: 600, color: '#333', maxWidth: '600px' }}>
              Tizim administratorlarini boshqaring, ularning huquqlarini tahrirlang yoki yangi adminlar qo'shing.
            </Paragraph>
          </div>

          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            onClick={() => navigate("/headadmin/add-admin")}
            style={{
              height: '60px',
              padding: '0 32px',
              fontWeight: 900,
              fontSize: '18px',
              border: '4px solid #000',
              boxShadow: '8px 8px 0px #000',
              textTransform: 'uppercase'
            }}
          >
            Yangi Admin
          </Button>
        </div>

        {success && (
          <Alert
            message={success}
            type="success"
            showIcon
            style={{ borderRadius: 0, border: '3px solid #000', boxShadow: '6px 6px 0px #000', fontWeight: 900, marginBottom: '24px' }}
          />
        )}

        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
            style={{ borderRadius: 0, border: '3px solid #000', boxShadow: '6px 6px 0px #000', fontWeight: 900, marginBottom: '24px' }}
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
            columns={columns}
            dataSource={filteredAdmins}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10 }}
            scroll={{ x: 1000 }}
          />
        </div>
      </div>
    </ConfigProvider>
  );
};

export default ManageAdmins;