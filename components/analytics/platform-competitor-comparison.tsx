'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { format, parseISO } from 'date-fns'
import { CHART_COLORS } from '@/lib/chart-colors'

interface CompetitiveData {
  date: string
  [entity: string]: string | number
}

interface PlatformCompetitorComparisonProps {
  platform: string
  dateFilter?: string
}

export function PlatformCompetitorComparison({ platform, dateFilter = 'all' }: PlatformCompetitorComparisonProps) {
  const [data, setData] = useState<CompetitiveData[]>([])
  const [entities, setEntities] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchCompetitorData()
  }, [platform, dateFilter])

  const fetchCompetitorData = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        platform: platform,
        date: dateFilter
      })

      const response = await fetch(`/api/analytics/platform-competitive?${params}`)
      const result = await response.json()

      if (Array.isArray(result) && result.length > 0) {
        setData(result)

        // Extract all unique entity names and calculate total citations
        const entityTotals = new Map<string, number>()
        result.forEach(item => {
          Object.keys(item).forEach(key => {
            if (key !== 'date') {
              const currentTotal = entityTotals.get(key) || 0
              entityTotals.set(key, currentTotal + (Number(item[key]) || 0))
            }
          })
        })

        // Sort entities: Anduin first, then by total citations (highest to lowest)
        const entityList = Array.from(entityTotals.keys()).sort((a, b) => {
          // Always put Anduin first
          if (a === 'Anduin') return -1
          if (b === 'Anduin') return 1

          // Sort others by total citations (descending)
          const totalA = entityTotals.get(a) || 0
          const totalB = entityTotals.get(b) || 0
          return totalB - totalA
        })
        setEntities(entityList)
      } else {
        setData([])
        setEntities([])
      }
    } catch (error) {
      console.error('Failed to fetch platform competitor data:', error)
      setData([])
      setEntities([])
    } finally {
      setIsLoading(false)
    }
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
              {entry.name}: {entry.value} citations
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Appearance ranking - Anduin vs Competitors</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-navy"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (data.length === 0 || entities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-brand-navy">Appearance ranking - Anduin vs Competitors</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center text-gray-500">
            <p>No competitive data available for {platform}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-brand-navy">Appearance ranking - Anduin vs Competitors</CardTitle>
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
            {entities.map((entity, index) => (
              <Line
                key={entity}
                type="monotone"
                dataKey={entity}
                stroke={CHART_COLORS[index % CHART_COLORS.length]}
                strokeWidth={entity === 'Anduin' ? 3 : 2}
                dot={{ fill: CHART_COLORS[index % CHART_COLORS.length], r: entity === 'Anduin' ? 5 : 4 }}
                name={entity}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
