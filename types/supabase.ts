export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          role: 'admin' | 'viewer'
          full_name: string | null
          created_at: string
          last_login: string | null
        }
        Insert: {
          id: string
          email: string
          role?: 'admin' | 'viewer'
          full_name?: string | null
          created_at?: string
          last_login?: string | null
        }
        Update: {
          id?: string
          email?: string
          role?: 'admin' | 'viewer'
          full_name?: string | null
          created_at?: string
          last_login?: string | null
        }
      }
      competitors: {
        Row: {
          id: string
          competitor_name: string
          industry_category: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          competitor_name: string
          industry_category?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          competitor_name?: string
          industry_category?: string | null
          is_active?: boolean
          created_at?: string
        }
      }
      prompts: {
        Row: {
          prompt_id: string
          prompt_text: string
          prompt_cluster: string
          prompt_sequence_count: number
          added_date: string
          priority: number
          created_at: string
        }
        Insert: {
          prompt_id?: string
          prompt_text: string
          prompt_cluster: string
          prompt_sequence_count?: number
          added_date?: string
          priority?: number
          created_at?: string
        }
        Update: {
          prompt_id?: string
          prompt_text?: string
          prompt_cluster?: string
          prompt_sequence_count?: number
          added_date?: string
          priority?: number
          created_at?: string
        }
      }
      responses: {
        Row: {
          response_id: string
          prompt_id: string
          platform: 'ChatGPT' | 'Google AI' | 'Microsoft Copilot'
          response_date: string
          execution_time: number | null
          response_length: number | null
          response_status: 'Success' | 'Failed'
          full_response_text: string | null
          created_at: string
        }
        Insert: {
          response_id?: string
          prompt_id: string
          platform: 'ChatGPT' | 'Google AI' | 'Microsoft Copilot'
          response_date?: string
          execution_time?: number | null
          response_length?: number | null
          response_status?: 'Success' | 'Failed'
          full_response_text?: string | null
          created_at?: string
        }
        Update: {
          response_id?: string
          prompt_id?: string
          platform?: 'ChatGPT' | 'Google AI' | 'Microsoft Copilot'
          response_date?: string
          execution_time?: number | null
          response_length?: number | null
          response_status?: 'Success' | 'Failed'
          full_response_text?: string | null
          created_at?: string
        }
      }
      brand_mentions: {
        Row: {
          id: string
          response_id: string
          brand_mentioned: boolean
          mention_count: number | null
          mention_text: string | null
          brand_citation: boolean | null
          cited_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          response_id: string
          brand_mentioned?: boolean
          mention_count?: number | null
          mention_text?: string | null
          brand_citation?: boolean | null
          cited_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          response_id?: string
          brand_mentioned?: boolean
          mention_count?: number | null
          mention_text?: string | null
          brand_citation?: boolean | null
          cited_url?: string | null
          created_at?: string
        }
      }
      competitor_mentions: {
        Row: {
          id: string
          response_id: string
          competitors_mentioned: boolean
          competitor_name: string | null
          mention_text: string | null
          cited_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          response_id: string
          competitors_mentioned?: boolean
          competitor_name?: string | null
          mention_text?: string | null
          cited_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          response_id?: string
          competitors_mentioned?: boolean
          competitor_name?: string | null
          mention_text?: string | null
          cited_url?: string | null
          created_at?: string
        }
      }
      external_mentions: {
        Row: {
          id: string
          response_id: string
          external_mentioned: boolean
          external_name: string | null
          cited_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          response_id: string
          external_mentioned?: boolean
          external_name?: string | null
          cited_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          response_id?: string
          external_mentioned?: boolean
          external_name?: string | null
          cited_url?: string | null
          created_at?: string
        }
      }
      user_search_queries: {
        Row: {
          query_id: string
          user_id: string
          prompt_text: string
          query_status: 'pending' | 'processing' | 'completed' | 'failed'
          created_at: string
          updated_at: string
        }
        Insert: {
          query_id?: string
          user_id: string
          prompt_text: string
          query_status?: 'pending' | 'processing' | 'completed' | 'failed'
          created_at?: string
          updated_at?: string
        }
        Update: {
          query_id?: string
          user_id?: string
          prompt_text?: string
          query_status?: 'pending' | 'processing' | 'completed' | 'failed'
          created_at?: string
          updated_at?: string
        }
      }
      search_responses: {
        Row: {
          response_id: string
          query_id: string
          source_type: 'google_search' | 'google_ai_mode'
          response_data: string
          response_status: 'success' | 'failed'
          execution_time: number | null
          error_message: string | null
          created_at: string
        }
        Insert: {
          response_id?: string
          query_id: string
          source_type: 'google_search' | 'google_ai_mode'
          response_data: string
          response_status?: 'success' | 'failed'
          execution_time?: number | null
          error_message?: string | null
          created_at?: string
        }
        Update: {
          response_id?: string
          query_id?: string
          source_type?: 'google_search' | 'google_ai_mode'
          response_data?: string
          response_status?: 'success' | 'failed'
          execution_time?: number | null
          error_message?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      brand_performance: {
        Row: {
          week: string
          brand_mentions: number
          total_mention_count: number
          citations: number
          platform: string
        }
      }
      competitive_analysis: {
        Row: {
          week: string
          competitor_name: string
          mention_count: number
          platform: string
        }
      }
    }
  }
}