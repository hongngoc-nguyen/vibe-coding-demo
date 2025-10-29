# Quick N8N Workflow Update Guide

## 🚨 CRITICAL: Update Both Workflows BEFORE Testing

You have switched to **real n8n mode** (`USE_MOCK_N8N=false`). Your n8n workflows MUST be updated to work with the new format.

---

## What Changed

### 1. Webhook Payload NOW Includes `response_id`

Your n8n workflow will receive:
```json
{
  "query_id": "uuid-here",
  "user_id": "clerk-user-id",
  "prompt_text": "user's search query",
  "response_id": "pre-generated-uuid"  ← NEW FIELD!
}
```

### 2. Response Format Changed to TEXT

Your workflow MUST return:
```json
{
  "success": true,
  "query_id": "uuid-here",
  "response_id": "same-uuid-from-payload",  ← MUST RETURN THIS!
  "response_data": "Your formatted plain text here...",
  "execution_time": 1234
}
```

**NOT** JSON objects anymore - just plain formatted text!

---

## Update Your N8N Workflows

### Google Search Workflow

**URL**: https://free-n8n.anduin.center/webhook/17094fa1-9051-4eed-b0cb-f9d2fd48f7a1

**Update the LAST CODE NODE** with this template:

```javascript
// Get webhook data
const webhookData = $('Webhook').item.json;

// Get your Google Search results from previous node
const searchResults = $input.all();

// Format as plain text
let formattedText = `Google Search Results for: "${webhookData.prompt_text}"\n\n`;
formattedText += '═'.repeat(75) + '\n\n';

searchResults.forEach((result, index) => {
  const item = result.json;

  formattedText += `Result #${index + 1}\n`;
  formattedText += '━'.repeat(60) + '\n';
  formattedText += `Title: ${item.title}\n`;
  formattedText += `URL: ${item.link}\n\n`;
  formattedText += `${item.snippet}\n\n`;
});

formattedText += '═'.repeat(75) + '\n';
formattedText += `About ${searchResults.length} results`;

// CRITICAL: Return with query_id AND response_id
return {
  success: true,
  query_id: webhookData.query_id,
  response_id: webhookData.response_id,  // ← MUST include this!
  response_data: formattedText,          // ← Plain text, not JSON!
  execution_time: Date.now() - $workflow.startedAt
};
```

### Google AI Mode Workflow

**URL**: https://free-n8n.anduin.center/webhook/152cb399-0f55-4bb0-9196-70c129f5486b

**Update the LAST CODE NODE** with this template:

```javascript
// Get webhook data
const webhookData = $('Webhook').item.json;

// Get your AI response from previous node
const aiResponse = $input.first().json;

// Format as plain text
let formattedText = `AI-Generated Answer for: "${webhookData.prompt_text}"\n\n`;
formattedText += aiResponse.answer + '\n\n';

if (aiResponse.sources && aiResponse.sources.length > 0) {
  formattedText += 'Sources:\n';
  formattedText += '━'.repeat(60) + '\n';

  aiResponse.sources.forEach((source, index) => {
    formattedText += `${index + 1}. ${source.title}\n`;
    formattedText += `   ${source.url}\n\n`;
  });

  formattedText += '━'.repeat(60) + '\n';
}

if (aiResponse.confidence) {
  formattedText += `Confidence Score: ${Math.round(aiResponse.confidence * 100)}%`;
}

// CRITICAL: Return with query_id AND response_id
return {
  success: true,
  query_id: webhookData.query_id,
  response_id: webhookData.response_id,  // ← MUST include this!
  response_data: formattedText,          // ← Plain text, not JSON!
  execution_time: Date.now() - $workflow.startedAt
};
```

---

## Quick Update Steps

1. **Open n8n** at https://free-n8n.anduin.center
2. **Edit Google Search Workflow**:
   - Find the last "Code" node
   - Replace with the code above
   - Click "Execute Workflow" to test
   - Save and Activate
3. **Edit Google AI Mode Workflow**:
   - Find the last "Code" node
   - Replace with the code above
   - Click "Execute Workflow" to test
   - Save and Activate

---

## Test Your Workflows

### Test Payload (use in n8n):
```json
{
  "query_id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "user_test",
  "prompt_text": "best legal software",
  "response_id": "660e8400-e29b-41d4-a716-446655440001"
}
```

### Expected Response:
```json
{
  "success": true,
  "query_id": "550e8400-e29b-41d4-a716-446655440000",
  "response_id": "660e8400-e29b-41d4-a716-446655440001",
  "response_data": "Google Search Results for: \"best legal software\"\n\n...",
  "execution_time": 1234
}
```

---

## Common Mistakes to Avoid

❌ **DON'T** return JSON objects in `response_data`:
```javascript
// WRONG!
response_data: { results: [...] }
```

✅ **DO** return plain formatted text:
```javascript
// CORRECT!
response_data: "Google Search Results for...\n\nResult #1\n..."
```

❌ **DON'T** forget to return `response_id`:
```javascript
// WRONG!
return {
  success: true,
  response_data: "..."
}
```

✅ **DO** include both `query_id` and `response_id`:
```javascript
// CORRECT!
return {
  success: true,
  query_id: webhookData.query_id,
  response_id: webhookData.response_id,
  response_data: "..."
}
```

---

## After Updating N8N

1. **Refresh your browser** at http://localhost:3002/search-assistant
2. **Submit a new search query**
3. **Watch for**:
   - Loading spinners should appear
   - After ~2-5 seconds, results should display
   - Check browser console (F12) for any errors
   - Check n8n execution logs for webhook calls

---

## If Something Goes Wrong

### Issue: "Unexpected end of JSON input"
- Your n8n workflow is not returning any response
- Check n8n execution logs
- Verify workflow is active

### Issue: Empty results displayed
- Your n8n workflow might be returning empty `response_data`
- Check n8n code node output
- Verify your API calls are working

### Issue: "Failed to fetch results"
- n8n workflow returned an error
- Check `error_message` field in response
- Review n8n execution logs

---

## Quick Debug Commands

Check latest query in database:
```bash
npm run check-latest
```

Check specific response:
```bash
npm run check-response <response_id>
```

Switch back to mock mode:
```bash
# In .env.local, change:
USE_MOCK_N8N=true
# Then restart server
```

---

## Current Configuration

✅ **Mock Mode**: DISABLED (`USE_MOCK_N8N=false`)
✅ **Server**: Running at http://localhost:3002
✅ **Google Search Webhook**: https://free-n8n.anduin.center/webhook/17094fa1-9051-4eed-b0cb-f9d2fd48f7a1
✅ **Google AI Webhook**: https://free-n8n.anduin.center/webhook/152cb399-0f55-4bb0-9196-70c129f5486b

---

**Ready to test!** Update your n8n workflows first, then try submitting a search query. 🚀
