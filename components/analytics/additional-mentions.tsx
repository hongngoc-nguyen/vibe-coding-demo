'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { UrlPreview } from './url-preview'
import { BRAND_COLOR } from '@/lib/chart-colors'

export function AdditionalMentions() {
  const [citationDateFilter, setCitationDateFilter] = useState('all')
  const [citationPlatformFilter, setCitationPlatformFilter] = useState('all')
  const [data, setData] = useState<any>({
    citations: [],
    topEntities: [],
    availableDates: [],
    availablePlatforms: []
  })
  const [isLoading, setIsLoading] = useState(true)
  const [displayLimit, setDisplayLimit] = useState(100)

  useEffect(() => {
    fetchAdditionalData()
    setDisplayLimit(100) // Reset display limit when filters change
  }, [citationDateFilter, citationPlatformFilter])

  const fetchAdditionalData = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        date: citationDateFilter,
        platform: citationPlatformFilter
      })

      const response = await fetch(`/api/analytics/additional?${params}`)
      const result = await response.json()
      setData(result)
    } catch (error) {
      console.error('Failed to fetch additional mentions data:', error)
      setData({
        citations: [],
        topEntities: [],
        availableDates: [],
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
              Citations: {entry.value}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card className="animate-pulse">
          <CardContent className="pt-6">
            <div className="h-20 bg-gray-200 rounded"></div>
          </CardContent>
        </Card>
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-gray-200 rounded"></div>
          </CardContent>
        </Card>
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-gray-200 rounded"></div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Filter by Date</label>
              <Select value={citationDateFilter} onValueChange={setCitationDateFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Dates</SelectItem>
                  {data.availableDates.map((date: string) => (
                    <SelectItem key={date} value={date}>{date}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Filter by Platform</label>
              <Select value={citationPlatformFilter} onValueChange={setCitationPlatformFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Platforms</SelectItem>
                  {data.availablePlatforms.map((platform: string) => (
                    <SelectItem key={platform} value={platform}>{platform}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Cited Entities Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Top Cited Web Pages in the Industry</CardTitle>
          <CardDescription>Top 20 web pages ranked by citation count from responses excluding Brand and Competitors</CardDescription>
        </CardHeader>
        <CardContent>
          {data.topEntities.length > 0 ? (
            <ResponsiveContainer width="100%" height={500}>
              <BarChart data={data.topEntities} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis type="number" className="text-xs" />
                <YAxis type="category" dataKey="entity" width={120} className="text-xs" />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="citations" fill={BRAND_COLOR} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[500px] flex items-center justify-center text-gray-500">
              No entity data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Citation Sources Table */}
      <Card>
        <CardHeader>
          <CardTitle>Citation Sources</CardTitle>
          <CardDescription>All additional mentions citations with counts and filters</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Count</TableHead>
                <TableHead className="w-[200px]">Entity</TableHead>
                <TableHead>URL</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.citations.length > 0 ? (
                data.citations.slice(0, displayLimit).map((citation: any, index: number) => (
                  <TableRow key={index}>
                    <TableCell className="font-mono">
                      <Badge variant="outline">{citation.count}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {citation.canonical_name}
                    </TableCell>
                    <TableCell className="text-sm">
                      <UrlPreview url={citation.url} />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-gray-500">
                    No citations available
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          {data.citations.length > displayLimit && (
            <div className="mt-4 flex justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => setDisplayLimit(prev => prev + 50)}
              >
                Load More 50 ({data.citations.length - displayLimit} remaining)
              </Button>
              <Button
                variant="default"
                onClick={() => setDisplayLimit(data.citations.length)}
              >
                Show All ({data.citations.length} total)
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
