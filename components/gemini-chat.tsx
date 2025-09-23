'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Send, Sparkles } from 'lucide-react';

export function GeminiChat() {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    setError('');
    setResponse('');

    try {
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt,
          type: 'generate'
        }),
      });

      const data = await res.json();

      if (data.success) {
        setResponse(data.data);
      } else {
        setError(data.error || 'Failed to generate response');
      }
    } catch (err) {
      setError('Failed to connect to Gemini API');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 heading text-brand-navy">
          <Sparkles className="h-5 w-5 text-brand-navy" />
          AI Assistant
        </CardTitle>
        <CardDescription className="text-gray-600">
          Get intelligent insights, strategic recommendations, and data-driven analysis for your AEO performance.
          Powered by real-time Supabase data and advanced AI capabilities.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Textarea
            placeholder="Ask me anything about your AEO performance, data trends, competitor analysis, or get strategic recommendations..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="min-h-[100px]"
            disabled={loading}
          />
          <Button
            onClick={handleSubmit}
            disabled={loading || !prompt.trim()}
            className="w-full sm:w-auto bg-brand-navy hover:bg-brand-navy/90 text-brand-white"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Send
              </>
            )}
          </Button>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-4">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {response && (
          <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-4">
            <h3 className="font-semibold mb-2 text-blue-900 dark:text-blue-300">
              AI Assistant Response:
            </h3>
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {response}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}