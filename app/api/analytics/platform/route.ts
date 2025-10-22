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

    // Get only Brand entities
    const { data: allEntities } = await supabase
      .from('entities')
      .select('entity_id, canonical_name, entity_type')
      .eq('entity_type', 'brand')

    const entityMap = new Map(allEntities?.map(e => [e.entity_id, e]) || [])
    const brandEntityIds = new Set(allEntities?.map(e => e.entity_id) || [])

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

    // Filter citations to only include Brand entities
    const brandCitations = allCitations?.filter(c => brandEntityIds.has(c.entity_id)) || []

    // 1. Total Citations (current period)
    const currentCitations = brandCitations.filter(c =>
      currentPeriodResponseIds.has(c.response_id)
    )

    const totalCitations = new Set(currentCitations.map(c => c.url)).size

    // 2. Growth Rate (previous period)
    const previousCitations = brandCitations.filter(c =>
      previousPeriodResponseIds.has(c.response_id)
    )

    const previousTotal = new Set(previousCitations.map(c => c.url)).size
    const growthRate = previousTotal > 0 ? ((totalCitations - previousTotal) / previousTotal) * 100 : 0

    // 3. Prompt Clusters Chart
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
      currentCitations,
      responsesWithDates || [],
      prompts || []
    )

    // Get available platforms from brand citations only
    const availablePlatforms = [...new Set(brandCitations.map(c => c.platform))]

    return NextResponse.json({
      metrics: {
        totalCitations,
        growthRate: Number(growthRate.toFixed(1))
      },
      promptClusters,
      availablePlatforms
    })
  } catch (error) {
    console.error('Error fetching platform analytics:', error)
    return NextResponse.json({ error: 'Failed to fetch platform analytics' }, { status: 500 })
  }
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
