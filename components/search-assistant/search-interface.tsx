'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { PromptInput } from './prompt-input'
import { ResponseDisplay } from './response-display'
import { HistorySidebar } from './history-sidebar'
import { HistoryQuery, SearchResponse } from '@/types/search'

interface SearchInterfaceProps {
  userId: string
}

export function SearchInterface({ userId }: SearchInterfaceProps) {
  const [queries, setQueries] = useState<HistoryQuery[]>([])
  const [selectedQueryId, setSelectedQueryId] = useState<string | null>(null)
  const [googleSearchResponse, setGoogleSearchResponse] = useState<SearchResponse | null>(null)
  const [googleAIModeResponse, setGoogleAIModeResponse] = useState<SearchResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(true)

  // Fetch history on mount
  useEffect(() => {
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    try {
      setIsLoadingHistory(true)
      const response = await fetch('/api/search/history')
      const data = await response.json()

      if (data.success) {
        setQueries(data.queries)
      } else {
        toast.error('Failed to load search history')
      }
    } catch (error) {
      console.error('Failed to fetch history:', error)
      toast.error('Failed to load search history')
    } finally {
      setIsLoadingHistory(false)
    }
  }

  const handleSubmit = async (prompt: string) => {
    try {
      setIsLoading(true)
      setGoogleSearchResponse(null)
      setGoogleAIModeResponse(null)

      const response = await fetch('/api/search/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt_text: prompt })
      })

      const data = await response.json()

      if (data.success) {
        // Update responses
        setGoogleSearchResponse(data.responses.google_search || null)
        setGoogleAIModeResponse(data.responses.google_ai_mode || null)
        setSelectedQueryId(data.query_id)

        // Refresh history
        await fetchHistory()

        toast.success('Search completed successfully')
      } else {
        toast.error(data.error || 'Failed to submit search')
      }
    } catch (error) {
      console.error('Submit error:', error)
      toast.error('Failed to submit search')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectQuery = async (queryId: string) => {
    try {
      setSelectedQueryId(queryId)
      setIsLoading(true)

      const response = await fetch(`/api/search/${queryId}`)
      const data = await response.json()

      if (data.success) {
        setGoogleSearchResponse(data.responses.google_search || null)
        setGoogleAIModeResponse(data.responses.google_ai_mode || null)
      } else {
        toast.error('Failed to load query details')
      }
    } catch (error) {
      console.error('Failed to load query:', error)
      toast.error('Failed to load query details')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full">
      {/* History Sidebar */}
      <div className="w-full lg:w-80 lg:h-[calc(100vh-200px)] flex-shrink-0">
        <div className="h-full border rounded-lg bg-white">
          <HistorySidebar
            queries={queries}
            selectedQueryId={selectedQueryId}
            onSelectQuery={handleSelectQuery}
            isLoading={isLoadingHistory}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 space-y-6">
        {/* Prompt Input */}
        <div className="bg-white border rounded-lg p-4">
          <PromptInput onSubmit={handleSubmit} isLoading={isLoading} />
        </div>

        {/* Response Display */}
        <ResponseDisplay
          googleSearchResponse={googleSearchResponse}
          googleAIModeResponse={googleAIModeResponse}
          isLoading={isLoading}
        />
      </div>
    </div>
  )
}
