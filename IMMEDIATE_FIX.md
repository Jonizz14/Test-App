# IMMEDIATE FIX - CORS Error Still Occurring

## The Issue
The CORS error persists because the backend changes haven't been deployed to Render yet.

## IMMEDIATE SOLUTION 1: Quick Netlify Proxy Fix

Create a `_redirects` file in your Netlify site's public folder to proxy API calls:

### Step 1: Create _redirects file
Add this file to your project root (same level as package.json):

```
/api/*  https://django-test-app-backend.onrender.com/api/:splat  200
```

### Step 2: Update Frontend API URL
Change the API URL in your frontend to use relative paths:

**In `src/data/apiService.js`**, change line 1:
```javascript
// OLD
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://django-test-app-backend.onrender.com/api';

// NEW - Use relative URL for proxy
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
```

### Step 3: Rebuild and Deploy
```bash
npm run build
# Deploy to Netlify
```

This bypasses CORS by making requests appear to come from the same domain.

## IMMEDIATE SOLUTION 2: Allow All Origins (Temporary)

### Step 1: Update Django Settings
In `backend/testplatform/settings.py`, replace:
```python
CORS_ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    # ... other local hosts ...
    'https://stimtestapp.netlify.app',
]
```

With:
```python
CORS_ALLOW_ALL_ORIGINS = True
```

### Step 2: Push Changes
```bash
git add backend/testplatform/settings.py
git commit -m "Temporarily allow all origins for CORS"
git push
```

## PERMANENT SOLUTION: Deploy Backend Changes

The proper fix is already done - you just need to push it:

```bash
git add backend/testplatform/settings.py
git commit -m "Fix CORS for Netlify deployment"
git push
```

Render will redeploy automatically.

## Which Solution to Use?

- **Quick test**: Use Solution 1 (Netlify proxy)
- **Production**: Use permanent solution (push backend changes)
- **Emergency**: Use Solution 2 (allow all origins temporarily)