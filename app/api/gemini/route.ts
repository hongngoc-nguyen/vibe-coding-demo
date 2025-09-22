import { NextRequest, NextResponse } from 'next/server';
import { generateContent, analyzeImage, streamContent } from '@/lib/gemini';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, type = 'generate', imageData } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    let result;

    switch (type) {
      case 'generate':
        result = await generateContent(prompt);
        break;
      case 'analyze':
        if (!imageData) {
          return NextResponse.json(
            { error: 'Image data is required for analysis' },
            { status: 400 }
          );
        }
        result = await analyzeImage(prompt, imageData);
        break;
      case 'stream':
        const stream = await streamContent(prompt);
        const chunks = [];
        for await (const chunk of stream) {
          chunks.push(chunk.text());
        }
        result = chunks.join('');
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid type. Must be generate, analyze, or stream' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Gemini API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process request'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Gemini API endpoint is configured',
    endpoints: {
      generate: 'POST /api/gemini with type: "generate"',
      analyze: 'POST /api/gemini with type: "analyze"',
      stream: 'POST /api/gemini with type: "stream"'
    }
  });
}