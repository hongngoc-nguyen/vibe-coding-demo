# AEO Dashboard Deployment Guide

## Prerequisites

1. **Supabase Account** - Create a new project at [supabase.com](https://supabase.com)
2. **Google AI Studio Account** - Get API key from [aistudio.google.com](https://aistudio.google.com)
3. **Vercel Account** - Sign up at [vercel.com](https://vercel.com)
4. **GitHub Repository** - Fork or clone this repository

## Step 1: Supabase Setup

### Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be fully provisioned
3. Note down your project URL and keys from Settings → API

### Run Database Schema
1. In your Supabase dashboard, go to SQL Editor
2. Copy the entire content of `supabase/schema.sql`
3. Paste and run the SQL in the SQL Editor
4. Verify tables are created in the Table Editor

### Configure Authentication
1. Go to Authentication → Settings
2. Enable email/password authentication
3. Set site URL to your domain (e.g., `https://your-app.vercel.app`)
4. Add redirect URLs for auth callbacks

## Step 2: Google Gemini API Setup

1. Visit [Google AI Studio](https://aistudio.google.com)
2. Create a new API key
3. Copy the API key for environment configuration
4. (Optional) Set usage quotas and restrictions

## Step 3: Environment Variables

Create the following environment variables with your actual values:

```env
# Supabase Configuration (from Supabase Settings → API)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Google Gemini API
GOOGLE_GEMINI_API_KEY=your_google_gemini_api_key

# Application Settings
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

## Step 4: Vercel Deployment

### Method 1: GitHub Integration (Recommended)

1. **Connect Repository**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository

2. **Configure Build Settings**
   - Framework Preset: Next.js
   - Build Command: `npm run build`
   - Install Command: `npm install`
   - Output Directory: `.next` (auto-detected)

3. **Add Environment Variables**
   - In project settings, go to Environment Variables
   - Add all the environment variables from Step 3
   - Make sure to add them for Production, Preview, and Development

4. **Deploy**
   - Click Deploy
   - Wait for the build to complete
   - Your app will be available at `https://your-app.vercel.app`

### Method 2: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from project directory
cd aeo-dashboard
vercel

# Follow the prompts to configure your project
# Add environment variables when prompted
```

## Step 5: Post-Deployment Configuration

### Update Supabase Auth Settings
1. Go to Supabase Authentication → Settings
2. Update Site URL to your Vercel deployment URL
3. Add Redirect URLs:
   - `https://your-app.vercel.app/auth/callback`
   - `http://localhost:3000/auth/callback` (for development)

### Test the Application
1. Visit your deployed URL
2. Try creating a new account
3. Test login/logout functionality
4. Verify dashboard loads with mock data
5. Test AI chat feature (requires valid API key)
6. Test export functionality

## Step 6: Create First Admin User

### Option 1: Direct Database Insert
```sql
-- Run in Supabase SQL Editor after user signs up
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
WHERE email = 'your-admin-email@company.com';

-- Update the users table
UPDATE public.users
SET role = 'admin'
WHERE email = 'your-admin-email@company.com';
```

### Option 2: Manual Update
1. Sign up with your admin email
2. Go to Supabase → Authentication → Users
3. Find your user and edit the metadata
4. Add `"role": "admin"` to the metadata JSON
5. Update the `public.users` table role as well

## Production Checklist

- [ ] Supabase project created and schema deployed
- [ ] Google Gemini API key configured
- [ ] All environment variables set in Vercel
- [ ] Supabase auth settings updated with production URLs
- [ ] Admin user created and tested
- [ ] Dashboard loads and displays mock data
- [ ] Authentication flow works (login/logout)
- [ ] Charts render correctly
- [ ] Export functionality works
- [ ] AI chat responds (if API key configured)
- [ ] Mobile responsiveness tested
- [ ] SSL certificate active (automatic with Vercel)

## Troubleshooting

### Common Issues

**Build Fails**
- Check all dependencies are listed in `package.json`
- Verify TypeScript types are correct
- Check for missing environment variables

**Authentication Not Working**
- Verify Supabase URL and keys are correct
- Check auth redirect URLs in Supabase settings
- Ensure RLS policies are properly configured

**Charts Not Loading**
- Check API endpoints are accessible
- Verify database schema is correctly deployed
- Check browser console for JavaScript errors

**AI Chat Not Responding**
- Verify Google Gemini API key is valid
- Check API key has proper permissions
- Monitor Vercel function logs for errors

### Monitoring

**Vercel Analytics**
- Enable Vercel Analytics for performance monitoring
- Monitor function execution times
- Track user interactions and errors

**Supabase Monitoring**
- Monitor database performance in Supabase dashboard
- Check auth usage and patterns
- Monitor API usage and quotas

**Error Tracking**
- Check Vercel function logs for server errors
- Monitor browser console for client errors
- Set up error monitoring service (optional)

## Security Considerations

1. **Environment Variables**
   - Never commit actual API keys to git
   - Use different keys for development/production
   - Regularly rotate sensitive keys

2. **Database Security**
   - Row Level Security (RLS) is enabled on all tables
   - Users can only access data they're authorized for
   - Admin functions are role-protected

3. **API Security**
   - All API endpoints verify user authentication
   - Rate limiting is handled by Vercel
   - Input validation on all endpoints

4. **Client Security**
   - Authentication tokens stored securely
   - No sensitive data in client-side code
   - HTTPS enforced in production

## Maintenance

### Regular Tasks
- Monitor API usage and costs
- Review user activity and permissions
- Update dependencies monthly
- Monitor performance metrics
- Backup critical data

### Updates
- Update Next.js and dependencies regularly
- Monitor Supabase for new features
- Keep Gemini API integration updated
- Review and update security policies

## Support

For deployment issues:
1. Check this guide first
2. Review Vercel deployment logs
3. Check Supabase project health
4. Verify all environment variables
5. Test locally with production environment variables

Remember to never share your actual API keys or database credentials publicly!