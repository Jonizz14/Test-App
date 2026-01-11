import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import '../styles/Onboarding.css';

const Onboarding = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const [isEntering, setIsEntering] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsEntering(false), 100);
    return () => clearTimeout(timer);
  }, []);

  const steps = [
    {
      title: "HUSH KELIBSIZ",
      subtitle: "EXAMIFY PREP DUNYOSIGA QADAM QO'YING",
      description: "Bizning platforma orqali siz o'z bilimlaringizni nazorat qilishingiz va yangi cho'qqilarni zabt etishingiz mumkin.",
      label: "BOSHLASH",
      highlightElement: null
    },
    {
      title: "NAVIGATSIYA PANELI",
      subtitle: "TEPA QISMDA JOYLASHTIRILGAN ASOSIY PANEL",
      description: "Saytning yuqori qismida asosiy navigatsiya paneli joylashgan. U orqali siz saytning istalgan bo'limiga tezda o'tishingiz mumkin.",
      label: "HEADER",
      highlightElement: "header"
    },
    {
      title: "SAQLASH TIZIMI",
      subtitle: "HECH NARRSANI BOY BERMANG",
      description: "Kerakli ma'lumotlarni tepa paneldagi 'Inventory' iconkasi orqali saqlab qo'ying. Ularga xohlagan vaqtda qaytishingiz mumkin.",
      label: "SAQLANGANLAR",
      highlightElement: "storage",
      demoAction: "save"
    },
    {
      title: "XABARLAR MARKAZI",
      subtitle: "DOIMIY ALOQADA BO'LING",
      description: "Biz bilan bog'lanish va yuborilgan xabarlaringizni kuzatib borish uchun maxsus 'Messages' bo'limidan foydalanishni unutmang.",
      label: "XABARLAR",
      highlightElement: "messages",
      demoAction: "message"
    },
    {
      title: "SHAXSIY PROFIL",
      subtitle: "O'Z YUTUQLARINGIZNI KUZATING",
      description: "Profilingizga kiring va o'z rolingizga mos (Admin, Ustoz, O'quvchi) kengaytirilgan imkoniyatlardan foydalaning.",
      label: "PROFIL",
      highlightElement: "profile"
    },
    {
      title: "TAYYORMISIZ?",
      subtitle: "KELING, BOSHLAYMIZ!",
      description: "Hamma narsa tayyor. Endi siz platformaning to'liq imkoniyatlaridan foydalanishga tayyorsiz.",
      label: "TAYYOR",
      highlightElement: null
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      finishOnboarding();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const finishOnboarding = () => {
    setIsExiting(true);
    localStorage.setItem('hasSeenOnboarding', 'true');
    setTimeout(() => {
      navigate('/');
    }, 600);
  };

  // Show header from step 2 onwards
  const showHeader = currentStep >= 1;

  // Trigger demo actions when entering specific steps
  useEffect(() => {
    const currentStepData = steps[currentStep];
    
    if (currentStepData.demoAction === 'save') {
      // Simulate saving an item
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('itemSaved', {
          detail: {
            title: 'Demo Ma\'lumot',
            description: 'Bu saqlash tizimining namunasi',
            icon: 'bookmark'
          }
        }));
      }, 800);
    } else if (currentStepData.demoAction === 'message') {
      // Simulate sending a message
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('itemSaved', {
          detail: {
            title: 'Xabar yuborildi',
            icon: 'mail',
            isFullMessage: true,
            message: 'Demo xabar muvaffaqiyatli yuborildi'
          }
        }));
      }, 800);
    }
  }, [currentStep]);

  return (
    <div className={`onboarding-brutalist ${isEntering ? 'entering' : ''} ${isExiting ? 'exiting' : ''}`}>
      <div className="onboarding-bg-brutal"></div>
      
      {/* Conditionally reveal the header with a transition class */}
      <div className={`onboarding-header-reveal ${showHeader ? 'visible' : ''}`}>
        <Header demoMode={true} />
      </div>
      
      <div className="onboarding-card-brutal">
        <div className="onboarding-header-brutal">
          <div className="step-count-brutal">0{currentStep + 1} / 0{steps.length}</div>
          <div className="brutal-label-box">{steps[currentStep].label}</div>
        </div>

        <div className="onboarding-content-brutal" key={currentStep}>
          <h1 className="brutal-title">{steps[currentStep].title}</h1>
          <h2 className="brutal-subtitle">{steps[currentStep].subtitle}</h2>
          <div className="brutal-divider"></div>
          <p className="brutal-description">{steps[currentStep].description}</p>
        </div>

        <div className="onboarding-footer-brutal">
          <div className="brutal-nav-group">
            <button 
              className={`brutal-nav-btn ${currentStep === 0 ? 'inactive' : ''}`} 
              onClick={handleBack}
              disabled={currentStep === 0}
            >
              ORQAGA
            </button>
            
            {currentStep === steps.length - 1 ? (
              <button className="brutal-action-btn" onClick={finishOnboarding}>
                TAYYORMAN
              </button>
            ) : (
              <button className="brutal-nav-btn" onClick={handleNext}>
                KEYINGI
              </button>
            )}
          </div>
          
          <button className="brutal-skip-link" onClick={finishOnboarding}>SOZLAMANI O'TKAZIB YUBORISH</button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
