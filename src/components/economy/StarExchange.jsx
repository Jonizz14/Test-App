import React, { useState } from 'react';
import { useEconomy } from '../../context/EconomyContext';

const StarExchange = () => {
    const { stars, exchangeStarsForPremium } = useEconomy();
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState(null);

    const plans = [
        { id: 'week', label: '1 Hafta', stars: 300, icon: '📅', color: 'bg-blue-500' },
        { id: 'month', label: '1 Oy', stars: 1200, icon: '🌟', color: 'bg-purple-600' },
        { id: 'year', label: '1 Yil', stars: 8000, icon: '👑', color: 'bg-yellow-500' },
    ];

    const handlePurchase = async (planId) => {
        setLoading(true);
        setStatus(null);
        try {
            await exchangeStarsForPremium(planId);
            setStatus({ type: 'success', message: 'Premium muvaffaqiyatli faollashtirildi!' });
        } catch (error) {
            setStatus({ type: 'error', message: error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-2">
            {plans.map((plan) => (
                <div
                    key={plan.id}
                    className="group transition-all hover:-translate-y-1"
                    style={{
                        backgroundColor: '#fff',
                        border: '3px solid #000',
                        boxShadow: '4px 4px 0px #000',
                        padding: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center',
                        gap: '12px',
                        position: 'relative',
                        overflow: 'hidden'
                    }}
                >
                    <div
                        className="absolute top-0 right-0 p-1 text-white text-[8px] font-black uppercase rotate-45 translate-x-10 -translate-y-2 w-32"
                        style={{ backgroundColor: plan.id === 'year' ? '#FFD700' : (plan.id === 'month' ? '#A020F0' : '#3b82f6'), color: plan.id === 'year' ? '#000' : '#fff' }}
                    >
                        {plan.id === 'year' ? 'Eng foydali' : 'Ommabop'}
                    </div>

                    <span className="text-3xl">{plan.icon}</span>
                    <h4 style={{ fontSize: '1rem', fontWeight: 900, textTransform: 'uppercase', color: '#000', margin: 0 }}>{plan.label}</h4>

                    <div className="flex items-center gap-1">
                        <span style={{ fontSize: '18px' }}>⭐</span>
                        <span style={{ fontSize: '20px', fontWeight: 900, color: '#000' }}>{plan.stars.toLocaleString()}</span>
                    </div>

                    <button
                        onClick={() => handlePurchase(plan.id)}
                        disabled={loading || stars < plan.stars}
                        style={{
                            width: '100%',
                            padding: '8px 0',
                            border: '2px solid #000',
                            boxShadow: stars >= plan.stars ? '3px 3px 0px #000' : 'none',
                            backgroundColor: stars >= plan.stars ? '#000' : '#f1f5f9',
                            color: stars >= plan.stars ? '#fff' : '#94a3b8',
                            fontSize: '11px',
                            fontWeight: 900,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            cursor: stars >= plan.stars ? 'pointer' : 'not-allowed',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        {stars >= plan.stars ? 'Almashish' : 'Yulduzlar yetarli emas'}
                    </button>

                    {stars < plan.stars && (
                        <p style={{ fontSize: '10px', fontWeight: 700, color: '#ef4444', margin: 0 }}>
                            Yana {(plan.stars - stars).toLocaleString()} yulduz kerak
                        </p>
                    )}
                </div>
            ))}

            {status && (
                <div className={`col-span-full p-2 rounded-lg font-bold text-center text-xs ${status.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                    {status.message}
                </div>
            )}
        </div>
    );
};

export default StarExchange;
