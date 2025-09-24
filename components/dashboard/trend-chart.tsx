'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { format, parseISO } from 'date-fns'

interface TrendData {
  week: string
  mentions: number
  citations: number
  platform: string
}

export function BrandTrendChart() {
  const [data, setData] = useState<TrendData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchTrendData = async () => {
      try {
        const response = await fetch('/api/metrics/trends')
        const result = await response.json()
        setData(result)
      } catch (error) {
        console.error('Failed to fetch trend data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTrendData()
  }, [])

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Brand Mention Trends</CardTitle>
          <CardDescription>Weekly performance across platforms</CardDescription>
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
          <p className="font-medium">{formatXAxisLabel(label)}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.dataKey === 'mentions' ? 'Mentions' : 'Citations'}: {entry.value}
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
        <CardTitle className="heading text-brand-navy">Brand Mention Trends</CardTitle>
        <CardDescription>
          Weekly Anduin mentions and citations across AI platforms
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis
              dataKey="week"
              tickFormatter={formatXAxisLabel}
              className="text-xs"
            />
            <YAxis className="text-xs" />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="mentions"
              stroke="#162950"
              strokeWidth={2}
              dot={{ fill: '#162950', r: 4 }}
              name="Mentions"
            />
            <Line
              type="monotone"
              dataKey="citations"
              stroke="#60a5fa"
              strokeWidth={2}
              dot={{ fill: '#60a5fa', r: 4 }}
              name="Citations"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}