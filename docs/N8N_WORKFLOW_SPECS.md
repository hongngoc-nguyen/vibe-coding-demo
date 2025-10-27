# N8N Workflow Specifications for Search Assistant

## ⚠️ IMPORTANT: Read This First

This document contains the **EXACT** specifications your n8n workflows must follow to integrate with the Search Assistant frontend.

---

## 🔗 Workflow IDs

- **Google AI Mode**: `da1fe02d-2a0c-4c04-a082-6fe722c9684f`
- **Google Search**: `17094fa1-9051-4eed-b0cb-f9d2fd48f7a1`

---

## 📥 Input Format (Both Workflows)

Both workflows receive the same input structure via POST request:

```json
{
  "query_id": "217104da-ea04-42ba-9dda-0aa9f9f7e16b",
  "user_id": "user_2abc123xyz",
  "prompt_text": "What is the best legal software for small firms?"
}
```

### Field Descriptions:
- `query_id` (string, UUID): Unique identifier for this search query, already created in database
- `user_id` (string): Clerk user ID of the user who submitted the query
- `prompt_text` (string): The actual search query/prompt entered by the user

---

## 📤 Output Format: Google AI Mode Workflow

### Success Response

```json
{
  "success": true,
  "query_id": "217104da-ea04-42ba-9dda-0aa9f9f7e16b",
  "source_type": "google_ai_mode",
  "response_data": {
    "answer": "For small law firms, the best legal software options include Clio, MyCase, and PracticePanther. These platforms offer case management, time tracking, billing, and client communication tools. Clio is the most popular choice with comprehensive features and integrations. MyCase offers excellent value for money with user-friendly interfaces. PracticePanther excels in automation and workflow management.",
    "sources": [
      {
        "title": "Clio - Legal Practice Management Software",
        "url": "https://clio.com",
        "snippet": "Cloud-based legal practice management software trusted by 150,000+ legal professionals"
      },
      {
        "title": "MyCase Legal Software Review",
        "url": "https://www.mycase.com",
        "snippet": "All-in-one legal case management with billing, time tracking, and client portal"
      },
      {
        "title": "PracticePanther Features",
        "url": "https://www.practicepanther.com",
        "snippet": "Legal practice management with powerful automation and customization"
      }
    ],
    "confidence": 0.92
  },
  "execution_time": 1847,
  "error": null
}
```

### Field Requirements:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `success` | boolean | ✅ Yes | Must be `true` for successful responses |
| `query_id` | string | ✅ Yes | Must match the input `query_id` |
| `source_type` | string | ✅ Yes | Must be exactly `"google_ai_mode"` |
| `response_data` | object | ✅ Yes | Contains the AI-generated response |
| `response_data.answer` | string | ✅ Yes | The main AI-generated answer text |
| `response_data.sources` | array | ⚠️ Optional | Array of source objects |
| `response_data.sources[].title` | string | ⚠️ Optional | Source title |
| `response_data.sources[].url` | string | ⚠️ Optional | Source URL |
| `response_data.sources[].snippet` | string | ⚠️ Optional | Brief description |
| `response_data.confidence` | number | ⚠️ Optional | Confidence score (0-1) |
| `execution_time` | number | ✅ Yes | Execution time in milliseconds |
| `error` | string\|null | ✅ Yes | Must be `null` on success |

### Error Response

```json
{
  "success": false,
  "query_id": "217104da-ea04-42ba-9dda-0aa9f9f7e16b",
  "source_type": "google_ai_mode",
  "error": "API rate limit exceeded. Please try again later."
}
```

---

## 📤 Output Format: Google Search Workflow

### Success Response

```json
{
  "success": true,
  "query_id": "217104da-ea04-42ba-9dda-0aa9f9f7e16b",
  "source_type": "google_search",
  "response_data": {
    "results": [
      {
        "title": "Best Legal Software for Small Firms - 2025 Guide",
        "link": "https://example.com/legal-software-guide",
        "snippet": "Comprehensive guide to choosing legal practice management software. Compare features, pricing, and user reviews...",
        "position": 1
      },
      {
        "title": "Top 10 Legal Practice Management Software",
        "link": "https://example.com/top-10-legal-software",
        "snippet": "Discover the best legal software solutions for attorneys and law firms...",
        "position": 2
      },
      {
        "title": "Legal Tech Reviews | Attorney Software Comparison",
        "link": "https://example.com/legal-tech-reviews",
        "snippet": "In-depth reviews of legal technology platforms. Compare case management, billing...",
        "position": 3
      }
    ],
    "searchInformation": {
      "totalResults": "1,250,000",
      "searchTime": 0.42
    }
  },
  "execution_time": 856,
  "error": null
}
```

### Field Requirements:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `success` | boolean | ✅ Yes | Must be `true` for successful responses |
| `query_id` | string | ✅ Yes | Must match the input `query_id` |
| `source_type` | string | ✅ Yes | Must be exactly `"google_search"` |
| `response_data` | object | ✅ Yes | Contains search results |
| `response_data.results` | array | ✅ Yes | Array of search result objects (min 1) |
| `response_data.results[].title` | string | ✅ Yes | Page title |
| `response_data.results[].link` | string | ✅ Yes | URL to the page |
| `response_data.results[].snippet` | string | ✅ Yes | Description/snippet |
| `response_data.results[].position` | number | ⚠️ Optional | Result position (1-based) |
| `response_data.searchInformation` | object | ⚠️ Optional | Metadata about search |
| `response_data.searchInformation.totalResults` | string | ⚠️ Optional | Total results found |
| `response_data.searchInformation.searchTime` | number | ⚠️ Optional | Search time in seconds |
| `execution_time` | number | ✅ Yes | Execution time in milliseconds |
| `error` | string\|null | ✅ Yes | Must be `null` on success |

### Error Response

```json
{
  "success": false,
  "query_id": "217104da-ea04-42ba-9dda-0aa9f9f7e16b",
  "source_type": "google_search",
  "error": "Search API quota exceeded"
}
```

---

## 🔧 Implementation Checklist

### For Each Workflow:

- [ ] **Webhook node** configured to accept POST requests
- [ ] **Input validation** - Check for required fields (`query_id`, `user_id`, `prompt_text`)
- [ ] **API call** to Google service (Search API or AI Mode API)
- [ ] **Response transformation** - Format response to match spec above
- [ ] **Execution time tracking** - Calculate and include `execution_time`
- [ ] **Error handling** - Catch errors and return proper error response
- [ ] **Response formatting** - Ensure exact JSON structure matches spec
- [ ] **Testing** - Test with sample data and verify output format

### Database Integration (Done by API, Not Workflows):

The workflows **DO NOT** need to write to the database. The Next.js API routes handle all database operations:
1. API creates query in database before calling workflows
2. API receives workflow responses
3. API stores responses in database

This separation keeps workflows simple and focused on calling Google APIs.

---

## 🧪 Testing Your Workflows

### Test with cURL:

```bash
# Test Google AI Mode Workflow
curl -X POST https://your-n8n-instance.com/webhook/da1fe02d-2a0c-4c04-a082-6fe722c9684f \
  -H "Content-Type: application/json" \
  -d '{
    "query_id": "test-' + $(uuidgen) + '",
    "user_id": "test-user",
    "prompt_text": "What is the best legal software for small firms?"
  }'

# Test Google Search Workflow
curl -X POST https://your-n8n-instance.com/webhook/17094fa1-9051-4eed-b0cb-f9d2fd48f7a1 \
  -H "Content-Type: application/json" \
  -d '{
    "query_id": "test-' + $(uuidgen) + '",
    "user_id": "test-user",
    "prompt_text": "legal software comparison"
  }'
```

### Validate Response:

1. ✅ Check `success` field is boolean
2. ✅ Check `query_id` matches input
3. ✅ Check `source_type` is correct literal string
4. ✅ Check `response_data` structure matches spec
5. ✅ Check `execution_time` is a number
6. ✅ Check `error` field exists (null or string)

---

## 🚨 Common Mistakes to Avoid

### ❌ Wrong:
```json
{
  "status": "success",  // Should be "success": true
  "data": { ... },      // Should be "response_data": { ... }
  "type": "ai"          // Should be "source_type": "google_ai_mode"
}
```

### ✅ Correct:
```json
{
  "success": true,
  "source_type": "google_ai_mode",
  "response_data": { ... }
}
```

### ❌ Wrong: Missing required fields
```json
{
  "success": true,
  "response_data": { ... }
  // Missing: query_id, source_type, execution_time, error
}
```

### ✅ Correct: All required fields present
```json
{
  "success": true,
  "query_id": "...",
  "source_type": "...",
  "response_data": { ... },
  "execution_time": 1234,
  "error": null
}
```

---

## 📋 Environment Setup

Add these to your `.env.local` file:

```bash
# N8N Webhook URLs - Update with your actual URLs
N8N_GOOGLE_AI_WEBHOOK_URL=https://your-n8n-instance.com/webhook/da1fe02d-2a0c-4c04-a082-6fe722c9684f
N8N_GOOGLE_SEARCH_WEBHOOK_URL=https://your-n8n-instance.com/webhook/17094fa1-9051-4eed-b0cb-f9d2fd48f7a1

# Optional: Workflow timeout (default: 30000ms / 30 seconds)
N8N_WEBHOOK_TIMEOUT=30000

# Set to 'true' to use mock responses for testing without n8n
USE_MOCK_N8N=false
```

---

## 🎯 Quick Reference

### Google AI Mode Response Template:
```json
{
  "success": true,
  "query_id": "{{input.query_id}}",
  "source_type": "google_ai_mode",
  "response_data": {
    "answer": "{{ai_answer}}",
    "sources": [/* array of sources */],
    "confidence": 0.92
  },
  "execution_time": {{calc_execution_time}},
  "error": null
}
```

### Google Search Response Template:
```json
{
  "success": true,
  "query_id": "{{input.query_id}}",
  "source_type": "google_search",
  "response_data": {
    "results": [/* array of results */],
    "searchInformation": {
      "totalResults": "{{total}}",
      "searchTime": {{time}}
    }
  },
  "execution_time": {{calc_execution_time}},
  "error": null
}
```

---

## 📞 Need Help?

If the frontend isn't receiving the expected data:

1. Check n8n execution logs for errors
2. Verify response JSON matches spec exactly
3. Test workflows with cURL independently
4. Enable mock mode (`USE_MOCK_N8N=true`) to test frontend without n8n

Mock responses are already implemented in `lib/n8n.ts` and match the exact spec above.
