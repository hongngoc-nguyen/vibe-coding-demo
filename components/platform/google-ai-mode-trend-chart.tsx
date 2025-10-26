'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { format, parseISO } from 'date-fns'
import { BRAND_COLOR } from '@/lib/chart-colors'

interface TrendData {
  date: string
  citations: number
}

interface GoogleAIModeTrendChartProps {
  dateFilter?: string
}

export function GoogleAIModeTrendChart({ dateFilter = 'all' }: GoogleAIModeTrendChartProps) {
  const [data, setData] = useState<TrendData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchTrendData()
  }, [dateFilter])

  const fetchTrendData = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        platform: 'Google AI Mode',
        date: dateFilter
      })
      const response = await fetch(`/api/analytics/brand?${params}`)
      const result = await response.json()

      // The API returns uniqueCitationChart with brandCitations field
      if (result.uniqueCitationChart && Array.isArray(result.uniqueCitationChart)) {
        // Transform the data to match our expected format
        const transformedData = result.uniqueCitationChart.map((item: any) => ({
          date: item.date,
          citations: item.brandCitations
        }))
        setData(transformedData)
      } else {
        setData([])
      }
    } catch (error) {
      console.error('Failed to fetch Google AI Mode trend data:', error)
      setData([])
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Anduin GG AI Mode Appearance Over Time</CardTitle>
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
        <CardTitle className="text-brand-navy">Anduin GG AI Mode Appearance Over Time</CardTitle>
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
