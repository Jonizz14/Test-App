# CORS Configuration Fix

## The Problem
The Netlify frontend is trying to access the Django backend, but the backend is blocking the request due to CORS policy.

**Error**: `Access to fetch at 'https://django-test-app-backend.onrender.com/api/users/login/' from origin 'https://stimtestapp.netlify.app' has been blocked by CORS policy`

## Solutions

### Solution 1: Update Django Backend CORS Settings (Recommended)

You need to modify your Django backend to allow requests from your Netlify domain.

1. **Install django-cors-headers** (if not already installed):
   ```bash
   pip install django-cors-headers
   ```

2. **Update `backend/testplatform/settings.py`**:
   ```python
   INSTALLED_APPS = [
       # ... other apps ...
       'corsheaders',
   ]

   MIDDLEWARE = [
       'corsheaders.middleware.CorsMiddleware',
       'django.middleware.security.SecurityMiddleware',
       # ... other middleware ...
   ]

   # Add these CORS settings
   CORS_ALLOWED_ORIGINS = [
       "https://stimtestapp.netlify.app",
       "http://localhost:5173",  # for local development
   ]

   # Allow credentials if needed
   CORS_ALLOW_CREDENTIALS = True

   # Allow all origins (less secure, for testing only)
   # CORS_ALLOW_ALL_ORIGINS = True
   ```

3. **Restart your Django backend**

### Solution 2: Use a Proxy (Temporary Fix)

You can set up a proxy in Netlify to route API requests through Netlify's domain:

1. **Create `_redirects` file in your `public` folder**:
   ```
   /*    /index.html   200
   /api/*  https://django-test-app-backend.onrender.com/api/:splat  200
   ```

2. **Update your frontend API base URL**:
   ```javascript
   const API_BASE_URL = '/api'; // Use relative URL for proxy
   ```

### Solution 3: Update Vite Config for Proxy (Development Only)

For local development, you can add a proxy to `vite.config.js`:
```javascript
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://django-test-app-backend.onrender.com',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
```

## Recommended Approach

**Use Solution 1** - Update the Django backend CORS settings. This is the most secure and proper solution.

## Testing the Fix

After making changes:
1. Clear browser cache
2. Try logging in again from your Netlify site
3. Check browser console for any remaining errors