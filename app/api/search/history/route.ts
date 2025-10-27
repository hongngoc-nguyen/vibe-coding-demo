import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'
import { HistoryResponse } from '@/types/search'

// Create Supabase client with service role
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')

    // Validate pagination params
    if (page < 1 || pageSize < 1 || pageSize > 100) {
      return NextResponse.json(
        { success: false, error: 'Invalid pagination parameters' },
        { status: 400 }
      )
    }

    const offset = (page - 1) * pageSize

    // Fetch total count
    const { count, error: countError } = await supabase
      .from('user_search_queries')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    if (countError) {
      console.error('Failed to count queries:', countError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch query history' },
        { status: 500 }
      )
    }

    // Fetch queries with response count
    const { data: queries, error: queriesError } = await supabase
      .from('user_search_queries')
      .select(`
        query_id,
        prompt_text,
        query_status,
        created_at,
        search_responses (response_id)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1)

    if (queriesError) {
      console.error('Failed to fetch queries:', queriesError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch query history' },
        { status: 500 }
      )
    }

    // Format response
    const formattedQueries = queries.map(q => ({
      query_id: q.query_id,
      prompt_text: q.prompt_text,
      query_status: q.query_status as 'pending' | 'processing' | 'completed' | 'failed',
      created_at: q.created_at,
      response_count: (q.search_responses as any[])?.length || 0
    }))

    const result: HistoryResponse = {
      success: true,
      queries: formattedQueries,
      total: count || 0,
      page,
      pageSize
    }

    return NextResponse.json(result, { status: 200 })

  } catch (error) {
    console.error('Search history error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    )
  }
}
