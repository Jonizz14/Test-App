import React, { useState, useEffect } from 'react';
import './MobileRestrictor.css';

const MobileRestrictor = ({ children }) => {
    const [isRestricted, setIsRestricted] = useState(false);

    useEffect(() => {
        const checkDevice = () => {
            // Check for common mobile and tablet screen widths
            // 1100px is usually enough to exclude tablets in landscape
            setIsRestricted(window.innerWidth < 1100);
        };

        checkDevice();
        window.addEventListener('resize', checkDevice);
        return () => window.removeEventListener('resize', checkDevice);
    }, []);

    if (isRestricted) {
        return (
            <div className="mobile-restrictor-overlay">
                <div className="restrictor-content">
                    <div className="restrictor-icon">
                        <span className="material-symbols-outlined">devices_off</span>
                    </div>
                    <h1>BU QURILMA TURIDA SAYT QO'LLAB-QUVVATLANMAYDI</h1>
                    <p>Examify Prep platformasi hozircha faqat desktop qurilmalari uchun optimallashtirilgan. Iltimos, kompyuterdan foydalaning.</p>
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
