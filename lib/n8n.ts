/**
 * N8N Workflow Integration
 * Handles calls to Google Search and Google AI Mode n8n workflows
 */

import { N8NWebhookPayload, N8NWebhookResponse } from '@/types/search'

// N8N Webhook URLs - Update these with your actual n8n instance URLs
const N8N_GOOGLE_AI_WEBHOOK = process.env.N8N_GOOGLE_AI_WEBHOOK_URL ||
  `https://your-n8n-instance.com/webhook/da1fe02d-2a0c-4c04-a082-6fe722c9684f`

const N8N_GOOGLE_SEARCH_WEBHOOK = process.env.N8N_GOOGLE_SEARCH_WEBHOOK_URL ||
  `https://your-n8n-instance.com/webhook/17094fa1-9051-4eed-b0cb-f9d2fd48f7a1`

const N8N_TIMEOUT = parseInt(process.env.N8N_WEBHOOK_TIMEOUT || '30000')
const USE_MOCK = process.env.USE_MOCK_N8N === 'true'

/**
 * Call Google AI Mode n8n workflow
 */
export async function callGoogleAIModeWorkflow(
  payload: N8NWebhookPayload
): Promise<N8NWebhookResponse> {
  if (USE_MOCK) {
    return mockGoogleAIModeResponse(payload)
  }

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), N8N_TIMEOUT)

    const response = await fetch(N8N_GOOGLE_AI_WEBHOOK, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`N8N workflow failed with status ${response.status}`)
    }

    const data = await response.json()
    return data as N8NWebhookResponse

  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Google AI Mode workflow timeout')
    }

    console.error('Google AI Mode workflow error:', error)
    throw new Error(
      error instanceof Error ? error.message : 'Failed to call Google AI Mode workflow'
    )
  }
}

/**
 * Call Google Search n8n workflow
 */
export async function callGoogleSearchWorkflow(
  payload: N8NWebhookPayload
): Promise<N8NWebhookResponse> {
  if (USE_MOCK) {
    return mockGoogleSearchResponse(payload)
  }

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), N8N_TIMEOUT)

    const response = await fetch(N8N_GOOGLE_SEARCH_WEBHOOK, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`N8N workflow failed with status ${response.status}`)
    }

    const data = await response.json()
    return data as N8NWebhookResponse

  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Google Search workflow timeout')
    }

    console.error('Google Search workflow error:', error)
    throw new Error(
      error instanceof Error ? error.message : 'Failed to call Google Search workflow'
    )
  }
}

/**
 * Call both workflows in parallel
 */
export async function callBothWorkflows(payload: N8NWebhookPayload): Promise<{
  googleSearch: N8NWebhookResponse | null
  googleAIMode: N8NWebhookResponse | null
  errors: { googleSearch?: string; googleAIMode?: string }
}> {
  const [searchResult, aiResult] = await Promise.allSettled([
    callGoogleSearchWorkflow(payload),
    callGoogleAIModeWorkflow(payload)
  ])

  const errors: { googleSearch?: string; googleAIMode?: string } = {}

  const googleSearch = searchResult.status === 'fulfilled'
    ? searchResult.value
    : null

  const googleAIMode = aiResult.status === 'fulfilled'
    ? aiResult.value
    : null

  if (searchResult.status === 'rejected') {
    errors.googleSearch = searchResult.reason?.message || 'Unknown error'
  }

  if (aiResult.status === 'rejected') {
    errors.googleAIMode = aiResult.reason?.message || 'Unknown error'
  }

  return {
    googleSearch,
    googleAIMode,
    errors
  }
}

// ============================================
// MOCK RESPONSES FOR TESTING
// ============================================

function mockGoogleAIModeResponse(payload: N8NWebhookPayload): N8NWebhookResponse {
  // Simulate network delay
  return new Promise((resolve) => {
    setTimeout(() => {
      const formattedResponse = `AI-Generated Answer for: "${payload.prompt_text}"

This is a mock AI-generated answer. In a real scenario, this would contain comprehensive information from Google's AI Mode, synthesizing multiple sources to provide a detailed, accurate response to your question.

The answer would be contextual, well-structured, and backed by reliable sources, providing insights that help you make informed decisions.

Sources:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Example Source 1 - Authoritative Guide
   https://example.com/guide
   Comprehensive information about legal software solutions and best practices.

2. Example Source 2 - Industry Analysis
   https://example.com/analysis
   Market research and comparison of leading tools in the industry.

3. Example Source 3 - User Reviews
   https://example.com/reviews
   Real user experiences and ratings from verified customers.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Confidence Score: 92%`

      resolve({
        success: true,
        query_id: payload.query_id,
        response_id: payload.response_id, // Return the pre-generated response_id
        source_type: 'google_ai_mode',
        response_data: formattedResponse,
        execution_time: Math.floor(Math.random() * 2000) + 800
      })
    }, 1500) // Simulate 1.5s delay
  })
}

function mockGoogleSearchResponse(payload: N8NWebhookPayload): N8NWebhookResponse {
  // Simulate network delay
  return new Promise((resolve) => {
    setTimeout(() => {
      const formattedResponse = `Google Search Results for: "${payload.prompt_text}"

═══════════════════════════════════════════════════════════════════════════

Result #1
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Title: Best Legal Software for Small Firms - 2025 Guide
URL: https://example.com/legal-software-guide

Comprehensive guide to choosing legal practice management software. Compare
features, pricing, and user reviews of top solutions including Clio, MyCase,
and more.

Result #2
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Title: Top 10 Legal Practice Management Software
URL: https://example.com/top-10-legal-software

Discover the best legal software solutions for attorneys and law firms. Read
expert reviews and comparisons to find the perfect fit for your practice.

Result #3
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Title: Legal Tech Reviews | Attorney Software Comparison
URL: https://example.com/legal-tech-reviews

In-depth reviews of legal technology platforms. Compare case management,
billing, document automation, and client portal features.

Result #4
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Title: Clio vs MyCase vs PracticePanther Comparison
URL: https://example.com/software-comparison

Side-by-side comparison of leading legal practice management platforms. See
pricing, features, integrations, and user ratings.

Result #5
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Title: How to Choose Legal Software for Your Firm
URL: https://example.com/how-to-choose

Step-by-step guide to evaluating and selecting legal practice management
software. Learn what features matter most for small to mid-size firms.

═══════════════════════════════════════════════════════════════════════════
About 1,250,000 results (0.42 seconds)`

      resolve({
        success: true,
        query_id: payload.query_id,
        response_id: payload.response_id, // Return the pre-generated response_id
        source_type: 'google_search',
        response_data: formattedResponse,
        execution_time: Math.floor(Math.random() * 1500) + 500
      })
    }, 1200) // Simulate 1.2s delay
  })
}
