'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BrandInsights } from './brand-insights'
import { CompetitiveAnalysis } from './competitive-analysis'

export function AnalyticsTabs() {
  return (
    <Tabs defaultValue="brand" className="space-y-6">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="brand">Brand Insights</TabsTrigger>
        <TabsTrigger value="competitive">Competitive Analysis</TabsTrigger>
      </TabsList>

      <TabsContent value="brand" className="space-y-6">
        <BrandInsights />
      </TabsContent>

      <TabsContent value="competitive" className="space-y-6">
        <CompetitiveAnalysis />
      </TabsContent>
    </Tabs>
  )
}