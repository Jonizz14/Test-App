import React, { useState, useEffect } from 'react';
import './MobileRestrictor.css';

const MobileRestrictor = ({ children }) => {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkDevice = () => {
            // Check for common mobile screen widths
            setIsMobile(window.innerWidth <= 768);
        };

        checkDevice();
        window.addEventListener('resize', checkDevice);
        return () => window.removeEventListener('resize', checkDevice);
    }, []);

    if (isMobile) {
        return (
            <div className="mobile-restrictor-overlay">
                <div className="restrictor-content">
                    <div className="restrictor-icon">
                        <span className="material-symbols-outlined">devices_off</span>
                    </div>
                    <h1>BU QURILMA TURIDA SAYT QO'LLAB-QUVVATLANMAYDI</h1>
                    <p>Examify Prep platformasi hozircha faqat desktop va planshet qurilmalari uchun optimallashtirilgan. Iltimos, kompyuterdan foydalaning.</p>
                    <div className="restrictor-footer">
                        <span>EXAMIFY PREP</span>
                    </div>
                </div>
            </div>
        );
    }

    return children;
};

export default MobileRestrictor;
