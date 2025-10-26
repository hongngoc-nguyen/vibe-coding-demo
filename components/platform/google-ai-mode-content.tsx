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
  const [availableDates, setAvailableDates] = useState<string[]>([])
  const [isLoadingDates, setIsLoadingDates] = useState(true)
  const [metrics, setMetrics] = useState({ totalCitations: 0, growthRate: 0 })

  useEffect(() => {
    fetchAvailableDates()
  }, [])

  useEffect(() => {
    fetchMetrics()
  }, [dateFilter])

  const fetchAvailableDates = async () => {
    setIsLoadingDates(true)
    try {
      const params = new URLSearchParams({
        platform: 'Google AI Mode',
        date: 'all'
      })
      const response = await fetch(`/api/analytics/brand?${params}`)
      const result = await response.json()
      if (result.availableDates) {
        setAvailableDates(result.availableDates)
      }
    } catch (error) {
      console.error('Failed to fetch available dates:', error)
    } finally {
      setIsLoadingDates(false)
    }
  }

  const fetchMetrics = async () => {
    try {
      const params = new URLSearchParams({
        platform: 'Google AI Mode',
        date: dateFilter
      })
      const response = await fetch(`/api/analytics/brand?${params}`)
      const result = await response.json()
      if (result.metrics) {
        setMetrics(result.metrics)
      }
    } catch (error) {
      console.error('Failed to fetch metrics:', error)
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

  return (
    <div className="space-y-6">
      {/* Date Filter */}
      <div className="flex justify-end">
        <div className="w-48">
          <Select value={dateFilter} onValueChange={setDateFilter} disabled={isLoadingDates}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Dates</SelectItem>
              {availableDates.map((date: string) => (
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
            <div className="text-2xl font-bold">{metrics.totalCitations}</div>
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
            <div className="text-2xl font-bold">{metrics.growthRate}%</div>
            <Badge variant="default" className="mt-1">
              vs previous period
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Charts from Overview - filtered for Google AI Mode */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GoogleAIModeTrendChart dateFilter={dateFilter} />
        <GoogleAIModeClusterChart dateFilter={dateFilter} />
      </div>

      {/* Platform Insights Section */}
      <GoogleAIModeInsights dateFilter={dateFilter} />
    </div>
  )
}
