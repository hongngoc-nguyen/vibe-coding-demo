import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const results: any = {}

    // Check citation_listing table
    const { data: citations, error: citationsError } = await supabase
      .from('citation_listing')
      .select('*')
      .limit(5)

    results.citation_listing = {
      error: citationsError?.message || null,
      count: citations?.length || 0,
      sample: citations || []
    }

    // Check entities table
    const { data: entities, error: entitiesError } = await supabase
      .from('entities')
      .select('*')
      .limit(10)

    results.entities = {
      error: entitiesError?.message || null,
      count: entities?.length || 0,
      sample: entities || []
    }

    // Check responses table
    const { data: responses, error: responsesError } = await supabase
      .from('responses')
      .select('response_date')
      .order('response_date', { ascending: false })
      .limit(10)

    results.responses = {
      error: responsesError?.message || null,
      count: responses?.length || 0,
      dates: responses || []
    }

    // Check prompts table
    const { data: prompts, error: promptsError } = await supabase
      .from('prompts')
      .select('prompt_cluster')
      .limit(100)

    const uniqueClusters = [...new Set(prompts?.map(p => p.prompt_cluster) || [])]

    results.prompts = {
      error: promptsError?.message || null,
      count: prompts?.length || 0,
      uniqueClusters
    }

    // Test trends query
    const { data: trendData, error: trendError } = await supabase
      .from('citation_listing')
      .select(`
        url,
        responses!inner(response_date),
        entities!inner(canonical_name)
      `)
      .eq('entities.canonical_name', 'Anduin')
      .limit(10)

    results.trendsQuery = {
      error: trendError?.message || null,
      fullError: trendError || null,
      count: trendData?.length || 0,
      sample: trendData?.slice(0, 3) || []
    }

    // Test competitive query
    const { data: competitiveData, error: competitiveError } = await supabase
      .from('citation_listing')
      .select(`
        url,
        responses!inner(response_date),
        entities!inner(canonical_name, entity_type)
      `)
      .in('entities.entity_type', ['brand', 'competitor'])
      .limit(10)

    results.competitiveQuery = {
      error: competitiveError?.message || null,
      fullError: competitiveError || null,
      count: competitiveData?.length || 0,
      sample: competitiveData?.slice(0, 3) || []
    }

    // Count total citations by entity
    const { data: allCitations, error: allError } = await supabase
      .from('citation_listing')
      .select(`
        url,
        entities!inner(canonical_name, entity_type)
      `)

    const entityCounts: { [key: string]: Set<string> } = {}
    allCitations?.forEach(c => {
      const name = c.entities.canonical_name
      if (!entityCounts[name]) {
        entityCounts[name] = new Set()
      }
      entityCounts[name].add(c.url)
    })

    const entitySummary = Object.entries(entityCounts).map(([name, urls]) => ({
      name,
      distinctUrls: urls.size
    })).sort((a, b) => b.distinctUrls - a.distinctUrls)

    results.entitySummary = {
      error: allError?.message || null,
      totalCitations: allCitations?.length || 0,
      entitiesByDistinctUrls: entitySummary
    }

    return NextResponse.json(results, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
