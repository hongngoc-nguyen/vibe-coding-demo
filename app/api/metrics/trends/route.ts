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

    // Get date range from query params (default to last 12 weeks)
    const { searchParams } = new URL(request.url)
    const weeksBack = parseInt(searchParams.get('weeks') || '12')

    const endDate = new Date()
    const startDate = new Date(endDate.getTime() - weeksBack * 7 * 24 * 60 * 60 * 1000)

    // Use the brand_performance view for aggregated data
    const { data: trendData, error } = await supabase
      .from('brand_performance')
      .select('*')
      .gte('week', startDate.toISOString())
      .lte('week', endDate.toISOString())
      .order('week', { ascending: true })

    if (error) {
      console.error('Supabase error:', error)
      // Return mock data if view doesn't exist yet
      return NextResponse.json(generateMockTrendData(weeksBack))
    }

    // Transform data for the chart
    const chartData = trendData?.map(item => ({
      week: item.week,
      mentions: item.brand_mentions || 0,
      citations: item.citations || 0,
      platform: item.platform,
    })) || []

    // If no data, return mock data
    if (chartData.length === 0) {
      return NextResponse.json(generateMockTrendData(weeksBack))
    }

    return NextResponse.json(chartData)
  } catch (error) {
    console.error('Error fetching trend data:', error)
    return NextResponse.json(generateMockTrendData(12))
  }
}

function generateMockTrendData(weeks: number) {
  const data = []
  const now = new Date()

  for (let i = weeks - 1; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000)
    const weekStart = new Date(date.setDate(date.getDate() - date.getDay()))

    data.push({
      week: weekStart.toISOString(),
      mentions: Math.floor(Math.random() * 20) + 5,
      citations: Math.floor(Math.random() * 8) + 1,
      platform: 'All Platforms',
    })
  }

  return data
}