'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export function PlatformDistribution() {
  const [data, setData] = useState<any>({
    platformDistribution: [],
    availablePlatforms: []
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchPlatformData()
  }, [])

  const fetchPlatformData = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/analytics/brand?days=30&date=all&platform=all')
      const result = await response.json()
      setData({
        platformDistribution: result.platformDistribution || [],
        availablePlatforms: result.availablePlatforms || []
      })
    } catch (error) {
      console.error('Failed to fetch platform data:', error)
      setData({
        platformDistribution: [],
        availablePlatforms: []
      })
    } finally {
      setIsLoading(false)
    }
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
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-gray-200 rounded"></div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Platform Distribution</CardTitle>
        <CardDescription>Brand citations breakdown by platform over time</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={data.platformDistribution}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey="date" className="text-xs" />
            <YAxis className="text-xs" />
            <Tooltip content={<CustomTooltip />} />
            {data.availablePlatforms.map((platform: string, idx: number) => (
              <Line
                key={platform}
                type="monotone"
                dataKey={platform}
                stroke={['#162950', '#3b82f6', '#10b981', '#f59e0b'][idx % 4]}
                name={platform}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
