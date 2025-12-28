# Netlify Deployment Guide

## Environment Variable Configuration

### Option 1: Set Environment Variable in Netlify Dashboard (Recommended)

1. Go to your Netlify site dashboard
2. Navigate to **Site settings > Environment variables**
3. Add a new environment variable:
   - **Key**: `VITE_API_BASE_URL`
   - **Value**: `https://django-test-app-backend.onrender.com/api`
4. Save and redeploy your site

### Option 2: Use Built-in Fallback (Already Configured)

The application now has a built-in fallback URL in `vite.config.js`:
- If no environment variable is set, it will use: `https://django-test-app-backend.onrender.com/api`
- This means you can deploy without additional configuration

## Current Configuration

- **Vite Config**: Updated to handle `VITE_API_BASE_URL` properly
- **API Service**: Falls back to the new backend URL if no env var is found
- **Environment File**: Updated for local development

## Build Process

The application will:
1. Check for `VITE_API_BASE_URL` environment variable
2. Use the provided URL if found
3. Fall back to `https://django-test-app-backend.onrender.com/api` if not found

## Deployment Steps

1. Connect your repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Optionally set the environment variable in Netlify dashboard
5. Deploy!

## Notes

- The `.env` file is only used for local development
- Environment variables in Netlify override the built-in fallbacks
- The fallback URL is already configured for production use