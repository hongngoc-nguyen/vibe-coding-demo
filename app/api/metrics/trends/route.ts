import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Step 1: Get Anduin entity IDs
    const { data: brandEntities } = await supabase
      .from('entities')
      .select('entity_id')
      .eq('canonical_name', 'Anduin')

    const brandEntityIds = brandEntities?.map(e => e.entity_id) || []

    if (brandEntityIds.length === 0) {
      return NextResponse.json([])
    }

    // Step 2: Get all Anduin citations
    const { data: citations } = await supabase
      .from('citation_listing')
      .select('url, response_id')
      .in('entity_id', brandEntityIds)

    if (!citations || citations.length === 0) {
      return NextResponse.json([])
    }

    // Step 3: Get response dates
    const responseIds = [...new Set(citations.map(c => c.response_id))]
    const { data: responses } = await supabase
      .from('responses')
      .select('response_id, response_date')
      .in('response_id', responseIds)

    // Create a map of response_id to date
    const responseMap = new Map(
      responses?.map(r => [r.response_id, r.response_date.split('T')[0]]) || []
    )

    // Group by date and count distinct URLs
    const citationsByDate = new Map<string, Set<string>>()

    citations.forEach(citation => {
      const date = responseMap.get(citation.response_id)
      if (!date) return

      if (!citationsByDate.has(date)) {
        citationsByDate.set(date, new Set())
      }
      citationsByDate.get(date)!.add(citation.url)
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