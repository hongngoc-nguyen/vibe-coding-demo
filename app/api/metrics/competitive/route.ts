import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get citations for Anduin and all competitors
    const { data, error} = await supabase
      .from('citation_listing')
      .select(`
        url,
        responses:response_id(response_date),
        entities:entity_id(canonical_name, entity_type)
      `)
      .in('entities.entity_type', ['brand', 'competitor'])

    if (error) {
      console.error('Error fetching competitive data:', error)
      return NextResponse.json({ error: 'Failed to fetch competitive data' }, { status: 500 })
    }

    // Group by response_date and entity, count distinct URLs
    interface EntityData {
      [entityName: string]: Set<string>
    }

    const dataByDate = new Map<string, EntityData>()

    data?.forEach(item => {
      if (!item.responses || !item.entities) return // Skip if no response or entity data
      // Extract just the date part (YYYY-MM-DD)
      const dateOnly = item.responses.response_date.split('T')[0]
      const entityName = item.entities.canonical_name

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
