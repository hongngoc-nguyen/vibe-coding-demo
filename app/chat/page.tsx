import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Navigation } from '@/components/layout/navigation'
import { GeminiChat } from '@/components/gemini-chat'

export default async function ChatPage() {
  // Mock user for demo purposes (bypassing Supabase auth for now)
  const mockUser = {
    id: 'demo-user',
    email: 'demo@anduin.co'
  }
  const mockUserRole = 'admin'

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation user={mockUser} userRole={mockUserRole} />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-brand-navy heading">AI Assistant</h1>
        </div>

        <GeminiChat />
      </main>
    </div>
  )
}