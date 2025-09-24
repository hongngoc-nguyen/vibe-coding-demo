import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Navigation } from '@/components/layout/navigation'
import { DashboardMetrics } from '@/components/dashboard/metrics'
import { BrandTrendChart } from '@/components/dashboard/trend-chart'
import { QuickInsights } from '@/components/dashboard/quick-insights'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation user={user} userRole={userData?.role || 'viewer'} />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Brand Monitoring Dashboard</h1>
          <p className="text-gray-600 mt-2">Track Anduin's AEO performance across platforms</p>
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