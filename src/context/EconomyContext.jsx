import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const EconomyContext = createContext();

export const useEconomy = () => {
    const context = useContext(EconomyContext);
    if (!context) {
        throw new Error('useEconomy must be used within an EconomyProvider');
    }
    return context;
};

export const EconomyProvider = ({ children }) => {
    const { currentUser, updateProfile } = useAuth();

    // Initialize state from currentUser or local storage for persistency
    const [stars, setStars] = useState(currentUser?.stars || 0);
    const [ownedTests, setOwnedTests] = useState(currentUser?.owned_tests || []);
    const [premiumUntil, setPremiumUntil] = useState(currentUser?.premium_until || null);

    // Sync with currentUser when it changes
    useEffect(() => {
        if (currentUser) {
            setStars(currentUser.stars || 0);
            setOwnedTests(currentUser.owned_tests || []);
            setPremiumUntil(currentUser.premium_until || null);
        }
    }, [currentUser]);

    const addStars = React.useCallback(async (amount) => {
        const newBalance = stars + amount;
        setStars(newBalance);

        if (currentUser) {
            try {
                await updateProfile({ stars: newBalance });
            } catch (error) {
                console.error('Failed to update stars balance:', error);
            }
        }

        return newBalance;
    }, [stars, currentUser, updateProfile]);

    const purchaseTest = React.useCallback(async (testId, price) => {
        if (stars < price) {
            throw new Error('Not enough stars!');
        }

        const newBalance = stars - price;
        const newOwnedTests = [...ownedTests, testId];

        setStars(newBalance);
        setOwnedTests(newOwnedTests);

        if (currentUser) {
            try {
                await updateProfile({
                    stars: newBalance,
                    owned_tests: newOwnedTests
                });
            } catch (error) {
                console.error('Failed to purchase test:', error);
            }
        }

        return true;
    }, [stars, ownedTests, currentUser, updateProfile]);

    const exchangeStarsForPremium = React.useCallback(async (plan) => {
        let price = 0;
        let durationDays = 0;

        switch (plan) {
            case 'week':
                price = 300;
                durationDays = 7;
                break;
            case 'month':
                price = 1200;
                durationDays = 30;
                break;
            case 'year':
                price = 8000;
                durationDays = 365;
                break;
            default:
                throw new Error('Invalid plan');
        }

        if (stars < price) {
            throw new Error('Not enough stars!');
        }

        const now = new Date();
        const currentExpiry = premiumUntil ? new Date(premiumUntil) : now;
        const baseDate = currentExpiry > now ? currentExpiry : now;

        const newExpiry = new Date(baseDate.getTime() + durationDays * 24 * 60 * 60 * 1000);
        const newBalance = stars - price;

        setStars(newBalance);
        setPremiumUntil(newExpiry.toISOString());

        if (currentUser) {
            try {
                await updateProfile({
                    stars: newBalance,
                    premium_until: newExpiry.toISOString()
                });
            } catch (error) {
                console.error('Failed to update premium status:', error);
            }
        }

        return true;
    }, [stars, premiumUntil, currentUser, updateProfile]);

    const isPremium = React.useCallback(() => {
        if (!premiumUntil) return false;
        return new Date(premiumUntil) > new Date();
    }, [premiumUntil]);

    const isTestOwned = React.useCallback((testId) => {
        if (!ownedTests) return false;
        // Check both string and number IDs for robustness
        return ownedTests.some(id => String(id) === String(testId));
    }, [ownedTests]);

    const value = React.useMemo(() => ({
        stars,
        ownedTests,
        premiumUntil,
        addStars,
        purchaseTest,
        exchangeStarsForPremium,
        isPremium,
        isTestOwned
    }), [stars, ownedTests, premiumUntil, addStars, purchaseTest, exchangeStarsForPremium, isPremium, isTestOwned]);

    return (
        <EconomyContext.Provider value={value}>
            {children}
        </EconomyContext.Provider>
    );
};
