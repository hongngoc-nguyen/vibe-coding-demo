# AEO Dashboard Screenshots

This directory contains screenshots of all pages in the AEO Brand Monitoring Dashboard application.

## Page Screenshots

1. **01-login-page.png** - Login page (empty form)
2. **02-login-filled.png** - Login page with demo credentials filled
3. **03-dashboard.png** - Main dashboard with brand monitoring metrics
4. **04-analytics.png** - Analytics dashboard with brand insights (has some data loading errors)
5. **05-chat.png** - AI Data Analyst chat interface
6. **06-dashboard-demo.png** - Demo dashboard page with mock data

## Application Overview

This is a Next.js application with the following key features:
- **Authentication**: Supabase-based authentication system
- **Dashboard**: Brand monitoring metrics and trends
- **Analytics**: Deep-dive analytics with brand insights and competitive analysis
- **AI Chat**: Gemini AI-powered data analyst for querying AEO data
- **Demo Mode**: Preview functionality with mock data

## Pages Structure

- `/` - Redirects to `/dashboard`
- `/login` - Authentication page
- `/dashboard` - Main brand monitoring dashboard
- `/dashboard/demo` - Demo version with mock data
- `/analytics` - Analytics dashboard with tabs for Brand Insights and Competitive Analysis
- `/chat` - AI-powered data analyst interface

## Technology Stack

- **Frontend**: Next.js 15.5.3 with React 19.1.0
- **Styling**: Tailwind CSS with shadcn/ui components
- **Authentication**: Supabase
- **AI Integration**: Google Gemini AI
- **Charts**: Recharts library
- **Development**: TypeScript, Turbopack

Generated on: ${new Date().toISOString()}