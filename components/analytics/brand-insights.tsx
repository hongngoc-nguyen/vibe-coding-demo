'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Download, Filter, Calendar, FileText, ExternalLink } from 'lucide-react'
import { exportToCSV, exportToPDF } from '@/lib/export-utils'
import { toast } from 'sonner'

interface FilterState {
  dateRange: string
  platform: string
  promptCluster: string
}

export function BrandInsights() {
  const [filters, setFilters] = useState<FilterState>({
    dateRange: '30',
    platform: 'all',
    promptCluster: 'all'
  })
  const [data, setData] = useState<any>({
    trends: [],
    platforms: [],
    clusters: [],
    citations: [],
    metrics: {}
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)

  // Chart refs for PDF export
  const platformChartRef = useRef<HTMLDivElement>(null)
  const clusterChartRef = useRef<HTMLDivElement>(null)
  const citationsTableRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchBrandData()
  }, [filters])

  const fetchBrandData = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        days: filters.dateRange,
        platform: filters.platform,
        cluster: filters.promptCluster
      })

      const response = await fetch(`/api/analytics/brand?${params}`)
      const result = await response.json()
      setData(result)
    } catch (error) {
      console.error('Failed to fetch brand data:', error)
      // Set mock data for demo
      setData({
        platforms: [
          { name: 'ChatGPT', mentions: 45, citations: 12 },
          { name: 'Google AI', mentions: 38, citations: 8 },
          { name: 'Microsoft Copilot', mentions: 23, citations: 5 }
        ],
        clusters: [
          { name: 'Brand Research', mentions: 52 },
          { name: 'Competitive Analysis', mentions: 34 },
          { name: 'Product Comparison', mentions: 20 }
        ],
        citations: [
          { url: 'https://example.com/article1', count: 15, title: 'Industry Analysis Report' },
          { url: 'https://example.com/article2', count: 12, title: 'Market Research Study' },
          { url: 'https://example.com/article3', count: 8, title: 'Competitive Landscape Review' },
          { url: 'https://example.com/article4', count: 6, title: 'Product Comparison Guide' },
          { url: 'https://example.com/article5', count: 4, title: 'Brand Analysis Deep Dive' }
        ],
        metrics: {
          uniqueMentions: 106,
          totalCitations: 45,
          growthRate: 15.2
        }
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getDateRangeText = () => {
    const days = parseInt(filters.dateRange)
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

  const COLORS = ['#162950', '#2563eb', '#60a5fa', '#bae6fd', '#4b5563', '#374151', '#475569', '#334155']

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
        <CardHeader>
          <CardTitle className="flex items-center gap-2 heading text-brand-navy">
            <Filter className="h-5 w-5 text-brand-navy" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Date Range</label>
              <Select value={filters.dateRange} onValueChange={(value) => setFilters({...filters, dateRange: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Platform</label>
              <Select value={filters.platform} onValueChange={(value) => setFilters({...filters, platform: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Platforms</SelectItem>
                  <SelectItem value="chatgpt">ChatGPT</SelectItem>
                  <SelectItem value="google-ai">Google AI</SelectItem>
                  <SelectItem value="copilot">Microsoft Copilot</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Prompt Cluster</label>
              <Select value={filters.promptCluster} onValueChange={(value) => setFilters({...filters, promptCluster: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Clusters</SelectItem>
                  <SelectItem value="brand-research">Brand Research</SelectItem>
                  <SelectItem value="competitive">Competitive Analysis</SelectItem>
                  <SelectItem value="product">Product Comparison</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <Button
                onClick={handleExportCSV}
                className="flex-1"
                disabled={isExporting}
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button
                onClick={handleExportPDF}
                variant="outline"
                className="flex-1"
                disabled={isExporting}
              >
                <FileText className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-brand-navy heading">Unique Mentions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.metrics.uniqueMentions}</div>
            <Badge variant="default" className="mt-1">
              +{data.metrics.growthRate}% {getDateRangeText()}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-brand-navy heading">Total Citations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.metrics.totalCitations}</div>
            <Badge variant="secondary" className="mt-1">
              {getDateRangeText().replace('vs ', 'in ')}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-brand-navy heading">Growth Rate</CardTitle>
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Platform Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="heading text-brand-navy">Platform Distribution</CardTitle>
            <CardDescription>Mentions across different AI platforms</CardDescription>
          </CardHeader>
          <CardContent>
            <div ref={platformChartRef}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.platforms} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis type="number" className="text-xs" />
                  <YAxis dataKey="name" type="category" className="text-xs" width={100} />
                  <Tooltip />
                  <Bar dataKey="mentions" fill="#162950" name="Mentions" />
                  <Bar dataKey="citations" fill="#60a5fa" name="Citations" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Prompt Clusters */}
        <Card>
          <CardHeader>
            <CardTitle className="heading text-brand-navy">Prompt Clusters</CardTitle>
            <CardDescription>Mentions by prompt category</CardDescription>
          </CardHeader>
          <CardContent>
            <div ref={clusterChartRef}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.clusters} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis type="number" className="text-xs" />
                  <YAxis dataKey="name" type="category" className="text-xs" width={120} />
                  <Tooltip />
                  <Bar dataKey="mentions" fill="#2563eb" name="Mentions" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Citations Table */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="heading text-brand-navy">Citation Sources</CardTitle>
            <CardDescription>All citations with URLs and citation counts</CardDescription>
          </CardHeader>
          <CardContent>
            <div ref={citationsTableRef}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Count</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>URL</TableHead>
                    <TableHead className="w-[100px]">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.citations?.map((citation: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell className="font-mono">
                        <Badge variant="outline" className="border-brand-navy text-brand-navy">{citation.count}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">{citation.title}</TableCell>
                      <TableCell className="text-sm text-gray-600 max-w-md truncate">
                        {citation.url}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(citation.url, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )) || (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-gray-500">
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