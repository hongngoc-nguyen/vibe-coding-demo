/**
 * Types for Search Assistant Feature
 * Supports Google Search and Google AI Mode queries
 */

// Base types from database
export type QueryStatus = 'pending' | 'processing' | 'completed' | 'failed'
export type SourceType = 'google_search' | 'google_ai_mode'
export type ResponseStatus = 'success' | 'failed'

// User search query interface
export interface SearchQuery {
  query_id: string
  user_id: string
  prompt_text: string
  query_status: QueryStatus
  created_at: string
  updated_at: string
}

// Search response interface
export interface SearchResponse {
  response_id: string
  query_id: string
  source_type: SourceType
  response_data: string // Changed from JSONB to TEXT - stores formatted response
  response_status: ResponseStatus
  execution_time: number | null
  error_message: string | null
  created_at: string
}

// Combined query with responses
export interface SearchQueryWithResponses extends SearchQuery {
  search_responses?: SearchResponse[]
  google_search_response?: SearchResponse
  google_ai_mode_response?: SearchResponse
}

// Google Search response data structure
// Adjust based on actual n8n workflow output
export interface GoogleSearchData {
  results?: Array<{
    title: string
    link: string
    snippet: string
    position?: number
  }>
  searchInformation?: {
    totalResults: string
    searchTime: number
  }
  raw?: any // Store full raw response
}

// Google AI Mode response data structure
// Adjust based on actual n8n workflow output
export interface GoogleAIModeData {
  answer?: string
  sources?: Array<{
    title: string
    url: string
    snippet?: string
  }>
  confidence?: number
  raw?: any // Store full raw response
}

// API request/response types
export interface SubmitSearchRequest {
  prompt_text: string
  user_id: string
}

export interface SubmitSearchResponse {
  success: boolean
  query_id: string
  message?: string
  error?: string
  responses?: {
    google_search?: SearchResponse
    google_ai_mode?: SearchResponse
  }
}

export interface HistoryQuery {
  query_id: string
  prompt_text: string
  query_status: QueryStatus
  created_at: string
  response_count?: number
}

export interface HistoryResponse {
  success: boolean
  queries: HistoryQuery[]
  total: number
  page: number
  pageSize: number
}

export interface QueryDetailResponse {
  success: boolean
  query: SearchQuery
  responses: {
    google_search?: SearchResponse
    google_ai_mode?: SearchResponse
  }
  error?: string
}

// N8N webhook payload types
export interface N8NWebhookPayload {
  query_id: string
  user_id: string
  prompt_text: string
  response_id: string // Pre-generated UUID for this response
}

export interface N8NWebhookResponse {
  success: boolean
  query_id: string
  response_id: string // The pre-generated UUID sent in payload
  source_type: SourceType
  response_data: string // n8n returns pre-formatted text
  execution_time: number
  error?: string
}
