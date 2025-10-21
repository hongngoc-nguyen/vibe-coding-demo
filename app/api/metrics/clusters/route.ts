import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Step 1: Get brand entity IDs
    const { data: brandEntities } = await supabase
      .from('entities')
      .select('entity_id')
      .eq('canonical_name', 'Anduin')

    const brandEntityIds = brandEntities?.map(e => e.entity_id) || []

    if (brandEntityIds.length === 0) {
      return NextResponse.json([])
    }

    // Step 2: Get brand citations
    const { data: citations } = await supabase
      .from('citation_listing')
      .select('url, response_id')
      .in('entity_id', brandEntityIds)

    if (!citations || citations.length === 0) {
      return NextResponse.json([])
    }

    // Step 3: Get unique response IDs
    const responseIds = [...new Set(citations.map(c => c.response_id))]

    // Step 4: Get responses with dates and prompt clusters
    const { data: responses } = await supabase
      .from('responses')
      .select('response_id, response_date, prompt_id')
      .in('response_id', responseIds)

    if (!responses || responses.length === 0) {
      return NextResponse.json([])
    }

    // Step 5: Get unique prompt IDs
    const promptIds = [...new Set(responses.map(r => r.prompt_id).filter(Boolean))]

    // Step 6: Get prompt clusters
    const { data: prompts } = await supabase
      .from('prompts')
      .select('prompt_id, prompt_cluster')
      .in('prompt_id', promptIds)

    // Create prompt cluster map
    const promptClusterMap = new Map(prompts?.map(p => [p.prompt_id, p.prompt_cluster]) || [])

    // Create response to date/cluster map
    const responseMap = new Map(
      responses.map(r => [
        r.response_id,
        {
          date: r.response_date.split('T')[0],
          cluster: promptClusterMap.get(r.prompt_id) || 'Unclustered'
        }
      ])
    )

    // Group by response_date and prompt_cluster, count distinct URLs
    interface ClusterData {
      [cluster: string]: Set<string>
    }

    const dataByDate = new Map<string, ClusterData>()

    citations.forEach(citation => {
      const responseInfo = responseMap.get(citation.response_id)
      if (!responseInfo) return

      const { date, cluster } = responseInfo

      if (!dataByDate.has(date)) {
        dataByDate.set(date, {})
      }

      const dateData = dataByDate.get(date)!
      if (!dateData[cluster]) {
        dateData[cluster] = new Set()
      }

      dateData[cluster].add(citation.url)
    })

    // Get all unique clusters across all dates
    const allClusters = new Set<string>()
    dataByDate.forEach(clusters => {
      Object.keys(clusters).forEach(cluster => allClusters.add(cluster))
    })

    // Transform to array format for stacked chart and sort by date
    // Ensure each date has all clusters (with 0 if missing)
    const chartData = Array.from(dataByDate.entries())
      .map(([date, clusters]) => {
        const entry: any = { date }
        // Add all clusters, defaulting to 0 if not present
        allClusters.forEach(cluster => {
          entry[cluster] = clusters[cluster]?.size || 0
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
