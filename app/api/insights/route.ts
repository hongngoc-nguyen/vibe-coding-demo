import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get latest two response dates for comparison
    const { data: dates } = await supabase
      .from('responses')
      .select('response_date')
      .order('response_date', { ascending: false })
      .limit(2)

    if (!dates || dates.length < 2) {
      return NextResponse.json({
        insights: [],
        lastUpdate: new Date().toISOString(),
      })
    }

    const latestDate = dates[0].response_date
    const previousDate = dates[1].response_date

    // Get current citations for Anduin
    const { data: currentCitations } = await supabase
      .from('citation_listing')
      .select(`
        url,
        responses:response_id(response_date),
        entities:entity_id(canonical_name)
      `)
      .eq('responses.response_date', latestDate)
      .eq('entities.canonical_name', 'Anduin')

    // Get previous citations for Anduin
    const { data: previousCitations } = await supabase
      .from('citation_listing')
      .select(`
        url,
        responses:response_id(response_date),
        entities:entity_id(canonical_name)
      `)
      .eq('responses.response_date', previousDate)
      .eq('entities.canonical_name', 'Anduin')

    // Get competitor citations for current date
    const { data: competitorCitations } = await supabase
      .from('citation_listing')
      .select(`
        url,
        responses:response_id(response_date),
        entities:entity_id(canonical_name, entity_type)
      `)
      .eq('responses.response_date', latestDate)
      .eq('entities.entity_type', 'competitor')

    // Get citations by cluster for current date
    const { data: clusterCitations } = await supabase
      .from('citation_listing')
      .select(`
        url,
        responses:response_id(
          response_date,
          prompts:prompt_id(prompt_cluster)
        ),
        entities:entity_id(canonical_name)
      `)
      .eq('responses.response_date', latestDate)
      .eq('entities.canonical_name', 'Anduin')

    // Generate insights based on data
    const insights = generateInsights({
      currentCitations: currentCitations || [],
      previousCitations: previousCitations || [],
      competitorCitations: competitorCitations || [],
      clusterCitations: clusterCitations || [],
      latestDate,
      previousDate,
    })

    return NextResponse.json({
      insights,
      lastUpdate: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error generating insights:', error)
    return NextResponse.json({ error: 'Failed to generate insights' }, { status: 500 })
  }
}

function generateInsights(data: any) {
  const insights = []

  // Count distinct URLs for current and previous periods
  const currentCount = new Set(data.currentCitations.map((c: any) => c.url)).size
  const previousCount = new Set(data.previousCitations.map((c: any) => c.url)).size

  // Trend insight
  if (currentCount > previousCount) {
    const growth = Math.round(((currentCount - previousCount) / Math.max(previousCount, 1)) * 100)
    insights.push({
      type: 'trend',
      title: 'Citations Trending Up',
      description: `Brand citations increased ${growth}% (${currentCount} vs ${previousCount})`,
      timestamp: new Date().toISOString(),
    })
  } else if (currentCount < previousCount) {
    const decline = Math.round(((previousCount - currentCount) / Math.max(previousCount, 1)) * 100)
    insights.push({
      type: 'alert',
      title: 'Citations Declining',
      description: `Brand citations decreased ${decline}% (${currentCount} vs ${previousCount})`,
      timestamp: new Date().toISOString(),
    })
  } else {
    insights.push({
      type: 'info',
      title: 'Citations Stable',
      description: `Brand citations remained stable at ${currentCount}`,
      timestamp: new Date().toISOString(),
    })
  }

  // Competitor activity - count distinct URLs per competitor
  const competitorCounts: { [key: string]: Set<string> } = {}
  data.competitorCitations.forEach((citation: any) => {
    if (!citation.entities) return // Skip if no entity data
    const competitorName = citation.entities.canonical_name
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
    const comparison = topCompetitor.count > currentCount ? 'ahead of' : 'behind'
    insights.push({
      type: topCompetitor.count > currentCount ? 'alert' : 'success',
      title: 'Top Competitor',
      description: `${topCompetitor.name} has ${topCompetitor.count} citations, ${comparison} Anduin`,
      timestamp: new Date().toISOString(),
    })
  }

  // Cluster performance - count distinct URLs per cluster
  const clusterCounts: { [key: string]: Set<string> } = {}
  data.clusterCitations.forEach((citation: any) => {
    if (!citation.responses) return // Skip if no response data
    const cluster = citation.responses.prompts?.prompt_cluster || 'Unclustered'
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
      title: 'Top Performing Cluster',
      description: `"${topCluster.name}" cluster leading with ${topCluster.count} citations`,
      timestamp: new Date().toISOString(),
    })
  }

  return insights.slice(0, 4) // Limit to 4 insights
}