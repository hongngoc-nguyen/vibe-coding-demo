# N8N Workflow Code - WITHOUT execution_time

## ✅ SIMPLIFIED VERSION - Copy This Exact Code

Since you can't calculate execution_time in n8n, here's the simplified version that works perfectly.

---

## Google Search Workflow

### Webhook URL:
`https://free-n8n.anduin.center/webhook/17094fa1-9051-4eed-b0cb-f9d2fd48f7a1`

### Code for Your Last Code Node:

```javascript
// Get webhook data
const webhookData = $('Webhook').item.json;

// Get your search results (adjust node name if needed)
const searchResults = $input.all();

// Format as plain text
let formattedText = '';

searchResults.forEach((result, index) => {
  const item = result.json;

  formattedText += `Title: ${item.title || 'No title'}\n`;
  formattedText += `Link: ${item.link || item.url || 'No URL'}\n`;

  if (item.snippet || item.description) {
    formattedText += `Snippet: ${item.snippet || item.description}\n`;
  }

  if (item.highlighted) {
    formattedText += `Highlighted: ${item.highlighted}\n`;
  }

  if (item.source) {
    formattedText += `Source: ${item.source}\n`;
  }

  formattedText += '\n'; // Blank line between results
});

// RETURN THIS FORMAT - EXACTLY AS IS!
return {
  success: true,
  query_id: webhookData.query_id,
  response_id: webhookData.response_id,
  source_type: 'google_search',
  response_data: formattedText
};
```

---

## Google AI Mode Workflow

### Webhook URL:
`https://free-n8n.anduin.center/webhook/152cb399-0f55-4bb0-9196-70c129f5486b`

### Code for Your Last Code Node:

```javascript
// Get webhook data
const webhookData = $('Webhook').item.json;

// Get your AI response (adjust node name if needed)
const aiResponse = $input.first().json;

// Format as plain text
let formattedText = '';

// Add the AI response text
if (aiResponse.response_data) {
  formattedText = aiResponse.response_data;
} else if (aiResponse.text || aiResponse.answer) {
  formattedText = aiResponse.text || aiResponse.answer;
} else {
  formattedText = 'No AI response generated';
}

// RETURN THIS FORMAT - EXACTLY AS IS!
return {
  success: true,
  query_id: webhookData.query_id,
  response_id: webhookData.response_id,
  source_type: 'google_ai_mode',
  response_data: formattedText
};
```

---

## 📋 Checklist

After updating both workflows:

### For BOTH Workflows:

1. ✅ Code node is the LAST node (no "Respond to Webhook" after it)
2. ✅ Code returns exactly 4 fields:
   - `success: true`
   - `query_id: webhookData.query_id`
   - `response_id: webhookData.response_id`
   - `source_type: 'google_search'` or `'google_ai_mode'`
   - `response_data: formattedText`
3. ✅ Workflow is saved
4. ✅ Workflow is active

---

## 🧪 Test

Run this command to test your updated workflows:

```bash
node test-n8n-webhooks.js
```

### Expected Output:

```
✅ Valid JSON received:
{
  "success": true,
  "query_id": "550e8400-e29b-41d4-a716-446655440000",
  "response_id": "660e8400-e29b-41d4-a716-446655440001",
  "source_type": "google_search",
  "response_data": "Title: ...\nLink: ...\n..."
}

✓ Has 'success' field: true
✓ Has 'query_id' field: 550e8400-e29b-41d4-a716-446655440000
✓ Has 'response_id' field: 660e8400-e29b-41d4-a716-446655440001
✓ Has 'source_type' field: google_search
✓ Has 'response_data' field
```

---

## ⚠️ Common Mistakes

### ❌ DON'T return only response_data:
```javascript
// WRONG!
return {
  response_data: formattedText
};
```

### ✅ DO return all 5 fields:
```javascript
// CORRECT!
return {
  success: true,
  query_id: webhookData.query_id,
  response_id: webhookData.response_id,
  source_type: 'google_search',
  response_data: formattedText
};
```

### ❌ DON'T have "Respond to Webhook" node after Code node

### ✅ DO make Code node the LAST node in workflow

---

## 🎯 What This Fixes

- ✅ Removes `execution_time` requirement
- ✅ Adds `source_type` field (required by app)
- ✅ Returns all required fields
- ✅ Works with your existing API/search nodes

---

**Copy the code above EXACTLY into your n8n Code nodes, then test!**
