# N8N Workflows - Step-by-Step Update Instructions

## 🎯 Goal

Update both Google Search and Google AI Mode workflows to:
1. Accept `response_id` in webhook payload
2. Return plain TEXT in `response_data` (not JSON objects)
3. Return `response_id` in the response

---

## 📋 Before You Start

Open two browser tabs:
1. **Tab 1**: Your n8n instance at https://free-n8n.anduin.center
2. **Tab 2**: This guide

---

## Workflow 1: Google Search

### URL
`https://free-n8n.anduin.center/webhook/17094fa1-9051-4eed-b0cb-f9d2fd48f7a1`

### Step 1: Open the Workflow
1. Go to https://free-n8n.anduin.center
2. Find the workflow for "Google Search"
3. Click to open it

### Step 2: Find the Last Node
1. Scroll to the **very last node** in your workflow
2. This is usually a **Code** node or **Set** node before "Respond to Webhook"
3. You need to find the node that formats the final response

### Step 3: Update the Code Node

**REPLACE** the entire code in your last Code node with this:

```javascript
// ============================================
// UPDATED CODE FOR GOOGLE SEARCH WORKFLOW
// ============================================

// 1. Get webhook data (includes response_id!)
const webhookData = $('Webhook').item.json;

// 2. Get your Google Search API results
// (Adjust this based on your previous node name)
const searchResults = $input.all();

// 3. Format as PLAIN TEXT (not JSON!)
let formattedText = `Google Search Results for: "${webhookData.prompt_text}"\n\n`;
formattedText += '═'.repeat(75) + '\n\n';

// 4. Loop through each search result and format
searchResults.forEach((result, index) => {
  const item = result.json;

  formattedText += `Result #${index + 1}\n`;
  formattedText += '━'.repeat(60) + '\n';
  formattedText += `Title: ${item.title || 'No title'}\n`;
  formattedText += `URL: ${item.link || item.url || 'No URL'}\n\n`;

  // Add snippet/description
  if (item.snippet || item.description) {
    const desc = item.snippet || item.description;
    formattedText += `${desc}\n\n`;
  }
});

formattedText += '═'.repeat(75) + '\n';
formattedText += `About ${searchResults.length} results\n`;

// 5. Calculate execution time
const executionTime = Date.now() - $workflow.startedAt;

// 6. CRITICAL: Return the new format
return {
  success: true,
  query_id: webhookData.query_id,
  response_id: webhookData.response_id,  // ← MUST include this!
  response_data: formattedText,          // ← Plain text, not JSON object!
  execution_time: executionTime
};
```

### Step 4: Test the Workflow in N8N

1. Click the **"Execute Workflow"** button at the bottom
2. In the **Webhook node**, click "Test webhook" or use this test payload:

```json
{
  "query_id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "user_test",
  "prompt_text": "best legal practice management software",
  "response_id": "660e8400-e29b-41d4-a716-446655440001"
}
```

3. Check the **output** of the last Code node
4. You should see:
```json
{
  "success": true,
  "query_id": "550e8400-e29b-41d4-a716-446655440000",
  "response_id": "660e8400-e29b-41d4-a716-446655440001",
  "response_data": "Google Search Results for: \"best legal practice management software\"\n\n...",
  "execution_time": 1234
}
```

### Step 5: Make Sure "Respond to Webhook" is Configured

1. Find the **"Respond to Webhook"** node (should be after your Code node)
2. Make sure it's configured to:
   - **Response Mode**: "Webhook Response"
   - **Response Data**: "Using Fields Below"
   - Or just pass through the data from the Code node

### Step 6: Save and Activate

1. Click **"Save"** button (top right)
2. Make sure the workflow is **Active** (toggle switch at top)

---

## Workflow 2: Google AI Mode

### URL
`https://free-n8n.anduin.center/webhook/152cb399-0f55-4bb0-9196-70c129f5486b`

### Step 1: Open the Workflow
1. Find the workflow for "Google AI Mode"
2. Click to open it

### Step 2: Find the Last Node
1. Scroll to the **very last node** in your workflow
2. This is usually a **Code** node before "Respond to Webhook"

### Step 3: Update the Code Node

**REPLACE** the entire code in your last Code node with this:

```javascript
// ============================================
// UPDATED CODE FOR GOOGLE AI MODE WORKFLOW
// ============================================

// 1. Get webhook data (includes response_id!)
const webhookData = $('Webhook').item.json;

// 2. Get your AI API response
// (Adjust this based on your previous node name)
const aiResponse = $input.first().json;

// 3. Format as PLAIN TEXT (not JSON!)
let formattedText = `AI-Generated Answer for: "${webhookData.prompt_text}"\n\n`;

// Add the main answer
if (aiResponse.answer || aiResponse.text || aiResponse.response) {
  const answer = aiResponse.answer || aiResponse.text || aiResponse.response;
  formattedText += answer + '\n\n';
}

// Add sources if available
if (aiResponse.sources && Array.isArray(aiResponse.sources) && aiResponse.sources.length > 0) {
  formattedText += 'Sources:\n';
  formattedText += '━'.repeat(60) + '\n';

  aiResponse.sources.forEach((source, index) => {
    formattedText += `${index + 1}. ${source.title || 'Source ' + (index + 1)}\n`;
    formattedText += `   ${source.url || source.link || 'No URL'}\n`;

    if (source.snippet || source.description) {
      formattedText += `   ${source.snippet || source.description}\n`;
    }
    formattedText += '\n';
  });

  formattedText += '━'.repeat(60) + '\n';
}

// Add confidence score if available
if (aiResponse.confidence) {
  formattedText += `Confidence Score: ${Math.round(aiResponse.confidence * 100)}%`;
}

// 4. Calculate execution time
const executionTime = Date.now() - $workflow.startedAt;

// 5. CRITICAL: Return the new format
return {
  success: true,
  query_id: webhookData.query_id,
  response_id: webhookData.response_id,  // ← MUST include this!
  response_data: formattedText,          // ← Plain text, not JSON object!
  execution_time: executionTime
};
```

### Step 4: Test the Workflow in N8N

1. Click **"Execute Workflow"**
2. Use this test payload:

```json
{
  "query_id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "user_test",
  "prompt_text": "best legal practice management software",
  "response_id": "770e8400-e29b-41d4-a716-446655440002"
}
```

3. Check the output - should see `response_id` and plain text in `response_data`

### Step 5: Save and Activate

1. Click **"Save"**
2. Make sure workflow is **Active**

---

## ✅ Verification Checklist

After updating both workflows, verify:

### For Each Workflow:

- [ ] Code node updated with new code
- [ ] Test execution successful
- [ ] Output includes `response_id` field
- [ ] Output includes `query_id` field
- [ ] `response_data` is plain text (not JSON object)
- [ ] "Respond to Webhook" node is configured
- [ ] Workflow is saved
- [ ] Workflow is active (toggle on)

---

## 🧪 Test with Real App

After updating BOTH workflows:

1. **Update .env.local** on your local machine:
   ```bash
   USE_MOCK_N8N=false
   ```

2. **Restart your dev server**

3. **Go to**: http://localhost:3002/search-assistant

4. **Submit a test query**: "best legal software"

5. **Expected result**:
   - Loading spinners appear
   - After 2-5 seconds, results display
   - Both Google Search and AI Response show formatted text
   - No errors in browser console

---

## 🐛 Troubleshooting

### Issue: "Unexpected end of JSON input"

**Cause**: Workflow is not returning any response

**Fix**:
1. Check n8n execution logs for errors
2. Verify "Respond to Webhook" node exists and is connected
3. Make sure workflow is Active

### Issue: Still getting JSON parsing errors

**Cause**: Workflow is returning wrong format

**Fix**:
1. Open n8n execution logs
2. Check what the Code node is actually returning
3. Verify you're using the new code above
4. Make sure `response_data` is a STRING, not an object

### Issue: Results display but no data shown

**Cause**: `response_data` is empty string

**Fix**:
1. Check your API node before the Code node
2. Verify it's returning data
3. Check field names match (e.g., `item.title` vs `item.name`)

---

## 📝 Important Notes

### Field Name Mapping

Your API might return different field names. Adjust these in the code:

**Common variations**:
- `title` → might be `name`, `heading`, `title`
- `link` → might be `url`, `href`, `link`
- `snippet` → might be `description`, `text`, `excerpt`

**Example adjustment**:
```javascript
// If your API returns "name" instead of "title"
formattedText += `Title: ${item.name || 'No title'}\n`;

// If your API returns "href" instead of "link"
formattedText += `URL: ${item.href || 'No URL'}\n\n`;
```

### Testing Individual Workflows

You can test each workflow independently in n8n:
1. Click the "Webhook" node
2. Click "Listen for test event" or "Execute workflow"
3. Use curl or Postman to send the test payload
4. Check the output in n8n's execution view

---

## 🎉 Success Criteria

You'll know it's working when:

1. ✅ N8N execution logs show successful runs
2. ✅ Your app displays formatted text results
3. ✅ No errors in browser console
4. ✅ Both Google Search and AI Response display
5. ✅ Search history updates with new queries

---

**Need help?** Check `N8N_TROUBLESHOOTING.md` or review the full guide in `N8N_TEXT_FORMAT_GUIDE.md`
