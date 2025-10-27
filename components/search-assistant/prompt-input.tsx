'use client'

import { useState } from 'react'
import { Send, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface PromptInputProps {
  onSubmit: (prompt: string) => void
  isLoading?: boolean
}

export function PromptInput({ onSubmit, isLoading }: PromptInputProps) {
  const [prompt, setPrompt] = useState('')

  const handleSubmit = () => {
    if (prompt.trim() && !isLoading) {
      onSubmit(prompt.trim())
      setPrompt('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const charCount = prompt.length
  const maxChars = 1000
  const isOverLimit = charCount > maxChars

  return (
    <div className="space-y-2">
      <div className="relative">
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything... (Press Enter to submit, Shift+Enter for new line)"
          className="min-h-[100px] pr-24 resize-none"
          disabled={isLoading}
        />
        <Button
          onClick={handleSubmit}
          disabled={!prompt.trim() || isLoading || isOverLimit}
          className="absolute right-2 bottom-2"
          size="sm"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Generate
            </>
          )}
        </Button>
      </div>
      <div className="flex items-center justify-between text-xs">
        <p className="text-gray-500">
          Press Enter to submit, Shift+Enter for new line
        </p>
        <p className={`font-medium ${isOverLimit ? 'text-red-600' : 'text-gray-500'}`}>
          {charCount}/{maxChars}
        </p>
      </div>
    </div>
  )
}
