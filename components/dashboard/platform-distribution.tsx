'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

export function PlatformDistribution() {
  const [data, setData] = useState<any>({
    platformDistribution: [],
    availablePlatforms: []
  })
  const [isLoading, setIsLoading] = useState(true)
  const [visiblePlatforms, setVisiblePlatforms] = useState<Set<string>>(new Set())

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
      // Initialize all platforms as visible
      setVisiblePlatforms(new Set(result.availablePlatforms || []))
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

  const togglePlatform = (platform: string) => {
    setVisiblePlatforms(prev => {
      const newSet = new Set(prev)
      if (newSet.has(platform)) {
        newSet.delete(platform)
      } else {
        newSet.add(platform)
      }
      return newSet
    })
  }

  const calculatePlatformTotal = (platform: string) => {
    return data.platformDistribution.reduce((sum: number, item: any) => {
      return sum + (item[platform] || 0)
    }, 0)
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

  const platformColors = ['#162950', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']

  return (
    <Card>
      <CardHeader>
        <CardTitle>Platform Distribution</CardTitle>
        <CardDescription>Anduin's appearance across platforms</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={data.platformDistribution}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey="date" className="text-xs" />
            <YAxis className="text-xs" />
            <Tooltip content={<CustomTooltip />} />
            {data.availablePlatforms.map((platform: string, idx: number) =>
              visiblePlatforms.has(platform) && (
                <Line
                  key={platform}
                  type="monotone"
                  dataKey={platform}
                  stroke={platformColors[idx % platformColors.length]}
                  name={platform}
                  strokeWidth={2}
                />
              )
            )}
          </LineChart>
        </ResponsiveContainer>

        {/* Custom Interactive Legend */}
        <div className="mt-6 space-y-2">
          {data.availablePlatforms.map((platform: string, idx: number) => {
            const total = calculatePlatformTotal(platform)
            const color = platformColors[idx % platformColors.length]

            return (
              <div
                key={platform}
                className="flex items-center justify-between p-2 rounded hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  <Checkbox
                    checked={visiblePlatforms.has(platform)}
                    onCheckedChange={() => togglePlatform(platform)}
                    className="data-[state=checked]:bg-[#162950] data-[state=checked]:border-[#162950]"
                  />
                  <div
                    className="flex items-center gap-2 cursor-pointer"
                    onClick={() => togglePlatform(platform)}
                  >
                    <div
                      className="w-8 h-0.5 rounded"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-sm font-medium text-gray-700">{platform}</span>
                  </div>
                </div>
                <span className="text-sm font-bold text-gray-900 tabular-nums">
                  {total.toLocaleString()}
                </span>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
