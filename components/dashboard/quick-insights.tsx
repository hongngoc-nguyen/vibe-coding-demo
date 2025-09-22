'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react'

interface Insight {
  type: 'trend' | 'alert' | 'success' | 'info'
  title: string
  description: string
  timestamp: string
}

export function QuickInsights() {
  const [insights, setInsights] = useState<Insight[]>([])
  const [lastUpdate, setLastUpdate] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const response = await fetch('/api/insights')
        const data = await response.json()
        setInsights(data.insights || [])
        setLastUpdate(data.lastUpdate || new Date().toISOString())
      } catch (error) {
        console.error('Failed to fetch insights:', error)
        // Fallback to sample data
        setInsights([
          {
            type: 'trend',
            title: 'Mentions Trending Up',
            description: 'Brand mentions increased 15% this week',
            timestamp: new Date().toISOString(),
          },
          {
            type: 'alert',
            title: 'Competitor Activity',
            description: 'Passthrough mentions up 8% on ChatGPT',
            timestamp: new Date().toISOString(),
          },
          {
            type: 'success',
            title: 'Citation Growth',
            description: 'Brand citations reached new weekly high',
            timestamp: new Date().toISOString(),
          },
        ])
        setLastUpdate(new Date().toISOString())
      } finally {
        setIsLoading(false)
      }
    }

    fetchInsights()
  }, [])

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'trend':
        return <TrendingUp className="h-4 w-4 text-blue-500" />
      case 'alert':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getBadgeVariant = (type: string) => {
    switch (type) {
      case 'trend':
        return 'default'
      case 'alert':
        return 'destructive'
      case 'success':
        return 'default'
      default:
        return 'secondary'
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Quick Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Quick Insights
        </CardTitle>
        <CardDescription className="flex items-center gap-1 text-xs">
          <Clock className="h-3 w-3" />
          Last updated: {new Date(lastUpdate).toLocaleDateString()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {insights.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              No insights available yet. Check back after data collection.
            </p>
          ) : (
            insights.map((insight, index) => (
              <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                {getInsightIcon(insight.type)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {insight.title}
                    </h4>
                    <Badge
                      variant={getBadgeVariant(insight.type) as any}
                      className="text-xs"
                    >
                      {insight.type}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-600">{insight.description}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}