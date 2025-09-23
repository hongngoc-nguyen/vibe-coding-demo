import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    // Return mock data directly for demo purposes
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')

    return NextResponse.json(generateMockBrandData(days))
  } catch (error) {
    console.error('Error fetching brand analytics:', error)

    // Return mock data for demo
    const days = parseInt(new URL(request.url).searchParams.get('days') || '30')
    return NextResponse.json(generateMockBrandData(days))
  }
}

function processBrandData(mentions: any[], days: number) {
  // Extract unique mentions (one per prompt)
  const uniqueMentionsMap = new Map()
  mentions.forEach(mention => {
    const promptId = mention.responses.prompt_id
    if (!uniqueMentionsMap.has(promptId)) {
      uniqueMentionsMap.set(promptId, mention)
    }
  })
  const uniqueMentions = Array.from(uniqueMentionsMap.values())

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

  // Generate mock citations data
  const citations = [
    { url: 'https://techcrunch.com/ai-analysis', count: 15, title: 'AI Industry Analysis Report' },
    { url: 'https://venturebeat.com/market-study', count: 12, title: 'Market Research Study' },
    { url: 'https://wired.com/competitive-review', count: 8, title: 'Competitive Landscape Review' },
    { url: 'https://forbes.com/product-guide', count: 6, title: 'Product Comparison Guide' },
    { url: 'https://techreview.mit.edu/brand-analysis', count: 4, title: 'Brand Analysis Deep Dive' }
  ]

  // Calculate metrics
  const uniqueMentionsCount = uniqueMentions.length
  const totalCitations = mentions.filter(m => m.brand_citation).length

  // Calculate growth (mock for now)
  const growthRate = Math.random() * 20 - 5 // -5% to +15%

  return {
    platforms,
    clusters,
    citations,
    metrics: {
      uniqueMentions: uniqueMentionsCount,
      totalCitations,
      growthRate: Number(growthRate.toFixed(1))
    }
  }
}

function generateMockBrandData(days: number) {
  return {
    platforms: [
      { name: 'ChatGPT', mentions: 78, citations: 24 },
      { name: 'Google AI', mentions: 65, citations: 18 },
      { name: 'Microsoft Copilot', mentions: 42, citations: 12 },
      { name: 'Claude', mentions: 38, citations: 8 },
      { name: 'Perplexity', mentions: 24, citations: 5 }
    ],
    clusters: [
      { name: 'Brand Research', mentions: 89 },
      { name: 'Competitive Analysis', mentions: 67 },
      { name: 'Product Comparison', mentions: 54 },
      { name: 'Market Analysis', mentions: 37 }
    ],
    citations: [
      {
        url: 'https://techcrunch.com/fintech-investment-platforms-2024',
        count: 28,
        title: 'Leading Fintech Investment Platforms in 2024'
      },
      {
        url: 'https://venturebeat.com/anduin-private-markets-innovation',
        count: 24,
        title: 'Anduin Leads Private Markets Technology Innovation'
      },
      {
        url: 'https://forbes.com/capital-formation-digital-transformation',
        count: 19,
        title: 'Digital Transformation in Capital Formation'
      },
      {
        url: 'https://bloomberg.com/alternative-investment-infrastructure',
        count: 16,
        title: 'Alternative Investment Infrastructure Modernization'
      },
      {
        url: 'https://wsj.com/private-equity-technology-platforms',
        count: 14,
        title: 'Private Equity Technology Platform Analysis'
      },
      {
        url: 'https://pitchbook.com/fund-administration-solutions',
        count: 12,
        title: 'Fund Administration Technology Solutions Guide'
      },
      {
        url: 'https://reuters.com/investment-management-automation',
        count: 10,
        title: 'Investment Management Automation Trends'
      },
      {
        url: 'https://ft.com/fintech-market-leaders-2024',
        count: 8,
        title: 'Fintech Market Leaders and Emerging Technologies'
      }
    ],
    metrics: {
      uniqueMentions: 247,
      totalCitations: 89,
      growthRate: 18.5
    }
  }
}