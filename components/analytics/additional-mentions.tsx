'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export function AdditionalMentions() {
  const [citationDateFilter, setCitationDateFilter] = useState('all')
  const [citationPlatformFilter, setCitationPlatformFilter] = useState('all')
  const [data, setData] = useState<any>({
    citations: [],
    availableDates: [],
    availablePlatforms: []
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchAdditionalData()
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
        availableDates: [],
        availablePlatforms: []
      })
    } finally {
      setIsLoading(false)
    }
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
        <CardTitle>Additional Mentions Citation Sources</CardTitle>
        <CardDescription>All additional mentions citations with counts and filters</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
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
              data.citations.map((citation: any, index: number) => (
                <TableRow key={index}>
                  <TableCell className="font-mono">
                    <Badge variant="outline">{citation.count}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    {citation.canonical_name}
                  </TableCell>
                  <TableCell className="text-sm max-w-md truncate">
                    {citation.url}
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
      </CardContent>
    </Card>
  )
}
