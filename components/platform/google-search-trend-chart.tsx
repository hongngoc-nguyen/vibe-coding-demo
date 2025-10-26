'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { format, parseISO } from 'date-fns'
import { BRAND_COLOR } from '@/lib/chart-colors'

interface TrendData {
  date: string
  citations: number
}

interface GoogleSearchTrendChartProps {
  data?: any[]
}

export function GoogleSearchTrendChart({ data: rawData = [] }: GoogleSearchTrendChartProps) {
  // Transform the data to match our expected format
  const data = useMemo(() => {
    if (!rawData || !Array.isArray(rawData)) return []
    return rawData.map((item: any) => ({
      date: item.date,
      citations: item.brandCitations || 0
    }))
  }, [rawData])

  const formatXAxisLabel = (tickItem: string) => {
    try {
      return format(parseISO(tickItem), 'MMM dd')
    } catch {
      return tickItem
    }
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded shadow-lg">
          <p className="font-medium mb-2 text-xs">{formatXAxisLabel(label)}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-xs">
              Citations: {entry.value}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-brand-navy">Anduin GG Search Appearance Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={data} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis
              dataKey="date"
              tickFormatter={formatXAxisLabel}
              className="text-xs"
            />
            <YAxis className="text-xs" />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="citations"
              stroke={BRAND_COLOR}
              strokeWidth={2}
              dot={{ fill: BRAND_COLOR, r: 4 }}
              name="Citations"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
