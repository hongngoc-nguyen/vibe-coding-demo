import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    // Return mock data directly for demo purposes
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')

    return NextResponse.json(generateMockCompetitiveData(days))
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

  // Generate mock citations data
  const citations = [
    { url: 'https://techcrunch.com/fintech-comparison', count: 18, title: 'Fintech Solutions Comparison 2024', competitors: ['Anduin', 'Passthrough'] },
    { url: 'https://venturebeat.com/investment-platforms', count: 15, title: 'Investment Platform Analysis', competitors: ['Subscribe', 'Anduin'] },
    { url: 'https://forbes.com/capital-markets', count: 12, title: 'Capital Markets Technology Review', competitors: ['Passthrough', 'CompetitorX'] },
    { url: 'https://wsj.com/digital-finance', count: 10, title: 'Digital Finance Landscape', competitors: ['Anduin', 'Subscribe', 'Passthrough'] },
    { url: 'https://bloomberg.com/fintech-trends', count: 8, title: 'Fintech Industry Trends', competitors: ['CompetitorX', 'Anduin'] }
  ]

  return {
    competitors,
    citations
  }
}

function generateMockCompetitiveData(days: number) {
  // Updated competitor data with the requested companies
  const competitors = [
    {
      name: 'Anduin',
      mentions: 67,
      uniqueMentions: 52,
      trend: 18.5,
      marketShare: 34,
      citations: 23,
      rank: 1
    },
    {
      name: 'Passthrough',
      mentions: 54,
      uniqueMentions: 42,
      trend: -3.2,
      marketShare: 28,
      citations: 16,
      rank: 2
    },
    {
      name: 'Atominvest',
      mentions: 38,
      uniqueMentions: 31,
      trend: 12.1,
      marketShare: 19,
      citations: 11,
      rank: 3
    },
    {
      name: 'Juniper Square',
      mentions: 29,
      uniqueMentions: 23,
      trend: 5.8,
      marketShare: 15,
      citations: 8,
      rank: 4
    },
    {
      name: 'Subscribe',
      mentions: 18,
      uniqueMentions: 14,
      trend: -1.4,
      marketShare: 9,
      citations: 5,
      rank: 5
    }
  ]

  // Generate more realistic daily trends that will aggregate to visible weekly data
  const trends = []
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000)

    // Create more realistic daily variations that sum to meaningful weekly totals
    trends.push({
      date: date.toISOString().split('T')[0],
      Anduin: Math.floor(Math.random() * 12) + 8,         // 8-20 daily
      Passthrough: Math.floor(Math.random() * 10) + 6,    // 6-16 daily
      'Atominvest': Math.floor(Math.random() * 8) + 4,    // 4-12 daily
      'Juniper Square': Math.floor(Math.random() * 6) + 3, // 3-9 daily
      Subscribe: Math.floor(Math.random() * 4) + 2        // 2-6 daily
    })
  }

  const citations = [
    {
      url: 'https://techcrunch.com/fintech-solutions-comparison-2024',
      count: 23,
      title: 'Fintech Investment Platform Solutions Comparison 2024',
      competitors: ['Anduin', 'Passthrough', 'Atominvest']
    },
    {
      url: 'https://venturebeat.com/private-market-technology-review',
      count: 18,
      title: 'Private Market Technology Platforms Analysis',
      competitors: ['Anduin', 'Juniper Square', 'Subscribe']
    },
    {
      url: 'https://forbes.com/capital-markets-digitization',
      count: 16,
      title: 'Capital Markets Digitization: Leading Platforms',
      competitors: ['Passthrough', 'Anduin', 'Atominvest']
    },
    {
      url: 'https://wsj.com/alternative-investment-platforms',
      count: 14,
      title: 'Alternative Investment Platform Market Overview',
      competitors: ['Anduin', 'Juniper Square', 'Passthrough']
    },
    {
      url: 'https://bloomberg.com/fintech-infrastructure-trends',
      count: 12,
      title: 'Fintech Infrastructure Trends and Market Leaders',
      competitors: ['Atominvest', 'Anduin', 'Subscribe']
    },
    {
      url: 'https://pitchbook.com/investment-management-tech',
      count: 10,
      title: 'Investment Management Technology Landscape',
      competitors: ['Passthrough', 'Juniper Square']
    },
    {
      url: 'https://crunchbase.com/private-equity-software',
      count: 9,
      title: 'Private Equity Software Solutions Guide',
      competitors: ['Anduin', 'Atominvest']
    },
    {
      url: 'https://ft.com/fund-administration-platforms',
      count: 8,
      title: 'Fund Administration Platform Innovations',
      competitors: ['Subscribe', 'Passthrough', 'Anduin']
    }
  ]

  return {
    competitors,
    trends,
    citations
  }
}