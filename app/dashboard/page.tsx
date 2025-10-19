import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { Navigation } from '@/components/layout/navigation'
import { DashboardMetrics } from '@/components/dashboard/metrics'
import { BrandTrendChart } from '@/components/dashboard/trend-chart'
import { ClusterChart } from '@/components/dashboard/cluster-chart'
import { CompetitorComparison } from '@/components/dashboard/competitor-comparison'
import { QuickInsights } from '@/components/dashboard/quick-insights'

export default async function DashboardPage() {
  const user = await currentUser()

  if (!user) {
    redirect('/sign-in')
  }

  // Get user role from Clerk metadata (you can set this in Clerk dashboard)
  const userRole = user.publicMetadata?.role as string || 'viewer'

  const userData = {
    id: user.id,
    email: user.emailAddresses[0]?.emailAddress || ''
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation user={userData} userRole={userRole} />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-brand-navy">Brand Monitoring Dashboard</h1>
          <p className="text-gray-600 mt-2">Track Anduin's AEO performance across platforms</p>
        </div>

        <DashboardMetrics />

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          <BrandTrendChart />
          <ClusterChart />
        </div>

        <div className="grid grid-cols-1 gap-6 mt-8">
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