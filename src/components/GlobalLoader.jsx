import React, { useState, useEffect } from 'react';
import '../styles/GlobalLoader.css';

const GlobalLoader = ({ onFinished, onTransitionStart }) => {
  const [progress, setProgress] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const targetMousePos = React.useRef({ x: 50, y: 50 });
  const currentMousePos = React.useRef({ x: 50, y: 50 });
  const auraRef = React.useRef(null);

  useEffect(() => {
    // Prevent scrolling while loading
    document.body.style.overflow = 'hidden';

    // Track target mouse position
    const handleMouseMove = (e) => {
      targetMousePos.current = {
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100
      };
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Smooth animation loop (Physics & LERP)
    let animationFrameId;
    const animate = () => {
      const lerpFactor = 0.08;
      
      // Aura movement
      currentMousePos.current.x += (targetMousePos.current.x - currentMousePos.current.x) * lerpFactor;
      currentMousePos.current.y += (targetMousePos.current.y - currentMousePos.current.y) * lerpFactor;

      if (auraRef.current) {
        auraRef.current.style.left = `${currentMousePos.current.x}%`;
        auraRef.current.style.top = `${currentMousePos.current.y}%`;
      }

      animationFrameId = requestAnimationFrame(animate);
    };
    animate();

    // 1. Initial "Real" checks
    const startTime = Date.now();
    let imagesLoaded = 0;
    const allImages = Array.from(document.images);
    const totalImages = allImages.length;

    const checkLoading = () => {
      const isWindowLoaded = document.readyState === 'complete';
      const imageProgress = totalImages > 0 ? (imagesLoaded / totalImages) * 100 : 100;
      const timeElapsed = Date.now() - startTime;
      const minDuration = 2000; 
      const timeProgress = Math.min((timeElapsed / minDuration) * 100, 100);

      const targetProgressValue = Math.min(imageProgress, timeProgress);
      
      setProgress(prev => {
        if (prev >= 100) return 100;
        return Math.max(prev, targetProgressValue);
      });

      if (isWindowLoaded && (totalImages === 0 || imagesLoaded === totalImages) && timeElapsed >= minDuration) {
        setProgress(100);
        return true;
      }
      return false;
    };

    if (totalImages > 0) {
      allImages.forEach(img => {
        if (img.complete) imagesLoaded++;
        else {
          img.addEventListener('load', () => imagesLoaded++);
          img.addEventListener('error', () => imagesLoaded++);
        }
      });
    }

    const interval = setInterval(() => {
      if (checkLoading()) {
        clearInterval(interval);
        setTimeout(() => {
          setIsFading(true);
          if (onTransitionStart) onTransitionStart();
          setTimeout(() => {
            document.body.style.overflow = '';
            if (onFinished) onFinished();
          }, 850);
        }, 600);
      }
    }, 50);

    return () => {
      clearInterval(interval);
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      document.body.style.overflow = '';
    };
  }, [onFinished, onTransitionStart]);

  return (
    <div className={`global-loader-container ${isFading ? 'fade-out' : ''}`}>
      <div 
        ref={auraRef}
        className="loader-aura" 
        style={{ left: '50%', top: '50%' }} 
      />
      <div className="loader-mesh" />
      
      <div className="loader-content">
        <div className="loader-percentage-wrapper">
          <span className="loader-percentage">
            {Math.floor(progress)}%
          </span>
        </div>
        
        <div className="loader-bar-container">
          <div 
            className="loader-bar-fill" 
            style={{ width: `${progress}%` }} 
          />
        </div>
        
        <div className="loader-text">Examify Prep</div>
      </div>
    </div>
  );
};

export default GlobalLoader;
