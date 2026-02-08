import React, { useState, useEffect } from 'react';
import { useEconomy } from '../../context/EconomyContext';

const StarBalance = () => {
    const { stars } = useEconomy();
    const [displayStars, setDisplayStars] = useState(stars);

    useEffect(() => {
        // Smoother transition for the counter
        const timer = setTimeout(() => {
            if (displayStars < stars) {
                setDisplayStars(prev => Math.min(prev + 1, stars));
            } else if (displayStars > stars) {
                setDisplayStars(prev => Math.max(prev - 1, stars));
            }
        }, 20);
        return () => clearTimeout(timer);
    }, [stars, displayStars]);

    return (
        <div
            className="flex items-center gap-2 px-4 py-2"
            style={{
                backgroundColor: '#fff',
                border: '3px solid #000',
                boxShadow: '4px 4px 0px #000',
                borderRadius: '0',
                marginLeft: '12px'
            }}
        >
            <div
                className="text-2xl"
                style={{
                    animation: 'spin 4s linear infinite',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                ⭐
            </div>
            <div className="flex flex-col">
                <span style={{
                    fontSize: '10px',
                    textTransform: 'uppercase',
                    fontWeight: 900,
                    opacity: 0.6,
                    lineHeight: 1,
                    marginBottom: '2px'
                }}>
                    Yulduzlar Balansi
                </span>
                <span
                    className="animate__animated animate__fadeInUp"
                    key={displayStars}
                    style={{
                        fontSize: '18px',
                        fontWeight: 900,
                        lineHeight: 1,
                        color: '#000'
                    }}
                >
                    {displayStars.toLocaleString()}
                </span>
            </div>
        </div>
    );
};

export default StarBalance;
