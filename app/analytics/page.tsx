import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Navigation } from '@/components/layout/navigation'
import { AnalyticsTabs } from '@/components/analytics/analytics-tabs'

export default async function AnalyticsPage() {
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
          <h1 className="text-3xl font-bold text-brand-navy heading">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Deep dive into brand performance and competitive analysis
          </p>
        </div>

        <AnalyticsTabs />
      </main>
    </div>
  )
}