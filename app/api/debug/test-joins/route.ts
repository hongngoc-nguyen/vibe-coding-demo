import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const results: any = {}

    // Test 1: Simple query without joins
    const { data: simple, error: simpleError } = await supabase
      .from('citation_listing')
      .select('*')
      .limit(5)

    results.simpleQuery = {
      error: simpleError?.message || null,
      count: simple?.length || 0,
      sample: simple
    }

    // Test 2: Join with responses using response_id
    const { data: withResponses, error: responsesError } = await supabase
      .from('citation_listing')
      .select(`
        url,
        name,
        platform,
        responses:response_id (response_date, prompt_id)
      `)
      .limit(5)

    results.joinWithResponses = {
      error: responsesError?.message || null,
      fullError: responsesError,
      count: withResponses?.length || 0,
      sample: withResponses
    }

    // Test 3: Join with entities using entity_id
    const { data: withEntities, error: entitiesError } = await supabase
      .from('citation_listing')
      .select(`
        url,
        name,
        platform,
        entities:entity_id (canonical_name, entity_type)
      `)
      .limit(5)

    results.joinWithEntities = {
      error: entitiesError?.message || null,
      fullError: entitiesError,
      count: withEntities?.length || 0,
      sample: withEntities
    }

    // Test 4: Full join with both responses and entities
    const { data: fullJoin, error: fullError } = await supabase
      .from('citation_listing')
      .select(`
        url,
        name,
        platform,
        responses:response_id (response_date),
        entities:entity_id (canonical_name, entity_type)
      `)
      .limit(5)

    results.fullJoin = {
      error: fullError?.message || null,
      fullError: fullError,
      count: fullJoin?.length || 0,
      sample: fullJoin
    }

    // Test 5: Filter for Anduin
    const { data: anduinData, error: anduinError } = await supabase
      .from('citation_listing')
      .select(`
        url,
        name,
        platform,
        responses:response_id (response_date),
        entities:entity_id (canonical_name, entity_type)
      `)
      .eq('entities.canonical_name', 'Anduin')
      .limit(10)

    results.anduinFilter = {
      error: anduinError?.message || null,
      fullError: anduinError,
      count: anduinData?.length || 0,
      sample: anduinData
    }

    return NextResponse.json(results, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
