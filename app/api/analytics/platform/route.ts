import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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
    const days = parseInt(searchParams.get('days') || '30')
    const platform = searchParams.get('platform') || 'all'
    const dateFilter = searchParams.get('date') || 'all'

    // Calculate date ranges
    const endDate = new Date()
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    const previousStartDate = new Date(startDate.getTime() - days * 24 * 60 * 60 * 1000)

    // Get all entity types for this platform
    const { data: allEntities } = await supabase
      .from('entities')
      .select('entity_id, canonical_name, entity_type')

    const entityMap = new Map(allEntities?.map(e => [e.entity_id, e]) || [])

    // Get all responses in date range for filtering
    const { data: currentPeriodResponses } = await supabase
      .from('responses')
      .select('response_id, response_date')
      .gte('response_date', startDate.toISOString())

    const { data: previousPeriodResponses } = await supabase
      .from('responses')
      .select('response_id, response_date')
      .gte('response_date', previousStartDate.toISOString())
      .lt('response_date', startDate.toISOString())

    const currentPeriodResponseIds = new Set(currentPeriodResponses?.map(r => r.response_id) || [])
    const previousPeriodResponseIds = new Set(previousPeriodResponses?.map(r => r.response_id) || [])

    // Get all citations for this platform (or all platforms if platform='all')
    let citationQuery = supabase
      .from('citation_listing')
      .select('url, response_id, entity_id, platform')

    if (platform !== 'all') {
      citationQuery = citationQuery.eq('platform', platform)
    }

    const { data: allCitations } = await citationQuery

    // 1. Total Citations (current period)
    const currentCitations = allCitations?.filter(c =>
      currentPeriodResponseIds.has(c.response_id)
    ) || []

    const totalCitations = new Set(currentCitations.map(c => c.url)).size

    // 2. Growth Rate (previous period)
    const previousCitations = allCitations?.filter(c =>
      previousPeriodResponseIds.has(c.response_id)
    ) || []

    const previousTotal = new Set(previousCitations.map(c => c.url)).size
    const growthRate = previousTotal > 0 ? ((totalCitations - previousTotal) / previousTotal) * 100 : 0

    // 3. Entity Distribution Chart (citations by entity over time)
    const { data: allResponses } = await supabase
      .from('responses')
      .select('response_id, response_date')
      .gte('response_date', startDate.toISOString())

    const citationsWithDates = currentCitations
      .map(c => {
        const response = currentPeriodResponses?.find(r => r.response_id === c.response_id)
        const entity = entityMap.get(c.entity_id)
        return {
          url: c.url,
          entity_name: entity?.canonical_name || 'Unknown',
          entity_type: entity?.entity_type || 'unknown',
          response_date: response?.response_date
        }
      })
      .filter(c => c.response_date)

    const entityDistribution = processEntityDistribution(citationsWithDates)

    // 4. Prompt Clusters Chart
    const citationResponseIds = [...new Set(currentCitations.map(c => c.response_id))]

    const { data: responsesWithDates } = await supabase
      .from('responses')
      .select('response_id, response_date, prompt_id')
      .in('response_id', citationResponseIds)

    const promptIds = [...new Set(responsesWithDates?.map(r => r.prompt_id).filter(Boolean) || [])]

    const { data: prompts } = await supabase
      .from('prompts')
      .select('prompt_id, prompt_cluster')
      .in('prompt_id', promptIds)

    const promptClusters = processPromptClusters(
      currentCitations || [],
      responsesWithDates || [],
      prompts || []
    )

    // 5. Citation Sources Table (with entity info)
    let responsesForFiltering = currentPeriodResponses || []

    if (dateFilter !== 'all') {
      const { data: specificDateResponses } = await supabase
        .from('responses')
        .select('response_id, response_date')
        .eq('response_date', dateFilter)

      responsesForFiltering = specificDateResponses || []
    }

    const filterResponseIds = new Set(responsesForFiltering.map(r => r.response_id))

    const filteredCitations = allCitations?.filter(c =>
      filterResponseIds.has(c.response_id)
    ) || []

    const citations = processCitations(filteredCitations, entityMap)

    // Get available filter options
    const { data: availableDatesData } = await supabase
      .from('responses')
      .select('response_date')
      .order('response_date', { ascending: false })

    const availableDates = [...new Set(availableDatesData?.map(d => d.response_date.split('T')[0]) || [])]

    // Get available platforms from citations
    const availablePlatforms = [...new Set(allCitations?.map(c => c.platform) || [])]

    // Get available entities from citations
    const availableEntities = [...new Set(
      currentCitations
        .map(c => entityMap.get(c.entity_id)?.canonical_name)
        .filter(Boolean)
    )] as string[]

    return NextResponse.json({
      metrics: {
        totalCitations,
        growthRate: Number(growthRate.toFixed(1))
      },
      entityDistribution,
      promptClusters,
      citations,
      availableDates,
      availablePlatforms,
      availableEntities
    })
  } catch (error) {
    console.error('Error fetching platform analytics:', error)
    return NextResponse.json({ error: 'Failed to fetch platform analytics' }, { status: 500 })
  }
}

function processEntityDistribution(data: any[]) {
  const entityMap = new Map<string, Map<string, Set<string>>>()

  data.forEach(item => {
    if (!item.response_date) return
    const date = item.response_date.split('T')[0]
    const entityName = item.entity_name

    if (!entityMap.has(date)) {
      entityMap.set(date, new Map())
    }
    if (!entityMap.get(date)!.has(entityName)) {
      entityMap.get(date)!.set(entityName, new Set())
    }
    entityMap.get(date)!.get(entityName)!.add(item.url)
  })

  // Get all unique entities
  const allEntities = new Set<string>()
  entityMap.forEach(entities => {
    entities.forEach((_, entity) => allEntities.add(entity))
  })

  // Transform to array format with all entities for each date (fill missing with 0)
  return Array.from(entityMap.entries())
    .map(([date, entities]) => {
      const entry: any = { date }
      allEntities.forEach(entity => {
        entry[entity] = entities.get(entity)?.size || 0
      })
      return entry
    })
    .sort((a, b) => a.date.localeCompare(b.date))
}

function processPromptClusters(citations: any[], responses: any[], prompts: any[]) {
  const promptClusterMap = new Map(prompts.map(p => [p.prompt_id, p.prompt_cluster]))

  const responseMap = new Map(
    responses.map(r => [
      r.response_id,
      {
        date: r.response_date.split('T')[0],
        cluster: promptClusterMap.get(r.prompt_id) || 'Unclustered'
      }
    ])
  )

  const dataByDate = new Map<string, Map<string, Set<string>>>()

  citations.forEach(citation => {
    const responseInfo = responseMap.get(citation.response_id)
    if (!responseInfo) return

    const { date, cluster } = responseInfo

    if (!dataByDate.has(date)) {
      dataByDate.set(date, new Map())
    }
    if (!dataByDate.get(date)!.has(cluster)) {
      dataByDate.get(date)!.set(cluster, new Set())
    }

    dataByDate.get(date)!.get(cluster)!.add(citation.url)
  })

  const allClusters = new Set<string>()
  dataByDate.forEach(clusters => {
    clusters.forEach((_, cluster) => allClusters.add(cluster))
  })

  const chartData = Array.from(dataByDate.entries())
    .map(([date, clusters]) => {
      const entry: any = { date }
      allClusters.forEach(cluster => {
        entry[cluster] = clusters.get(cluster)?.size || 0
      })
      return entry
    })
    .sort((a, b) => a.date.localeCompare(b.date))

  return chartData
}

function processCitations(data: any[], entityMap: Map<string, any>) {
  const urlCounts = new Map<string, { count: number, entity: string }>()

  data.forEach(item => {
    const entity = entityMap.get(item.entity_id)
    const existingData = urlCounts.get(item.url)

    if (existingData) {
      urlCounts.set(item.url, {
        count: existingData.count + 1,
        entity: existingData.entity
      })
    } else {
      urlCounts.set(item.url, {
        count: 1,
        entity: entity?.canonical_name || 'Unknown'
      })
    }
  })

  return Array.from(urlCounts.entries())
    .map(([url, data]) => ({ url, count: data.count, entity: data.entity }))
    .sort((a, b) => b.count - a.count)
}
