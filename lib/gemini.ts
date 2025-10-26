import { GoogleGenerativeAI } from '@google/generative-ai';

let genAI: GoogleGenerativeAI | null = null;

function getGenAI() {
  if (!genAI) {
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error('Missing GOOGLE_GEMINI_API_KEY environment variable');
    }

    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

function getGeminiPro() {
  return getGenAI().getGenerativeModel({ model: 'gemini-1.5-flash' });
}

function getGeminiProVision() {
  return getGenAI().getGenerativeModel({ model: 'gemini-1.5-flash' });
}

export async function generateContent(prompt: string) {
  try {
    const model = getGeminiPro();
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error generating content:', error);
    throw error;
  }
}

export async function analyzeImage(prompt: string, imageData: string) {
  try {
    const model = getGeminiProVision();
    const result = await model.generateContent([
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
    const model = getGeminiPro();
    const result = await model.generateContentStream(prompt);
    return result.stream;
  } catch (error) {
    console.error('Error streaming content:', error);
    throw error;
  }
}