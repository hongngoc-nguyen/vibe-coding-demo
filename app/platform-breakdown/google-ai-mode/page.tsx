import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { Navigation } from '@/components/layout/navigation'
import { PlatformInsights } from '@/components/analytics/platform-insights'

export default async function GoogleAIModePage() {
  const user = await currentUser()

  if (!user) {
    redirect('/sign-in')
  }

  // Get user role from Clerk metadata
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
          <h1 className="text-3xl font-bold text-gray-900">Google AI Mode</h1>
          <p className="text-gray-600 mt-2">
            Analyze performance on Google AI Mode platform
          </p>
        </div>

        <PlatformInsights platform="Google AI Mode" />
      </main>
    </div>
  )
}
