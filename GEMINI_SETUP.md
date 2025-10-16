# Gemini API Setup Guide

## Overview
The AEO Dashboard now includes Google Gemini AI integration for intelligent insights and data analysis.

## Setup Instructions

### 1. Get Your Gemini API Key
1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Sign in with your Google account
3. Click on "Get API Key" in the left sidebar
4. Create a new project or select an existing one
5. Copy your API key

### 2. Configure Environment Variable
Open `.env.local` and replace the placeholder with your actual API key:
```env
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

### 3. Restart Development Server
After adding your API key, restart the development server:
```bash
npm run dev
```

## API Endpoints

### Test Connection
```bash
GET http://localhost:3000/api/gemini/test
```

### Generate Content
```bash
POST http://localhost:3000/api/gemini
Content-Type: application/json

{
  "prompt": "Your question here",
  "type": "generate"
}
```

### Analyze Images
```bash
POST http://localhost:3000/api/gemini
Content-Type: application/json

{
  "prompt": "Describe this image",
  "type": "analyze",
  "imageData": "base64_encoded_image_data"
}
```

### Stream Content
```bash
POST http://localhost:3000/api/gemini
Content-Type: application/json

{
  "prompt": "Your question here",
  "type": "stream"
}
```

## Usage in the Application

1. Navigate to the Chat page at `/chat`
2. You'll see the Gemini AI Assistant interface
3. Type your question about AEO strategies or data analysis
4. Click "Send" to get AI-powered insights

## Features

- **Text Generation**: Get AI responses for AEO-related queries
- **Image Analysis**: Upload images for visual content analysis
- **Streaming Responses**: Real-time streaming for longer responses
- **Context-Aware**: Tailored for AEO and digital marketing insights

## Security Notes

- Never commit your API key to version control
- Keep your `.env.local` file secure
- Consider implementing rate limiting in production
- Use environment-specific API keys for different deployments

## Troubleshooting

### API Key Not Working
- Verify the key is correctly copied without extra spaces
- Check if the API is enabled in Google Cloud Console
- Ensure billing is set up if required

### Connection Errors
- Check your internet connection
- Verify firewall settings allow outbound HTTPS requests
- Look for error messages in the browser console or server logs

### Rate Limits
- Google Gemini has usage quotas
- Consider implementing caching for repeated queries
- Monitor your usage in Google AI Studio dashboard