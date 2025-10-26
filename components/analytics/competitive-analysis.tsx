'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { UrlPreview } from './url-preview'
import { PlatformCompetitorComparison } from './platform-competitor-comparison'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export function CompetitiveAnalysis() {
  const [dateFilter, setDateFilter] = useState('all')
  const [platformFilter, setPlatformFilter] = useState('all')
  const [selectedCompetitors, setSelectedCompetitors] = useState<string[]>([])
  const [data, setData] = useState<any>({
    citations: [],
    availableDates: [],
    availablePlatforms: [],
    availableCompetitors: []
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchCompetitiveData()
  }, [dateFilter, platformFilter, selectedCompetitors])

  const fetchCompetitiveData = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        date: dateFilter,
        platform: platformFilter,
        competitors: selectedCompetitors.length > 0 ? selectedCompetitors.join(',') : 'all'
      })

      const response = await fetch(`/api/analytics/competitors?${params}`)
      const result = await response.json()
      setData(result)
    } catch (error) {
      console.error('Failed to fetch competitor data:', error)
      setData({
        citations: [],
        availableDates: [],
        availablePlatforms: [],
        availableCompetitors: []
      })
    } finally {
      setIsLoading(false)
    }
  }

  const toggleCompetitor = (competitor: string) => {
    setSelectedCompetitors(prev =>
      prev.includes(competitor)
        ? prev.filter(c => c !== competitor)
        : [...prev, competitor]
    )
  }

  const clearCompetitors = () => {
    setSelectedCompetitors([])
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
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
      {/* Global Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Filter by Date</label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
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
              <Select value={platformFilter} onValueChange={setPlatformFilter}>
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
            <div className="space-y-2">
              <label className="text-sm font-medium">Filter by Competitor</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between"
                  >
                    {selectedCompetitors.length === 0
                      ? "All Competitors"
                      : `${selectedCompetitors.length} selected`}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <div className="max-h-[300px] overflow-auto p-2">
                    {selectedCompetitors.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start mb-2"
                        onClick={clearCompetitors}
                      >
                        Clear all
                      </Button>
                    )}
                    {data.availableCompetitors.map((competitor: string) => (
                      <div
                        key={competitor}
                        className={cn(
                          "flex items-center space-x-2 px-2 py-1.5 cursor-pointer hover:bg-accent rounded-sm",
                          selectedCompetitors.includes(competitor) && "bg-accent"
                        )}
                        onClick={() => toggleCompetitor(competitor)}
                      >
                        <div className={cn(
                          "flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                          selectedCompetitors.includes(competitor)
                            ? "bg-primary text-primary-foreground"
                            : "opacity-50"
                        )}>
                          {selectedCompetitors.includes(competitor) && (
                            <Check className="h-3 w-3" />
                          )}
                        </div>
                        <span className="text-sm">{competitor}</span>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Anduin vs. Competitors Chart */}
      <PlatformCompetitorComparison
        platform={platformFilter}
        dateFilter={dateFilter}
        selectedCompetitors={selectedCompetitors}
      />

      {/* Competitor Citation Sources Table */}
      <Card>
        <CardHeader>
          <CardTitle>Competitor Citation Sources</CardTitle>
          <CardDescription>All competitor citations with counts</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Count</TableHead>
                <TableHead className="w-[200px]">Competitor</TableHead>
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
        </CardContent>
      </Card>
    </div>
  )
}