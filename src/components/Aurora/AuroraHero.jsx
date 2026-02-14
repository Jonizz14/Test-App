import React from 'react';
import Aurora from './Aurora';
import './AuroraHero.css';

const AuroraHero = ({ children, className = '', ...props }) => {
  return (
    <section className={`aurora-hero-wrapper ${className}`}>
      <div className="aurora-background">
        <Aurora 
          colorStops={["#00d2ff", "#3a7bd5", "#00d2ff"]}
          blend={0.5}
          amplitude={1.0}
          speed={0.5}
          {...props}
        />
      </div>
      <div className="aurora-hero-content">
        {children}
      </div>
    </section>
  );
};

export default AuroraHero;
