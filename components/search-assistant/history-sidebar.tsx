'use client'

import { formatDistanceToNow } from 'date-fns'
import { Clock, Loader2, MessageSquare, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { HistoryQuery } from '@/types/search'

interface HistorySidebarProps {
  queries: HistoryQuery[]
  selectedQueryId?: string | null
  onSelectQuery: (queryId: string) => void
  isLoading?: boolean
}

export function HistorySidebar({
  queries,
  selectedQueryId,
  onSelectQuery,
  isLoading
}: HistorySidebarProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
      case 'failed':
        return <AlertCircle className="h-3.5 w-3.5 text-red-600" />
      case 'processing':
        return <RefreshCw className="h-3.5 w-3.5 text-blue-600 animate-spin" />
      default:
        return <Clock className="h-3.5 w-3.5 text-gray-400" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      completed: 'default',
      failed: 'destructive',
      processing: 'secondary',
      pending: 'secondary'
    }

    return (
      <Badge variant={variants[status] || 'secondary'} className="text-xs">
        {status}
      </Badge>
    )
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400 mx-auto" />
          <p className="text-sm text-gray-500">Loading history...</p>
        </div>
      </div>
    )
  }

  if (queries.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
              <MessageSquare className="h-6 w-6 text-gray-400" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-900">No searches yet</h3>
          <p className="text-xs text-gray-500 max-w-[200px]">
            Start by entering a prompt in the search box
          </p>
        </div>
      </div>
    )
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-2 p-4">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Search History</h2>
        {queries.map((query) => (
          <Card
            key={query.query_id}
            className={`p-3 cursor-pointer transition-all hover:shadow-md ${
              selectedQueryId === query.query_id
                ? 'border-blue-500 bg-blue-50'
                : 'hover:border-gray-300'
            }`}
            onClick={() => onSelectQuery(query.query_id)}
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium text-gray-900 line-clamp-2 flex-1">
                  {query.prompt_text}
                </p>
                {getStatusIcon(query.query_status)}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Clock className="h-3 w-3" />
                  <span>
                    {formatDistanceToNow(new Date(query.created_at), { addSuffix: true })}
                  </span>
                </div>
                {query.response_count > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {query.response_count} {query.response_count === 1 ? 'response' : 'responses'}
                  </Badge>
                )}
              </div>

              {query.query_status !== 'completed' && (
                <div className="pt-1">
                  {getStatusBadge(query.query_status)}
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </ScrollArea>
  )
}
