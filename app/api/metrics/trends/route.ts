import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    // Return mock data directly for demo purposes
    const { searchParams } = new URL(request.url)
    const weeksBack = parseInt(searchParams.get('weeks') || '12')

    return NextResponse.json(generateMockTrendData(weeksBack))
  } catch (error) {
    console.error('Error fetching trend data:', error)
    return NextResponse.json(generateMockTrendData(12))
  }
}

function generateMockTrendData(weeks: number) {
  const data = []
  const now = new Date()

  // Generate realistic trend data for Anduin with seasonal patterns
  const baseMentions = 22
  const baseCitations = 8

  for (let i = weeks - 1; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000)
    const weekStart = new Date(date.setDate(date.getDate() - date.getDay()))

    // Add slight upward trend with some variation
    const trendMultiplier = 1 + (weeks - i) * 0.02 // 2% growth per week
    const variation = 0.8 + Math.random() * 0.4 // ±20% variation

    const mentions = Math.round(baseMentions * trendMultiplier * variation)
    const citations = Math.round(baseCitations * trendMultiplier * variation)

    data.push({
      week: weekStart.toISOString(),
      mentions: Math.max(mentions, 5), // Minimum 5 mentions
      citations: Math.max(citations, 2), // Minimum 2 citations
      platform: 'All Platforms',
    })
  }

  return data
}