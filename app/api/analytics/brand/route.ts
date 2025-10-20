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

    // 1. Total Citations (current period)
    const { data: currentCitations } = await supabase
      .from('citation_listing')
      .select('url, response_id(response_date)')
      .in('entity_id', brandEntityIds)
      .gte('response_id.response_date', startDate.toISOString())

    const totalCitations = new Set(currentCitations?.map(c => c.url) || []).size

    // 2. Growth Rate (previous period)
    const { data: previousCitations } = await supabase
      .from('citation_listing')
      .select('url')
      .in('entity_id', brandEntityIds)
      .gte('response_id.response_date', previousStartDate.toISOString())
      .lt('response_id.response_date', startDate.toISOString())

    const previousTotal = new Set(previousCitations?.map(c => c.url) || []).size
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
    const { data: platformData } = await supabase
      .from('citation_listing')
      .select('url, platform, response_id(response_date)')
      .in('entity_id', brandEntityIds)
      .gte('response_id.response_date', startDate.toISOString())

    const platformDistribution = processPlatformDistribution(platformData || [])

    // 5. Prompt Clusters Chart
    // Get brand responses with prompts
    const { data: brandResponsesWithPrompts } = await supabase
      .from('responses')
      .select('response_id, response_date, prompts:prompt_id(prompt_cluster)')
      .in('response_id', brandResponseIds)
      .gte('response_date', startDate.toISOString())

    const { data: allResponsesWithClusters } = await supabase
      .from('responses')
      .select('response_id, response_date, prompts:prompt_id(prompt_cluster)')
      .gte('response_date', startDate.toISOString())

    const promptClusters = processPromptClusters(allResponsesWithClusters || [], brandResponsesWithPrompts || [])

    // 6. Citation Sources Table
    let citationsQuery = supabase
      .from('citation_listing')
      .select('url, response_id(response_date), platform')
      .in('entity_id', brandEntityIds)

    if (dateFilter !== 'all') {
      citationsQuery = citationsQuery.eq('response_id.response_date', dateFilter)
    }
    if (platformFilter !== 'all') {
      citationsQuery = citationsQuery.eq('platform', platformFilter)
    }

    const { data: citationsData } = await citationsQuery

    const citations = processCitations(citationsData || [])

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
    if (!item.response_id) return
    const date = item.response_id.response_date.split('T')[0]
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

function processPromptClusters(allResponses: any[], brandResponses: any[]) {
  const clusterMap = new Map<string, Map<string, { total: Set<string>, withBrand: Set<string> }>>()

  // Count all responses by date and cluster
  allResponses.forEach(response => {
    if (!response.prompts) return
    const date = response.response_date.split('T')[0]
    const cluster = response.prompts.prompt_cluster || 'Unclustered'

    if (!clusterMap.has(date)) {
      clusterMap.set(date, new Map())
    }
    if (!clusterMap.get(date)!.has(cluster)) {
      clusterMap.get(date)!.set(cluster, { total: new Set(), withBrand: new Set() })
    }
    clusterMap.get(date)!.get(cluster)!.total.add(response.response_id)
  })

  // Count responses with brand citations by cluster
  brandResponses.forEach(response => {
    if (!response.prompts) return
    const date = response.response_date.split('T')[0]
    const cluster = response.prompts.prompt_cluster || 'Unclustered'

    if (clusterMap.has(date) && clusterMap.get(date)!.has(cluster)) {
      clusterMap.get(date)!.get(cluster)!.withBrand.add(response.response_id)
    }
  })

  return Array.from(clusterMap.entries())
    .map(([date, clusters]) => {
      const entry: any = { date }
      clusters.forEach((data, cluster) => {
        entry[`${cluster}_brand`] = data.withBrand.size
        entry[`${cluster}_total`] = data.total.size
      })
      return entry
    })
    .sort((a, b) => a.date.localeCompare(b.date))
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

