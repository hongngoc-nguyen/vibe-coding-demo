# AEO Brand Monitoring Dashboard

A comprehensive dashboard for monitoring Anduin's brand presence across AI search platforms (ChatGPT, Google AI, Microsoft Copilot) with competitive analysis and AI-powered insights.

## Features

### 🏠 Dashboard Overview
- **Brand Performance Summary**: Key metrics cards showing total mentions, trend direction, and competitive ranking
- **Primary Visualization**: Interactive trend line chart showing Anduin mentions over time
- **Quick Insights Panel**: AI-generated summary of latest trends and notable changes
- **Data Freshness Indicator**: Clear timestamp of last data update

### 📊 Analytics Deep Dive
**Brand-Specific Insights Tab:**
- Interactive trend charts with filtering by date range, platform, and prompt clusters
- Breakdown metrics: mention frequency, citation URLs, platform source distribution
- Export functionality for reports (CSV/PDF)

**Competitive Analysis Tab:**
- Comparative trend charts: Anduin vs competitors vs external mentions
- Side-by-side metrics comparison table
- Market share visualization showing relative mention percentages
- Competitor-specific breakdowns with drill-down capability

### 🤖 AI Data Analyst Chat
- **Google Gemini Integration**: Natural language queries about AEO data
- **Intelligent Analysis**: Answers questions about trends, sentiment, competitive insights
- **Structured Responses**: Bullet points with key insights, data-backed recommendations
- **Example Queries**: "Why did our mentions drop last month?", "Which competitor is gaining traction?"

### 🔐 Authentication & Roles
- **Simple Authentication**: Email/password via Supabase Auth
- **Admin Role**: Full dashboard access + user management capabilities
- **Viewer Role**: Dashboard access + export functionality
- **Profile Management**: Basic user profile settings

### 📈 Interactive Data Filtering
- Date range selector (last 30 days, 90 days, custom range)
- Prompt cluster filtering (multi-select dropdown)
- Platform source filtering (search engines, AI platforms)
- Brand/competitor toggle switches
- Real-time chart updates based on filter selections

## Technology Stack

- **Frontend**: Next.js 15 with TypeScript
- **UI Components**: shadcn/ui with Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with Row Level Security
- **Charts**: Recharts library
- **AI Integration**: Google Gemini API
- **Export**: xlsx (Excel), jsPDF (PDF reports)
- **Deployment**: Vercel

## Database Schema

### Core Tables
- `users` - User profiles and roles (extends Supabase auth)
- `prompts` - AI prompts with clustering and sequence tracking
- `responses` - AI platform responses with execution metrics
- `brand_mentions` - Anduin brand mentions with citation tracking
- `competitor_mentions` - Competitor mentions and analysis
- `external_mentions` - Third-party mentions tracking
- `competitors` - Competitor configuration and metadata

### Views & Analytics
- `brand_performance` - Aggregated weekly brand performance metrics
- `competitive_analysis` - Comparative analysis across competitors

## Environment Setup

Create a `.env.local` file with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Google Gemini API
GOOGLE_GEMINI_API_KEY=your_google_gemini_api_key

# Application Settings
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Installation & Development

1. **Clone and install dependencies:**
```bash
npm install
```

2. **Set up Supabase:**
   - Create a new Supabase project
   - Run the SQL schema from `supabase/schema.sql`
   - Configure your environment variables

3. **Configure Google Gemini:**
   - Get API key from Google AI Studio
   - Add to environment variables

4. **Run development server:**
```bash
npm run dev
```

5. **Open in browser:**
   Navigate to `http://localhost:3000`

## Database Setup

Execute the SQL schema in your Supabase SQL Editor:

```sql
-- Run the complete schema from supabase/schema.sql
-- This includes tables, views, RLS policies, and sample data
```

## API Endpoints

### Metrics & Analytics
- `GET /api/metrics/summary` - Dashboard summary metrics
- `GET /api/metrics/trends` - Brand mention trends over time
- `GET /api/insights` - AI-generated insights and alerts
- `GET /api/analytics/brand` - Detailed brand performance data
- `GET /api/analytics/competitive` - Competitive analysis data

### AI Chat
- `POST /api/chat/analyze` - Process AI analyst queries

### Authentication
- Handled automatically by Supabase Auth
- Middleware protects routes and enforces role-based access

## User Roles & Permissions

### Admin Role
- Full dashboard access
- User management capabilities
- Data export (CSV/PDF)
- AI analyst chat access

### Viewer Role
- Dashboard and analytics access
- Data export functionality
- AI analyst chat access
- No user management

## Export Functionality

### CSV Export
- Multi-sheet Excel files with separate tabs for metrics, trends, platforms, competitors
- Formatted data tables with clear headers
- Date-stamped filenames

### PDF Reports
- Comprehensive reports with charts captured as images
- Executive summary with key metrics
- Data tables and visualizations
- Professional formatting suitable for stakeholder distribution

## Security Features

- **Row Level Security (RLS)** on all tables
- **Authentication middleware** protecting all routes
- **Role-based access control** for admin functions
- **Secure API endpoints** with user verification
- **Environment variable protection** for sensitive keys

## Data Flow

1. **Data Collection**: Weekly batch updates from automation pipeline
2. **Data Processing**: Aggregation through database views and API endpoints
3. **Visualization**: Real-time charts with interactive filtering
4. **AI Analysis**: Context-aware insights using current data
5. **Export**: On-demand report generation in multiple formats

## Deployment

### Vercel Deployment (Recommended)
1. Connect GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on git push

### Environment Variables in Production
- All environment variables must be configured in Vercel
- Supabase URLs and keys from your production project
- Google Gemini API key for AI functionality

## Monitoring & Maintenance

### Data Freshness
- Weekly data refresh cycle indicated in UI
- Last update timestamps throughout the application
- Automated data quality checks via database constraints

### Performance Optimization
- Database indexing on frequently queried columns
- Efficient data aggregation through views
- Client-side caching of API responses
- Optimized chart rendering with Recharts

## Support & Troubleshooting

### Common Issues
1. **Authentication errors**: Check Supabase configuration and RLS policies
2. **AI chat not working**: Verify Google Gemini API key configuration
3. **Charts not loading**: Check API endpoints and data format
4. **Export failures**: Ensure all required dependencies are installed

### Development Tips
- Use Supabase Studio for database management
- Monitor API usage in Vercel Analytics
- Check browser console for client-side errors
- Use React DevTools for component debugging

## Future Enhancements

- Real-time data streaming
- Advanced sentiment analysis
- Automated alerting system
- Custom dashboard creation
- Mobile-responsive design
- Advanced ML predictions
- Integration with more AI platforms

## License

Proprietary - Internal use only for Anduin team members.