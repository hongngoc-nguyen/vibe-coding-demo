'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PlatformInsights } from './platform-insights'

export function PlatformTabs() {
  const [platforms, setPlatforms] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchAvailablePlatforms()
  }, [])

  const fetchAvailablePlatforms = async () => {
    setIsLoading(true)
    try {
      // Fetch with 'all' platform to get the list of available platforms
      const response = await fetch('/api/analytics/platform?days=30&platform=all')
      const result = await response.json()

      // Filter out platforms that have no data
      const platformsWithData = result.availablePlatforms?.filter((p: string) => p && p.trim() !== '') || []
      setPlatforms(platformsWithData)
    } catch (error) {
      console.error('Failed to fetch available platforms:', error)
      setPlatforms([])
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (platforms.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <p>No platform data available</p>
      </div>
    )
  }

  return (
    <Tabs defaultValue={platforms[0]} className="space-y-6">
      <TabsList className={`grid w-full grid-cols-${Math.min(platforms.length, 4)}`}>
        {platforms.map(platform => (
          <TabsTrigger key={platform} value={platform}>
            {platform}
          </TabsTrigger>
        ))}
      </TabsList>

      {platforms.map(platform => (
        <TabsContent key={platform} value={platform} className="space-y-6">
          <PlatformInsights platform={platform} />
        </TabsContent>
      ))}
    </Tabs>
  )
}
