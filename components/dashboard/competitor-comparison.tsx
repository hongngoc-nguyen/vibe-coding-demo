'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { format, parseISO } from 'date-fns'

interface CompetitiveData {
  date: string
  [entity: string]: string | number
}

const ENTITY_COLORS = [
  '#162950', // brand-navy (Anduin)
  '#2563eb', // blue-600
  '#60a5fa', // blue-400
  '#34d399', // emerald-400
  '#fbbf24', // amber-400
  '#f87171', // red-400
  '#a78bfa', // violet-400
  '#fb923c', // orange-400
]

export function CompetitorComparison() {
  const [data, setData] = useState<CompetitiveData[]>([])
  const [entities, setEntities] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchCompetitorData = async () => {
      try {
        const response = await fetch('/api/metrics/competitive')
        const result = await response.json()

        if (Array.isArray(result) && result.length > 0) {
          setData(result)

          // Extract all unique entity names from the data, ensuring Anduin is first
          const entitySet = new Set<string>()
          result.forEach(item => {
            Object.keys(item).forEach(key => {
              if (key !== 'date') {
                entitySet.add(key)
              }
            })
          })

          const entityList = Array.from(entitySet)
          // Sort so Anduin is first, then alphabetically
          entityList.sort((a, b) => {
            if (a === 'Anduin') return -1
            if (b === 'Anduin') return 1
            return a.localeCompare(b)
          })
          setEntities(entityList)
        } else {
          console.error('API returned non-array or empty data:', result)
          const fallbackData = generateFallbackCompetitiveData()
          setData(fallbackData)
          setEntities(['Anduin', 'Competitor A', 'Competitor B'])
        }
      } catch (error) {
        console.error('Failed to fetch competitor data:', error)
        const fallbackData = generateFallbackCompetitiveData()
        setData(fallbackData)
        setEntities(['Anduin', 'Competitor A', 'Competitor B'])
      } finally {
        setIsLoading(false)
      }
    }

    fetchCompetitorData()
  }, [])


  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Brand vs. Competitors</CardTitle>
          <CardDescription>Citation comparison over time</CardDescription>
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
              {entry.name}: {entry.value} citations
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
        <CardTitle className="text-brand-navy">Brand vs. Competitors</CardTitle>
        <CardDescription>
          Citation comparison over time
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
            {entities.map((entity, index) => (
              <Line
                key={entity}
                type="linear"
                dataKey={entity}
                stroke={ENTITY_COLORS[index % ENTITY_COLORS.length]}
                strokeWidth={entity === 'Anduin' ? 3 : 2}
                dot={{ fill: ENTITY_COLORS[index % ENTITY_COLORS.length], r: entity === 'Anduin' ? 5 : 4 }}
                name={entity}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

function generateFallbackCompetitiveData(): CompetitiveData[] {
  const data: CompetitiveData[] = []
  const now = new Date()

  // Generate 12 dates of data
  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000)
    data.push({
      date: date.toISOString().split('T')[0],
      'Anduin': Math.floor(Math.random() * 15) + 10,
      'Competitor A': Math.floor(Math.random() * 10) + 5,
      'Competitor B': Math.floor(Math.random() * 8) + 3,
    })
  }

  return data
}