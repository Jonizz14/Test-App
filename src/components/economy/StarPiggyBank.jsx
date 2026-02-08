import React from 'react';
import { useEconomy } from '../../context/EconomyContext';

const StarPiggyBank = () => {
    const { stars } = useEconomy();

    return (
        <div className="flex flex-col items-center gap-6">
            <div
                className="floating-ui relative"
                style={{
                    width: '140px',
                    height: '140px',
                    backgroundColor: '#fff',
                    border: '5px solid #000',
                    boxShadow: '10px 10px 0px #FFD700',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '0'
                }}
            >
                {/* Gold corner accents */}
                <div style={{ position: 'absolute', top: '5px', left: '5px', width: '20px', height: '20px', borderTop: '4px solid #FFD700', borderLeft: '4px solid #FFD700' }}></div>
                <div style={{ position: 'absolute', bottom: '5px', right: '5px', width: '20px', height: '20px', borderBottom: '4px solid #FFD700', borderRight: '4px solid #FFD700' }}></div>

                <div
                    className="relative z-10 text-6xl animate__animated animate__pulse animate__infinite"
                >
                    🏺
                </div>

                {/* Simplified particles using CSS */}
                <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                    {[...Array(8)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute bg-yellow-400 rounded-full opacity-40 animate-ping"
                            style={{
                                width: '4px',
                                height: '4px',
                                left: `${10 + Math.random() * 80}%`,
                                top: `${10 + Math.random() * 80}%`,
                                animationDelay: `${i * 0.3}s`,
                                animationDuration: `${2 + Math.random() * 2}s`
                            }}
                        />
                    ))}
                </div>
            </div>

            <div className="text-center">
                <h3 style={{ fontSize: '1.25rem', fontWeight: 900, textTransform: 'uppercase', color: '#000', margin: 0 }}>
                    Mening Yulduzlarim
                </h3>
                <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#666', marginTop: '4px' }}>
                    Premium imkoniyatlarni ochish uchun yulduz to'plang
                </p>
            </div>
        </div>
    );
};

export default StarPiggyBank;
