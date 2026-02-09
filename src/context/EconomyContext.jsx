import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import apiService from '../data/apiService';

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
    const [premiumUntil, setPremiumUntil] = useState(currentUser?.premium_expiry_date || null);

    // Sync with currentUser when it changes
    useEffect(() => {
        if (currentUser) {
            setStars(currentUser.stars || 0);
            setOwnedTests(currentUser.owned_tests || []);
            setPremiumUntil(currentUser.premium_expiry_date || null);
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
        // Ensure we have the latest token from localStorage
        const accessToken = window.localStorage.getItem('accessToken');
        if (accessToken) {
            apiService.setToken(accessToken);
        }
        
        // Call the backend API to purchase premium with stars
        if (!currentUser) {
            throw new Error('User not authenticated');
        }

        try {
            const response = await apiService.post('/users/purchase_premium_with_stars/', {
                plan_type: plan
            });

            if (response && response.user) {
                // Update local state with server response
                setStars(response.user.stars || 0);
                setPremiumUntil(response.user.premium_expiry_date || null);
                
                // Also update the current user in AuthContext
                await updateProfile({
                    stars: response.user.stars,
                    premium_expiry_date: response.user.premium_expiry_date,
                    is_premium: response.user.is_premium
                });
            }

            return response;
        } catch (error) {
            console.error('Failed to purchase premium with stars:', error);
            throw error;
        }
    }, [currentUser, updateProfile]);

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
