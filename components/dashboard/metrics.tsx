'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, Link2 } from 'lucide-react'

interface MetricsData {
  totalCitations: number
  growthRate: number
  latestDate?: string
  previousDate?: string
}

export function DashboardMetrics() {
  const [metrics, setMetrics] = useState<MetricsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch('/api/metrics/summary')
        const data = await response.json()
        setMetrics(data)
      } catch (error) {
        console.error('Failed to fetch metrics:', error)
        // Set fallback mock data
        setMetrics({
          totalCitations: 0,
          growthRate: 0,
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchMetrics()
  }, [])

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const metricCards = [
    {
      title: 'Total Citations',
      value: metrics?.totalCitations || 0,
      icon: Link2,
      format: 'number',
    },
    {
      title: 'Growth Rate',
      value: metrics?.growthRate || 0,
      icon: TrendingUp,
      format: 'percentage',
    },
  ]

  const formatValue = (value: number, format: string) => {
    switch (format) {
      case 'percentage':
        return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`
      default:
        return value.toLocaleString()
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {metricCards.map((metric, index) => {
        const Icon = metric.icon

        return (
          <Card key={index} className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {metric.title}
              </CardTitle>
              <Icon className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {formatValue(metric.value, metric.format)}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}