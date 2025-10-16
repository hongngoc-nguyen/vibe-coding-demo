import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    // Return mock data directly for demo purposes
    const days = parseInt(new URL(request.url).searchParams.get('days') || '30')
    return NextResponse.json(generateMockCompetitiveData(days))

    /* Original database logic - commented for demo
    const supabase = await createClient()

    // Verify authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')

    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    const previousPeriodStart = new Date(startDate.getTime() - days * 24 * 60 * 60 * 1000)

    // Get competitor mentions for current period
    const { data: currentMentions } = await supabase
      .from('competitor_mentions')
      .select(`
        competitor_name,
        responses!inner(response_date, platform)
      `)
      .eq('competitors_mentioned', true)
      .gte('responses.response_date', startDate.toISOString())

    // Get competitor mentions for previous period (for trend calculation)
    const { data: previousMentions } = await supabase
      .from('competitor_mentions')
      .select(`
        competitor_name,
        responses!inner(response_date, platform)
      `)
      .eq('competitors_mentioned', true)
      .gte('responses.response_date', previousPeriodStart.toISOString())
      .lt('responses.response_date', startDate.toISOString())

    // Get brand mentions for comparison
    const { data: brandMentions } = await supabase
      .from('brand_mentions')
      .select(`
        brand_mentioned,
        responses!inner(response_date, platform)
      `)
      .eq('brand_mentioned', true)
      .gte('responses.response_date', startDate.toISOString())

    const processedData = processCompetitiveData(
      currentMentions || [],
      previousMentions || [],
      brandMentions || [],
      days
    )

    return NextResponse.json(processedData)
    */
  } catch (error) {
    console.error('Error fetching competitive analytics:', error)

    // Return mock data for demo
    const days = parseInt(new URL(request.url).searchParams.get('days') || '30')
    return NextResponse.json(generateMockCompetitiveData(days))
  }
}

function processCompetitiveData(
  currentMentions: any[],
  previousMentions: any[],
  brandMentions: any[],
  days: number
) {
  // Calculate competitor stats
  const currentCounts = currentMentions.reduce((acc, mention) => {
    const name = mention.competitor_name
    acc[name] = (acc[name] || 0) + 1
    return acc
  }, {})

  const previousCounts = previousMentions.reduce((acc, mention) => {
    const name = mention.competitor_name
    acc[name] = (acc[name] || 0) + 1
    return acc
  }, {})

  // Add Anduin to the mix
  const anduinCurrent = brandMentions.length
  const anduinPrevious = Math.floor(anduinCurrent * (0.8 + Math.random() * 0.4)) // Mock previous

  currentCounts['Anduin'] = anduinCurrent
  previousCounts['Anduin'] = anduinPrevious

  // Calculate total mentions for market share
  const totalMentions = Object.values(currentCounts).reduce((sum: number, count) => sum + (count as number), 0)

  // Build competitor array with trends
  const competitors = Object.entries(currentCounts).map(([name, current]: [string, any]) => {
    const previous = previousCounts[name] || 0
    const trend = previous > 0 ? ((current - previous) / previous) * 100 : 0
    const marketShare = (current / totalMentions) * 100

    return {
      name,
      mentions: current,
      trend: Number(trend.toFixed(1)),
      marketShare: Number(marketShare.toFixed(0)),
      citations: Math.floor(current * 0.3) // Mock citations as 30% of mentions
    }
  }).sort((a, b) => b.mentions - a.mentions)

  // Generate trend data
  const trends = []
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
    const trendPoint: any = {
      date: date.toISOString().split('T')[0]
    }

    competitors.forEach(comp => {
      trendPoint[comp.name] = Math.floor(Math.random() * 8) + 1
    })

    trends.push(trendPoint)
  }

  return {
    competitors,
    trends
  }
}

function generateMockCompetitiveData(days: number) {
  const competitors = [
    { name: 'Anduin', mentions: 45, trend: 15.2, marketShare: 35, citations: 12 },
    { name: 'Passthrough', mentions: 38, trend: -5.3, marketShare: 30, citations: 8 },
    { name: 'Subscribe', mentions: 32, trend: 8.7, marketShare: 25, citations: 6 },
    { name: 'CompetitorX', mentions: 13, trend: -2.1, marketShare: 10, citations: 2 }
  ]

  const trends = []
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
    trends.push({
      date: date.toISOString().split('T')[0],
      Anduin: Math.floor(Math.random() * 8) + 3,
      Passthrough: Math.floor(Math.random() * 6) + 2,
      Subscribe: Math.floor(Math.random() * 5) + 2,
      CompetitorX: Math.floor(Math.random() * 3) + 1
    })
  }

  const citations = [
    {
      url: 'https://techcrunch.com/fintech-comparison',
      count: 18,
      title: 'Fintech Solutions Comparison 2024',
      competitors: ['Anduin', 'Passthrough']
    },
    {
      url: 'https://venturebeat.com/investment-platforms',
      count: 15,
      title: 'Investment Platform Analysis',
      competitors: ['Subscribe', 'Anduin']
    },
    {
      url: 'https://forbes.com/capital-markets',
      count: 12,
      title: 'Capital Markets Technology Review',
      competitors: ['Passthrough', 'CompetitorX']
    },
    {
      url: 'https://wsj.com/digital-finance',
      count: 10,
      title: 'Digital Finance Landscape',
      competitors: ['Anduin', 'Subscribe', 'Passthrough']
    },
    {
      url: 'https://bloomberg.com/fintech-trends',
      count: 8,
      title: 'Fintech Industry Trends',
      competitors: ['CompetitorX', 'Anduin']
    }
  ]

  return {
    competitors,
    trends,
    citations
  }
}