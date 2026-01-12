import React from 'react';
import {
  Drawer,
  Button,
  Typography,
  Space,
  Tag,
  Row,
  Col,
  Divider,
} from 'antd';
import {
  CloseOutlined,
  StopOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import 'animate.css';

const { Title, Text, Paragraph } = Typography;

const BannedStudentsModal = ({ open, onClose, bannedStudents, onUnbanStudent }) => {
  return (
    <Drawer
      placement="bottom"
      open={open}
      onClose={onClose}
      height="80vh"
      title={
        <Space size="middle">
          <StopOutlined style={{ color: '#000', fontSize: '24px' }} />
          <div>
            <Title level={4} style={{ margin: 0, fontWeight: 900, textTransform: 'uppercase' }}>Bloklangan o'quvchilar</Title>
            <Text style={{ fontWeight: 700, color: '#666' }}>{bannedStudents.length} TA BLOKLANGAN O'QUVCHI</Text>
          </div>
        </Space>
      }
      closeIcon={<CloseOutlined style={{ fontSize: '20px', color: '#000' }} />}
      styles={{
        header: { borderBottom: '4px solid #000', padding: '24px' },
        body: { padding: '32px', backgroundColor: '#fff' }
      }}
    >
      <div className="animate__animated animate__fadeIn">
        {bannedStudents.length > 0 ? (
          <Row gutter={[24, 24]}>
            {bannedStudents.map((student) => (
              <Col xs={24} sm={12} md={8} key={student.id}>
                <div style={{ 
                  padding: '24px', 
                  border: '4px solid #000', 
                  boxShadow: '8px 8px 0px #000', 
                  backgroundColor: '#fff',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <Text style={{ fontSize: '18px', fontWeight: 900, textTransform: 'uppercase' }}>{student.name}</Text>
                    <Tag style={{ 
                      borderRadius: 0, 
                      border: '2px solid #000', 
                      backgroundColor: '#000', 
                      color: '#fff', 
                      fontWeight: 800,
                      margin: 0
                    }}>BLOKLANGAN</Tag>
                  </div>

                  <Space direction="vertical" style={{ flex: 1 }}>
                    <Text style={{ display: 'block' }}><strong>ID:</strong> <span style={{ fontFamily: 'monospace' }}>{student.display_id || student.username}</span></Text>
                    <Text style={{ display: 'block' }}><strong>SABAB:</strong> {student.ban_reason || 'Noma\'lum'}</Text>
                    <Text style={{ display: 'block' }}><strong>SANA:</strong> {student.ban_date ? new Date(student.ban_date).toLocaleDateString('uz-UZ') : 'Noma\'lum'}</Text>
                    {student.unban_code && (
                      <div style={{ 
                        marginTop: '12px', 
                        padding: '8px 12px', 
                        border: '2px solid #000', 
                        backgroundColor: '#eee', 
                        display: 'inline-block',
                        fontWeight: 900,
                        fontFamily: 'monospace'
                      }}>
                        KOD: {student.unban_code}
                      </div>
                    )}
                  </Space>

                  <Divider style={{ borderTop: '2px solid #000', margin: '20px 0' }} />

                  <Button
                    icon={<CheckCircleOutlined />}
                    onClick={() => onUnbanStudent(student.id)}
                    style={{ 
                      borderRadius: 0, 
                      border: '3px solid #000', 
                      fontWeight: 900, 
                      height: '45px',
                      textTransform: 'uppercase'
                    }}
                  >
                    Blokdan chiqarish
                  </Button>
                </div>
              </Col>
            ))}
          </Row>
        ) : (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <Title level={3} style={{ fontWeight: 900, color: '#999' }}>BLOKLANGAN O'QUVCHILAR YO'Q</Title>
            <Text style={{ fontWeight: 700, color: '#ccc' }}>Hozirda barcha o'quvchilar faol</Text>
          </div>
        )}
      </div>

      <div style={{ marginTop: '40px', textAlign: 'right' }}>
        <Button 
          type="primary" 
          size="large" 
          onClick={onClose}
          style={{ 
            borderRadius: 0, 
            border: '4px solid #000', 
            backgroundColor: '#000', 
            color: '#fff', 
            fontWeight: 900,
            height: '60px',
            padding: '0 40px'
          }}
        >
          YOPISH
        </Button>
      </div>
    </Drawer>
  );
};

export default BannedStudentsModal;