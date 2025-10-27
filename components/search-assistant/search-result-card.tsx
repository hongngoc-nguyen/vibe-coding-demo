'use client'

import { ExternalLink } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface SearchResult {
  title: string
  link: string
  snippet: string
  position?: number
}

interface SearchResultCardProps {
  result: SearchResult
}

export function SearchResultCard({ result }: SearchResultCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <a
              href={result.link}
              target="_blank"
              rel="noopener noreferrer"
              className="group"
            >
              <h3 className="text-base font-medium text-blue-600 hover:text-blue-800 group-hover:underline line-clamp-2">
                {result.title}
              </h3>
            </a>

            <p className="text-sm text-gray-600 mt-1 line-clamp-1">
              {new URL(result.link).hostname}
            </p>

            <p className="text-sm text-gray-700 mt-2 line-clamp-3">
              {result.snippet}
            </p>
          </div>

          {result.position && (
            <div className="flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-600">
                {result.position}
              </div>
            </div>
          )}
        </div>

        <a
          href={result.link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mt-3"
        >
          Visit site
          <ExternalLink className="h-3 w-3" />
        </a>
      </CardContent>
    </Card>
  )
}
