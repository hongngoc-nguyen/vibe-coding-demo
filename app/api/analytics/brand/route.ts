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

    // Get all brand citations
    const { data: allBrandCitationsRaw } = await supabase
      .from('citation_listing')
      .select('url, response_id')
      .in('entity_id', brandEntityIds)

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
    const { data: allResponses } = await supabase
      .from('responses')
      .select('response_id, response_date')
      .gte('response_date', startDate.toISOString())

    // Get all brand citations without join first
    const { data: brandCitationRaw } = await supabase
      .from('citation_listing')
      .select('response_id')
      .in('entity_id', brandEntityIds)

    // Get unique response IDs
    const brandResponseIds = [...new Set(brandCitationRaw?.map(c => c.response_id) || [])]

    // Get those responses with their dates
    const { data: brandResponses } = await supabase
      .from('responses')
      .select('response_id, response_date')
      .in('response_id', brandResponseIds)
      .gte('response_date', startDate.toISOString())

    const uniqueCitationChart = processUniqueCitationChart(allResponses || [], brandResponses || [])

    // 4. Platform Distribution (brand citations by platform over time)
    // Get all brand citations with platform
    const { data: allPlatformCitations } = await supabase
      .from('citation_listing')
      .select('url, platform, response_id')
      .in('entity_id', brandEntityIds)

    // Filter for current period and add response dates
    const platformData = allPlatformCitations
      ?.filter(c => currentPeriodResponseIds.has(c.response_id))
      .map(c => {
        const response = currentPeriodResponses?.find(r => r.response_id === c.response_id)
        return {
          url: c.url,
          platform: c.platform,
          response_date: response?.response_date
        }
      })
      .filter(c => c.response_date) || []

    const platformDistribution = processPlatformDistribution(platformData)

    // 5. Prompt Clusters Chart
    // Use same approach as dashboard - get citations with response details
    const { data: allBrandCitations } = await supabase
      .from('citation_listing')
      .select('url, response_id')
      .in('entity_id', brandEntityIds)

    // Filter by date after getting the data (since join filtering doesn't work)
    const brandCitationsForClusters = allBrandCitations?.filter(c => {
      const responseDate = brandResponses?.find(r => r.response_id === c.response_id)?.response_date
      return responseDate && new Date(responseDate) >= startDate
    }) || []

    // Get response details for brand citations
    const brandClusterResponseIds = [...new Set(brandCitationsForClusters?.map(c => c.response_id) || [])]

    const { data: responsesWithDates } = await supabase
      .from('responses')
      .select('response_id, response_date, prompt_id')
      .in('response_id', brandClusterResponseIds)

    // Get prompt clusters
    const promptIds = [...new Set(responsesWithDates?.map(r => r.prompt_id).filter(Boolean) || [])]

    const { data: prompts } = await supabase
      .from('prompts')
      .select('prompt_id, prompt_cluster')
      .in('prompt_id', promptIds)

    const promptClusters = processPromptClusters(
      brandCitationsForClusters || [],
      responsesWithDates || [],
      prompts || []
    )

    // 6. Citation Sources Table
    // Get all brand citations with platform
    const { data: allCitationsForTable } = await supabase
      .from('citation_listing')
      .select('url, response_id, platform')
      .in('entity_id', brandEntityIds)

    // Get responses for date filtering
    let responsesForFiltering = currentPeriodResponses || []

    if (dateFilter !== 'all') {
      // Get responses for specific date
      const { data: specificDateResponses } = await supabase
        .from('responses')
        .select('response_id, response_date')
        .eq('response_date', dateFilter)

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

    const { data: availablePlatformsData } = await supabase
      .from('citation_listing')
      .select('platform')
      .in('entity_id', brandEntityIds)

    const availablePlatforms = [...new Set(availablePlatformsData?.map(p => p.platform) || [])]

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

  return Array.from(platformMap.entries())
    .map(([date, platforms]) => {
      const entry: any = { date }
      platforms.forEach((urls, platform) => {
        entry[platform] = urls.size
      })
      return entry
    })
    .sort((a, b) => a.date.localeCompare(b.date))
}

function processPromptClusters(citations: any[], responses: any[], prompts: any[]) {
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

  // Group by date and cluster, count distinct URLs
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

