'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { format, parseISO } from 'date-fns'
import { CHART_COLORS } from '@/lib/chart-colors'

interface ClusterData {
  date: string
  [cluster: string]: string | number
}

interface GoogleAIModeClusterChartProps {
  dateFilter?: string
}

export function GoogleAIModeClusterChart({ dateFilter = 'all' }: GoogleAIModeClusterChartProps) {
  const [data, setData] = useState<ClusterData[]>([])
  const [clusters, setClusters] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchClusterData()
  }, [dateFilter])

  const fetchClusterData = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        platform: 'Google AI Mode',
        date: dateFilter
      })
      const response = await fetch(`/api/analytics/brand?${params}`)
      const result = await response.json()

      if (result.promptClusters && Array.isArray(result.promptClusters) && result.promptClusters.length > 0) {
        setData(result.promptClusters)

        // Extract all unique cluster names from the data
        const clusterSet = new Set<string>()
        result.promptClusters.forEach((item: any) => {
          Object.keys(item).forEach(key => {
            if (key !== 'date') {
              clusterSet.add(key)
            }
          })
        })
        setClusters(Array.from(clusterSet))
      } else {
        setData([])
        setClusters([])
      }
    } catch (error) {
      console.error('Failed to fetch Google AI Mode cluster data:', error)
      setData([])
      setClusters([])
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Anduin GG AI Mode Citation Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-navy"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const formatXAxisLabel = (tickItem: string) => {
    try {
      return format(parseISO(tickItem), 'MMM dd')
    } catch {
      return tickItem
    }
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const total = payload.reduce((sum: number, entry: any) => sum + (entry.value || 0), 0)
      return (
        <div className="bg-white p-3 border rounded shadow-lg">
          <p className="font-medium mb-2 text-xs">{formatXAxisLabel(label)}</p>
          {payload.reverse().map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-xs">
              {entry.name}: {entry.value}
            </p>
          ))}
          <p className="font-medium text-xs mt-2 pt-2 border-t">
            Total: {total}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-brand-navy">Anduin GG AI Mode Citation Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={data} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis
              dataKey="date"
              tickFormatter={formatXAxisLabel}
              className="text-xs"
            />
            <YAxis className="text-xs" />
            <Tooltip content={<CustomTooltip />} />
            {clusters.map((cluster, index) => (
              <Area
                key={cluster}
                type="monotone"
                dataKey={cluster}
                stackId="1"
                stroke={CHART_COLORS[index % CHART_COLORS.length]}
                fill={CHART_COLORS[index % CHART_COLORS.length]}
                fillOpacity={0.6}
                name={cluster}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
