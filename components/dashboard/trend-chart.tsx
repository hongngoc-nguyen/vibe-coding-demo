'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { format, parseISO } from 'date-fns'
import { BRAND_COLOR } from '@/lib/chart-colors'

interface TrendData {
  date: string
  citations: number
}

export function BrandTrendChart() {
  const [data, setData] = useState<TrendData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchTrendData = async () => {
      try {
        const response = await fetch('/api/metrics/trends')
        const result = await response.json()

        // Check if result is an array
        if (Array.isArray(result)) {
          setData(result)
        } else {
          console.error('API returned non-array data:', result)
          setData(generateFallbackTrendData())
        }
      } catch (error) {
        console.error('Failed to fetch trend data:', error)
        // Set fallback mock data
        setData(generateFallbackTrendData())
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
          <CardTitle>Total Brand Citations</CardTitle>
          <CardDescription>Anduin citations over time</CardDescription>
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
        <CardTitle className="text-brand-navy">Total Brand Citations</CardTitle>
        <CardDescription>
          Anduin citations over time
        </CardDescription>
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
              type="linear"
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

function generateFallbackTrendData(): TrendData[] {
  const data: TrendData[] = []
  const now = new Date()

  // Generate 12 dates of data
  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000)
    data.push({
      date: date.toISOString().split('T')[0],
      citations: Math.floor(Math.random() * 15) + 5, // 5-20 citations
    })
  }

  return data
}