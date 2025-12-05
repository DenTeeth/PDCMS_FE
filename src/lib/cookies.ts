// Storage keys
export const TOKEN_KEY = 'accessToken';
export const USER_KEY = 'userData';

/**
 * Access Token Management (localStorage)
 * Note: refreshToken is stored in HTTP-Only Cookie by backend
 */

// Set access token in localStorage
export const setToken = (token: string) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(TOKEN_KEY, token);
    console.log(' Access token stored in localStorage');
  } catch (error) {
    console.error('Failed to set access token:', error);
  }
};

// Get access token from localStorage
export const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch (error) {
    console.error('Failed to get access token:', error);
    return null;
  }
};

// Remove access token from localStorage
export const removeToken = () => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(TOKEN_KEY);
    console.log(' Access token removed from localStorage');
  } catch (error) {
    console.error('Failed to remove access token:', error);
  }
};

/**
 * User Data Management (localStorage)
 */

// Set user data in localStorage
export const setUserData = (userData: any) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
    console.log(' User data stored in localStorage');
  } catch (error) {
    console.error('Failed to set user data:', error);
  }
};

// Get user data from localStorage
export const getUserData = (): any | null => {
  if (typeof window === 'undefined') return null;
  try {
    const userData = localStorage.getItem(USER_KEY);
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Failed to get user data:', error);
    return null;
  }
};

// Remove user data from localStorage
export const removeUserData = () => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(USER_KEY);
    console.log(' User data removed from localStorage');
  } catch (error) {
    console.error('Failed to remove user data:', error);
  }
};

/**
 * Clear all authentication data
 * Note: refreshToken in HTTP-Only Cookie will be cleared by backend on logout
 */
export const clearAuthData = () => {
  removeToken();
  removeUserData();
  console.log(' All auth data cleared from localStorage');
  
  // Debug: Check if refreshToken cookie exists
  if (typeof document !== 'undefined') {
    console.log('� Current cookies:', document.cookie);
  }
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  const token = getToken();
  const userData = getUserData();
  return !!(token && userData);
};

