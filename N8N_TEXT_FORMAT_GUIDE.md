# N8N Text Response Format Guide

## Overview

The Search Assistant now expects **plain text** responses from n8n workflows instead of JSON. This gives you full control over formatting.

## Database Change

`search_responses.response_data` is now **TEXT** (previously JSONB).

## Webhook Payload

Your n8n workflow will receive this payload:

```json
{
  "query_id": "uuid-of-query",
  "user_id": "clerk-user-id",
  "prompt_text": "user's search query",
  "response_id": "pre-generated-uuid-for-this-response"
}
```

### Important: `response_id`

The `response_id` is **pre-generated** by the app before calling your n8n workflow. This UUID is already created in the database and you can use it for:
- Tracking and logging
- Callbacks or webhooks back to the app
- Referencing this specific response in future operations

**You MUST return this same `response_id` in your response.**

## Required Response Format

Your n8n workflow MUST return this structure:

```json
{
  "success": true,
  "query_id": "uuid-of-query",
  "response_id": "the-same-response-id-from-payload",
  "response_data": "Your formatted text here...",
  "execution_time": 1234
}
```

### Fields:

- `success` (boolean, required): Must be `true` for successful responses
- `query_id` (string, required): The query_id from the webhook payload
- `response_id` (string, required): The SAME response_id from the webhook payload
- `response_data` (string, required): Your formatted text content
- `execution_time` (number, optional): Execution time in milliseconds

## Formatting Examples

### Google Search Workflow

```javascript
// Last node in your n8n workflow (Code node)
const results = $input.all();
const webhookData = $('Webhook').item.json;

let formattedText = `Google Search Results for: "${webhookData.prompt_text}"\n\n`;
formattedText += '═'.repeat(75) + '\n\n';

results.forEach((item, index) => {
  formattedText += `Result #${index + 1}\n`;
  formattedText += '━'.repeat(60) + '\n';
  formattedText += `Title: ${item.json.title}\n`;
  formattedText += `URL: ${item.json.link}\n\n`;
  formattedText += `${item.json.snippet}\n\n`;
});

formattedText += '═'.repeat(75) + '\n';
formattedText += `About ${results.length} results (0.${Math.floor(Math.random() * 99)} seconds)`;

return {
  success: true,
  query_id: webhookData.query_id,
  response_id: webhookData.response_id, // IMPORTANT: Return the same response_id
  response_data: formattedText,
  execution_time: Date.now() - $workflow.startedAt
};
```

### Google AI Mode Workflow

```javascript
// Last node in your n8n workflow (Code node)
const aiResponse = $input.first().json;
const webhookData = $('Webhook').item.json;

let formattedText = `AI-Generated Answer for: "${webhookData.prompt_text}"\n\n`;
formattedText += aiResponse.answer + '\n\n';

if (aiResponse.sources && aiResponse.sources.length > 0) {
  formattedText += 'Sources:\n';
  formattedText += '━'.repeat(60) + '\n';

  aiResponse.sources.forEach((source, index) => {
    formattedText += `${index + 1}. ${source.title}\n`;
    formattedText += `   ${source.url}\n`;
    if (source.snippet) {
      formattedText += `   ${source.snippet}\n`;
    }
    formattedText += '\n';
  });

  formattedText += '━'.repeat(60) + '\n';
}

if (aiResponse.confidence) {
  formattedText += `Confidence Score: ${Math.round(aiResponse.confidence * 100)}%`;
}

return {
  success: true,
  query_id: webhookData.query_id,
  response_id: webhookData.response_id, // IMPORTANT: Return the same response_id
  response_data: formattedText,
  execution_time: Date.now() - $workflow.startedAt
};
```

## Formatting Tips

### Use Unicode Characters for Visual Separation

```javascript
'═'.repeat(75)  // Double line
'━'.repeat(60)  // Single line
'─'.repeat(40)  // Thin line
'•' or '◦'      // Bullet points
'▸' or '▹'      // Arrows
```

### Line Breaks

```javascript
'\n'      // Single line break
'\n\n'    // Paragraph break
'\n\n\n'  // Large spacing
```

### Text Wrapping

Wrap long text at 75-80 characters for better readability:

```javascript
function wrapText(text, maxLength = 75) {
  const words = text.split(' ');
  let lines = [];
  let currentLine = '';

  words.forEach(word => {
    if ((currentLine + word).length > maxLength) {
      lines.push(currentLine.trim());
      currentLine = word + ' ';
    } else {
      currentLine += word + ' ';
    }
  });

  if (currentLine) {
    lines.push(currentLine.trim());
  }

  return lines.join('\n');
}
```

## Complete n8n Workflow Structure

```
┌─────────────┐
│   Webhook   │ (Receives POST with query_id, user_id, prompt_text, response_id)
└──────┬──────┘
       │
       ↓
┌─────────────┐
│ Extract Data│ (Get all webhook fields)
└──────┬──────┘
       │
       ↓
┌─────────────┐
│  HTTP/API   │ (Call Google API)
│   Request   │
└──────┬──────┘
       │
       ↓
┌─────────────┐
│ Code Node   │ (Format response as text)
│  (Format)   │ (Return query_id, response_id, response_data)
└─────────────┘
```

## Example Complete Code Node

```javascript
// Store workflow start time
const startTime = Date.now();

// Get input from previous node (API response)
const apiResults = $input.all();

// Get webhook data (includes response_id!)
const webhookData = $('Webhook').item.json;

// Format the response
let formattedText = `Search Results for: "${webhookData.prompt_text}"\n\n`;
formattedText += '═'.repeat(75) + '\n\n';

// Process each result
apiResults.forEach((result, index) => {
  const item = result.json;

  formattedText += `Result #${index + 1}\n`;
  formattedText += '━'.repeat(60) + '\n';
  formattedText += `Title: ${item.title || 'No title'}\n`;
  formattedText += `URL: ${item.link || item.url || 'No URL'}\n\n`;

  // Wrap description text
  if (item.snippet || item.description) {
    const desc = item.snippet || item.description;
    formattedText += wrapText(desc, 75) + '\n\n';
  }
});

formattedText += '═'.repeat(75) + '\n';
formattedText += `Total Results: ${apiResults.length}\n`;

// Calculate execution time
const executionTime = Date.now() - startTime;

// Return formatted response with SAME response_id from webhook
return {
  success: true,
  query_id: webhookData.query_id,
  response_id: webhookData.response_id, // CRITICAL: Return the same response_id
  response_data: formattedText,
  execution_time: executionTime
};

// Helper function
function wrapText(text, maxLength) {
  if (!text) return '';
  const words = text.split(' ');
  let lines = [];
  let currentLine = '';

  words.forEach(word => {
    if ((currentLine + word).length > maxLength) {
      lines.push(currentLine.trim());
      currentLine = word + ' ';
    } else {
      currentLine += word + ' ';
    }
  });

  if (currentLine) lines.push(currentLine.trim());
  return lines.join('\n');
}
```

## Error Handling

If your workflow fails, return:

```json
{
  "success": false,
  "response_data": "Error: Failed to fetch results from API",
  "execution_time": 100,
  "error": "Detailed error message here"
}
```

## Testing Your n8n Workflow

Test your workflow with this payload:

```json
{
  "query_id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "user_2abc123def",
  "prompt_text": "best legal practice management software",
  "response_id": "660e8400-e29b-41d4-a716-446655440001"
}
```

Expected response:

```json
{
  "success": true,
  "query_id": "550e8400-e29b-41d4-a716-446655440000",
  "response_id": "660e8400-e29b-41d4-a716-446655440001",
  "response_data": "Google Search Results for: \"best legal practice management software\"\n\n...",
  "execution_time": 1234
}
```

## Migration Steps

1. **Run the database migration** in Supabase:
   ```sql
   -- File: supabase/migrations/005_change_response_data_to_text.sql
   -- Already created, just run it in Supabase SQL Editor
   ```

2. **Update your n8n workflows**:
   - Open each workflow
   - Update the last Code node to format text
   - Test with the Execute Workflow button
   - Activate the workflow

3. **Test with the app**:
   - Set `USE_MOCK_N8N=true` in `.env.local`
   - Submit a search query
   - Verify formatted text displays correctly
   - Switch to `USE_MOCK_N8N=false` to test real webhooks

## Troubleshooting

### Issue: "Unexpected end of JSON input"
**Solution**: Make sure your n8n workflow returns the `response_data` field as a string, not missing.

### Issue: Text not displaying with line breaks
**Solution**: Use `\n` for line breaks in your text string. The frontend uses `whitespace-pre-wrap` to preserve them.

### Issue: Unicode characters not showing
**Solution**: Make sure your n8n workflow returns UTF-8 encoded text.

### Issue: Empty response
**Solution**: Check that your last node actually returns the formatted object with `success: true` and `response_data: "..."`

## Support

If you encounter issues:
1. Check the n8n execution logs
2. Verify the response format matches exactly
3. Test with `node test-webhook.js` to see raw response
4. Check browser console for any display errors
