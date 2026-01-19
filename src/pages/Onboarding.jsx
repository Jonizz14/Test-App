import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import '../styles/Onboarding.css';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../context/SettingsContext';

const Onboarding = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const [isEntering, setIsEntering] = useState(true);
  const { t } = useTranslation();
  const { settings } = useSettings();

  useEffect(() => {
    const timer = setTimeout(() => setIsEntering(false), 100);
    return () => clearTimeout(timer);
  }, []);

  const allSteps = [
    {
      id: 0,
      title: t('onboarding.steps.welcome.title'),
      subtitle: t('onboarding.steps.welcome.subtitle'),
      description: t('onboarding.steps.welcome.desc'),
      label: t('onboarding.steps.welcome.label'),
      highlightElement: null
    },
    {
      id: 1,
      title: t('onboarding.steps.nav.title'),
      subtitle: t('onboarding.steps.nav.subtitle'),
      description: t('onboarding.steps.nav.desc'),
      label: t('onboarding.steps.nav.label'),
      highlightElement: "header"
    },
    {
      id: 2,
      title: t('onboarding.steps.save.title'),
      subtitle: t('onboarding.steps.save.subtitle'),
      description: t('onboarding.steps.save.desc'),
      label: t('onboarding.steps.save.label'),
      highlightElement: "storage",
      demoAction: "save"
    },
    {
      id: 3,
      title: t('onboarding.steps.messages.title'),
      subtitle: t('onboarding.steps.messages.subtitle'),
      description: t('onboarding.steps.messages.desc'),
      label: t('onboarding.steps.messages.label'),
      highlightElement: "messages",
      demoAction: "message"
    },
    {
      id: 4,
      title: t('onboarding.steps.profile.title'),
      subtitle: t('onboarding.steps.profile.subtitle'),
      description: t('onboarding.steps.profile.desc'),
      label: t('onboarding.steps.profile.label'),
      highlightElement: "profile"
    },
    {
      id: 5,
      title: t('onboarding.steps.ready.title'),
      subtitle: t('onboarding.steps.ready.subtitle'),
      description: t('onboarding.steps.ready.desc'),
      label: t('onboarding.steps.ready.label'),
      highlightElement: null
    }
  ];

  const steps = allSteps.filter(step => settings?.welcome?.steps?.[step.id]);

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
    
    // Dispatch global event with comprehensive data to make the ghost perfectly match
    window.dispatchEvent(new CustomEvent('onboardingExiting', {
      detail: {
        step: steps[currentStep] || steps[0],
        showHeader: showHeader,
        currentStepIndex: currentStep,
        totalSteps: steps.length,
        isLastStep: currentStep === steps.length - 1,
        labels: {
          back: t('onboarding.back'),
          next: t('onboarding.next'),
          ready: t('onboarding.ready'),
          skip: t('onboarding.skip')
        }
      }
    }));
    
    // Navigate slightly after the curtain covers the skip to Home
    setTimeout(() => {
      navigate('/');
    }, 150);
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
              {t('onboarding.back')}
            </button>
            
            {currentStep === steps.length - 1 ? (
              <button className="brutal-action-btn" onClick={finishOnboarding}>
                {t('onboarding.ready')}
              </button>
            ) : (
              <button className="brutal-nav-btn" onClick={handleNext}>
                {t('onboarding.next')}
              </button>
            )}
          </div>
          
          <button className="brutal-skip-link" onClick={finishOnboarding}>{t('onboarding.skip')}</button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
