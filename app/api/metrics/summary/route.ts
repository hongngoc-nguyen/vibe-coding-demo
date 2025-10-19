import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get all distinct response dates to find latest and previous
    const { data: dates } = await supabase
      .from('responses')
      .select('response_date')
      .order('response_date', { ascending: false })
      .limit(2)

    if (!dates || dates.length < 2) {
      return NextResponse.json({
        totalCitations: 0,
        growthRate: 0,
      })
    }

    const latestDate = dates[0].response_date
    const previousDate = dates[1].response_date

    // Get current period citations for Anduin
    const { data: currentCitations } = await supabase
      .from('citation_listing')
      .select(`
        url,
        responses:response_id(response_date),
        entities:entity_id(canonical_name)
      `)
      .eq('responses.response_date', latestDate)
      .eq('entities.canonical_name', 'Anduin')

    // Get previous period citations for Anduin
    const { data: previousCitations } = await supabase
      .from('citation_listing')
      .select(`
        url,
        responses:response_id(response_date),
        entities:entity_id(canonical_name)
      `)
      .eq('responses.response_date', previousDate)
      .eq('entities.canonical_name', 'Anduin')

    // Count distinct URLs
    const currentCount = new Set(currentCitations?.map(c => c.url) || []).size
    const previousCount = new Set(previousCitations?.map(c => c.url) || []).size

    // Calculate growth rate
    const growthRate = previousCount > 0
      ? ((currentCount - previousCount) / previousCount) * 100
      : 0

    return NextResponse.json({
      totalCitations: currentCount,
      growthRate: Math.round(growthRate * 10) / 10, // Round to 1 decimal
      latestDate,
      previousDate,
    })
  } catch (error) {
    console.error('Error fetching metrics summary:', error)
    return NextResponse.json({ error: 'Failed to fetch metrics summary' }, { status: 500 })
  }
}