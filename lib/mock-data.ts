// Centralized mock data for AEO Dashboard Demo
// This provides consistent, realistic placeholder data across all components

export const MOCK_COMPETITORS = [
  { name: 'Anduin', baseScore: 45 },
  { name: 'Passthrough', baseScore: 38 },
  { name: 'Subscribe', baseScore: 32 },
  { name: 'CompetitorX', baseScore: 13 }
]

export const MOCK_PLATFORMS = [
  { name: 'ChatGPT', mentions: 45, citations: 12 },
  { name: 'Google AI', mentions: 38, citations: 8 },
  { name: 'Microsoft Copilot', mentions: 23, citations: 5 }
]

export const MOCK_PROMPT_CLUSTERS = [
  { name: 'Brand Research', mentions: 89 },
  { name: 'Competitive Analysis', mentions: 67 },
  { name: 'Product Comparison', mentions: 54 },
  { name: 'Market Analysis', mentions: 37 }
]

export const MOCK_CITATIONS = [
  {
    url: 'https://techcrunch.com/fintech-comparison',
    count: 18,
    title: 'Fintech Solutions Comparison 2024',
    competitors: ['Anduin', 'Passthrough']
  },
  {
    url: 'https://venturebeat.com/investment-platforms',
    count: 15,
    title: 'Investment Platform Analysis',
    competitors: ['Subscribe', 'Anduin']
  },
  {
    url: 'https://forbes.com/capital-markets',
    count: 12,
    title: 'Capital Markets Technology Review',
    competitors: ['Passthrough', 'CompetitorX']
  },
  {
    url: 'https://wsj.com/digital-finance',
    count: 10,
    title: 'Digital Finance Landscape',
    competitors: ['Anduin', 'Subscribe', 'Passthrough']
  },
  {
    url: 'https://bloomberg.com/fintech-trends',
    count: 8,
    title: 'Fintech Industry Trends',
    competitors: ['CompetitorX', 'Anduin']
  }
]

export const MOCK_INSIGHTS = [
  {
    type: 'trend',
    title: 'Mentions Trending Up',
    description: 'Brand mentions increased 15% this week (45 vs 39)',
  },
  {
    type: 'alert',
    title: 'Competitor Activity',
    description: 'Passthrough mentioned 8% more on ChatGPT this week',
  },
  {
    type: 'success',
    title: 'Citation Growth',
    description: 'New weekly high: 12 authoritative citations achieved',
  },
  {
    type: 'info',
    title: 'Platform Performance',
    description: 'ChatGPT leading with 18 mentions, Google AI showing growth',
  }
]

// Generate trend data with realistic patterns
export function generateTrendData(weeks: number = 12) {
  const data = []
  const now = new Date()
  const baseMentions = 22
  const baseCitations = 8

  for (let i = weeks - 1; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000)
    const weekStart = new Date(date.setDate(date.getDate() - date.getDay()))

    // Add slight upward trend with variation
    const trendMultiplier = 1 + (weeks - i) * 0.02 // 2% growth per week
    const variation = 0.8 + Math.random() * 0.4 // ±20% variation

    const mentions = Math.round(baseMentions * trendMultiplier * variation)
    const citations = Math.round(baseCitations * trendMultiplier * variation)

    data.push({
      week: weekStart.toISOString(),
      mentions: Math.max(mentions, 5), // Minimum 5 mentions
      citations: Math.max(citations, 2), // Minimum 2 citations
      platform: 'All Platforms',
    })
  }

  return data
}

// Generate competitor data for charts
export function generateCompetitorData(weeks: number = 4) {
  const competitors = ['Anduin', 'Passthrough', 'Atominvest', 'Juniper Square', 'Subscribe']
  const data = []

  for (let week = 0; week < weeks; week++) {
    const weekLabel = `Week ${week + 1}`
    const weekData: any = { week: weekLabel }

    competitors.forEach((competitor, index) => {
      // Base scores with some realistic variation
      const baseScores = [72, 56, 42, 31, 25] // Anduin highest, others lower
      const weeklyVariation = Math.random() * 8 - 4 // ±4 variation per week
      const growthTrend = week * 2 // Slight weekly growth

      weekData[competitor] = Math.max(
        baseScores[index] + weeklyVariation + growthTrend,
        5 // Minimum value
      )
    })

    data.push(weekData)
  }

  return data
}

// Generate daily trend data
export function generateDailyTrends(days: number = 30) {
  const trends = []

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
    trends.push({
      date: date.toISOString().split('T')[0],
      mentions: Math.floor(Math.random() * 8) + 2,
      citations: Math.floor(Math.random() * 3) + 1
    })
  }

  return trends
}

// Generate mock metrics summary
export function generateMetricsSummary() {
  const baseMentions = 45
  const variation = 0.8 + Math.random() * 0.4

  const totalMentions = Math.round(baseMentions * variation)
  const citations = Math.round(totalMentions * 0.28) // ~28% citation rate

  return {
    totalMentions,
    mentionTrend: 15.2,
    citations,
    citationTrend: 8.7,
    competitiveRank: 2,
    rankTrend: -0.5, // Improved
    weeklyGrowth: 15.2,
  }
}