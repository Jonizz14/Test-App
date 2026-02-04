import React from 'react';
import { Card, Switch, List, Typography, Divider, Space, ConfigProvider } from 'antd';
import { useSettings } from '../../context/SettingsContext';
import { useTranslation } from 'react-i18next';
import 'animate.css';

const { Title, Text, Paragraph } = Typography;

const AppSettings = () => {
  const { settings, updateHeaderSetting, updateWelcomeStep, updateFeatureSetting } = useSettings();
  const { t } = useTranslation();

  const welcomeStepNames = [
    t('onboarding.steps.welcome.title'),
    t('onboarding.steps.nav.title'),
    t('onboarding.steps.save.title'),
    t('onboarding.steps.messages.title'),
    t('onboarding.steps.search.title'),
    t('onboarding.steps.language.title'),
    t('onboarding.steps.ai.title'),
    t('onboarding.steps.profile.title'),
    t('onboarding.steps.ready.title')
  ];

  const cardStyle = {
    marginBottom: 40,
    border: '4px solid #000',
    borderRadius: 0,
    boxShadow: '10px 10px 0px #000',
    backgroundColor: '#fff'
  };

  const listItemStyle = {
    padding: '20px 24px',
    borderBottom: '2px solid #eee'
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          borderRadius: 0,
          colorPrimary: '#000',
        },
        components: {
          Switch: {
            innerMinHeight: 24,
            innerMinWidth: 50,
            colorPrimary: '#000', // ON state color
            colorTextQuaternary: '#ff4d4f', // OFF state color (track)
            colorTextTertiary: '#ff4d4f', // OFF state handle etc
          },
        },
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: `
        .ant-switch {
          border: 3px solid #000 !important;
          height: 32px !important;
          min-width: 60px !important;
          background-color: #ff4d4f !important; /* Default OFF color */
          border-radius: 100px !important; /* Rounded track */
        }
        .ant-switch.ant-switch-checked {
          background-color: #000 !important; /* ON color */
        }
        .ant-switch .ant-switch-handle {
          width: 24px !important;
          height: 24px !important;
          top: 1px !important;
        }
        .ant-switch .ant-switch-handle::before {
          border-radius: 100px !important; /* Rounded handle */
          background-color: #fff !important;
          border: 2px solid #000 !important;
        }
        .ant-switch-checked .ant-switch-handle {
          inset-inline-start: calc(100% - 25px) !important;
        }
      `}} />
      <div style={{ padding: '40px 0' }}>
        {/* Brutalist Header */}
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
            Texnik Boshqaruv
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
            Sayt Sozlamalari
          </Title>
          <div style={{ 
            width: '80px', 
            height: '10px', 
            backgroundColor: '#000', 
            margin: '24px 0' 
          }}></div>
          <Paragraph style={{ fontSize: '1.2rem', fontWeight: 600, color: '#333', maxWidth: '600px' }}>
            Platformaning interfeysi va funksiyalarini real vaqt rejimida boshqaring.
          </Paragraph>
        </div>

        <div className="animate__animated animate__fadeInUp">
          <Card 
            title={<Title level={4} style={{ margin: 0, fontWeight: 900, textTransform: 'uppercase' }}>Header Funksiyalari</Title>} 
            style={cardStyle}
          >
            <List grid={{ gutter: 16, xs: 1, sm: 2 }}>
              <List.Item style={listItemStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <div style={{ marginRight: 16 }}>
                    <Text style={{ fontWeight: 900, display: 'block', textTransform: 'uppercase' }}>Xabarlar</Text>
                    <Text type="secondary" style={{ fontWeight: 600 }}>Headerda xabarlar panelini ko'rsatish</Text>
                  </div>
                  <Switch 
                    checked={settings?.header?.messages} 
                    onChange={(val) => updateHeaderSetting('messages', val)} 
                  />
                </div>
              </List.Item>
              <List.Item style={listItemStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <div style={{ marginRight: 16 }}>
                    <Text style={{ fontWeight: 900, display: 'block', textTransform: 'uppercase' }}>Saqlash</Text>
                    <Text type="secondary" style={{ fontWeight: 600 }}>Inventory tizimini faollashtirish</Text>
                  </div>
                  <Switch 
                    checked={settings?.header?.storage} 
                    onChange={(val) => updateHeaderSetting('storage', val)}
                  />
                </div>
              </List.Item>
              <List.Item style={listItemStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <div style={{ marginRight: 16 }}>
                    <Text style={{ fontWeight: 900, display: 'block', textTransform: 'uppercase' }}>Qidiruv</Text>
                    <Text type="secondary" style={{ fontWeight: 600 }}>Global qidiruv panelini yoqish</Text>
                  </div>
                  <Switch 
                    checked={settings?.header?.search} 
                    onChange={(val) => updateHeaderSetting('search', val)}
                  />
                </div>
              </List.Item>
              <List.Item style={listItemStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <div style={{ marginRight: 16 }}>
                    <Text style={{ fontWeight: 900, display: 'block', textTransform: 'uppercase' }}>Til Sozlamalari</Text>
                    <Text type="secondary" style={{ fontWeight: 600 }}>Tilni o'zgartirish tugmasini ko'rsatish</Text>
                  </div>
                  <Switch 
                    checked={settings?.header?.language} 
                    onChange={(val) => updateHeaderSetting('language', val)}
                  />
                </div>
              </List.Item>
              <List.Item style={listItemStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <div style={{ marginRight: 16 }}>
                    <Text style={{ fontWeight: 900, display: 'block', textTransform: 'uppercase' }}>Vaqt</Text>
                    <Text type="secondary" style={{ fontWeight: 600 }}>Headerda vaqt ko'rsatishni yoqish</Text>
                  </div>
                  <Switch 
                    checked={settings?.header?.time} 
                    onChange={(val) => updateHeaderSetting('time', val)}
                  />
                </div>
              </List.Item>
              <List.Item style={listItemStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <div style={{ marginRight: 16 }}>
                    <Text style={{ fontWeight: 900, display: 'block', textTransform: 'uppercase' }}>Ob-havo</Text>
                    <Text type="secondary" style={{ fontWeight: 600 }}>Headerda ob-havo ko'rsatishni yoqish</Text>
                  </div>
                  <Switch 
                    checked={settings?.header?.weather} 
                    onChange={(val) => updateHeaderSetting('weather', val)}
                  />
                </div>
              </List.Item>
            </List>
          </Card>

          <Card 
            title={<Title level={4} style={{ margin: 0, fontWeight: 900, textTransform: 'uppercase' }}>Foydalanuvchi Funksiyalari</Title>} 
            style={cardStyle}
          >
            <List grid={{ gutter: 16, xs: 1, sm: 2 }}>
              <List.Item style={listItemStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <div style={{ marginRight: 16 }}>
                    <Text style={{ fontWeight: 900, display: 'block', textTransform: 'uppercase' }}>Matn Saqlash</Text>
                    <Text type="secondary" style={{ fontWeight: 600 }}>Videlit orqali ma'lumot saqlash</Text>
                  </div>
                  <Switch 
                    checked={settings?.features?.textSelection} 
                    onChange={(val) => updateFeatureSetting('textSelection', val)}
                  />
                </div>
              </List.Item>
              <List.Item style={listItemStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <div style={{ marginRight: 16 }}>
                    <Text style={{ fontWeight: 900, display: 'block', textTransform: 'uppercase' }}>Home Save</Text>
                    <Text type="secondary" style={{ fontWeight: 600 }}>Bosh sahifadagi saqlash tugmalari</Text>
                  </div>
                  <Switch 
                    checked={settings?.features?.homeSaveButton} 
                    onChange={(val) => updateFeatureSetting('homeSaveButton', val)}
                  />
                </div>
              </List.Item>
              <List.Item style={listItemStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <div style={{ marginRight: 16 }}>
                    <Text style={{ fontWeight: 900, display: 'block', textTransform: 'uppercase' }}>Animatsiyalar</Text>
                    <Text type="secondary" style={{ fontWeight: 600 }}>Fleyer (uchish) effekti</Text>
                  </div>
                  <Switch 
                    checked={settings?.features?.flyerAnimation} 
                    onChange={(val) => updateFeatureSetting('flyerAnimation', val)}
                  />
                </div>
              </List.Item>
            </List>
          </Card>

          <Card 
            title={<Title level={4} style={{ margin: 0, fontWeight: 900, textTransform: 'uppercase' }}>Welcome Page Qadamlari</Title>} 
            style={cardStyle}
          >
            <List 
              grid={{ gutter: 16, xs: 1, sm: 2, md: 3 }}
              dataSource={welcomeStepNames}
              renderItem={(name, index) => (
                <List.Item style={listItemStyle}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <div style={{ marginRight: 12 }}>
                      <Text style={{ fontWeight: 900, display: 'block', textTransform: 'uppercase' }}>{index + 1}-QADAM</Text>
                      <Text type="secondary" style={{ fontWeight: 600, fontSize: '13px' }}>{name}</Text>
                    </div>
                    <Switch 
                      checked={settings?.welcome?.steps?.[index]} 
                      onChange={(val) => updateWelcomeStep(index, val)}
                    />
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </div>
      </div>
    </ConfigProvider>
  );
};

export default AppSettings;
