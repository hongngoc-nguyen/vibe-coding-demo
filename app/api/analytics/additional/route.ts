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

    // Get 'other' entity IDs
    const { data: otherEntities } = await supabase
      .from('entities')
      .select('entity_id')
      .eq('entity_type', 'other')

    const otherEntityIds = (otherEntities as Array<{ entity_id: string }> | null)?.map(e => e.entity_id) || []

    if (otherEntityIds.length === 0) {
      return NextResponse.json({
        citations: [],
        topEntities: [],
        availableDates: [],
        availablePlatforms: []
      })
    }

    // Get citation sources with filters - multi-step approach
    // Get all citations for 'other' entities
    const { data: allOtherCitations } = await supabase
      .from('citation_listing')
      .select('url, response_id, platform, entity_id')
      .in('entity_id', otherEntityIds) as { data: Array<{ url: string; response_id: string; platform: string; entity_id: string }> | null }

    // Get responses for date filtering
    let responsesForFiltering: Array<{ response_id: string; response_date: string }>
    if (dateFilter !== 'all') {
      // Get responses for specific date range
      const { data: specificDateResponses } = await supabase
        .from('responses')
        .select('response_id, response_date')
        .gte('response_date', dateFilter)
        .lt('response_date', getNextDay(dateFilter))

      responsesForFiltering = (specificDateResponses as Array<{ response_id: string; response_date: string }> | null) || []
    } else {
      // Get all responses
      const { data: allResponses } = await supabase
        .from('responses')
        .select('response_id, response_date')

      responsesForFiltering = (allResponses as Array<{ response_id: string; response_date: string }> | null) || []
    }

    const filterResponseIds = new Set(responsesForFiltering.map(r => r.response_id))

    // Filter citations by date and platform in JavaScript
    let filteredCitations = allOtherCitations?.filter(c =>
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
      .in('entity_id', otherEntityIds)

    const entityMap = new Map((entitiesData as Array<{ entity_id: string; canonical_name: string }> | null)?.map(e => [e.entity_id, e.canonical_name]) || [])

    const citations = processCitations(citationsData || [], entityMap)
    const topEntities = processTopEntities(filteredCitations || [], entityMap)

    // Get available filter options
    const { data: availableDatesData } = await supabase
      .from('responses')
      .select('response_date')
      .order('response_date', { ascending: false })

    const availableDates = [...new Set((availableDatesData as Array<{ response_date: string }> | null)?.map(d => d.response_date.split('T')[0]) || [])]

    // Get available platforms from filtered citations only
    const availablePlatforms = [...new Set(filteredCitations?.map(c => c.platform) || [])]

    return NextResponse.json({
      citations,
      topEntities,
      availableDates,
      availablePlatforms
    })
  } catch (error) {
    console.error('Error fetching additional mentions analytics:', error)
    return NextResponse.json({ error: 'Failed to fetch additional mentions analytics' }, { status: 500 })
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

function processTopEntities(data: any[], entityMap: Map<string, string>) {
  // Count ALL citations per entity (including duplicate URLs)
  const entityCounts = new Map<string, number>()

  data.forEach(citation => {
    const entityName = entityMap.get(citation.entity_id)
    if (entityName) {
      entityCounts.set(entityName, (entityCounts.get(entityName) || 0) + 1)
    }
  })

  // Convert to array, sort by count descending, take top 20
  return Array.from(entityCounts.entries())
    .map(([entity, citations]) => ({ entity, citations }))
    .sort((a, b) => b.citations - a.citations)
    .slice(0, 20)
}
