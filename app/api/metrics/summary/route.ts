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

    // Get current week and previous week dates
    const now = new Date()
    const currentWeekStart = new Date(now.setDate(now.getDate() - now.getDay()))
    const previousWeekStart = new Date(currentWeekStart.getTime() - 7 * 24 * 60 * 60 * 1000)

    // Get total mentions this week
    const { data: currentMentions } = await supabase
      .from('brand_mentions')
      .select(`
        id,
        brand_mentioned,
        mention_count,
        responses!inner(response_date)
      `)
      .gte('responses.response_date', currentWeekStart.toISOString())
      .eq('brand_mentioned', true)

    // Get total mentions previous week
    const { data: previousMentions } = await supabase
      .from('brand_mentions')
      .select(`
        id,
        brand_mentioned,
        mention_count,
        responses!inner(response_date)
      `)
      .gte('responses.response_date', previousWeekStart.toISOString())
      .lt('responses.response_date', currentWeekStart.toISOString())
      .eq('brand_mentioned', true)

    // Get citations this week
    const { data: currentCitations } = await supabase
      .from('brand_mentions')
      .select(`
        id,
        brand_citation,
        responses!inner(response_date)
      `)
      .gte('responses.response_date', currentWeekStart.toISOString())
      .eq('brand_citation', true)

    // Get citations previous week
    const { data: previousCitations } = await supabase
      .from('brand_mentions')
      .select(`
        id,
        brand_citation,
        responses!inner(response_date)
      `)
      .gte('responses.response_date', previousWeekStart.toISOString())
      .lt('responses.response_date', currentWeekStart.toISOString())
      .eq('brand_citation', true)

    // Calculate metrics
    const totalMentions = currentMentions?.length || 0
    const previousTotalMentions = previousMentions?.length || 0
    const mentionTrend = previousTotalMentions > 0
      ? ((totalMentions - previousTotalMentions) / previousTotalMentions) * 100
      : 0

    const citations = currentCitations?.length || 0
    const previousCitationsCount = previousCitations?.length || 0
    const citationTrend = previousCitationsCount > 0
      ? ((citations - previousCitationsCount) / previousCitationsCount) * 100
      : 0

    // Mock competitive ranking (in real implementation, this would compare with competitors)
    const competitiveRank = 2
    const rankTrend = -0.5 // Improved by 0.5 positions

    const weeklyGrowth = mentionTrend

    return NextResponse.json({
      totalMentions,
      mentionTrend,
      citations,
      citationTrend,
      competitiveRank,
      rankTrend,
      weeklyGrowth,
    })
  } catch (error) {
    console.error('Error fetching metrics summary:', error)
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    )
  }
}