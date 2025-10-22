'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Download } from 'lucide-react'
import { exportToCSV, exportToPDF } from '@/lib/export-utils'
import { toast } from 'sonner'

interface PlatformInsightsProps {
  platform: string
}

export function PlatformInsights({ platform }: PlatformInsightsProps) {
  const [dateRange, setDateRange] = useState('30')
  const [citationDateFilter, setCitationDateFilter] = useState('all')
  const [data, setData] = useState<any>({
    metrics: { totalCitations: 0, growthRate: 0 },
    entityDistribution: [],
    promptClusters: [],
    citations: [],
    availableDates: [],
    availableEntities: []
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)

  // Chart refs for PDF export
  const entityChartRef = useRef<HTMLDivElement>(null)
  const clusterChartRef = useRef<HTMLDivElement>(null)
  const citationsTableRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchPlatformData()
  }, [dateRange, citationDateFilter, platform])

  const fetchPlatformData = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        days: dateRange,
        date: citationDateFilter,
        platform: platform
      })

      const response = await fetch(`/api/analytics/platform?${params}`)
      const result = await response.json()
      setData(result)
    } catch (error) {
      console.error('Failed to fetch platform data:', error)
      setData({
        metrics: { totalCitations: 0, growthRate: 0 },
        entityDistribution: [],
        promptClusters: [],
        citations: [],
        availableDates: [],
        availableEntities: []
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getDateRangeText = () => {
    const days = parseInt(dateRange)
    if (days === 7) return 'vs last 7 days'
    if (days === 30) return 'vs last 30 days'
    if (days === 90) return 'vs last 90 days'
    return 'vs previous period'
  }

  const handleExportCSV = async () => {
    setIsExporting(true)
    try {
      const filename = `platform-${platform}-${new Date().toISOString().split('T')[0]}`
      await exportToCSV(data, filename)
      toast.success('Data exported to CSV successfully!')
    } catch (error) {
      console.error('Export failed:', error)
      toast.error('Failed to export data')
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportPDF = async () => {
    setIsExporting(true)
    try {
      const filename = `platform-${platform}-report-${new Date().toISOString().split('T')[0]}`
      const chartRefs = {
        entityChart: entityChartRef,
        clusterChart: clusterChartRef,
        citationsTable: citationsTableRef
      }
      await exportToPDF(data, filename, chartRefs)
      toast.success('Report exported to PDF successfully!')
    } catch (error) {
      console.error('PDF export failed:', error)
      toast.error('Failed to export PDF report')
    } finally {
      setIsExporting(false)
    }
  }

  const COLORS = ['#162950', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6']

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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
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
      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Citations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.metrics.totalCitations}</div>
            <Badge variant="secondary" className="mt-1">
              Last {dateRange} days
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Growth Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.metrics.growthRate}%</div>
            <Badge variant="default" className="mt-1">
              {getDateRangeText()}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6">
        {/* Entity Distribution Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Entity Distribution</CardTitle>
            <CardDescription>Citations by entity over time on {platform}</CardDescription>
          </CardHeader>
          <CardContent>
            <div ref={entityChartRef}>
              {data.entityDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={data.entityDistribution}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip content={<CustomTooltip />} />
                    {(() => {
                      const entityNames = new Set<string>()
                      data.entityDistribution.forEach((item: any) => {
                        Object.keys(item).forEach(key => {
                          if (key !== 'date') {
                            entityNames.add(key)
                          }
                        })
                      })

                      return Array.from(entityNames).map((entity, idx) => (
                        <Bar
                          key={entity}
                          dataKey={entity}
                          stackId="a"
                          fill={COLORS[idx % COLORS.length]}
                          name={entity}
                        />
                      ))
                    })()}
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[320px] flex items-center justify-center text-gray-500">
                  No entity distribution data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Prompt Clusters */}
        <Card>
          <CardHeader>
            <CardTitle>Prompt Clusters</CardTitle>
            <CardDescription>Citation distribution across prompt types on {platform}</CardDescription>
          </CardHeader>
          <CardContent>
            <div ref={clusterChartRef}>
              {data.promptClusters.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={data.promptClusters}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip content={<CustomTooltip />} />
                    {(() => {
                      const clusterNames = new Set<string>()
                      data.promptClusters.forEach((item: any) => {
                        Object.keys(item).forEach(key => {
                          if (key !== 'date') {
                            clusterNames.add(key)
                          }
                        })
                      })

                      return Array.from(clusterNames).map((cluster, idx) => (
                        <Bar
                          key={cluster}
                          dataKey={cluster}
                          stackId="a"
                          fill={COLORS[idx % COLORS.length]}
                          name={cluster}
                        />
                      ))
                    })()}
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[320px] flex items-center justify-center text-gray-500">
                  No prompt cluster data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Citations Table */}
        <Card>
          <CardHeader>
            <CardTitle>Citation Sources</CardTitle>
            <CardDescription>All citations on {platform} with counts and entity info</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
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
            <div ref={citationsTableRef}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Count</TableHead>
                    <TableHead className="w-[150px]">Entity</TableHead>
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
                        <TableCell className="text-sm">
                          <Badge>{citation.entity}</Badge>
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
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
