'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BrandInsights } from './brand-insights'
import { CompetitiveAnalysis } from './competitive-analysis'
import { AdditionalMentions } from './additional-mentions'

export function AnalyticsTabs() {
  return (
    <Tabs defaultValue="brand" className="space-y-6">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="brand">Brand</TabsTrigger>
        <TabsTrigger value="competitive">Competitors</TabsTrigger>
        <TabsTrigger value="additional">Additional Mentions</TabsTrigger>
      </TabsList>

      <TabsContent value="brand" className="space-y-6">
        <BrandInsights />
      </TabsContent>

      <TabsContent value="competitive" className="space-y-6">
        <CompetitiveAnalysis />
      </TabsContent>

      <TabsContent value="additional" className="space-y-6">
        <AdditionalMentions />
      </TabsContent>
    </Tabs>
  )
}