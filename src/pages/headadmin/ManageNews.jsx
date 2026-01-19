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
  Tabs
} from 'antd';
import { UploadOutlined, DeleteOutlined, EditOutlined, FileImageOutlined } from '@ant-design/icons';
import 'animate.css';

const { TextArea } = Input;
const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

const ManageNews = () => {
  const { news, addNews, deleteNews, updateNews } = useNews();
  const [editingId, setEditingId] = useState(null);
  
  // Form State - Multi-language
  const [titles, setTitles] = useState({ uz: '', ru: '', en: '' });
  const [descriptions, setDescriptions] = useState({ uz: '', ru: '', en: '' });
  
  const [mediaType, setMediaType] = useState('image');
  const [mediaUrl, setMediaUrl] = useState('');
  const [fileList, setFileList] = useState([]);

  // Handle File Upload
  const handleUpload = ({ file }) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setMediaUrl(e.target.result);
      setFileList([file]);
      message.success('Media yuklandi!');
    };
    reader.readAsDataURL(file);
    return false;
  };

  const handleSubmit = async () => {
    // Strict Validation: Check all 3 languages
    const languages = ['uz', 'ru', 'en'];
    const missingFields = [];

    languages.forEach(lang => {
      if (!titles[lang]) missingFields.push(`Sarlavha (${lang.toUpperCase()})`);
      if (!descriptions[lang]) missingFields.push(`Tavsif (${lang.toUpperCase()})`);
    });

    if (missingFields.length > 0) {
      message.error({
        content: `Iltimos, quyidagilarni kiritishni unutmang: ${missingFields.join(', ')}`,
        duration: 4
      });
      return;
    }

    const formData = new FormData();
    formData.append('title_uz', titles.uz);
    formData.append('description_uz', descriptions.uz);
    formData.append('title_ru', titles.ru);
    formData.append('description_ru', descriptions.ru);
    formData.append('title_en', titles.en);
    formData.append('description_en', descriptions.en);
    
    // Legacy fields
    formData.append('title', titles.uz);
    formData.append('description', descriptions.uz);

    formData.append('media_type', mediaType);

    if (fileList.length > 0) {
      formData.append('media_file', fileList[0]);
    }

    try {
      if (editingId) {
        await updateNews(editingId, formData);
        message.success('Yangilik tahrirlandi!');
        setEditingId(null);
      } else {
        await addNews(formData);
        message.success('Yangilik muvaffaqiyatli chop etildi!');
      }

      // Reset Form
      setTitles({ uz: '', ru: '', en: '' });
      setDescriptions({ uz: '', ru: '', en: '' });
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
    setTitles({
      uz: item.title_uz || item.title || '',
      ru: item.title_ru || '',
      en: item.title_en || ''
    });
    setDescriptions({
      uz: item.description_uz || item.description || '',
      ru: item.description_ru || '',
      en: item.description_en || ''
    });
    setMediaType(item.media_type);
    setMediaUrl(item.media_file);
    setFileList([]);
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

  const cardStyle = {
    borderRadius: 0,
    border: '4px solid #000',
    boxShadow: '10px 10px 0px #000',
    marginBottom: '24px'
  };

  const tabItems = [
    {
      key: 'uz',
      label: <span style={{ fontWeight: 800 }}>O'ZBEKCHA</span>,
      children: (
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <div>
            <Text strong style={{ fontSize: '0.7rem' }}>SARLAVHA (UZ)</Text>
            <Input 
              placeholder="O'zbekcha sarlavha..." 
              value={titles.uz} 
              onChange={e => setTitles({...titles, uz: e.target.value})} 
              size="large"
              style={{ border: '2px solid #000' }}
            />
          </div>
          <div>
            <Text strong style={{ fontSize: '0.7rem' }}>TAVSIF (UZ)</Text>
            <TextArea 
              rows={4} 
              placeholder="O'zbekcha tavsif..." 
              value={descriptions.uz} 
              onChange={e => setDescriptions({...descriptions, uz: e.target.value})} 
              style={{ border: '2px solid #000' }}
            />
          </div>
        </Space>
      )
    },
    {
      key: 'ru',
      label: <span style={{ fontWeight: 800 }}>РУССКИЙ</span>,
      children: (
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <div>
            <Text strong style={{ fontSize: '0.7rem' }}>ЗАГОЛОВОК (RU)</Text>
            <Input 
              placeholder="Русский заголовок..." 
              value={titles.ru} 
              onChange={e => setTitles({...titles, ru: e.target.value})} 
              size="large"
              style={{ border: '2px solid #000' }}
            />
          </div>
          <div>
            <Text strong style={{ fontSize: '0.7rem' }}>ОПИСАНИЕ (RU)</Text>
            <TextArea 
              rows={4} 
              placeholder="Русское описание..." 
              value={descriptions.ru} 
              onChange={e => setDescriptions({...descriptions, ru: e.target.value})} 
              style={{ border: '2px solid #000' }}
            />
          </div>
        </Space>
      )
    },
    {
      key: 'en',
      label: <span style={{ fontWeight: 800 }}>ENGLISH</span>,
      children: (
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <div>
            <Text strong style={{ fontSize: '0.7rem' }}>TITLE (EN)</Text>
            <Input 
              placeholder="English title..." 
              value={titles.en} 
              onChange={e => setTitles({...titles, en: e.target.value})} 
              size="large"
              style={{ border: '2px solid #000' }}
            />
          </div>
          <div>
            <Text strong style={{ fontSize: '0.7rem' }}>DESCRIPTION (EN)</Text>
            <TextArea 
              rows={4} 
              placeholder="English description..." 
              value={descriptions.en} 
              onChange={e => setDescriptions({...descriptions, en: e.target.value})} 
              style={{ border: '2px solid #000' }}
            />
          </div>
        </Space>
      )
    }
  ];

  return (
    <ConfigProvider
      theme={{
        token: {
          borderRadius: 0,
          colorPrimary: '#000',
          fontFamily: "'Inter', sans-serif",
        },
        components: {
          Tabs: {
            titleFontSize: 14,
            itemColor: '#999',
            itemSelectedColor: '#000',
            itemHoverColor: '#000',
            inkBarColor: '#000',
          }
        }
      }}
    >
      <div style={{ padding: '24px 0' }}>
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
            fontSize: '3rem', 
            lineHeight: 0.9, 
            textTransform: 'uppercase',
            letterSpacing: '-0.05em',
            color: '#000'
          }}>
            Platforma Yangiliklari
          </Title>
          <div style={{ 
            width: '80px', 
            height: '10px', 
            backgroundColor: '#000', 
            margin: '24px 0' 
          }}></div>
          <Paragraph style={{ fontSize: '1.2rem', fontWeight: 600, color: '#333', maxWidth: '600px' }}>
            Platformadagi barcha tizimli o'zgarishlar va yangiliklarni 3 tilda (UZ, RU, EN) shu yerdan boshqaring.
          </Paragraph>
        </div>

        <Row gutter={40}>
          <Col xs={24} lg={12}>
            <Card 
              title={
                <span style={{ textTransform: 'uppercase', fontWeight: 900, fontSize: '1rem' }}>
                   {editingId ? "Tahrirlash" : "Yangi xabar"}
                </span>
              } 
              style={cardStyle}
              headStyle={{ borderBottom: '4px solid #000' }}
            >
              <Tabs defaultActiveKey="uz" items={tabItems} style={{ marginBottom: 24 }} />

              <Space direction="vertical" style={{ width: '100%' }} size="large">
                <Row gutter={20} align="bottom">
                  <Col span={10}>
                    <div style={{ marginBottom: 4 }}>
                      <Text strong style={{ fontSize: '0.7rem', color: '#666', textTransform: 'uppercase' }}>MEDIA TURI</Text>
                    </div>
                    <Select 
                      value={mediaType} 
                      onChange={setMediaType} 
                      style={{ width: '100%', border: '2px solid #000' }} 
                      size="large"
                    >
                      <Option value="image">Image</Option>
                      <Option value="video">Video</Option>
                    </Select>
                  </Col>
                  <Col span={14}>
                    <div style={{ marginBottom: 4 }}>
                      <Text strong style={{ fontSize: '0.7rem', color: '#666', textTransform: 'uppercase' }}>FAYL YUKLASH</Text>
                    </div>
                    <Upload 
                      beforeUpload={() => false} 
                      onChange={handleUpload} 
                      maxCount={1} 
                      showUploadList={false}
                      accept={mediaType === 'video' ? "video/*" : "image/*"}
                    >
                      <Button 
                        icon={<UploadOutlined />} 
                        size="large" 
                        style={{ width: '100%', border: '2px solid #000', fontWeight: 700 }}
                      >
                        {fileList.length > 0 ? "Fayl almashtirish" : "Tanlash"}
                      </Button>
                    </Upload>
                  </Col>
                </Row>

                {mediaUrl && (
                  <div style={{ border: '4px solid #000', overflow: 'hidden', boxShadow: '5px 5px 0px #000' }}>
                    {mediaType === 'video' ? (
                      <video src={mediaUrl} controls style={{ width: '100%', display: 'block' }} />
                    ) : (
                      <img src={mediaUrl} alt="Preview" style={{ width: '100%', display: 'block' }} />
                    )}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 16 }}>
                  <Button type="primary" size="large" onClick={handleSubmit} style={{ flex: 1, height: '50px', background: '#000' }}>
                    {editingId ? "SAQLASH" : "CHOP ETISH"}
                  </Button>
                  {editingId && (
                    <Button size="large" onClick={() => { setEditingId(null); setTitles({ uz: '', ru: '', en: '' }); setDescriptions({ uz: '', ru: '', en: '' }); setMediaUrl(''); setFileList([]); }} style={{ height: '50px' }}>
                      BEKOR QILISH
                    </Button>
                  )}
                </div>
              </Space>
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Title level={3} style={{ textTransform: 'uppercase', fontWeight: 800 }}>Arxiv</Title>
            <List
              dataSource={news}
              renderItem={item => (
                <Card 
                  style={{ ...cardStyle, boxShadow: '6px 6px 0px #000', marginBottom: 20 }}
                  styles={{ body: { padding: 0 } }}
                >
                  <div style={{ display: 'flex' }}>
                    {item.media_file && (
                      <div style={{ width: '120px', minHeight: '120px', borderRight: '4px solid #000' }}>
                        <img src={item.media_file} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    )}
                    <div style={{ padding: 15, flex: 1, position: 'relative' }}>
                      <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: 5 }}>
                        <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(item)} />
                        <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(item.id)} />
                      </div>
                      <Text style={{ fontSize: '12px', color: '#666' }}>{new Date(item.created_at).toLocaleDateString()}</Text>
                      <div style={{ fontWeight: 800, textTransform: 'uppercase' }}>{item.title_uz || item.title}</div>
                      <Paragraph ellipsis={{ rows: 2 }} style={{ margin: 0, fontSize: '13px' }}>{item.description_uz || item.description}</Paragraph>
                    </div>
                  </div>
                </Card>
              )}
            />
          </Col>
        </Row>
      </div>
    </ConfigProvider>
  );
};

export default ManageNews;
