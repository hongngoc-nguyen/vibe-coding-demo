import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Navigation } from '@/components/layout/navigation'
import { DashboardMetrics } from '@/components/dashboard/metrics'
import { BrandTrendChart } from '@/components/dashboard/trend-chart'
import { CompetitorComparison } from '@/components/dashboard/competitor-comparison'
import { QuickInsights } from '@/components/dashboard/quick-insights'

export default async function DashboardPage() {
  // Mock user for demo purposes (bypassing Supabase auth for now)
  const mockUser = {
    id: 'demo-user',
    email: 'demo@anduin.co'
  }
  const mockUserRole = 'admin'

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation user={mockUser} userRole={mockUserRole} />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-brand-navy heading">Brand Monitoring Dashboard</h1>
          <p className="text-gray-600 mt-2">Track Anduin's AEO performance across platforms</p>
        </div>

        <DashboardMetrics />

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          <BrandTrendChart />
          <CompetitorComparison />
        </div>

        {/* Insights Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          <div className="lg:col-span-3">
            <QuickInsights />
          </div>
        </div>
      </main>
    </div>
  )
}