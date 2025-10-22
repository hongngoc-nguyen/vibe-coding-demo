import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { Navigation } from '@/components/layout/navigation'
import { DashboardMetrics } from '@/components/dashboard/metrics'
import { BrandTrendChart } from '@/components/dashboard/trend-chart'
import { ClusterChart } from '@/components/dashboard/cluster-chart'
import { CompetitorComparison } from '@/components/dashboard/competitor-comparison'
import { QuickInsights } from '@/components/dashboard/quick-insights'
import { PlatformDistribution } from '@/components/dashboard/platform-distribution'

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
          <h1 className="text-3xl font-bold text-brand-navy">Overview</h1>
          <p className="text-gray-600 mt-2">Quick view of general metrics across all entities</p>
        </div>

        {/* Quick Insights Section */}
        <div className="mb-8">
          <QuickInsights />
        </div>

        {/* Platform Distribution Chart */}
        <div className="mb-8">
          <PlatformDistribution />
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
      </main>
    </div>
  )
}