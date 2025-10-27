import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'
import { QueryDetailResponse } from '@/types/search'

// Create Supabase client with service role
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ queryId: string }> }
) {
  try {
    // Authenticate user
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { queryId } = await params

    if (!queryId) {
      return NextResponse.json(
        { success: false, error: 'Query ID is required' },
        { status: 400 }
      )
    }

    // Fetch query with responses
    const { data: query, error: queryError } = await supabase
      .from('user_search_queries')
      .select(`
        *,
        search_responses (*)
      `)
      .eq('query_id', queryId)
      .single()

    if (queryError) {
      if (queryError.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Query not found' },
          { status: 404 }
        )
      }

      console.error('Failed to fetch query:', queryError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch query details' },
        { status: 500 }
      )
    }

    // Verify ownership
    if (query.user_id !== userId) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    // Format responses
    const responses = query.search_responses as any[] || []
    const googleSearchResponse = responses.find(r => r.source_type === 'google_search')
    const googleAIModeResponse = responses.find(r => r.source_type === 'google_ai_mode')

    const result: QueryDetailResponse = {
      success: true,
      query: {
        query_id: query.query_id,
        user_id: query.user_id,
        prompt_text: query.prompt_text,
        query_status: query.query_status as 'pending' | 'processing' | 'completed' | 'failed',
        created_at: query.created_at,
        updated_at: query.updated_at
      },
      responses: {
        google_search: googleSearchResponse || undefined,
        google_ai_mode: googleAIModeResponse || undefined
      }
    }

    return NextResponse.json(result, { status: 200 })

  } catch (error) {
    console.error('Query detail error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    )
  }
}
