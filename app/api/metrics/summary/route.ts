import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get all distinct response dates to find latest and previous
    const { data: allDates } = await supabase
      .from('responses')
      .select('response_date')
      .order('response_date', { ascending: false })

    if (!allDates || allDates.length === 0) {
      return NextResponse.json({
        totalCitations: 0,
        growthRate: 0,
      })
    }

    // Get unique dates (responses table has multiple entries per date)
    const uniqueDates = [...new Set(allDates.map(d => d.response_date.split('T')[0]))].sort().reverse()

    if (uniqueDates.length < 2) {
      return NextResponse.json({
        totalCitations: 0,
        growthRate: 0,
      })
    }

    const latestDate = uniqueDates[0]
    const previousDate = uniqueDates[1]

    // Step 1: Get Anduin entity IDs
    const { data: brandEntities } = await supabase
      .from('entities')
      .select('entity_id')
      .eq('canonical_name', 'Anduin')

    const brandEntityIds = brandEntities?.map(e => e.entity_id) || []

    if (brandEntityIds.length === 0) {
      return NextResponse.json({
        totalCitations: 0,
        growthRate: 0,
      })
    }

    // Step 2: Get all Anduin citations
    const { data: allCitations } = await supabase
      .from('citation_listing')
      .select('url, response_id')
      .in('entity_id', brandEntityIds)

    if (!allCitations || allCitations.length === 0) {
      return NextResponse.json({
        totalCitations: 0,
        growthRate: 0,
        latestDate,
        previousDate,
      })
    }

    // Step 3: Get response dates for these citations
    const responseIds = [...new Set(allCitations.map(c => c.response_id))]
    const { data: responses } = await supabase
      .from('responses')
      .select('response_id, response_date')
      .in('response_id', responseIds)

    // Create a map of response_id to date
    const responseMap = new Map(
      responses?.map(r => [r.response_id, r.response_date.split('T')[0]]) || []
    )

    // Filter citations by date
    const currentCitations = allCitations.filter(c => responseMap.get(c.response_id) === latestDate)
    const previousCitations = allCitations.filter(c => responseMap.get(c.response_id) === previousDate)

    // Count distinct URLs
    const currentCount = new Set(currentCitations.map(c => c.url)).size
    const previousCount = new Set(previousCitations.map(c => c.url)).size

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