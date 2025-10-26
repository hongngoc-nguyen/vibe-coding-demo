'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { format, parseISO } from 'date-fns'
import { CHART_COLORS } from '@/lib/chart-colors'

interface ClusterData {
  date: string
  [cluster: string]: string | number
}

interface GoogleSearchClusterChartProps {
  data?: any[]
}

export function GoogleSearchClusterChart({ data = [] }: GoogleSearchClusterChartProps) {
  // Extract all unique cluster names from the data
  const clusters = useMemo(() => {
    if (!data || !Array.isArray(data) || data.length === 0) return []

    const clusterSet = new Set<string>()
    data.forEach((item: any) => {
      Object.keys(item).forEach(key => {
        if (key !== 'date') {
          clusterSet.add(key)
        }
      })
    })
    return Array.from(clusterSet)
  }, [data])

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
        <CardTitle className="text-brand-navy">Anduin GG Search Citation Over Time</CardTitle>
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
