import React, { useState, useEffect } from "react";
import {
  Typography,
  Table,
  Button,
  Tag,
  Modal,
  Input,
  Space,
  Alert,
  Popconfirm,
  Avatar,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  SearchOutlined,
  EyeOutlined,
  SafetyCertificateOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import apiService from "../../data/apiService";

const { Title, Text } = Typography;
const { Search } = Input;

const ManageAdmins = () => {
  const navigate = useNavigate();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // Load admins from API
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
      // Remove from local state
      setAdmins(admins.filter((admin) => admin.id !== adminId));
      setSuccess("Admin muvaffaqiyatli o'chirildi!");
    } catch (error) {
      console.error("Failed to delete admin:", error);
      setError("Adminni o'chirishda xatolik yuz berdi");
    }
  };

  const handleEditClick = (admin) => {
    navigate(`/headadmin/edit-admin/${admin.id}`);
  };

  const handleDetailsClick = (admin) => {
    navigate(`/headadmin/admin-details/${admin.id}`);
  };

  const columns = [
    {
      title: 'Ism',
      dataIndex: 'name',
      key: 'name',
      render: (name, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Avatar 
            icon={<SafetyCertificateOutlined />} 
            style={{ backgroundColor: '#dc2626' }}
          />
          <Text strong style={{ color: '#1e293b' }}>
            {name}
          </Text>
        </div>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      render: (email) => (
        <Text
          style={{
            fontFamily: "monospace",
            fontWeight: 600,
            fontSize: "12px",
            backgroundColor: "#fef2f2",
            padding: "4px 8px",
            borderRadius: "6px",
            color: "#dc2626",
          }}
        >
          {email}
        </Text>
      ),
    },
    {
      title: 'Tashkilot',
      dataIndex: 'organization',
      key: 'organization',
      render: (organization) => (
        <Text style={{ color: "#64748b" }}>
          {organization || '-'}
        </Text>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      render: () => (
        <Tag color="success">Faol</Tag>
      ),
    },
    {
      title: "Ro'yxatdan o'tgan",
      dataIndex: 'registration_date',
      key: 'registration_date',
      render: (date) => (
        <Text style={{ color: "#64748b" }}>
          {date ? new Date(date).toLocaleDateString('uz-UZ') : 'Noma\'lum'}
        </Text>
      ),
    },
    {
      title: 'Harakatlar',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Button
            size="small"
            type="default"
            onClick={() => handleDetailsClick(record)}
            icon={<EyeOutlined />}
            style={{
              fontSize: "12px",
              padding: "4px 8px",
              borderColor: "#dc2626",
              color: "#dc2626",
              height: "auto",
            }}
          >
            Batafsil
          </Button>

          <Button
            size="small"
            type="text"
            onClick={() => handleEditClick(record)}
            icon={<EditOutlined />}
            style={{
              color: "#059669",
            }}
          >
            Tahrirlash
          </Button>
          
          <Popconfirm
            title="Adminni o'chirishni tasdiqlang"
            description="Haqiqatan ham ushbu adminni o'chirishni xohlaysizmi?"
            onConfirm={() => handleDelete(record.id)}
            okText="O'chirish"
            cancelText="Bekor qilish"
            okButtonProps={{ danger: true }}
          >
            <Button
              size="small"
              type="text"
              icon={<DeleteOutlined />}
              style={{
                color: "#dc2626",
              }}
            >
              O'chirish
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px 0' }}>
      {/* Header */}
      <div style={{
        marginBottom: '24px',
        paddingBottom: '16px',
        borderBottom: '1px solid #e2e8f0'
      }}>
        <Title level={1} style={{ margin: 0, color: '#1e293b', marginBottom: '8px' }}>
          Administratorlarni boshqarish
        </Title>
        <Text style={{ fontSize: '18px', color: '#64748b' }}>
          Adminlar ma'lumotlarini boshqaring va yangi adminlar qo'shing
        </Text>
      </div>

      {/* Search and Add Button */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px',
        gap: '16px',
      }}>
        <Search
          placeholder="Admin nomi yoki emailini qidirish..."
          allowClear
          style={{
            maxWidth: '400px',
          }}
          prefix={<SearchOutlined style={{ color: '#64748b' }} />}
          onChange={(e) => {
            // In a real implementation, you'd filter the data here
            // For now, we'll just show all admins
          }}
        />
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate("/headadmin/add-admin")}
          style={{
            backgroundColor: "#dc2626",
            borderColor: "#dc2626",
            fontWeight: 600,
          }}
        >
          Admin qo'shish
        </Button>
      </div>

      {/* Success Message */}
      {success && (
        <Alert
          message={success}
          type="success"
          showIcon
          style={{ marginBottom: '16px' }}
        />
      )}

      {/* Error Message */}
      {error && (
        <Alert
          message={error}
          type="error"
          showIcon
          style={{ marginBottom: '16px' }}
        />
      )}

      {/* Table */}
      <Table
        columns={columns}
        dataSource={admins}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} / ${total} admin`,
        }}
        locale={{
          emptyText: 'Adminlar topilmadi',
        }}
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          overflow: 'hidden',
        }}
      />
    </div>
  );
};

export default ManageAdmins;