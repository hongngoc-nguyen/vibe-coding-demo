'use client'

import { ExternalLink } from 'lucide-react'

interface UrlPreviewProps {
  url: string
}

export function UrlPreview({ url }: UrlPreviewProps) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 group cursor-pointer w-full"
    >
      <span className="truncate flex-1 min-w-0">{url}</span>
      <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
    </a>
  )
}
