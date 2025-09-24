'use client'

import { DashboardMetrics } from '@/components/dashboard/metrics'
import { BrandTrendChart } from '@/components/dashboard/trend-chart'
import { QuickInsights } from '@/components/dashboard/quick-insights'

// Demo navigation component
function DemoNavigation() {
  return (
    <nav className="border-b bg-white">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded bg-brand-navy" />
              <span className="text-xl font-bold heading text-brand-navy">AEO Dashboard</span>
            </div>
            <div className="hidden md:flex space-x-1">
              <div className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium bg-brand-navy text-brand-white">
                <span>Dashboard</span>
              </div>
              <div className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-brand-navy hover:bg-gray-50">
                <span>Analytics</span>
              </div>
              <div className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-brand-navy hover:bg-gray-50">
                <span>AI Assistant</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600">Demo Mode</div>
            <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
              A
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default function DemoDashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <DemoNavigation />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-brand-navy heading">Brand Monitoring Dashboard</h1>
          <p className="text-gray-600 mt-2">Track Anduin's AEO performance across platforms</p>
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800 text-sm">
              <strong>Demo Mode:</strong> This is a preview of the AEO Dashboard with mock data.
              To access the full functionality, please configure your Supabase and Google Gemini API keys.
            </p>
          </div>
        </div>

        <DashboardMetrics />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          <div className="lg:col-span-2">
            <BrandTrendChart />
          </div>
          <div className="lg:col-span-1">
            <QuickInsights />
          </div>
        </div>
      </main>
    </div>
  )
}