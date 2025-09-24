import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    // Return mock data directly for demo purposes
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')
    const platform = searchParams.get('platform') || 'all'
    const cluster = searchParams.get('cluster') || 'all'
    return NextResponse.json(generateMockBrandData(days, platform, cluster))

    /* Original database logic - commented for demo
    const supabase = await createClient()

    // Verify authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')
    const platform = searchParams.get('platform') || 'all'
    const cluster = searchParams.get('cluster') || 'all'

    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    // Build query conditions
    let platformFilter = ''
    if (platform !== 'all') {
      const platformMap: { [key: string]: string } = {
        'chatgpt': 'ChatGPT',
        'google-ai': 'Google AI',
        'copilot': 'Microsoft Copilot'
      }
      platformFilter = platformMap[platform] || platform
    }

    // Get brand mentions with responses
    let query = supabase
      .from('brand_mentions')
      .select(`
        id,
        brand_mentioned,
        mention_count,
        brand_citation,
        responses!inner(response_date, platform, prompt_id, prompts!inner(prompt_cluster))
      `)
      .eq('brand_mentioned', true)
      .gte('responses.response_date', startDate.toISOString())

    if (platformFilter) {
      query = query.eq('responses.platform', platformFilter)
    }

    const { data: mentions } = await query

    // Process data for charts
    const processedData = processBrandData(mentions || [], days)

    return NextResponse.json(processedData)
    */
  } catch (error) {
    console.error('Error fetching brand analytics:', error)

    // Return mock data for demo
    const days = parseInt(new URL(request.url).searchParams.get('days') || '30')
    return NextResponse.json(generateMockBrandData(days))
  }
}

function processBrandData(mentions: any[], days: number) {
  // Generate trend data
  const trends = []
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
    const dateStr = date.toISOString().split('T')[0]

    const dayMentions = mentions.filter(m => {
      const mentionDate = new Date(m.responses.response_date).toISOString().split('T')[0]
      return mentionDate === dateStr
    })

    trends.push({
      date: dateStr,
      mentions: dayMentions.length,
      citations: dayMentions.filter(m => m.brand_citation).length
    })
  }

  // Platform distribution
  const platformCounts = mentions.reduce((acc, mention) => {
    const platform = mention.responses.platform
    acc[platform] = acc[platform] || { mentions: 0, citations: 0 }
    acc[platform].mentions++
    if (mention.brand_citation) {
      acc[platform].citations++
    }
    return acc
  }, {})

  const platforms = Object.entries(platformCounts).map(([name, data]: [string, any]) => ({
    name,
    mentions: data.mentions,
    citations: data.citations
  }))

  // Prompt clusters
  const clusterCounts = mentions.reduce((acc, mention) => {
    const cluster = mention.responses.prompts?.prompt_cluster || 'Unknown'
    acc[cluster] = (acc[cluster] || 0) + 1
    return acc
  }, {})

  const clusters = Object.entries(clusterCounts).map(([name, mentions]) => ({
    name,
    mentions
  }))

  // Calculate metrics
  const totalMentions = mentions.length
  const totalCitations = mentions.filter(m => m.brand_citation).length
  const avgCitations = totalCitations / Math.max(days / 7, 1) // per week

  // Calculate growth (mock for now)
  const growthRate = Math.random() * 20 - 5 // -5% to +15%

  return {
    trends,
    platforms,
    clusters,
    metrics: {
      totalMentions,
      avgCitations: Number(avgCitations.toFixed(1)),
      growthRate: Number(growthRate.toFixed(1))
    }
  }
}

function generateMockBrandData(days: number, platform?: string, cluster?: string) {
  const trends = []
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
    trends.push({
      date: date.toISOString().split('T')[0],
      mentions: Math.floor(Math.random() * 8) + 2,
      citations: Math.floor(Math.random() * 3) + 1
    })
  }

  // Base platform data with mentions and citations breakdown
  let platformsData = [
    {
      name: 'ChatGPT',
      totalMentions: 45,
      brandMentions: 28,
      competitorMentions: 17,
      citations: 12,
      brandCitations: 8,
      competitorCitations: 4
    },
    {
      name: 'Google AI',
      totalMentions: 38,
      brandMentions: 24,
      competitorMentions: 14,
      citations: 8,
      brandCitations: 5,
      competitorCitations: 3
    },
    {
      name: 'Microsoft Copilot',
      totalMentions: 23,
      brandMentions: 15,
      competitorMentions: 8,
      citations: 5,
      brandCitations: 3,
      competitorCitations: 2
    }
  ]

  // Base cluster data with mentions breakdown by category
  let clustersData = [
    {
      name: 'Brand Research',
      totalMentions: 89,
      brandMentions: 55,
      competitorMentions: 34
    },
    {
      name: 'Competitive Analysis',
      totalMentions: 67,
      brandMentions: 42,
      competitorMentions: 25
    },
    {
      name: 'Product Comparison',
      totalMentions: 54,
      brandMentions: 32,
      competitorMentions: 22
    },
    {
      name: 'Market Analysis',
      totalMentions: 37,
      brandMentions: 23,
      competitorMentions: 14
    }
  ]

  // Platform Distribution and Prompt Clusters charts should only respond to date range filter
  // Remove platform and cluster filtering for these specific chart datasets

  return {
    trends,
    platforms: platformsData,
    clusters: clustersData,
    citations: [
      { url: 'https://techcrunch.com/fintech-comparison', count: 18, title: 'Fintech Solutions Comparison 2024' },
      { url: 'https://venturebeat.com/investment-platforms', count: 15, title: 'Investment Platform Analysis' },
      { url: 'https://forbes.com/capital-markets', count: 12, title: 'Capital Markets Technology Review' },
      { url: 'https://wsj.com/digital-finance', count: 10, title: 'Digital Finance Landscape' },
      { url: 'https://bloomberg.com/fintech-trends', count: 8, title: 'Fintech Industry Trends' }
    ],
    metrics: {
      uniqueMentions: platformsData.reduce((sum, p) => sum + p.brandMentions, 0),
      totalCitations: platformsData.reduce((sum, p) => sum + p.brandCitations, 0),
      growthRate: 15.2
    }
  }
}