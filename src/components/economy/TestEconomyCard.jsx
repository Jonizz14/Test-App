import React from 'react';
import { useEconomy } from '../../context/EconomyContext';
import { useAuth } from '../../context/AuthContext';

const TestEconomyCard = ({ test, onStart, onContinue, alreadyTaken }) => {
    const { stars, isPremium, isTestOwned, purchaseTest } = useEconomy();
    const { currentUser } = useAuth();

    const isPaid = test.star_price > 0;
    const isPremiumOnly = test.is_premium;
    const owned = isTestOwned(test.id) || !isPaid;
    const premiumLocked = isPremiumOnly && !isPremium();

    // Can access if:
    // 1. Not premium only, OR student has premium
    // 2. AND (Already owned, OR student buys it)

    const canStart = owned && !premiumLocked;

    const handlePurchase = async () => {
        try {
            await purchaseTest(test.id, test.star_price);
        } catch (error) {
            alert(error.message);
        }
    };

    return (
        <div
            className={`brutalist-card p-6 flex flex-col gap-4 relative overflow-hidden transition-all hover:scale-[1.02] ${premiumLocked ? 'opacity-80' : ''}`}
        >
            {/* Header Info */}
            <div className="flex justify-between items-start">
                <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase opacity-60 px-2 py-0.5 bg-black/5 dark:bg-white/5 self-start mb-1">
                        {test.subject}
                    </span>
                    <h3 className="text-xl font-black uppercase tracking-tighter leading-none">
                        {test.title}
                    </h3>
                </div>

                <div className="flex flex-col items-end gap-2">
                    {alreadyTaken && (
                        <span className="badge-owned">Completed</span>
                    )}
                    {isTestOwned(test.id) && isPaid && !alreadyTaken && (
                        <span className="badge-owned">Owned</span>
                    )}
                </div>
            </div>

            {/* Stats Row */}
            <div className="flex gap-4 border-y-2 border-black/10 dark:border-white/10 py-3">
                <div className="flex flex-col">
                    <span className="text-[10px] font-bold opacity-50 uppercase">Time</span>
                    <span className="font-black">{test.time_limit}m</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-[10px] font-bold opacity-50 uppercase">Questions</span>
                    <span className="font-black">{test.total_questions}</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-[10px] font-bold opacity-50 uppercase">Difficulty</span>
                    <span className={`font-black uppercase text-xs ${test.difficulty === 'hard' ? 'text-red-500' :
                        test.difficulty === 'medium' ? 'text-orange-500' : 'text-green-500'
                        }`}>
                        {test.difficulty}
                    </span>
                </div>
            </div>

            {/* Pricing / Lock Overlay */}
            <div className="flex items-center justify-between mt-2">
                {premiumLocked ? (
                    <div className="flex items-center gap-2 premium-purple-text font-black uppercase text-xs">
                        <span className="material-symbols-outlined text-lg">lock</span>
                        Premium Required
                    </div>
                ) : isPaid && !owned ? (
                    <div className="star-price-tag">
                        <span>⭐</span>
                        <span>{test.star_price}</span>
                    </div>
                ) : (
                    <div className="text-xs font-black uppercase text-green-600 dark:text-green-400">
                        Available
                    </div>
                )}
            </div>

            {/* Action Button */}
            {premiumLocked ? (
                <button
                    className="w-full py-3 bg-purple-600 text-white font-black uppercase tracking-widest border-2 border-black shadow-[4px_4px_0_#000]"
                    onClick={() => window.location.href = '/student/pricing'}
                >
                    Get Premium
                </button>
            ) : isPaid && !owned ? (
                <button
                    className={`w-full py-3 font-black uppercase tracking-widest border-2 border-black shadow-[4px_4px_0_#000] transition-all
            ${stars >= test.star_price
                            ? 'bg-star-gold text-black hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#000]'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'}
          `}
                    onClick={handlePurchase}
                    disabled={stars < test.star_price}
                >
                    {stars >= test.star_price ? 'Unlock with Stars' : 'Need More Stars'}
                </button>
            ) : (
                <button
                    className="w-full py-3 bg-black text-white dark:bg-white dark:text-black font-black uppercase tracking-widest border-2 border-black dark:border-white shadow-[4px_4px_0_#000] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#000] transition-all"
                    onClick={onStart}
                >
                    {alreadyTaken ? 'Review' : 'Start Test'}
                </button>
            )}
        </div>
    );
};

export default TestEconomyCard;
