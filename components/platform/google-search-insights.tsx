'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { PlatformCompetitorComparison } from '../analytics/platform-competitor-comparison'
import { BRAND_COLOR, NEUTRAL_COLOR } from '@/lib/chart-colors'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { UrlPreview } from '../analytics/url-preview'

interface GoogleSearchInsightsProps {
  uniqueCitationChart?: any[]
  citations?: any[]
  dateFilter?: string
}

export function GoogleSearchInsights({
  uniqueCitationChart = [],
  citations = [],
  dateFilter = 'all'
}: GoogleSearchInsightsProps) {

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

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6">
        {/* Brand Appearance Over Time */}
        <Card>
          <CardHeader>
            <CardTitle>Brand Appearance Over Time</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Responses containing brand citations vs total responses over time</p>
          </CardHeader>
          <CardContent>
            {uniqueCitationChart && uniqueCitationChart.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={uniqueCitationChart}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="brandCitations" fill={BRAND_COLOR} name="Brand appearance" />
                  <Bar dataKey="totalResponses" fill={NEUTRAL_COLOR} name="Total responses" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[320px] flex items-center justify-center text-gray-500">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Anduin vs. Competitors */}
        <PlatformCompetitorComparison platform="Google Search" dateFilter={dateFilter} />

        {/* Pages appearing on Google Search */}
        <Card>
          <CardHeader>
            <CardTitle>Pages appearing on Google Search</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Count</TableHead>
                  <TableHead>URL</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {citations && citations.length > 0 ? (
                  citations.map((citation: any, index: number) => (
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
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
