import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get brand citations grouped by response_date
    const { data, error } = await supabase
      .from('citation_listing')
      .select(`
        url,
        responses:response_id(response_date),
        entities:entity_id(canonical_name)
      `)
      .eq('entities.canonical_name', 'Anduin')

    if (error) {
      console.error('Error fetching trend data:', error)
      return NextResponse.json({ error: 'Failed to fetch trend data' }, { status: 500 })
    }

    // Group by date only (not datetime) and count distinct URLs
    const citationsByDate = new Map<string, Set<string>>()

    data?.forEach(item => {
      if (!item.responses) return // Skip if no response data
      // Extract just the date part (YYYY-MM-DD)
      const dateOnly = item.responses.response_date.split('T')[0]
      if (!citationsByDate.has(dateOnly)) {
        citationsByDate.set(dateOnly, new Set())
      }
      citationsByDate.get(dateOnly)!.add(item.url)
    })

    // Transform to array format and sort by date
    const trendData = Array.from(citationsByDate.entries())
      .map(([date, urls]) => ({
        date,
        citations: urls.size,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))

    return NextResponse.json(trendData)
  } catch (error) {
    console.error('Error fetching trend data:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}