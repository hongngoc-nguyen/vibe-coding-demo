'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { PlatformCompetitorComparison } from './platform-competitor-comparison'
import { CHART_COLORS } from '@/lib/chart-colors'

interface PlatformInsightsProps {
  platform: string
}

export function PlatformInsights({ platform }: PlatformInsightsProps) {
  const [dateRange, setDateRange] = useState('30')
  const [data, setData] = useState<any>({
    metrics: { totalCitations: 0, growthRate: 0 },
    promptClusters: []
  })
  const [isLoading, setIsLoading] = useState(true)

  // Chart refs for PDF export
  const clusterChartRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchPlatformData()
  }, [dateRange, platform])

  const fetchPlatformData = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        days: dateRange,
        platform: platform
      })

      const response = await fetch(`/api/analytics/platform?${params}`)
      const result = await response.json()
      setData(result)
    } catch (error) {
      console.error('Failed to fetch platform data:', error)
      setData({
        metrics: { totalCitations: 0, growthRate: 0 },
        promptClusters: []
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getDateRangeText = () => {
    const days = parseInt(dateRange)
    if (days === 7) return 'vs last 7 days'
    if (days === 30) return 'vs last 30 days'
    if (days === 90) return 'vs last 90 days'
    return 'vs previous period'
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded shadow-lg">
          <p className="font-medium mb-2 text-xs">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-xs">
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
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
    )
  }

  return (
    <div className="space-y-6">
      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Citations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.metrics.totalCitations}</div>
            <Badge variant="secondary" className="mt-1">
              Last {dateRange} days
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
              {getDateRangeText()}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6">
        {/* Prompt Clusters */}
        <Card>
          <CardHeader>
            <CardTitle>Prompt Clusters</CardTitle>
            <CardDescription>Citation distribution across prompt types on {platform}</CardDescription>
          </CardHeader>
          <CardContent>
            <div ref={clusterChartRef}>
              {data.promptClusters.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={data.promptClusters}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip content={<CustomTooltip />} />
                    {(() => {
                      const clusterNames = new Set<string>()
                      data.promptClusters.forEach((item: any) => {
                        Object.keys(item).forEach(key => {
                          if (key !== 'date') {
                            clusterNames.add(key)
                          }
                        })
                      })

                      return Array.from(clusterNames).map((cluster, idx) => (
                        <Bar
                          key={cluster}
                          dataKey={cluster}
                          stackId="a"
                          fill={CHART_COLORS[idx % CHART_COLORS.length]}
                          name={cluster}
                        />
                      ))
                    })()}
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[320px] flex items-center justify-center text-gray-500">
                  No prompt cluster data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Brand vs. Competitors Chart */}
        <PlatformCompetitorComparison platform={platform} />
      </div>
    </div>
  )
}
