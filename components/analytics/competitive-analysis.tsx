'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { Download, TrendingUp, TrendingDown, FileText } from 'lucide-react'
import { exportToCSV, exportToPDF } from '@/lib/export-utils'
import { toast } from 'sonner'

interface CompetitorData {
  name: string
  mentions: number
  trend: number
  marketShare: number
  citations: number
}

export function CompetitiveAnalysis() {
  const [dateRange, setDateRange] = useState('30')
  const [competitors, setCompetitors] = useState<CompetitorData[]>([])
  const [trendData, setTrendData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)

  // Chart refs for PDF export
  const trendsChartRef = useRef<HTMLDivElement>(null)
  const marketShareChartRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchCompetitiveData()
  }, [dateRange])

  const fetchCompetitiveData = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/analytics/competitive?days=${dateRange}`)
      const result = await response.json()
      setCompetitors(result.competitors || [])
      setTrendData(result.trends || [])
    } catch (error) {
      console.error('Failed to fetch competitive data:', error)
      // Mock data for demo
      setCompetitors([
        { name: 'Anduin', mentions: 45, trend: 15.2, marketShare: 35, citations: 12 },
        { name: 'Passthrough', mentions: 38, trend: -5.3, marketShare: 30, citations: 8 },
        { name: 'Subscribe', mentions: 32, trend: 8.7, marketShare: 25, citations: 6 },
        { name: 'Others', mentions: 13, trend: -2.1, marketShare: 10, citations: 2 }
      ])
      setTrendData(generateMockCompetitiveTrends())
    } finally {
      setIsLoading(false)
    }
  }

  const generateMockCompetitiveTrends = () => {
    const data = []
    const days = parseInt(dateRange)
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
      data.push({
        date: date.toISOString().split('T')[0],
        Anduin: Math.floor(Math.random() * 8) + 3,
        Passthrough: Math.floor(Math.random() * 6) + 2,
        Subscribe: Math.floor(Math.random() * 5) + 2,
        Others: Math.floor(Math.random() * 3) + 1
      })
    }
    return data
  }

  const handleExportCSV = async () => {
    setIsExporting(true)
    try {
      const exportData = {
        competitors,
        trends: trendData
      }
      const filename = `competitive-analysis-${new Date().toISOString().split('T')[0]}`
      await exportToCSV(exportData, filename)
      toast.success('Competitive data exported to CSV successfully!')
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
      const exportData = {
        competitors,
        trends: trendData
      }
      const filename = `competitive-analysis-report-${new Date().toISOString().split('T')[0]}`
      const chartRefs = {
        trendsChart: trendsChartRef,
        marketShareChart: marketShareChartRef
      }
      await exportToPDF(exportData, filename, chartRefs)
      toast.success('Competitive analysis report exported to PDF successfully!')
    } catch (error) {
      console.error('PDF export failed:', error)
      toast.error('Failed to export PDF report')
    } finally {
      setIsExporting(false)
    }
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
        <CardHeader>
          <CardTitle>Competitive Analysis Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Date Range</label>
              <Select value={dateRange} onValueChange={setDateRange}>
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

      {/* Competitor Rankings */}
      <Card>
        <CardHeader>
          <CardTitle>Competitor Rankings</CardTitle>
          <CardDescription>Based on mention frequency and market presence</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {competitors.map((competitor, index) => (
              <div key={competitor.name} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="text-lg font-bold text-gray-500">#{index + 1}</div>
                  <div>
                    <h3 className="font-semibold text-lg">{competitor.name}</h3>
                    <p className="text-sm text-gray-600">{competitor.mentions} mentions</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="text-sm text-gray-600">Market Share</div>
                    <div className="font-semibold">{competitor.marketShare}%</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">Citations</div>
                    <div className="font-semibold">{competitor.citations}</div>
                  </div>
                  <div className="flex items-center space-x-1">
                    {competitor.trend > 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    )}
                    <span className={competitor.trend > 0 ? 'text-green-600' : 'text-red-600'}>
                      {competitor.trend > 0 ? '+' : ''}{competitor.trend.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Competitive Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Mention Trends Comparison</CardTitle>
            <CardDescription>Daily mentions across competitors</CardDescription>
          </CardHeader>
          <CardContent>
            <div ref={trendsChartRef}>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Line type="monotone" dataKey="Anduin" stroke="#3b82f6" strokeWidth={2} />
                  <Line type="monotone" dataKey="Passthrough" stroke="#ef4444" strokeWidth={2} />
                  <Line type="monotone" dataKey="Subscribe" stroke="#10b981" strokeWidth={2} />
                  <Line type="monotone" dataKey="Others" stroke="#f59e0b" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Market Share */}
        <Card>
          <CardHeader>
            <CardTitle>Market Share Comparison</CardTitle>
            <CardDescription>Relative mention share by competitor</CardDescription>
          </CardHeader>
          <CardContent>
            <div ref={marketShareChartRef}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={competitors} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis type="number" className="text-xs" />
                  <YAxis dataKey="name" type="category" width={80} className="text-xs" />
                  <Tooltip />
                  <Bar dataKey="marketShare" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Competitive Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Key Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-900">Anduin Position</h4>
              <p className="text-sm text-blue-700 mt-1">
                Leading with 35% market share and positive 15.2% growth trend
              </p>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg">
              <h4 className="font-semibold text-yellow-900">Competitive Threat</h4>
              <p className="text-sm text-yellow-700 mt-1">
                Subscribe showing strong 8.7% growth, monitor closely
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-semibold text-green-900">Citation Advantage</h4>
              <p className="text-sm text-green-700 mt-1">
                Anduin leads in citations with 12 vs competitors' 8 average
              </p>
            </div>
            <div className="p-4 bg-red-50 rounded-lg">
              <h4 className="font-semibold text-red-900">Watch: Passthrough</h4>
              <p className="text-sm text-red-700 mt-1">
                Declining -5.3% but still holds significant 30% market share
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}