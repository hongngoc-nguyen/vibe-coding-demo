'use client'

import { useState, useEffect } from 'react'
import { GoogleAIModeTrendChart } from './google-ai-mode-trend-chart'
import { GoogleAIModeClusterChart } from './google-ai-mode-cluster-chart'
import { GoogleAIModeInsights } from './google-ai-mode-insights'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function GoogleAIModeContent() {
  const [dateFilter, setDateFilter] = useState('all')
  const [data, setData] = useState<any>({
    availableDates: [],
    metrics: { totalCitations: 0, growthRate: 0 },
    uniqueCitationChart: [],
    promptClusters: [],
    citations: []
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchAllData()
  }, [dateFilter])

  const fetchAllData = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        platform: 'Google AI Mode',
        date: dateFilter
      })
      const response = await fetch(`/api/analytics/brand?${params}`)
      const result = await response.json()
      setData(result)
    } catch (error) {
      console.error('Failed to fetch platform data:', error)
      setData({
        availableDates: [],
        metrics: { totalCitations: 0, growthRate: 0 },
        uniqueCitationChart: [],
        promptClusters: [],
        citations: []
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getDateRangeText = () => {
    if (dateFilter === 'all') return 'All time'
    if (dateFilter === '7') return 'Last 7 days'
    if (dateFilter === '14') return 'Last 14 days'
    if (dateFilter === '30') return 'Last 30 days'
    if (dateFilter === '90') return 'Last 90 days'
    return 'Selected period'
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-end">
          <div className="w-48 h-10 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-1/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Date Filter */}
      <div className="flex justify-end">
        <div className="w-48">
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Dates</SelectItem>
              {data.availableDates.map((date: string) => (
                <SelectItem key={date} value={date}>{date}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Citations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.metrics.totalCitations}</div>
            <Badge variant="secondary" className="mt-1">
              {getDateRangeText()}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Growth Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.metrics.growthRate}%</div>
            <Badge variant="default" className="mt-1">
              vs previous period
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Charts from Overview - filtered for Google AI Mode */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GoogleAIModeTrendChart data={data.uniqueCitationChart} />
        <GoogleAIModeClusterChart data={data.promptClusters} />
      </div>

      {/* Platform Insights Section */}
      <GoogleAIModeInsights
        uniqueCitationChart={data.uniqueCitationChart}
        citations={data.citations}
        dateFilter={dateFilter}
      />
    </div>
  )
}
