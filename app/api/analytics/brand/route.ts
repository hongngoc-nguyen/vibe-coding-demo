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
    const days = parseInt(searchParams.get('days') || '30')
    const dateFilter = searchParams.get('date') || 'all'
    const platformFilter = searchParams.get('platform') || 'all'

    // Calculate date ranges
    const endDate = new Date()
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    const previousStartDate = new Date(startDate.getTime() - days * 24 * 60 * 60 * 1000)

    // Get brand entity IDs
    const { data: brandEntities } = await supabase
      .from('entities')
      .select('entity_id')
      .eq('entity_type', 'brand')

    const brandEntityIds = brandEntities?.map(e => e.entity_id) || []

    if (brandEntityIds.length === 0) {
      return NextResponse.json({
        metrics: { totalCitations: 0, growthRate: 0 },
        uniqueCitationChart: [],
        platformDistribution: [],
        promptClusters: [],
        citations: [],
        availableDates: [],
        availablePlatforms: []
      })
    }

    // Get all responses in date range for filtering
    // When dateFilter is 'all', get ALL responses for metrics, otherwise use 30-day window
    let currentPeriodResponses = []
    let previousPeriodResponses = []

    if (dateFilter === 'all') {
      // Get ALL responses for metrics when showing all data
      const { data: allResponsesData } = await supabase
        .from('responses')
        .select('response_id, response_date')

      currentPeriodResponses = allResponsesData || []
      // For growth rate when showing all data, compare to empty previous period
      previousPeriodResponses = []
    } else {
      // Use 30-day rolling window for metrics when filtering by specific date
      const { data: currentData } = await supabase
        .from('responses')
        .select('response_id, response_date')
        .gte('response_date', startDate.toISOString())

      const { data: previousData } = await supabase
        .from('responses')
        .select('response_id, response_date')
        .gte('response_date', previousStartDate.toISOString())
        .lt('response_date', startDate.toISOString())

      currentPeriodResponses = currentData || []
      previousPeriodResponses = previousData || []
    }

    const currentPeriodResponseIds = new Set(currentPeriodResponses?.map(r => r.response_id) || [])
    const previousPeriodResponseIds = new Set(previousPeriodResponses?.map(r => r.response_id) || [])

    // Get all brand citations (with platform filter if specified)
    let brandCitationsQuery = supabase
      .from('citation_listing')
      .select('url, response_id, platform')
      .in('entity_id', brandEntityIds)

    if (platformFilter !== 'all') {
      brandCitationsQuery = brandCitationsQuery.eq('platform', platformFilter)
    }

    const { data: allBrandCitationsRaw } = await brandCitationsQuery

    // 1. Total Citations (current period) - filter in JavaScript
    const currentCitations = allBrandCitationsRaw?.filter(c =>
      currentPeriodResponseIds.has(c.response_id)
    ) || []

    const totalCitations = new Set(currentCitations.map(c => c.url)).size

    // 2. Growth Rate (previous period) - filter in JavaScript
    const previousCitations = allBrandCitationsRaw?.filter(c =>
      previousPeriodResponseIds.has(c.response_id)
    ) || []

    const previousTotal = new Set(previousCitations.map(c => c.url)).size
    const growthRate = previousTotal > 0 ? ((totalCitations - previousTotal) / previousTotal) * 100 : 0

    // 3. Unique Citation Chart (responses with brand URLs vs total responses by date)
    // Apply date filter if specified
    let chartResponsesQuery = supabase
      .from('responses')
      .select('response_id, response_date')

    if (dateFilter !== 'all') {
      // Filter by specific date
      chartResponsesQuery = chartResponsesQuery
        .gte('response_date', dateFilter)
        .lt('response_date', getNextDay(dateFilter))
    }
    // When dateFilter is 'all', don't apply any date restriction to get ALL historical data

    const { data: allResponses } = await chartResponsesQuery

    // Get all brand citations without join first (with platform filter)
    let brandCitationQuery = supabase
      .from('citation_listing')
      .select('response_id')
      .in('entity_id', brandEntityIds)

    if (platformFilter !== 'all') {
      brandCitationQuery = brandCitationQuery.eq('platform', platformFilter)
    }

    const { data: brandCitationRaw } = await brandCitationQuery

    // Get unique response IDs
    const brandResponseIds = [...new Set(brandCitationRaw?.map(c => c.response_id) || [])]

    // Get those responses with their dates, applying date filter
    let brandResponsesQuery = supabase
      .from('responses')
      .select('response_id, response_date')
      .in('response_id', brandResponseIds)

    if (dateFilter !== 'all') {
      // Filter by specific date
      brandResponsesQuery = brandResponsesQuery
        .gte('response_date', dateFilter)
        .lt('response_date', getNextDay(dateFilter))
    }
    // When dateFilter is 'all', don't apply any date restriction to get ALL historical data

    const { data: brandResponses } = await brandResponsesQuery

    const uniqueCitationChart = processUniqueCitationChart(allResponses || [], brandResponses || [])

    // 4. Platform Distribution (brand citations by platform over time)
    // Get all brand citations with platform (with platform filter)
    let platformCitationsQuery = supabase
      .from('citation_listing')
      .select('url, platform, response_id')
      .in('entity_id', brandEntityIds)

    if (platformFilter !== 'all') {
      platformCitationsQuery = platformCitationsQuery.eq('platform', platformFilter)
    }

    const { data: allPlatformCitations } = await platformCitationsQuery

    // Determine which response set to use based on date filter
    // When dateFilter is 'all', use brandResponses (which now includes ALL historical data)
    const platformResponseSet = brandResponses
    const platformResponseIds = new Set(platformResponseSet?.map(r => r.response_id) || [])

    // Filter for responses in the selected period and add response dates
    const platformData = allPlatformCitations
      ?.filter(c => platformResponseIds.has(c.response_id))
      .map(c => {
        const response = platformResponseSet?.find(r => r.response_id === c.response_id)
        return {
          url: c.url,
          platform: c.platform,
          response_date: response?.response_date
        }
      })
      .filter(c => c.response_date) || []

    const platformDistribution = processPlatformDistribution(platformData)

    // 5. Prompt Clusters Chart
    // Use same approach as dashboard - get citations with response details (with platform filter)
    let brandCitationsForClustersQuery = supabase
      .from('citation_listing')
      .select('url, response_id')
      .in('entity_id', brandEntityIds)

    if (platformFilter !== 'all') {
      brandCitationsForClustersQuery = brandCitationsForClustersQuery.eq('platform', platformFilter)
    }

    const { data: allBrandCitations } = await brandCitationsForClustersQuery

    // Filter by date after getting the data (since join filtering doesn't work)
    // Only apply startDate filter if dateFilter is not 'all'
    const brandCitationsForClusters = allBrandCitations?.filter(c => {
      const responseDate = brandResponses?.find(r => r.response_id === c.response_id)?.response_date
      if (!responseDate) return false
      // When dateFilter is 'all', don't apply startDate restriction to get ALL historical data
      return dateFilter === 'all' || new Date(responseDate) >= startDate
    }) || []

    // Get response details for brand citations
    const brandClusterResponseIds = [...new Set(brandCitationsForClusters?.map(c => c.response_id) || [])]

    let responsesWithDatesQuery = supabase
      .from('responses')
      .select('response_id, response_date, prompt_id')
      .in('response_id', brandClusterResponseIds)

    if (dateFilter !== 'all') {
      responsesWithDatesQuery = responsesWithDatesQuery
        .gte('response_date', dateFilter)
        .lt('response_date', getNextDay(dateFilter))
    }

    const { data: responsesWithDates } = await responsesWithDatesQuery

    // Get prompt clusters
    const promptIds = [...new Set(responsesWithDates?.map(r => r.prompt_id).filter(Boolean) || [])]

    const { data: prompts } = await supabase
      .from('prompts')
      .select('prompt_id, prompt_cluster')
      .in('prompt_id', promptIds)

    const promptClusters = processPromptClusters(
      brandCitationsForClusters || [],
      responsesWithDates || [],
      prompts || [],
      allResponses || [] // Pass all responses to get all dates
    )

    // 6. Citation Sources Table
    // Get all brand citations with platform (with platform filter)
    let citationsForTableQuery = supabase
      .from('citation_listing')
      .select('url, response_id, platform')
      .in('entity_id', brandEntityIds)

    if (platformFilter !== 'all') {
      citationsForTableQuery = citationsForTableQuery.eq('platform', platformFilter)
    }

    const { data: allCitationsForTable } = await citationsForTableQuery

    // Get responses for date filtering
    let responsesForFiltering = []

    if (dateFilter === 'all') {
      // Get ALL responses when dateFilter is 'all'
      const { data: allResponsesForTable } = await supabase
        .from('responses')
        .select('response_id, response_date')

      responsesForFiltering = allResponsesForTable || []
    } else {
      // Get responses for specific date
      const { data: specificDateResponses } = await supabase
        .from('responses')
        .select('response_id, response_date')
        .gte('response_date', dateFilter)
        .lt('response_date', getNextDay(dateFilter))

      responsesForFiltering = specificDateResponses || []
    }

    const filterResponseIds = new Set(responsesForFiltering.map(r => r.response_id))

    // Filter citations by date and platform
    let filteredCitations = allCitationsForTable?.filter(c =>
      filterResponseIds.has(c.response_id)
    ) || []

    if (platformFilter !== 'all') {
      filteredCitations = filteredCitations.filter(c => c.platform === platformFilter)
    }

    const citations = processCitations(filteredCitations)

    // Get available filter options
    const { data: availableDatesData } = await supabase
      .from('responses')
      .select('response_date')
      .order('response_date', { ascending: false })

    const availableDates = [...new Set(availableDatesData?.map(d => d.response_date.split('T')[0]) || [])]

    // Get available platforms from filtered citations only
    const availablePlatforms = [...new Set(filteredCitations?.map(c => c.platform) || [])]

    return NextResponse.json({
      metrics: {
        totalCitations,
        growthRate: Number(growthRate.toFixed(1))
      },
      uniqueCitationChart,
      platformDistribution,
      promptClusters,
      citations,
      availableDates,
      availablePlatforms
    })
  } catch (error) {
    console.error('Error fetching brand analytics:', error)
    return NextResponse.json({ error: 'Failed to fetch brand analytics' }, { status: 500 })
  }
}

function processUniqueCitationChart(allResponses: any[], brandResponses: any[]) {
  const dateMap = new Map<string, { total: Set<string>, withBrand: Set<string> }>()

  // Count all responses by date
  allResponses.forEach(response => {
    const date = response.response_date.split('T')[0]
    if (!dateMap.has(date)) {
      dateMap.set(date, { total: new Set(), withBrand: new Set() })
    }
    dateMap.get(date)!.total.add(response.response_id)
  })

  // Count responses with brand citations
  brandResponses.forEach(response => {
    const date = response.response_date.split('T')[0]
    if (dateMap.has(date)) {
      dateMap.get(date)!.withBrand.add(response.response_id)
    }
  })

  return Array.from(dateMap.entries())
    .map(([date, data]) => ({
      date,
      brandCitations: data.withBrand.size,
      totalResponses: data.total.size
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

function processPlatformDistribution(data: any[]) {
  const platformMap = new Map<string, Map<string, Set<string>>>()

  data.forEach(item => {
    if (!item.response_date) return
    const date = item.response_date.split('T')[0]
    const platform = item.platform

    if (!platformMap.has(date)) {
      platformMap.set(date, new Map())
    }
    if (!platformMap.get(date)!.has(platform)) {
      platformMap.get(date)!.set(platform, new Set())
    }
    platformMap.get(date)!.get(platform)!.add(item.url)
  })

  // Get all unique platforms
  const allPlatforms = new Set<string>()
  platformMap.forEach(platforms => {
    platforms.forEach((_, platform) => allPlatforms.add(platform))
  })

  // Transform to array format with all platforms for each date (fill missing with 0)
  return Array.from(platformMap.entries())
    .map(([date, platforms]) => {
      const entry: any = { date }
      allPlatforms.forEach(platform => {
        entry[platform] = platforms.get(platform)?.size || 0
      })
      return entry
    })
    .sort((a, b) => a.date.localeCompare(b.date))
}

function processPromptClusters(citations: any[], responses: any[], prompts: any[], allResponses: any[]) {
  // Create prompt cluster map
  const promptClusterMap = new Map(prompts.map(p => [p.prompt_id, p.prompt_cluster]))

  // Create response to date/cluster map
  const responseMap = new Map(
    responses.map(r => [
      r.response_id,
      {
        date: r.response_date.split('T')[0],
        cluster: promptClusterMap.get(r.prompt_id) || 'Unclustered'
      }
    ])
  )

  // Get all unique dates from allResponses to ensure we fill missing dates
  const allDates = new Set(allResponses.map(r => r.response_date.split('T')[0]))

  // Group by date and cluster, count distinct URLs
  const dataByDate = new Map<string, Map<string, Set<string>>>()

  // Initialize all dates with empty data
  allDates.forEach(date => {
    dataByDate.set(date, new Map())
  })

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

  // Get all unique clusters
  const allClusters = new Set<string>()
  dataByDate.forEach(clusters => {
    clusters.forEach((_, cluster) => allClusters.add(cluster))
  })

  // Transform to array format with all clusters for each date
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

function processCitations(data: any[]) {
  const urlCounts = new Map<string, number>()

  data.forEach(item => {
    const count = urlCounts.get(item.url) || 0
    urlCounts.set(item.url, count + 1)
  })

  return Array.from(urlCounts.entries())
    .map(([url, count]) => ({ url, count }))
    .sort((a, b) => b.count - a.count)
}

