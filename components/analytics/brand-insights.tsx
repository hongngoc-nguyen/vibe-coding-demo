'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
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
          { name: 'ChatGPT', totalMentions: 45, brandMentions: 28, competitorMentions: 17, citations: 12, brandCitations: 8, competitorCitations: 4 },
          { name: 'Google AI', totalMentions: 38, brandMentions: 24, competitorMentions: 14, citations: 8, brandCitations: 5, competitorCitations: 3 },
          { name: 'Microsoft Copilot', totalMentions: 23, brandMentions: 15, competitorMentions: 8, citations: 5, brandCitations: 3, competitorCitations: 2 }
        ],
        clusters: [
          { name: 'Brand Research', totalMentions: 89, brandMentions: 55, competitorMentions: 34 },
          { name: 'Competitive Analysis', totalMentions: 67, brandMentions: 42, competitorMentions: 25 },
          { name: 'Product Comparison', totalMentions: 54, brandMentions: 32, competitorMentions: 22 },
          { name: 'Market Analysis', totalMentions: 37, brandMentions: 23, competitorMentions: 14 }
        ],
        citations: [
          { url: 'https://techcrunch.com/fintech-comparison', count: 18, title: 'Fintech Solutions Comparison 2024' },
          { url: 'https://venturebeat.com/investment-platforms', count: 15, title: 'Investment Platform Analysis' },
          { url: 'https://forbes.com/capital-markets', count: 12, title: 'Capital Markets Technology Review' },
          { url: 'https://wsj.com/digital-finance', count: 10, title: 'Digital Finance Landscape' },
          { url: 'https://bloomberg.com/fintech-trends', count: 8, title: 'Fintech Industry Trends' }
        ],
        metrics: {
          uniqueMentions: 247,
          totalCitations: 63,
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

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444']

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
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
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
                  <SelectItem value="market">Market Analysis</SelectItem>
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
            <CardTitle className="text-sm font-medium text-gray-600">Unique Mentions</CardTitle>
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
            <CardTitle className="text-sm font-medium text-gray-600">Total Citations</CardTitle>
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Platform Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Platform Distribution</CardTitle>
            <CardDescription className="text-sm">Brand vs Competitor mentions across AI platforms</CardDescription>
          </CardHeader>
          <CardContent>
            <div ref={platformChartRef}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.platforms}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="brandMentions" stackId="a" fill="#162950" name="Brand Mentions" />
                  <Bar dataKey="competitorMentions" stackId="a" fill="#94a3b8" name="Competitor Mentions" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Prompt Clusters */}
        <Card>
          <CardHeader>
            <CardTitle>Prompt Clusters</CardTitle>
            <CardDescription className="text-sm">Brand vs Competitor mentions by prompt category</CardDescription>
          </CardHeader>
          <CardContent>
            <div ref={clusterChartRef}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.clusters} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis
                    dataKey="name"
                    tick={false}
                    axisLine={false}
                  />
                  <YAxis className="text-xs" />
                  <Tooltip
                    formatter={(value, name, props) => [
                      value,
                      name,
                      props.payload.name
                    ]}
                    labelFormatter={(label, payload) => {
                      return payload?.[0]?.payload?.name || label
                    }}
                  />
                  <Legend />
                  <Bar dataKey="brandMentions" stackId="a" fill="#162950" name="Brand Mentions" />
                  <Bar dataKey="competitorMentions" stackId="a" fill="#94a3b8" name="Competitor Mentions" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Citations Table */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Citation Sources</CardTitle>
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
                        <Badge variant="outline">{citation.count}</Badge>
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