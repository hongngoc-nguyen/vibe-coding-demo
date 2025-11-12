import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getNextDay(dateString: string): string {
  const date = new Date(dateString)
  date.setDate(date.getDate() + 1)
  return date.toISOString().split('T')[0]
}

export async function GET(request: NextRequest) {
  try {
    // Use service role to bypass RLS for analytics data
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { searchParams } = new URL(request.url)
    const dateFilter = searchParams.get('date') || 'all'
    const platformFilter = searchParams.get('platform') || 'all'
    const competitorsParam = searchParams.get('competitors') || 'all'

    // Parse competitors (can be comma-separated for multiple selections)
    const selectedCompetitors = competitorsParam === 'all'
      ? []
      : competitorsParam.split(',').filter(Boolean)

    // Get competitor entity IDs
    let competitorQuery = supabase
      .from('entities')
      .select('entity_id, canonical_name')
      .eq('entity_type', 'competitor')

    // Filter by specific competitors if selected
    if (selectedCompetitors.length > 0) {
      competitorQuery = competitorQuery.in('canonical_name', selectedCompetitors)
    }

    const { data: competitorEntities } = await competitorQuery

    const competitorEntityIds = competitorEntities?.map(e => e.entity_id) || []

    if (competitorEntityIds.length === 0) {
      // Still get available competitors for the filter dropdown
      const { data: allCompetitors } = await supabase
        .from('entities')
        .select('canonical_name')
        .eq('entity_type', 'competitor')
        .order('canonical_name', { ascending: true })

      return NextResponse.json({
        citations: [],
        availableDates: [],
        availablePlatforms: [],
        availableCompetitors: allCompetitors?.map(c => c.canonical_name) || []
      })
    }

    // Get citation sources with filters - multi-step approach
    // Get all citations for competitor entities
    const { data: allCompetitorCitations } = await supabase
      .from('citation_listing')
      .select('url, response_id, platform, entity_id')
      .in('entity_id', competitorEntityIds)

    // Get responses for date filtering
    let responsesForFiltering
    if (dateFilter !== 'all') {
      // Get responses for specific date range
      const { data: specificDateResponses } = await supabase
        .from('responses')
        .select('response_id, response_date')
        .gte('response_date', dateFilter)
        .lt('response_date', getNextDay(dateFilter))

      responsesForFiltering = specificDateResponses || []
    } else {
      // Get all responses
      const { data: allResponses } = await supabase
        .from('responses')
        .select('response_id, response_date')

      responsesForFiltering = allResponses || []
    }

    const filterResponseIds = new Set(responsesForFiltering.map(r => r.response_id))

    // Filter citations by date and platform in JavaScript
    let filteredCitations = allCompetitorCitations?.filter(c =>
      filterResponseIds.has(c.response_id)
    ) || []

    if (platformFilter !== 'all') {
      filteredCitations = filteredCitations.filter(c => c.platform === platformFilter)
    }

    const citationsData = filteredCitations

    // Get entity canonical names
    const { data: entitiesData } = await supabase
      .from('entities')
      .select('entity_id, canonical_name')
      .in('entity_id', competitorEntityIds)

    const entityMap = new Map(entitiesData?.map(e => [e.entity_id, e.canonical_name]) || [])

    const citations = processCitations(citationsData || [], entityMap)

    // Get available filter options
    const { data: availableDatesData } = await supabase
      .from('responses')
      .select('response_date')
      .order('response_date', { ascending: false })

    const availableDates = [...new Set(availableDatesData?.map(d => d.response_date.split('T')[0]) || [])]

    // Get available platforms from ALL competitor citations (not just filtered ones)
    const availablePlatforms = [...new Set(allCompetitorCitations?.map(c => c.platform) || [])]

    // Get all competitor names for the filter dropdown
    const { data: allCompetitors } = await supabase
      .from('entities')
      .select('canonical_name')
      .eq('entity_type', 'competitor')
      .order('canonical_name', { ascending: true })

    const availableCompetitors = allCompetitors?.map(c => c.canonical_name) || []

    return NextResponse.json({
      citations,
      availableDates,
      availablePlatforms,
      availableCompetitors
    })
  } catch (error) {
    console.error('Error fetching competitor analytics:', error)
    return NextResponse.json({ error: 'Failed to fetch competitor analytics' }, { status: 500 })
  }
}

function processCitations(data: any[], entityMap: Map<string, string>) {
  const urlMap = new Map<string, { count: number, entityIds: Set<string> }>()

  data.forEach(item => {
    const existing = urlMap.get(item.url) || { count: 0, entityIds: new Set() }
    existing.count++
    existing.entityIds.add(item.entity_id)
    urlMap.set(item.url, existing)
  })

  return Array.from(urlMap.entries())
    .map(([url, data]) => ({
      url,
      count: data.count,
      canonical_name: Array.from(data.entityIds).map(id => entityMap.get(id)).filter(Boolean).join(', ')
    }))
    .sort((a, b) => b.count - a.count)
}
