import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function GET() {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      return NextResponse.json({
        success: false,
        configured: false,
        message: 'GEMINI_API_KEY is not configured. Please add your API key to .env.local'
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = 'Say hello in 5 words or less';
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({
      success: true,
      configured: true,
      message: 'Gemini API is properly configured and working',
      test_response: text
    });

  } catch (error) {
    console.error('Gemini test error:', error);
    return NextResponse.json({
      success: false,
      configured: true,
      message: 'API key is configured but connection failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}