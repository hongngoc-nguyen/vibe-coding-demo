'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from 'recharts'
import { Download, Filter, Calendar, FileText, ExternalLink } from 'lucide-react'
import { exportToCSV, exportToPDF } from '@/lib/export-utils'
import { toast } from 'sonner'
import { UrlPreview } from './url-preview'
import { CHART_COLORS, BRAND_COLOR, NEUTRAL_COLOR } from '@/lib/chart-colors'

export function BrandInsights() {
  const [dateRange, setDateRange] = useState('30')
  const [citationDateFilter, setCitationDateFilter] = useState('all')
  const [citationPlatformFilter, setCitationPlatformFilter] = useState('all')
  const [data, setData] = useState<any>({
    metrics: { totalCitations: 0, growthRate: 0 },
    uniqueCitationChart: [],
    platformDistribution: [],
    promptClusters: [],
    citations: [],
    availableDates: [],
    availablePlatforms: []
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)

  // Chart refs for PDF export
  const uniqueCitationChartRef = useRef<HTMLDivElement>(null)
  const platformChartRef = useRef<HTMLDivElement>(null)
  const clusterChartRef = useRef<HTMLDivElement>(null)
  const citationsTableRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchBrandData()
  }, [dateRange, citationDateFilter, citationPlatformFilter])

  const fetchBrandData = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        days: dateRange,
        date: citationDateFilter,
        platform: citationPlatformFilter
      })

      const response = await fetch(`/api/analytics/brand?${params}`)
      const result = await response.json()
      setData(result)
    } catch (error) {
      console.error('Failed to fetch brand data:', error)
      setData({
        metrics: { totalCitations: 0, growthRate: 0 },
        uniqueCitationChart: [],
        platformDistribution: [],
        promptClusters: [],
        citations: [],
        availableDates: [],
        availablePlatforms: []
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
      const filename = `brand-insights-${new Date().toISOString().split('T')[0]}`
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
      const filename = `brand-insights-report-${new Date().toISOString().split('T')[0]}`
      const chartRefs = {
        platformChart: platformChartRef,
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
        {/* Unique Citation Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Unique Brand Citations</CardTitle>
            <CardDescription>Responses containing brand citations vs total responses over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div ref={uniqueCitationChartRef}>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={data.uniqueCitationChart}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="brandCitations" stackId="a" fill={BRAND_COLOR} name="With Brand Citations" />
                  <Bar dataKey="totalResponses" stackId="a" fill={NEUTRAL_COLOR} name="Without Brand Citations" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Prompt Clusters */}
        <Card>
          <CardHeader>
            <CardTitle>Prompt Clusters</CardTitle>
            <CardDescription>Brand citations distribution across prompt types</CardDescription>
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
                      // Extract all unique cluster names from the data
                      const clusterNames = new Set<string>()
                      data.promptClusters.forEach((item: any) => {
                        Object.keys(item).forEach(key => {
                          if (key !== 'date') {
                            clusterNames.add(key)
                          }
                        })
                      })

                      // Render a bar for each cluster
                      return Array.from(clusterNames).map((cluster, idx) => (
                        <Bar
                          key={cluster}
                          dataKey={cluster}
                          stackId="a"
                          fill={CHART_COLORS[idx % CHART_COLORS.length]}
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
            <CardDescription>All brand citations with counts</CardDescription>
          </CardHeader>
          <CardContent>
            <div ref={citationsTableRef}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Count</TableHead>
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
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}