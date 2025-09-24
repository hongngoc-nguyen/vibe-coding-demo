'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import { Download, Filter, Calendar, FileText } from 'lucide-react'
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
    metrics: {}
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)

  // Chart refs for PDF export
  const trendChartRef = useRef<HTMLDivElement>(null)
  const platformChartRef = useRef<HTMLDivElement>(null)
  const clusterChartRef = useRef<HTMLDivElement>(null)

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
        trends: generateMockTrendData(),
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
        metrics: {
          totalMentions: 106,
          avgCitations: 8.3,
          growthRate: 15.2
        }
      })
    } finally {
      setIsLoading(false)
    }
  }

  const generateMockTrendData = () => {
    const data = []
    const days = parseInt(filters.dateRange)
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
      data.push({
        date: date.toISOString().split('T')[0],
        mentions: Math.floor(Math.random() * 8) + 2,
        citations: Math.floor(Math.random() * 3) + 1
      })
    }
    return data
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
        trendChart: trendChartRef,
        platformChart: platformChartRef,
        clusterChart: clusterChartRef
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
            <CardTitle className="text-sm font-medium text-gray-600">Total Mentions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.metrics.totalMentions}</div>
            <Badge variant="default" className="mt-1">
              +{data.metrics.growthRate}% vs previous period
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Avg Citations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.metrics.avgCitations}</div>
            <Badge variant="secondary" className="mt-1">
              Per week
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
              Monthly
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Mention Trends</CardTitle>
            <CardDescription>Daily mentions and citations over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div ref={trendChartRef}>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.trends}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Line type="monotone" dataKey="mentions" stroke="#3b82f6" strokeWidth={2} />
                  <Line type="monotone" dataKey="citations" stroke="#10b981" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Platform Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Platform Distribution</CardTitle>
            <CardDescription>Mentions across different AI platforms</CardDescription>
          </CardHeader>
          <CardContent>
            <div ref={platformChartRef}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.platforms}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Bar dataKey="mentions" fill="#3b82f6" />
                  <Bar dataKey="citations" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Prompt Clusters */}
        <Card>
          <CardHeader>
            <CardTitle>Prompt Clusters</CardTitle>
            <CardDescription>Mentions by prompt category</CardDescription>
          </CardHeader>
          <CardContent>
            <div ref={clusterChartRef}>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data.clusters}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({name, percent}) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="mentions"
                  >
                    {data.clusters.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}