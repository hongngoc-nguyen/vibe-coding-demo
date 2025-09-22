import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Navigation } from '@/components/layout/navigation'
import { GeminiChat } from '@/components/gemini-chat'

export default async function ChatPage() {
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
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">AI Data Analyst</h1>
          <p className="text-gray-600 mt-2">
            Ask questions about your AEO data and get intelligent insights
          </p>
        </div>

        <GeminiChat />
      </main>
    </div>
  )
}