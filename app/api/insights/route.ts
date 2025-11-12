import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    // Use service role for insights to bypass RLS
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

    // Get latest response date only
    const { data: dates } = await supabase
      .from('responses')
      .select('response_date')
      .order('response_date', { ascending: false })
      .limit(1)

    if (!dates || dates.length < 1) {
      return NextResponse.json({
        insights: [],
        lastUpdate: new Date().toISOString(),
      })
    }

    const latestDate = dates[0].response_date

    // Get Anduin entity IDs
    const { data: anduinEntities } = await supabase
      .from('entities')
      .select('entity_id')
      .eq('canonical_name', 'Anduin')

    const anduinEntityIds = anduinEntities?.map(e => e.entity_id) || []

    // Get ALL response IDs (not filtered by date - we want cumulative data)
    const { data: allResponses } = await supabase
      .from('responses')
      .select('response_id, response_date')

    const allResponseIds = new Set(allResponses?.map(r => r.response_id) || [])

    // Get all Anduin citations
    const { data: allAnduinCitations } = await supabase
      .from('citation_listing')
      .select('url, response_id')
      .in('entity_id', anduinEntityIds)

    // Filter citations - keep all that have valid response_ids
    const currentCitations = allAnduinCitations?.filter(c =>
      allResponseIds.has(c.response_id)
    ) || []

    // Get competitor entity IDs and their citations for latest date
    const { data: competitorEntities } = await supabase
      .from('entities')
      .select('entity_id, canonical_name')
      .eq('entity_type', 'competitor')

    const competitorEntityIds = competitorEntities?.map(e => e.entity_id) || []

    const { data: allCompetitorCitations } = await supabase
      .from('citation_listing')
      .select('url, response_id, entity_id')
      .in('entity_id', competitorEntityIds)

    // Filter competitor citations and add entity names
    const competitorCitations = allCompetitorCitations
      ?.filter(c => allResponseIds.has(c.response_id))
      .map(c => {
        const entity = competitorEntities?.find(e => e.entity_id === c.entity_id)
        return {
          url: c.url,
          canonical_name: entity?.canonical_name || 'Unknown'
        }
      }) || []

    // Get cluster data for Anduin citations
    const { data: allResponsesWithPrompts } = await supabase
      .from('responses')
      .select('response_id, prompt_id')

    const { data: prompts } = await supabase
      .from('prompts')
      .select('prompt_id, prompt_cluster')

    const promptMap = new Map(prompts?.map(p => [p.prompt_id, p.prompt_cluster]) || [])
    const responsePromptMap = new Map(
      allResponsesWithPrompts?.map(r => [r.response_id, promptMap.get(r.prompt_id)]) || []
    )

    // Filter Anduin citations with cluster info
    const clusterCitations = allAnduinCitations
      ?.filter(c => allResponseIds.has(c.response_id))
      .map(c => ({
        url: c.url,
        prompt_cluster: responsePromptMap.get(c.response_id) || 'Unclustered'
      })) || []

    // Get platform citations for current date (brand only)
    const { data: brandEntities } = await supabase
      .from('entities')
      .select('entity_id')
      .eq('canonical_name', 'Anduin')
      .eq('entity_type', 'brand')

    const brandEntityIds = brandEntities?.map(e => e.entity_id) || []

    const { data: allPlatformCitations } = await supabase
      .from('citation_listing')
      .select('url, platform, response_id')
      .in('entity_id', brandEntityIds)

    const platformCitations = allPlatformCitations?.filter(c =>
      allResponseIds.has(c.response_id)
    ) || []

    // Generate insights based on data
    const insights = generateInsights({
      competitorCitations: competitorCitations || [],
      clusterCitations: clusterCitations || [],
      platformCitations: platformCitations || [],
      latestDate,
    })

    return NextResponse.json({
      insights,
      lastUpdate: latestDate,
    })
  } catch (error) {
    console.error('Error generating insights:', error)
    return NextResponse.json({ error: 'Failed to generate insights' }, { status: 500 })
  }
}

function generateInsights(data: any) {
  const insights = []

  // Competitor activity - count distinct URLs per competitor
  const competitorCounts: { [key: string]: Set<string> } = {}
  data.competitorCitations.forEach((citation: any) => {
    const competitorName = citation.canonical_name
    if (!competitorCounts[competitorName]) {
      competitorCounts[competitorName] = new Set()
    }
    competitorCounts[competitorName].add(citation.url)
  })

  const competitorSizes = Object.entries(competitorCounts).map(([name, urls]) => ({
    name,
    count: urls.size
  }))
  const topCompetitor = competitorSizes.sort((a, b) => b.count - a.count)[0]

  if (topCompetitor && topCompetitor.count > 0) {
    insights.push({
      type: 'trend',
      title: 'Best Performing Competitor',
      description: `${topCompetitor.name}: ${topCompetitor.count} citations`,
      timestamp: new Date().toISOString(),
    })
  }

  // Cluster performance - count distinct URLs per cluster
  const clusterCounts: { [key: string]: Set<string> } = {}
  data.clusterCitations.forEach((citation: any) => {
    const cluster = citation.prompt_cluster || 'Unclustered'
    if (!clusterCounts[cluster]) {
      clusterCounts[cluster] = new Set()
    }
    clusterCounts[cluster].add(citation.url)
  })

  const clusterSizes = Object.entries(clusterCounts).map(([name, urls]) => ({
    name,
    count: urls.size
  }))
  const topCluster = clusterSizes.sort((a, b) => b.count - a.count)[0]

  if (topCluster && topCluster.count > 0) {
    insights.push({
      type: 'success',
      title: 'Anduin\'s Top Performing Cluster',
      description: `"${topCluster.name}": ${topCluster.count} citations`,
      timestamp: new Date().toISOString(),
    })
  }

  // Platform performance - count distinct URLs per platform
  const platformCounts: { [key: string]: Set<string> } = {}
  data.platformCitations.forEach((citation: any) => {
    const platform = citation.platform
    if (!platformCounts[platform]) {
      platformCounts[platform] = new Set()
    }
    platformCounts[platform].add(citation.url)
  })

  const platformSizes = Object.entries(platformCounts).map(([name, urls]) => ({
    name,
    count: urls.size
  }))
  const topPlatform = platformSizes.sort((a, b) => b.count - a.count)[0]

  if (topPlatform && topPlatform.count > 0) {
    insights.push({
      type: 'alert',
      title: 'Anduin\'s Top Performing Platform',
      description: `${topPlatform.name}: ${topPlatform.count} citations`,
      timestamp: new Date().toISOString(),
    })
  }

  return insights.slice(0, 3) // Limit to 3 insights
}