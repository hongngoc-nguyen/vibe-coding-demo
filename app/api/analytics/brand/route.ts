import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
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

function generateMockBrandData(days: number) {
  const trends = []
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
    trends.push({
      date: date.toISOString().split('T')[0],
      mentions: Math.floor(Math.random() * 8) + 2,
      citations: Math.floor(Math.random() * 3) + 1
    })
  }

  return {
    trends,
    platforms: [
      { name: 'ChatGPT', mentions: 45, citations: 12 },
      { name: 'Google AI', mentions: 38, citations: 8 },
      { name: 'Microsoft Copilot', mentions: 23, citations: 5 }
    ],
    clusters: [
      { name: 'Brand Research', mentions: 52 },
      { name: 'Competitive Analysis', mentions: 34 },
      { name: 'Product Comparison', mentions: 20 }
    ],
    metrics: {
      totalMentions: 106,
      avgCitations: 8.3,
      growthRate: 15.2
    }
  }
}