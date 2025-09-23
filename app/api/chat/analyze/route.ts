import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verify authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { message, context } = await request.json()

    if (!process.env.GOOGLE_GEMINI_API_KEY) {
      return NextResponse.json({
        response: "I'm sorry, but the Google Gemini API key is not configured. Please set up the GOOGLE_GEMINI_API_KEY environment variable to enable AI Assistant analysis.",
        insights: []
      })
    }

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    // Fetch recent AEO data for context
    const aeoData = await fetchAEODataContext(supabase)

    // Create a comprehensive prompt
    const prompt = createAnalysisPrompt(message, aeoData, context)

    // Generate response
    const result = await model.generateContent(prompt)
    const aiResponse = result.response.text()

    // Parse response for insights
    const insights = extractInsights(aiResponse)

    return NextResponse.json({
      response: aiResponse,
      insights
    })
  } catch (error) {
    console.error('Error in AI analysis:', error)
    return NextResponse.json(
      {
        response: "I apologize, but I encountered an error while processing your request. As your AI Assistant, I'm here to help analyze your AEO data and provide insights. Please try again or rephrase your question."
        insights: []
      },
      { status: 500 }
    )
  }
}

async function fetchAEODataContext(supabase: any) {
  try {
    // Get recent brand mentions
    const { data: brandMentions } = await supabase
      .from('brand_mentions')
      .select(`
        brand_mentioned,
        mention_count,
        responses!inner(platform, response_date)
      `)
      .eq('brand_mentioned', true)
      .gte('responses.response_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .limit(100)

    // Get competitor mentions
    const { data: competitorMentions } = await supabase
      .from('competitor_mentions')
      .select(`
        competitor_name,
        responses!inner(platform, response_date)
      `)
      .eq('competitors_mentioned', true)
      .gte('responses.response_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .limit(100)

    // Get citation data
    const { data: citations } = await supabase
      .from('brand_mentions')
      .select(`
        brand_citation,
        cited_url,
        responses!inner(platform, response_date)
      `)
      .eq('brand_citation', true)
      .gte('responses.response_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .limit(50)

    return {
      brandMentions: brandMentions || [],
      competitorMentions: competitorMentions || [],
      citations: citations || []
    }
  } catch (error) {
    console.error('Error fetching AEO data:', error)
    return {
      brandMentions: [],
      competitorMentions: [],
      citations: []
    }
  }
}

function createAnalysisPrompt(userMessage: string, aeoData: any, context: any[]) {
  const contextStr = context
    .filter(msg => msg.sender === 'user')
    .slice(-3)
    .map(msg => msg.content)
    .join('\n')

  return `You are an AI Assistant specializing in AEO (Answer Engine Optimization) for Anduin, a legal tech company. You provide intelligent insights, strategic recommendations, and pattern analysis using real-time data from Supabase. You help users understand their brand monitoring performance across AI platforms like ChatGPT, Google AI, and Microsoft Copilot.

CURRENT DATA CONTEXT:
Brand Mentions (Last 30 days): ${aeoData.brandMentions.length} total mentions
Competitor Mentions: ${aeoData.competitorMentions.length} total mentions
Citations: ${aeoData.citations.length} total citations

Platform Distribution:
${getPlatformDistribution(aeoData.brandMentions)}

Top Competitors Mentioned:
${getTopCompetitors(aeoData.competitorMentions)}

CONVERSATION CONTEXT:
${contextStr}

USER QUESTION: ${userMessage}

Please provide a detailed, data-driven response that:
1. Directly answers the user's question using the available data
2. Provides specific numbers and trends when possible
3. Offers strategic insights and recommendations
4. Identifies any concerning patterns or opportunities
5. Keeps the response focused and actionable

Format your response as natural, conversational text. If you identify key insights, make them clear and actionable.`
}

function getPlatformDistribution(mentions: any[]) {
  const platforms = mentions.reduce((acc, mention) => {
    const platform = mention.responses?.platform || 'Unknown'
    acc[platform] = (acc[platform] || 0) + 1
    return acc
  }, {})

  return Object.entries(platforms)
    .map(([platform, count]) => `- ${platform}: ${count} mentions`)
    .join('\n')
}

function getTopCompetitors(mentions: any[]) {
  const competitors = mentions.reduce((acc, mention) => {
    const name = mention.competitor_name
    if (name) {
      acc[name] = (acc[name] || 0) + 1
    }
    return acc
  }, {})

  return Object.entries(competitors)
    .sort(([,a], [,b]) => (b as number) - (a as number))
    .slice(0, 5)
    .map(([name, count]) => `- ${name}: ${count} mentions`)
    .join('\n')
}

function extractInsights(response: string): any[] {
  const insights = []

  // Look for trend-related content
  if (response.toLowerCase().includes('increas') || response.toLowerCase().includes('grow')) {
    insights.push({
      type: 'trend',
      title: 'Growth Detected',
      description: 'Positive trends identified in the data'
    })
  }

  // Look for competitive mentions
  if (response.toLowerCase().includes('competitor') || response.toLowerCase().includes('threat')) {
    insights.push({
      type: 'alert',
      title: 'Competitive Activity',
      description: 'Competitor movement detected'
    })
  }

  // Look for recommendations
  if (response.toLowerCase().includes('recommend') || response.toLowerCase().includes('should')) {
    insights.push({
      type: 'recommendation',
      title: 'Strategic Recommendation',
      description: 'Action items identified'
    })
  }

  return insights.slice(0, 3) // Limit to 3 insights
}