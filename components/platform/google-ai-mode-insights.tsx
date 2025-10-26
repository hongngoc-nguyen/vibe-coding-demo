'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { PlatformCompetitorComparison } from '../analytics/platform-competitor-comparison'
import { BRAND_COLOR, NEUTRAL_COLOR } from '@/lib/chart-colors'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { UrlPreview } from '../analytics/url-preview'

interface GoogleAIModeInsightsProps {
  dateFilter?: string
}

export function GoogleAIModeInsights({ dateFilter = 'all' }: GoogleAIModeInsightsProps) {
  const [data, setData] = useState<any>({
    uniqueCitationChart: [],
    citations: []
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchPlatformData()
  }, [dateFilter])

  const fetchPlatformData = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        platform: 'Google AI Mode',
        date: dateFilter
      })

      const response = await fetch(`/api/analytics/brand?${params}`)
      const result = await response.json()
      setData(result)
    } catch (error) {
      console.error('Failed to fetch platform data:', error)
      setData({
        uniqueCitationChart: [],
        citations: []
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
      <div className="grid grid-cols-1 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6">
        {/* Brand Appearance Over Time */}
        <Card>
          <CardHeader>
            <CardTitle>Brand Appearance Over Time</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Responses containing brand citations vs total responses over time</p>
          </CardHeader>
          <CardContent>
            {data.uniqueCitationChart && data.uniqueCitationChart.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={data.uniqueCitationChart}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="brandCitations" fill={BRAND_COLOR} name="Brand appearance" />
                  <Bar dataKey="totalResponses" fill={NEUTRAL_COLOR} name="Total responses" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[320px] flex items-center justify-center text-gray-500">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Anduin vs. Competitors */}
        <PlatformCompetitorComparison platform="Google AI Mode" />

        {/* Pages appearing on Google AI Mode */}
        <Card>
          <CardHeader>
            <CardTitle>Pages appearing on Google AI Mode</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Count</TableHead>
                  <TableHead>URL</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.citations && data.citations.length > 0 ? (
                  data.citations.map((citation: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell className="font-mono">
                        <Badge variant="outline">{citation.count}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        <UrlPreview url={citation.url} />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-gray-500">
                      No citations available
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
