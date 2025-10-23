'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { format, parseISO } from 'date-fns'
import { CHART_COLORS } from '@/lib/chart-colors'

interface ClusterData {
  date: string
  [cluster: string]: string | number
}

export function ClusterChart() {
  const [data, setData] = useState<ClusterData[]>([])
  const [clusters, setClusters] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchClusterData = async () => {
      try {
        const response = await fetch('/api/metrics/clusters')
        const result = await response.json()

        if (Array.isArray(result) && result.length > 0) {
          setData(result)

          // Extract all unique cluster names from the data
          const clusterSet = new Set<string>()
          result.forEach(item => {
            Object.keys(item).forEach(key => {
              if (key !== 'date') {
                clusterSet.add(key)
              }
            })
          })
          setClusters(Array.from(clusterSet))
        } else {
          console.error('API returned non-array or empty data:', result)
          setData(generateFallbackClusterData())
          setClusters(['Cluster A', 'Cluster B', 'Cluster C'])
        }
      } catch (error) {
        console.error('Failed to fetch cluster data:', error)
        setData(generateFallbackClusterData())
        setClusters(['Cluster A', 'Cluster B', 'Cluster C'])
      } finally {
        setIsLoading(false)
      }
    }

    fetchClusterData()
  }, [])

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Citations by Prompt Clusters</CardTitle>
          <CardDescription>Brand citations grouped by prompt type</CardDescription>
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
        <CardTitle className="text-brand-navy">Citations by Prompt Clusters</CardTitle>
        <CardDescription>
          Distribution of Anduin citations across prompt types
        </CardDescription>
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

function generateFallbackClusterData(): ClusterData[] {
  const data: ClusterData[] = []
  const now = new Date()

  // Generate 12 dates of data
  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000)
    data.push({
      date: date.toISOString().split('T')[0],
      'Cluster A': Math.floor(Math.random() * 8) + 2,
      'Cluster B': Math.floor(Math.random() * 6) + 1,
      'Cluster C': Math.floor(Math.random() * 5) + 1,
    })
  }

  return data
}
