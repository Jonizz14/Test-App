/**
 * Utility functions for premium visibility
 */

/**
 * Check if premium features should be visible for a user
 * @param {Object} user - The user object
 * @param {Object} currentUser - The currently logged in user (for self-check)
 * @returns {boolean} - Whether premium features should be visible
 */
export function shouldShowPremiumFeatures(user, currentUser) {
  // If user is not premium, don't show premium features
  if (!user?.is_premium) {
    return false;
  }

  // If viewing self
  if (currentUser && user.id === currentUser.id) {
    return !user.hide_premium_from_self;
  }

  // If viewing others
  return !user.hide_premium_from_others;
}

/**
 * Get filtered user data with premium features hidden if needed
 * @param {Object} user - The user object
 * @param {Object} currentUser - The currently logged in user
 * @returns {Object} - Filtered user object
 */
export function getUserWithPremiumVisibility(user, currentUser) {
  const showPremium = shouldShowPremiumFeatures(user, currentUser);

  if (!showPremium) {
    // Return a copy of the user with premium features hidden
    return {
      ...user,
      is_premium: false,
      background_gradient: null,
      selected_emojis: [],
      premium_emoji_count: 0,
      // Keep other fields as they are
    };
  }

  return user;
}