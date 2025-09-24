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

    // Get recent data for insights generation
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)

    // Get brand mentions for trend analysis
    const { data: thisWeekMentions } = await supabase
      .from('brand_mentions')
      .select(`
        id,
        brand_mentioned,
        responses!inner(response_date, platform)
      `)
      .gte('responses.response_date', oneWeekAgo.toISOString())
      .eq('brand_mentioned', true)

    const { data: lastWeekMentions } = await supabase
      .from('brand_mentions')
      .select(`
        id,
        brand_mentioned,
        responses!inner(response_date, platform)
      `)
      .gte('responses.response_date', twoWeeksAgo.toISOString())
      .lt('responses.response_date', oneWeekAgo.toISOString())
      .eq('brand_mentioned', true)

    // Get competitor mentions
    const { data: competitorMentions } = await supabase
      .from('competitor_mentions')
      .select(`
        competitor_name,
        responses!inner(response_date, platform)
      `)
      .gte('responses.response_date', oneWeekAgo.toISOString())
      .eq('competitors_mentioned', true)

    // Generate insights based on data
    const insights = generateInsights({
      thisWeekMentions: thisWeekMentions || [],
      lastWeekMentions: lastWeekMentions || [],
      competitorMentions: competitorMentions || [],
    })

    return NextResponse.json({
      insights,
      lastUpdate: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error generating insights:', error)

    // Return fallback insights
    return NextResponse.json({
      insights: [
        {
          type: 'trend',
          title: 'Weekly Performance',
          description: 'Brand mention data is being processed',
          timestamp: new Date().toISOString(),
        },
        {
          type: 'info',
          title: 'Platform Activity',
          description: 'Monitoring across ChatGPT, Google AI, and Microsoft Copilot',
          timestamp: new Date().toISOString(),
        },
      ],
      lastUpdate: new Date().toISOString(),
    })
  }
}

function generateInsights(data: any) {
  const insights = []
  const currentCount = data.thisWeekMentions.length
  const previousCount = data.lastWeekMentions.length

  // Trend insight
  if (currentCount > previousCount) {
    const growth = Math.round(((currentCount - previousCount) / Math.max(previousCount, 1)) * 100)
    insights.push({
      type: 'trend',
      title: 'Mentions Trending Up',
      description: `Brand mentions increased ${growth}% this week (${currentCount} vs ${previousCount})`,
      timestamp: new Date().toISOString(),
    })
  } else if (currentCount < previousCount) {
    const decline = Math.round(((previousCount - currentCount) / Math.max(previousCount, 1)) * 100)
    insights.push({
      type: 'alert',
      title: 'Mentions Declining',
      description: `Brand mentions decreased ${decline}% this week (${currentCount} vs ${previousCount})`,
      timestamp: new Date().toISOString(),
    })
  }

  // Competitor activity
  const competitorCounts = data.competitorMentions.reduce((acc: any, mention: any) => {
    acc[mention.competitor_name] = (acc[mention.competitor_name] || 0) + 1
    return acc
  }, {})

  const topCompetitor = Object.entries(competitorCounts)
    .sort(([,a], [,b]) => (b as number) - (a as number))[0]

  if (topCompetitor) {
    insights.push({
      type: 'alert',
      title: 'Competitor Activity',
      description: `${topCompetitor[0]} mentioned ${topCompetitor[1]} times this week`,
      timestamp: new Date().toISOString(),
    })
  }

  // Platform performance
  const platformCounts = data.thisWeekMentions.reduce((acc: any, mention: any) => {
    const platform = mention.responses.platform
    acc[platform] = (acc[platform] || 0) + 1
    return acc
  }, {})

  const topPlatform = Object.entries(platformCounts)
    .sort(([,a], [,b]) => (b as number) - (a as number))[0]

  if (topPlatform) {
    insights.push({
      type: 'success',
      title: 'Platform Performance',
      description: `${topPlatform[0]} leading with ${topPlatform[1]} mentions`,
      timestamp: new Date().toISOString(),
    })
  }

  return insights.slice(0, 4) // Limit to 4 insights
}