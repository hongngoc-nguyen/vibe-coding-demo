'use client'

import { Search, Sparkles, Loader2, AlertCircle } from 'lucide-react'
import { SearchResultCard } from './search-result-card'
import { AIResponseCard } from './ai-response-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { SearchResponse } from '@/types/search'

interface ResponseDisplayProps {
  googleSearchResponse?: SearchResponse | null
  googleAIModeResponse?: SearchResponse | null
  isLoading?: boolean
}

export function ResponseDisplay({
  googleSearchResponse,
  googleAIModeResponse,
  isLoading
}: ResponseDisplayProps) {
  // Show empty state
  if (!isLoading && !googleSearchResponse && !googleAIModeResponse) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center">
              <Search className="h-8 w-8 text-gray-400" />
            </div>
          </div>
          <h3 className="text-lg font-medium text-gray-900">No search selected</h3>
          <p className="text-sm text-gray-500 max-w-sm">
            Enter a prompt and click generate to see results, or select a previous search from the history.
          </p>
        </div>
      </div>
    )
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Google Search Loading */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Search className="h-5 w-5 text-blue-600" />
              Google Search Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-3">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
                <p className="text-sm text-gray-600">Searching...</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Google AI Mode Loading */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="h-5 w-5 text-purple-600" />
              AI Response
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-3">
                <Loader2 className="h-8 w-8 animate-spin text-purple-600 mx-auto" />
                <p className="text-sm text-gray-600">Generating answer...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Google Search Results */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Search className="h-5 w-5 text-blue-600" />
              Google Search Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            {googleSearchResponse?.response_status === 'failed' ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {googleSearchResponse.error_message || 'Failed to fetch search results'}
                </AlertDescription>
              </Alert>
            ) : googleSearchResponse?.response_data ? (
              <div className="prose prose-sm max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700 leading-relaxed">
                  {googleSearchResponse.response_data}
                </pre>
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-8">
                No search results available
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Google AI Mode Response */}
      <div className="space-y-4">
        {googleAIModeResponse?.response_status === 'failed' ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="h-5 w-5 text-purple-600" />
                AI Response
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {googleAIModeResponse.error_message || 'Failed to generate AI response'}
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        ) : googleAIModeResponse?.response_data ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="h-5 w-5 text-purple-600" />
                AI Response
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700 leading-relaxed">
                  {googleAIModeResponse.response_data}
                </pre>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="h-5 w-5 text-purple-600" />
                AI Response
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 text-center py-8">
                No AI response available
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
