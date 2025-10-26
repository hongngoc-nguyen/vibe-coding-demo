import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getNextDay(dateString: string): string {
  const date = new Date(dateString)
  date.setDate(date.getDate() + 1)
  return date.toISOString().split('T')[0]
}

export async function GET(request: NextRequest) {
  try {
    // Use service role for analytics to bypass RLS
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
    const platform = searchParams.get('platform') || 'all'
    const dateFilter = searchParams.get('date') || 'all'
    const competitorsParam = searchParams.get('competitors') || 'all'

    // Parse competitors (can be comma-separated for multiple selections)
    const selectedCompetitors = competitorsParam === 'all'
      ? []
      : competitorsParam.split(',').filter(Boolean)

    // Step 1: Get brand and competitor entity IDs with their names
    let entitiesQuery = supabase
      .from('entities')
      .select('entity_id, canonical_name, entity_type')
      .in('entity_type', ['brand', 'competitor'])

    // Filter by specific competitors if selected (but always include brand)
    if (selectedCompetitors.length > 0) {
      entitiesQuery = entitiesQuery.or(`entity_type.eq.brand,canonical_name.in.(${selectedCompetitors.join(',')})`)
    }

    const { data: entities } = await entitiesQuery

    const entityIds = entities?.map(e => e.entity_id) || []
    const entityMap = new Map(entities?.map(e => [e.entity_id, e.canonical_name]) || [])

    if (entityIds.length === 0) {
      return NextResponse.json([])
    }

    // Step 2: Build optimized query - get citations with response dates in one query
    // First get response IDs filtered by date if needed
    let responseIdsForFilter: string[] | null = null
    let allDates: Set<string>

    if (dateFilter !== 'all') {
      const { data: filteredResponses } = await supabase
        .from('responses')
        .select('response_id, response_date')
        .gte('response_date', dateFilter)
        .lt('response_date', getNextDay(dateFilter))

      responseIdsForFilter = filteredResponses?.map(r => r.response_id) || []
      allDates = new Set(filteredResponses?.map(r => r.response_date.split('T')[0]) || [])

      if (responseIdsForFilter.length === 0) {
        return NextResponse.json([])
      }
    } else {
      // Get all unique dates from all responses
      const { data: allResponsesData } = await supabase
        .from('responses')
        .select('response_date')

      allDates = new Set(allResponsesData?.map(r => r.response_date.split('T')[0]) || [])
    }

    // Step 3: Get citations filtered by platform and date (via response_id filter)
    let citationQuery = supabase
      .from('citation_listing')
      .select('url, response_id, entity_id, platform')
      .in('entity_id', entityIds)

    if (platform !== 'all') {
      citationQuery = citationQuery.eq('platform', platform)
    }

    if (responseIdsForFilter) {
      citationQuery = citationQuery.in('response_id', responseIdsForFilter)
    }

    const { data: citations } = await citationQuery

    // Step 4: Get response dates only for citations we have (single optimized query)
    const uniqueResponseIds = [...new Set(citations?.map(c => c.response_id) || [])]

    if (uniqueResponseIds.length === 0) {
      return NextResponse.json([])
    }

    const { data: responses } = await supabase
      .from('responses')
      .select('response_id, response_date')
      .in('response_id', uniqueResponseIds)

    const responseMap = new Map(responses?.map(r => [r.response_id, r.response_date]) || [])

    // Group by response_date and entity, count distinct URLs
    interface EntityData {
      [entityName: string]: Set<string>
    }

    const dataByDate = new Map<string, EntityData>()

    // Initialize all dates with empty data
    allDates.forEach(date => {
      dataByDate.set(date, {})
    })

    citations?.forEach(item => {
      const responseDate = responseMap.get(item.response_id)
      const entityName = entityMap.get(item.entity_id)

      if (!responseDate || !entityName) return // Skip if no response date or entity name

      // Extract just the date part (YYYY-MM-DD)
      const dateOnly = responseDate.split('T')[0]

      if (!dataByDate.has(dateOnly)) {
        dataByDate.set(dateOnly, {})
      }

      const dateData = dataByDate.get(dateOnly)!
      if (!dateData[entityName]) {
        dateData[entityName] = new Set()
      }

      dateData[entityName].add(item.url)
    })

    // Get all unique entity names for filling missing dates
    const allEntityNames = new Set<string>()
    dataByDate.forEach(entities => {
      Object.keys(entities).forEach(name => allEntityNames.add(name))
    })

    // Transform to array format for multi-line chart and sort by date
    // Fill missing entity data with 0
    const chartData = Array.from(dataByDate.entries())
      .map(([date, entities]) => {
        const entry: any = { date }
        // Fill all entities, even if they have 0 citations that day
        allEntityNames.forEach(entityName => {
          entry[entityName] = entities[entityName]?.size || 0
        })
        return entry
      })
      .sort((a, b) => a.date.localeCompare(b.date))

    return NextResponse.json(chartData)
  } catch (error) {
    console.error('Error fetching platform competitive data:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
