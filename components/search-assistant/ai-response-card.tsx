'use client'

import { Copy, Check, ExternalLink, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface AISource {
  title: string
  url: string
  snippet?: string
}

interface AIResponseCardProps {
  answer: string
  sources?: AISource[]
  confidence?: number
}

export function AIResponseCard({ answer, sources, confidence }: AIResponseCardProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(answer)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-purple-600" />
            AI Response
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-8"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 mr-1" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-1" />
                Copy
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="prose prose-sm max-w-none">
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
            {answer}
          </p>
        </div>

        {confidence !== undefined && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Confidence:</span>
            <Badge variant="secondary">
              {(confidence * 100).toFixed(0)}%
            </Badge>
          </div>
        )}

        {sources && sources.length > 0 && (
          <div className="space-y-2 pt-4 border-t">
            <h4 className="text-sm font-medium text-gray-900">Sources</h4>
            <div className="space-y-2">
              {sources.map((source, index) => (
                <a
                  key={index}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600 line-clamp-1">
                        {source.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                        {new URL(source.url).hostname}
                      </p>
                      {source.snippet && (
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                          {source.snippet}
                        </p>
                      )}
                    </div>
                    <ExternalLink className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
