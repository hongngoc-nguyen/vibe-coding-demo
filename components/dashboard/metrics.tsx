'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, Eye, Award, Link2 } from 'lucide-react'

interface MetricsData {
  totalMentions: number
  mentionTrend: number
  citations: number
  citationTrend: number
  competitiveRank: number
  rankTrend: number
  weeklyGrowth: number
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
      } finally {
        setIsLoading(false)
      }
    }

    fetchMetrics()
  }, [])

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
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
      title: 'Total Mentions',
      value: metrics?.totalMentions || 0,
      trend: metrics?.mentionTrend || 0,
      icon: Eye,
      format: 'number',
    },
    {
      title: 'Brand Citations',
      value: metrics?.citations || 0,
      trend: metrics?.citationTrend || 0,
      icon: Link2,
      format: 'number',
    },
    {
      title: 'Competitive Rank',
      value: metrics?.competitiveRank || 0,
      trend: metrics?.rankTrend || 0,
      icon: Award,
      format: 'rank',
    },
    {
      title: 'Weekly Growth',
      value: metrics?.weeklyGrowth || 0,
      trend: metrics?.weeklyGrowth || 0,
      icon: TrendingUp,
      format: 'percentage',
    },
  ]

  const formatValue = (value: number, format: string) => {
    switch (format) {
      case 'percentage':
        return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`
      case 'rank':
        return `#${value}`
      default:
        return value.toLocaleString()
    }
  }

  const getTrendColor = (trend: number, isRank = false) => {
    if (trend === 0) return 'text-gray-500'
    const isPositive = isRank ? trend < 0 : trend > 0
    return isPositive ? 'text-green-600' : 'text-red-600'
  }

  const getTrendIcon = (trend: number, isRank = false) => {
    if (trend === 0) return null
    const isPositive = isRank ? trend < 0 : trend > 0
    return isPositive ? TrendingUp : TrendingDown
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metricCards.map((metric, index) => {
        const Icon = metric.icon
        const TrendIcon = getTrendIcon(metric.trend, metric.format === 'rank')
        const trendColor = getTrendColor(metric.trend, metric.format === 'rank')

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
              {metric.trend !== 0 && (
                <div className={`flex items-center space-x-1 text-xs ${trendColor}`}>
                  {TrendIcon && <TrendIcon className="h-3 w-3" />}
                  <span>
                    {metric.format === 'rank' ? '' : metric.trend > 0 ? '+' : ''}
                    {metric.format === 'percentage' ?
                      `${metric.trend.toFixed(1)}%` :
                      metric.trend.toFixed(1)
                    } vs last week
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}