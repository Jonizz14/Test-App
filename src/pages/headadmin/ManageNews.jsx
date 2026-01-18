import React, { useState } from 'react';
import { useNews } from '../../context/NewsContext';
import { 
  Button, 
  Input, 
  Select, 
  Upload, 
  Card, 
  List, 
  message, 
  Typography, 
  Space, 
  ConfigProvider, 
  Row, 
  Col,
  Alert 
} from 'antd';
import { UploadOutlined, DeleteOutlined, EditOutlined, PlusOutlined, FileImageOutlined } from '@ant-design/icons';
import 'animate.css';

const { TextArea } = Input;
const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

const ManageNews = () => {
  const { news, addNews, deleteNews, updateNews } = useNews();
  const [editingId, setEditingId] = useState(null);
  
  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [mediaType, setMediaType] = useState('image');
  const [mediaUrl, setMediaUrl] = useState('');
  const [fileList, setFileList] = useState([]);

  // Handle File Upload (Convert to Base64 for local storage demo)
  const handleUpload = ({ file }) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setMediaUrl(e.target.result);
      setFileList([file]);
      message.success('Media yuklandi!');
    };
    reader.readAsDataURL(file);
    return false; // Prevent auto upload
  };

  const handleSubmit = async () => {
    if (!title || !description) {
      message.error('Iltimos, sarlavha va matnni kiriting!');
      return;
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('media_type', mediaType);

    if (fileList.length > 0) {
      // fileList[0] is dependent on how Ant Design Upload returns it, usually it's fileList[0].originFileObj if using default
      // but here we set it manually in handleUpload: setFileList([file])
      formData.append('media_file', fileList[0]);
    }

    try {
      if (editingId) {
        await updateNews(editingId, formData);
        message.success('Yangilik tahrirlandi!');
        setEditingId(null);
      } else {
        await addNews(formData);
        message.success('Yangilik qo\'shildi!');
      }

      // Reset Form
      setTitle('');
      setDescription('');
      setMediaUrl('');
      setFileList([]);
      setMediaType('image');
    } catch (error) {
      console.error(error);
      message.error('Xatolik yuz berdi');
    }
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setTitle(item.title);
    setDescription(item.description);
    setMediaType(item.media_type);
    setMediaUrl(item.media_file);
    setFileList([]); // Clear file list visual, though URL persists
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    try {
      await deleteNews(id);
      message.success('O\'chirildi');
    } catch (error) {
      message.error('Xatolik');
    }
  };

  // Common Card Style
  const cardStyle = {
    borderRadius: 0,
    border: '4px solid #000',
    boxShadow: '10px 10px 0px #000',
    marginBottom: '24px'
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          borderRadius: 0,
          colorPrimary: '#000',
          fontFamily: "'Inter', sans-serif",
        },
        components: {
          Button: {
            colorPrimary: '#000',
            algorithm: true,
          },
          Input: {
            activeBorderColor: '#000',
            hoverBorderColor: '#000',
          }
        }
      }}
    >
      <div style={{ padding: '24px 0' }}>
        
        {/* Header Section */}
        {/* Header Section */}
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
            Yangilanishlar
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
            Yangiliklarni Boshqarish
          </Title>
          <div style={{ 
            width: '80px', 
            height: '10px', 
            backgroundColor: '#000', 
            margin: '24px 0' 
          }}></div>
          <Paragraph style={{ fontSize: '1.2rem', fontWeight: 600, color: '#333', maxWidth: '600px' }}>
            Sayt foydalanuvchilariga ko'rinadigan yangiliklar va o'zgarishlarni shu yerdan boshqaring.
          </Paragraph>
        </div>

        <Row gutter={40}>
          {/* Form Side - Left Half */}
          <Col xs={24} lg={12}>
            <div className="animate__animated animate__fadeIn">
              <Card 
                title={
                  <span style={{ textTransform: 'uppercase', fontWeight: 900, fontSize: '1.2rem' }}>
                     {editingId ? "Tahrirlash rejimi" : "Yangi xabar qo'shish"}
                  </span>
                } 
                style={cardStyle}
                headStyle={{ borderBottom: '4px solid #000' }}
              >
                <Space direction="vertical" style={{ width: '100%' }} size="large">
                  <div>
                    <Text strong style={{ textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '1px' }}>Sarlavha</Text>
                    <Input 
                      placeholder="Qisqa va tushunarli sarlavha..." 
                      value={title} 
                      onChange={e => setTitle(e.target.value)} 
                      size="large"
                      style={{ border: '2px solid #000', padding: '10px' }}
                    />
                  </div>

                  <Row gutter={16}>
                    <Col span={12}>
                      <Text strong style={{ textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '1px' }}>Media Turi</Text><br/>
                      <Select 
                        value={mediaType} 
                        onChange={setMediaType} 
                        style={{ width: '100%', marginTop: 8, border: '2px solid #000' }}
                        size="large"
                        variant="borderless" // Remove default border to use ours
                      >
                        <Option value="image">Rasm (Image)</Option>
                        <Option value="video">Video</Option>
                      </Select>
                    </Col>
                    <Col span={12}>
                       <Text strong style={{ textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '1px' }}>Fayl Yuklash</Text><br/>
                       <Upload 
                         beforeUpload={() => false} 
                         onChange={handleUpload} 
                         fileList={fileList}
                         maxCount={1}
                         accept={mediaType === 'video' ? "video/*" : "image/*"}
                         showUploadList={false}
                       >
                         <Button icon={<UploadOutlined />} size="large" style={{ width: '100%', marginTop: 8, border: '2px solid #000' }}>
                           Fayl tanlash
                         </Button>
                       </Upload>
                    </Col>
                  </Row>

                  {/* Manual URL Input Fallback & Preview */}
                  <div style={{ background: '#f5f5f5', padding: '16px', border: '2px dashed #ccc' }}>
                     <Input 
                        placeholder="Yoki media URL manzilini kiriting..." 
                        value={mediaUrl} 
                        onChange={e => setMediaUrl(e.target.value)}
                        style={{ marginBottom: 16, border: '1px solid #ddd' }}
                        disabled={fileList.length > 0} 
                        prefix={<FileImageOutlined />}
                      />
                     
                     {mediaUrl ? (
                         <div style={{ borderRadius: 0, overflow: 'hidden', border: '2px solid #000', background: '#000' }}>
                            {mediaType === 'video' ? (
                              <video src={mediaUrl} controls style={{ width: '100%', display: 'block' }} />
                            ) : (
                              <img src={mediaUrl} alt="Preview" style={{ width: '100%', display: 'block' }} />
                            )}
                         </div>
                     ) : (
                        <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                           Media ko'rinishi shu yerda bo'ladi
                        </div>
                     )}
                  </div>

                  <div>
                    <Text strong style={{ textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '1px' }}>Tavsif (Description)</Text>
                    <TextArea 
                      rows={6} 
                      placeholder="Batafsil ma'lumot..." 
                      value={description} 
                      onChange={e => setDescription(e.target.value)} 
                      style={{ border: '2px solid #000', padding: '10px', marginTop: 8 }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: 16, marginTop: 10 }}>
                    <Button 
                      type="primary" 
                      size="large" 
                      onClick={handleSubmit}
                      style={{ 
                        flex: 1, 
                        height: '50px', 
                        fontWeight: 900, 
                        textTransform: 'uppercase', 
                        fontSize: '1rem',
                        background: '#000',
                        border: '2px solid #000'
                      }}
                    >
                      {editingId ? "O'zgarishlarni Saqlash" : "Yangilikni Chop Etish"}
                    </Button>
                    
                    {editingId && (
                      <Button 
                        size="large" 
                        onClick={() => {
                          setEditingId(null);
                          setTitle('');
                          setDescription('');
                          setMediaUrl('');
                          setFileList([]);
                        }}
                        style={{ 
                          height: '50px', 
                          fontWeight: 700,
                          border: '2px solid #000'
                        }}
                      >
                        Bekor qilish
                      </Button>
                    )}
                  </div>
                </Space>
              </Card>
            </div>
          </Col>

          {/* List Side - Right Half */}
          <Col xs={24} lg={12}>
            <div className="animate__animated animate__fadeIn">
              <Title level={3} style={{  marginTop: 0, textTransform: 'uppercase', fontWeight: 800 }}>Mavjud Yangiliklar</Title>
              <List
                itemLayout="vertical"
                dataSource={news}
                renderItem={item => (
                  <List.Item style={{ padding: 0, marginBottom: '24px' }}>
                    <Card 
                      hoverable
                      style={{ 
                        ...cardStyle, 
                        marginBottom: 0, 
                        boxShadow: '6px 6px 0px #000',
                        cursor: 'default'
                      }}
                      styles={{ body: { padding: '0' } }}
                    >
                      <div style={{ position: 'relative' }}>
                         {/* Media Header */}
                         {item.media_file && (
                           <div style={{ height: '180px', overflow: 'hidden', borderBottom: '4px solid #000' }}>
                              {item.media_type === 'video' ? (
                                <div style={{ width: '100%', height: '100%', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>VIDEO</div>
                              ) : (
                                <img alt="news" src={item.media_file} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              )}
                           </div>
                         )}
                         
                         {/* Actions Overlay */}
                         <div style={{ 
                            position: 'absolute', 
                            top: 10, 
                            right: 10, 
                            display: 'flex', 
                            gap: 8 
                         }}>
                            <Button shape="circle" icon={<EditOutlined />} onClick={() => handleEdit(item)} style={{ border: '2px solid #000' }} />
                            <Button shape="circle" danger icon={<DeleteOutlined />} onClick={() => handleDelete(item.id)} style={{ border: '2px solid #000' }} />
                         </div>

                         <div style={{ padding: '20px' }}>
                            <Title level={4} style={{ margin: 0, marginBottom: 8, fontSize: '1.1rem', fontWeight: 800 }}>{item.title}</Title>
                            <Paragraph ellipsis={{ rows: 3 }} style={{ marginBottom: 12, opacity: 0.7 }}>
                              {item.description}
                            </Paragraph>
                            <Text type="secondary" style={{ fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 600 }}>
                               {new Date(item.created_at).toLocaleDateString('uz-UZ')}
                            </Text>
                         </div>
                      </div>
                    </Card>
                  </List.Item>
                )}
              />
            </div>
          </Col>
        </Row>
      </div>
    </ConfigProvider>
  );
};

export default ManageNews;
