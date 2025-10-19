import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get brand citations with prompt cluster information
    const { data, error } = await supabase
      .from('citation_listing')
      .select(`
        url,
        responses:response_id(
          response_date,
          prompts:prompt_id(prompt_cluster)
        ),
        entities:entity_id(canonical_name)
      `)
      .eq('entities.canonical_name', 'Anduin')

    if (error) {
      console.error('Error fetching cluster data:', error)
      return NextResponse.json({ error: 'Failed to fetch cluster data' }, { status: 500 })
    }

    // Group by response_date and prompt_cluster, count distinct URLs
    interface ClusterData {
      [cluster: string]: Set<string>
    }

    const dataByDate = new Map<string, ClusterData>()

    data?.forEach(item => {
      if (!item.responses) return // Skip if no response data
      // Extract just the date part (YYYY-MM-DD)
      const dateOnly = item.responses.response_date.split('T')[0]
      const cluster = item.responses.prompts?.prompt_cluster || 'Unclustered'

      if (!dataByDate.has(dateOnly)) {
        dataByDate.set(dateOnly, {})
      }

      const dateData = dataByDate.get(dateOnly)!
      if (!dateData[cluster]) {
        dateData[cluster] = new Set()
      }

      dateData[cluster].add(item.url)
    })

    // Transform to array format for stacked chart and sort by date
    const chartData = Array.from(dataByDate.entries())
      .map(([date, clusters]) => {
        const entry: any = { date }
        Object.entries(clusters).forEach(([cluster, urls]) => {
          entry[cluster] = urls.size
        })
        return entry
      })
      .sort((a, b) => a.date.localeCompare(b.date))

    return NextResponse.json(chartData)
  } catch (error) {
    console.error('Error fetching cluster data:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
