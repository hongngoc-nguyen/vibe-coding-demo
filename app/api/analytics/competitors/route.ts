import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { searchParams } = new URL(request.url)
    const dateFilter = searchParams.get('date') || 'all'
    const platformFilter = searchParams.get('platform') || 'all'

    // Get competitor entity IDs
    const { data: competitorEntities } = await supabase
      .from('entities')
      .select('entity_id')
      .eq('entity_type', 'competitor')

    const competitorEntityIds = competitorEntities?.map(e => e.entity_id) || []

    if (competitorEntityIds.length === 0) {
      return NextResponse.json({
        citations: [],
        availableDates: [],
        availablePlatforms: []
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
      // Get responses for specific date
      const { data: specificDateResponses } = await supabase
        .from('responses')
        .select('response_id, response_date')
        .eq('response_date', dateFilter)

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

    const { data: availablePlatformsData } = await supabase
      .from('citation_listing')
      .select('platform')
      .in('entity_id', competitorEntityIds)

    const availablePlatforms = [...new Set(availablePlatformsData?.map(p => p.platform) || [])]

    return NextResponse.json({
      citations,
      availableDates,
      availablePlatforms
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
