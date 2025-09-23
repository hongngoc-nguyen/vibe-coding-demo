'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Download, Filter, FileText, ExternalLink, Bookmark, BookmarkCheck } from 'lucide-react'
import { exportToCSV, exportToPDF } from '@/lib/export-utils'
import { toast } from 'sonner'

interface FilterState {
  dateRange: string
  platform: string
  promptCluster: string
}

interface CompetitorData {
  name: string
  mentions: number
  trend: number
  marketShare: number
  citations: number
}

interface CitationData {
  url: string
  count: number
  title: string
  competitors: string[]
}

export function CompetitiveAnalysis() {
  const [filters, setFilters] = useState<FilterState>({
    dateRange: '30',
    platform: 'all',
    promptCluster: 'all'
  })
  const [competitors, setCompetitors] = useState<CompetitorData[]>([])
  const [citations, setCitations] = useState<CitationData[]>([])
  const [bookmarkedCitations, setBookmarkedCitations] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)

  // Table refs for PDF export
  const competitorsTableRef = useRef<HTMLDivElement>(null)
  const citationsTableRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchCompetitiveData()

    // Load bookmarks from localStorage
    const savedBookmarks = localStorage.getItem('competitorCitationBookmarks')
    if (savedBookmarks) {
      try {
        const bookmarkArray = JSON.parse(savedBookmarks)
        setBookmarkedCitations(new Set(bookmarkArray))
      } catch (error) {
        console.error('Failed to load bookmarks:', error)
      }
    }
  }, [filters])

  const fetchCompetitiveData = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        days: filters.dateRange,
        platform: filters.platform,
        cluster: filters.promptCluster
      })

      const response = await fetch(`/api/analytics/competitive?${params}`)
      const result = await response.json()
      setCompetitors(result.competitors || [])
      setCitations(result.citations || [])
    } catch (error) {
      console.error('Failed to fetch competitive data:', error)
      // Mock data for demo
      setCompetitors([
        { name: 'Anduin', mentions: 45, trend: 15.2, marketShare: 35, citations: 12 },
        { name: 'Passthrough', mentions: 38, trend: -5.3, marketShare: 30, citations: 8 },
        { name: 'Subscribe', mentions: 32, trend: 8.7, marketShare: 25, citations: 6 },
        { name: 'CompetitorX', mentions: 13, trend: -2.1, marketShare: 10, citations: 2 }
      ])
      setCitations([
        { url: 'https://techcrunch.com/fintech-comparison', count: 18, title: 'Fintech Solutions Comparison 2024', competitors: ['Anduin', 'Passthrough'] },
        { url: 'https://venturebeat.com/investment-platforms', count: 15, title: 'Investment Platform Analysis', competitors: ['Subscribe', 'Anduin'] },
        { url: 'https://forbes.com/capital-markets', count: 12, title: 'Capital Markets Technology Review', competitors: ['Passthrough', 'CompetitorX'] },
        { url: 'https://wsj.com/digital-finance', count: 10, title: 'Digital Finance Landscape', competitors: ['Anduin', 'Subscribe', 'Passthrough'] },
        { url: 'https://bloomberg.com/fintech-trends', count: 8, title: 'Fintech Industry Trends', competitors: ['CompetitorX', 'Anduin'] }
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const getDateRangeText = () => {
    const days = parseInt(filters.dateRange)
    if (days === 7) return 'Last 7 days'
    if (days === 30) return 'Last 30 days'
    if (days === 90) return 'Last 90 days'
    return 'Custom period'
  }

  const toggleBookmark = (citationUrl: string) => {
    const newBookmarks = new Set(bookmarkedCitations)
    if (newBookmarks.has(citationUrl)) {
      newBookmarks.delete(citationUrl)
      toast.success('Bookmark removed')
    } else {
      newBookmarks.add(citationUrl)
      toast.success('Citation bookmarked')
    }
    setBookmarkedCitations(newBookmarks)

    // Save to localStorage for persistence
    localStorage.setItem('competitorCitationBookmarks', JSON.stringify(Array.from(newBookmarks)))
  }

  const exportBookmarks = () => {
    const bookmarkedItems = citations.filter(citation => bookmarkedCitations.has(citation.url))
    if (bookmarkedItems.length === 0) {
      toast.error('No bookmarks to export')
      return
    }

    const exportData = bookmarkedItems.map(item => ({
      title: item.title,
      url: item.url,
      count: item.count,
      competitors: item.competitors.join(', ')
    }))

    const filename = `bookmarked-citations-${new Date().toISOString().split('T')[0]}`
    exportToCSV({ bookmarks: exportData }, filename)
    toast.success('Bookmarks exported successfully!')
  }

  const handleExportCSV = async () => {
    setIsExporting(true)
    try {
      const exportData = {
        competitors,
        citations
      }
      const filename = `competitor-monitoring-${new Date().toISOString().split('T')[0]}`
      await exportToCSV(exportData, filename)
      toast.success('Competitor monitoring data exported to CSV successfully!')
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
        citations
      }
      const filename = `competitor-monitoring-report-${new Date().toISOString().split('T')[0]}`
      const tableRefs = {
        competitorsTable: competitorsTableRef,
        citationsTable: citationsTableRef
      }
      await exportToPDF(exportData, filename, tableRefs)
      toast.success('Competitor monitoring report exported to PDF successfully!')
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
          <CardTitle className="flex items-center gap-2 heading text-brand-navy">
            <Filter className="h-5 w-5 text-brand-navy" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
            <div className="md:col-span-2 flex items-end gap-2">
              <Button
                onClick={handleExportCSV}
                className="flex-1"
                disabled={isExporting}
              >
                <Download className="h-4 w-4 mr-2" />
                CSV
              </Button>
              <Button
                onClick={handleExportPDF}
                variant="outline"
                className="flex-1"
                disabled={isExporting}
              >
                <FileText className="h-4 w-4 mr-2" />
                PDF
              </Button>
              <Button
                onClick={exportBookmarks}
                variant="secondary"
                className="flex-1"
                disabled={bookmarkedCitations.size === 0}
              >
                <Bookmark className="h-4 w-4 mr-2" />
                Bookmarks ({bookmarkedCitations.size})
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Competitors Table */}
      <Card>
        <CardHeader>
          <CardTitle className="heading text-brand-navy">Competitor Monitoring</CardTitle>
          <CardDescription>Unique mention counts for predefined competitors ({getDateRangeText()})</CardDescription>
        </CardHeader>
        <CardContent>
          <div ref={competitorsTableRef}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Rank</TableHead>
                  <TableHead>Competitor</TableHead>
                  <TableHead className="text-center">Unique Mentions</TableHead>
                  <TableHead className="text-center">Citations</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {competitors.map((competitor, index) => (
                  <TableRow key={competitor.name}>
                    <TableCell className="font-mono">
                      <Badge variant="outline" className="border-brand-navy text-brand-navy">#{index + 1}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{competitor.name}</TableCell>
                    <TableCell className="text-center font-mono">{competitor.mentions}</TableCell>
                    <TableCell className="text-center font-mono">{competitor.citations}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Citations Table */}
      <Card>
        <CardHeader>
          <CardTitle className="heading text-brand-navy">Citation Sources</CardTitle>
          <CardDescription>
            All citations with URLs, citation counts, and mentioned competitors.
            Bookmark citations for later reference or export.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div ref={citationsTableRef}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Count</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>Competitors Mentioned</TableHead>
                  <TableHead className="w-[140px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {citations.map((citation, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-mono">
                      <Badge variant="outline" className="border-brand-blue text-brand-blue">{citation.count}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{citation.title}</TableCell>
                    <TableCell className="text-sm text-gray-600 max-w-md truncate">
                      {citation.url}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {citation.competitors.map((comp, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs bg-brand-sky text-brand-slate-700">
                            {comp}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleBookmark(citation.url)}
                          className={bookmarkedCitations.has(citation.url) ? 'bg-yellow-50 border-yellow-300' : ''}
                        >
                          {bookmarkedCitations.has(citation.url) ? (
                            <BookmarkCheck className="h-4 w-4 text-yellow-600" />
                          ) : (
                            <Bookmark className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(citation.url, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}