import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'
import { callGoogleSearchWorkflow, callGoogleAIModeWorkflow } from '@/lib/n8n'
import { SubmitSearchRequest, SubmitSearchResponse } from '@/types/search'
import crypto from 'crypto'

// Create Supabase client with service role
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse request body
    const body: SubmitSearchRequest = await request.json()
    const { prompt_text } = body

    if (!prompt_text || prompt_text.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Prompt text is required' },
        { status: 400 }
      )
    }

    if (prompt_text.length > 1000) {
      return NextResponse.json(
        { success: false, error: 'Prompt text must be less than 1000 characters' },
        { status: 400 }
      )
    }

    // Step 1: Create query in database
    const { data: query, error: queryError } = await supabase
      .from('user_search_queries')
      .insert({
        user_id: userId,
        prompt_text: prompt_text.trim(),
        query_status: 'pending'
      })
      .select()
      .single()

    if (queryError) {
      console.error('Failed to create query:', queryError)
      return NextResponse.json(
        { success: false, error: 'Failed to create search query' },
        { status: 500 }
      )
    }

    // Step 2: Update status to processing
    await supabase
      .from('user_search_queries')
      .update({ query_status: 'processing' })
      .eq('query_id', query.query_id)

    // Step 3: Pre-generate response_id UUIDs
    const googleSearchResponseId = crypto.randomUUID()
    const googleAIModeResponseId = crypto.randomUUID()

    // Step 4: Call both n8n workflows in parallel with pre-generated response_ids
    const [searchResult, aiResult] = await Promise.allSettled([
      callGoogleSearchWorkflow({
        query_id: query.query_id,
        user_id: userId,
        prompt_text: prompt_text.trim(),
        response_id: googleSearchResponseId
      }),
      callGoogleAIModeWorkflow({
        query_id: query.query_id,
        user_id: userId,
        prompt_text: prompt_text.trim(),
        response_id: googleAIModeResponseId
      })
    ])

    const errors: { googleSearch?: string; googleAIMode?: string } = {}

    const googleSearch = searchResult.status === 'fulfilled'
      ? searchResult.value
      : null

    const googleAIMode = aiResult.status === 'fulfilled'
      ? aiResult.value
      : null

    if (searchResult.status === 'rejected') {
      errors.googleSearch = searchResult.reason?.message || 'Unknown error'
    }

    if (aiResult.status === 'rejected') {
      errors.googleAIMode = aiResult.reason?.message || 'Unknown error'
    }

    // Step 5: Store responses in database using pre-generated response_ids
    const responseInserts = []

    if (googleSearch && googleSearch.success) {
      responseInserts.push(
        supabase
          .from('search_responses')
          .insert({
            response_id: googleSearchResponseId, // Use pre-generated UUID
            query_id: query.query_id,
            source_type: 'google_search',
            response_data: googleSearch.response_data,
            response_status: 'success',
            execution_time: googleSearch.execution_time
          })
          .select()
          .single()
      )
    } else if (errors.googleSearch) {
      responseInserts.push(
        supabase
          .from('search_responses')
          .insert({
            response_id: googleSearchResponseId, // Use pre-generated UUID
            query_id: query.query_id,
            source_type: 'google_search',
            response_data: '',
            response_status: 'failed',
            error_message: errors.googleSearch
          })
          .select()
          .single()
      )
    }

    if (googleAIMode && googleAIMode.success) {
      responseInserts.push(
        supabase
          .from('search_responses')
          .insert({
            response_id: googleAIModeResponseId, // Use pre-generated UUID
            query_id: query.query_id,
            source_type: 'google_ai_mode',
            response_data: googleAIMode.response_data,
            response_status: 'success',
            execution_time: googleAIMode.execution_time
          })
          .select()
          .single()
      )
    } else if (errors.googleAIMode) {
      responseInserts.push(
        supabase
          .from('search_responses')
          .insert({
            response_id: googleAIModeResponseId, // Use pre-generated UUID
            query_id: query.query_id,
            source_type: 'google_ai_mode',
            response_data: '',
            response_status: 'failed',
            error_message: errors.googleAIMode
          })
          .select()
          .single()
      )
    }

    // Wait for all responses to be stored
    const responseResults = await Promise.allSettled(responseInserts)

    // Step 6: Update query status
    const finalStatus = Object.keys(errors).length > 0 ? 'failed' : 'completed'
    await supabase
      .from('user_search_queries')
      .update({ query_status: finalStatus })
      .eq('query_id', query.query_id)

    // Step 7: Fetch the complete query with responses
    const { data: completeQuery, error: fetchError } = await supabase
      .from('user_search_queries')
      .select(`
        *,
        search_responses (*)
      `)
      .eq('query_id', query.query_id)
      .single()

    if (fetchError) {
      console.error('Failed to fetch complete query:', fetchError)
    }

    // Format responses for frontend
    const responses = completeQuery?.search_responses as any[] || []
    const googleSearchResponse = responses.find(r => r.source_type === 'google_search')
    const googleAIModeResponse = responses.find(r => r.source_type === 'google_ai_mode')

    const result: SubmitSearchResponse = {
      success: true,
      query_id: query.query_id,
      message: Object.keys(errors).length > 0
        ? 'Search completed with some errors'
        : 'Search completed successfully',
      responses: {
        google_search: googleSearchResponse || undefined,
        google_ai_mode: googleAIModeResponse || undefined
      }
    }

    return NextResponse.json(result, { status: 200 })

  } catch (error) {
    console.error('Search submit error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    )
  }
}
