import React, { useState, useEffect } from 'react';
import { useEconomy } from '../../context/EconomyContext';

const PremiumBadge = () => {
    const { isPremium, premiumUntil } = useEconomy();
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        if (!isPremium()) return;

        const calculateTimeLeft = () => {
            const difference = new Date(premiumUntil) - new Date();
            if (difference <= 0) return 'Expired';

            const days = Math.floor(difference / (1000 * 60 * 60 * 24));
            const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
            const minutes = Math.floor((difference / 1000 / 60) % 60);

            if (days > 0) return `${days}d ${hours}h left`;
            return `${hours}h ${minutes}m left`;
        };

        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 60000);

        setTimeLeft(calculateTimeLeft());
        return () => clearInterval(timer);
    }, [isPremium, premiumUntil]);

    if (!isPremium()) {
        return (
            <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 dark:bg-white/5 rounded-full border border-dashed border-gray-400 opacity-60">
                <span className="text-[10px] font-bold uppercase">Basic Student</span>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-end animate__animated animate__zoomIn">
            <div
                className="flex items-center gap-2 px-4 py-1.5"
                style={{
                    backgroundColor: '#fff',
                    border: '3px solid #000',
                    boxShadow: '4px 4px 0px #000',
                    borderRadius: 0,
                    position: 'relative',
                    overflow: 'hidden'
                }}
            >
                {/* Purple accent bar at the top */}
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    backgroundColor: '#A020F0'
                }}></div>

                <span className="text-lg animate-bounce" style={{ marginTop: '2px' }}>
                    💎
                </span>
                <div className="flex flex-col">
                    <span style={{
                        fontSize: '10px',
                        fontWeight: 900,
                        textTransform: 'uppercase',
                        color: '#A020F0',
                        lineHeight: 1
                    }}>
                        Premium Status
                    </span>
                    <span style={{
                        fontSize: '10px',
                        fontWeight: 800,
                        color: '#000',
                        opacity: 0.7,
                        lineHeight: 1
                    }}>
                        {timeLeft}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default PremiumBadge;
