import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    // Return realistic placeholder data for Anduin brand monitoring
    const placeholderData = {
      totalMentions: 247,
      mentionTrend: 18.5, // 18.5% increase vs last week
      citations: 89,
      citationTrend: 12.3, // 12.3% increase vs last week
      competitiveRank: 2, // 2nd place among competitors
      rankTrend: 1, // Improved by 1 position
      weeklyGrowth: 18.5,
      lastUpdated: new Date().toISOString()
    }

    return NextResponse.json(placeholderData)
  } catch (error) {
    console.error('Error fetching metrics summary:', error)
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    )
  }
}