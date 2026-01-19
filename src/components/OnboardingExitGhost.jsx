import React from 'react';
import Header from './Header';
import '../styles/Onboarding.css';

const OnboardingExitGhost = () => {
  const [isExiting, setIsExiting] = React.useState(false);
  const [shouldRender, setShouldRender] = React.useState(false);
  const [exitData, setExitData] = React.useState(null);

  React.useEffect(() => {
    const handleOnboardingExit = (e) => {
      setExitData(e.detail);
      setShouldRender(true);
      setTimeout(() => setIsExiting(true), 10);
      setTimeout(() => {
        setShouldRender(false);
        setIsExiting(false);
      }, 1000);
    };

    window.addEventListener('onboardingExiting', handleOnboardingExit);
    return () => window.removeEventListener('onboardingExiting', handleOnboardingExit);
  }, []);

  if (!shouldRender || !exitData) return null;

  const { step, showHeader, currentStepIndex, totalSteps, isLastStep, labels } = exitData;

  return (
    <div className={`onboarding-brutalist ${isExiting ? 'exiting' : ''}`} style={{ zIndex: 10001 }}>
      <div className="onboarding-bg-brutal"></div>
      
      {showHeader && (
        <div className="onboarding-header-reveal visible">
          <Header demoMode={true} />
        </div>
      )}
      
      <div className="onboarding-card-brutal">
        <div className="onboarding-header-brutal">
          <div className="step-count-brutal">0{step.id + 1} / 0{totalSteps}</div>
          <div className="brutal-label-box">{step.label}</div>
        </div>

        <div className="onboarding-content-brutal">
          <h1 className="brutal-title">{step.title}</h1>
          <h2 className="brutal-subtitle">{step.subtitle}</h2>
          <div className="brutal-divider"></div>
          <p className="brutal-description">{step.description}</p>
        </div>

        <div className="onboarding-footer-brutal">
          <div className="brutal-nav-group">
            <button className={`brutal-nav-btn ${currentStepIndex === 0 ? 'inactive' : ''}`}>
              {labels.back}
            </button>
            
            {isLastStep ? (
              <button className="brutal-action-btn">
                {labels.ready}
              </button>
            ) : (
              <button className="brutal-nav-btn">
                {labels.next}
              </button>
            )}
          </div>
          
          <button className="brutal-skip-link">{labels.skip}</button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingExitGhost;
