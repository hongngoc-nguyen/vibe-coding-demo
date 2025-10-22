import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Multi-step approach to avoid unreliable join filtering

    // Step 1: Get brand and competitor entity IDs with their names
    const { data: entities, error: entitiesError } = await supabase
      .from('entities')
      .select('entity_id, canonical_name, entity_type')
      .in('entity_type', ['brand', 'competitor'])

    if (entitiesError) {
      console.error('Error fetching entities:', entitiesError)
      return NextResponse.json({ error: 'Failed to fetch entities' }, { status: 500 })
    }

    const entityIds = entities?.map(e => e.entity_id) || []
    const entityMap = new Map(entities?.map(e => [e.entity_id, e.canonical_name]) || [])

    if (entityIds.length === 0) {
      return NextResponse.json([])
    }

    // Step 2: Get all citations for these entities
    const { data: citations, error: citationsError } = await supabase
      .from('citation_listing')
      .select('url, response_id, entity_id')
      .in('entity_id', entityIds)

    if (citationsError) {
      console.error('Error fetching citations:', citationsError)
      return NextResponse.json({ error: 'Failed to fetch citations' }, { status: 500 })
    }

    // Step 3: Get all responses with dates
    const responseIds = [...new Set(citations?.map(c => c.response_id) || [])]
    const { data: responses, error: responsesError } = await supabase
      .from('responses')
      .select('response_id, response_date')
      .in('response_id', responseIds)

    if (responsesError) {
      console.error('Error fetching responses:', responsesError)
      return NextResponse.json({ error: 'Failed to fetch responses' }, { status: 500 })
    }

    const responseMap = new Map(responses?.map(r => [r.response_id, r.response_date]) || [])

    // Group by response_date and entity, count distinct URLs
    interface EntityData {
      [entityName: string]: Set<string>
    }

    const dataByDate = new Map<string, EntityData>()

    citations?.forEach(item => {
      const responseDate = responseMap.get(item.response_id)
      const entityName = entityMap.get(item.entity_id)

      if (!responseDate || !entityName) return // Skip if no response date or entity name

      // Extract just the date part (YYYY-MM-DD)
      const dateOnly = responseDate.split('T')[0]

      if (!dataByDate.has(dateOnly)) {
        dataByDate.set(dateOnly, {})
      }

      const dateData = dataByDate.get(dateOnly)!
      if (!dateData[entityName]) {
        dateData[entityName] = new Set()
      }

      dateData[entityName].add(item.url)
    })

    // Transform to array format for multi-line chart and sort by date
    const chartData = Array.from(dataByDate.entries())
      .map(([date, entities]) => {
        const entry: any = { date }
        Object.entries(entities).forEach(([entityName, urls]) => {
          entry[entityName] = urls.size
        })
        return entry
      })
      .sort((a, b) => a.date.localeCompare(b.date))

    return NextResponse.json(chartData)
  } catch (error) {
    console.error('Error fetching competitive data:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
