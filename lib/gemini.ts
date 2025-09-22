import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error('Missing GEMINI_API_KEY environment variable');
}

const genAI = new GoogleGenerativeAI(apiKey);

export const geminiPro = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
export const geminiProVision = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

export async function generateContent(prompt: string) {
  try {
    const result = await geminiPro.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error generating content:', error);
    throw error;
  }
}

export async function analyzeImage(prompt: string, imageData: string) {
  try {
    const result = await geminiProVision.generateContent([
      prompt,
      {
        inlineData: {
          data: imageData,
          mimeType: 'image/jpeg'
        }
      }
    ]);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error analyzing image:', error);
    throw error;
  }
}

export async function streamContent(prompt: string) {
  try {
    const result = await geminiPro.generateContentStream(prompt);
    return result.stream;
  } catch (error) {
    console.error('Error streaming content:', error);
    throw error;
  }
}