# N8N Search Assistant Workflow Setup Guide

## Overview
This document provides detailed instructions for setting up the n8n workflows that power the Search Assistant feature.

---

## Workflow IDs
- **Google AI Mode**: `da1fe02d-2a0c-4c04-a082-6fe722c9684f`
- **Google Search**: `17094fa1-9051-4eed-b0cb-f9d2fd48f7a1`

---

## Database Tables

### `user_search_queries`
Stores user prompts and query status.

| Column | Type | Description |
|--------|------|-------------|
| query_id | UUID | Primary key |
| user_id | TEXT | Clerk user ID |
| prompt_text | TEXT | User's search query |
| query_status | TEXT | Status: pending, processing, completed, failed |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

### `search_responses`
Stores responses from both Google Search and Google AI Mode.

| Column | Type | Description |
|--------|------|-------------|
| response_id | UUID | Primary key |
| query_id | UUID | Foreign key to user_search_queries |
| source_type | TEXT | 'google_search' or 'google_ai_mode' |
| response_data | JSONB | Raw response data |
| response_status | TEXT | 'success' or 'failed' |
| execution_time | INTEGER | Execution time in milliseconds |
| error_message | TEXT | Error message if failed |
| created_at | TIMESTAMPTZ | Creation timestamp |

---

## Supabase Connection

### Connection Details
- **URL**: `https://lqithgkebyqogoeynfmp.supabase.co`
- **Anon Key**: Available in `.env.local`
- **Service Role Key**: Available in `.env.local` (use this for n8n)

**Important**: Use the **Service Role Key** in n8n to bypass RLS policies.

---

## Workflow 1: Google AI Mode

### Webhook URL
```
https://your-n8n-instance.com/webhook/da1fe02d-2a0c-4c04-a082-6fe722c9684f
```

### Expected Input (POST)
```json
{
  "query_id": "uuid-generated-by-frontend",
  "user_id": "clerk_user_id",
  "prompt_text": "User's search query here"
}
```

### Workflow Steps

#### 1. Webhook Node
- **Method**: POST
- **Path**: `/webhook/da1fe02d-2a0c-4c04-a082-6fe722c9684f`
- **Response Mode**: When Last Node Finishes

#### 2. Update Query Status to 'processing'
- **Node Type**: Supabase
- **Operation**: Update
- **Table**: `user_search_queries`
- **Filter**: `query_id` = `{{$json.query_id}}`
- **Update Data**:
  ```json
  {
    "query_status": "processing"
  }
  ```

#### 3. Google AI Mode API Call
- **Node Type**: HTTP Request or Google Custom Search
- **Method**: POST/GET
- **URL**: Your Google AI Mode API endpoint
- **Body/Query**:
  ```json
  {
    "query": "{{$json.prompt_text}}"
  }
  ```
- **Store execution start time** for calculating execution_time

#### 4. Transform Response
- **Node Type**: Code/Function
- **Purpose**: Format the response data into a consistent structure
- **Output Example**:
  ```json
  {
    "answer": "AI generated answer...",
    "sources": [
      {
        "title": "Source Title",
        "url": "https://example.com",
        "snippet": "Relevant snippet..."
      }
    ],
    "raw": {} // Original response
  }
  ```
- **Calculate execution_time**: `Date.now() - startTime`

#### 5. Insert Response to Database
- **Node Type**: Supabase
- **Operation**: Insert
- **Table**: `search_responses`
- **Data**:
  ```json
  {
    "query_id": "{{$json.query_id}}",
    "source_type": "google_ai_mode",
    "response_data": "{{$json.formattedResponse}}",
    "response_status": "success",
    "execution_time": "{{$json.execution_time}}"
  }
  ```

#### 6. Update Query Status to 'completed'
- **Node Type**: Supabase
- **Operation**: Update
- **Table**: `user_search_queries`
- **Filter**: `query_id` = `{{$json.query_id}}`
- **Update Data**:
  ```json
  {
    "query_status": "completed"
  }
  ```

#### 7. Return Response
- **Node Type**: Respond to Webhook
- **Status Code**: 200
- **Body**:
  ```json
  {
    "success": true,
    "query_id": "{{$json.query_id}}",
    "source_type": "google_ai_mode",
    "response_data": "{{$json.formattedResponse}}",
    "execution_time": "{{$json.execution_time}}"
  }
  ```

### Error Handling

Add an **Error Trigger** node that catches failures:

#### On Error:
1. **Insert Failed Response**
   - **Table**: `search_responses`
   - **Data**:
     ```json
     {
       "query_id": "{{$json.query_id}}",
       "source_type": "google_ai_mode",
       "response_data": {},
       "response_status": "failed",
       "error_message": "{{$json.error.message}}"
     }
     ```

2. **Update Query Status to 'failed'**
   - **Table**: `user_search_queries`
   - **Filter**: `query_id` = `{{$json.query_id}}`
   - **Data**:
     ```json
     {
       "query_status": "failed"
     }
     ```

3. **Return Error Response**
   - **Status Code**: 500
   - **Body**:
     ```json
     {
       "success": false,
       "query_id": "{{$json.query_id}}",
       "error": "{{$json.error.message}}"
     }
     ```

---

## Workflow 2: Google Search

### Webhook URL
```
https://your-n8n-instance.com/webhook/17094fa1-9051-4eed-b0cb-f9d2fd48f7a1
```

### Expected Input (POST)
```json
{
  "query_id": "uuid-from-user-search-queries",
  "user_id": "clerk_user_id",
  "prompt_text": "User's search query here"
}
```

### Workflow Steps

#### 1. Webhook Node
- **Method**: POST
- **Path**: `/webhook/17094fa1-9051-4eed-b0cb-f9d2fd48f7a1`
- **Response Mode**: When Last Node Finishes

#### 2. Google Search API Call
- **Node Type**: HTTP Request / Google Custom Search API
- **Method**: GET
- **URL**: `https://www.googleapis.com/customsearch/v1`
- **Query Parameters**:
  ```
  key: YOUR_GOOGLE_API_KEY
  cx: YOUR_SEARCH_ENGINE_ID
  q: {{$json.prompt_text}}
  num: 10
  ```

#### 3. Transform Response
- **Node Type**: Code/Function
- **Purpose**: Format Google Search results
- **Output Example**:
  ```json
  {
    "results": [
      {
        "title": "Page Title",
        "link": "https://example.com",
        "snippet": "Description snippet...",
        "position": 1
      }
    ],
    "searchInformation": {
      "totalResults": "1000000",
      "searchTime": 0.25
    },
    "raw": {} // Original response
  }
  ```

#### 4. Insert Response to Database
- **Node Type**: Supabase
- **Operation**: Insert
- **Table**: `search_responses`
- **Data**:
  ```json
  {
    "query_id": "{{$json.query_id}}",
    "source_type": "google_search",
    "response_data": "{{$json.formattedResponse}}",
    "response_status": "success",
    "execution_time": "{{$json.execution_time}}"
  }
  ```

#### 5. Return Response
- **Node Type**: Respond to Webhook
- **Status Code**: 200
- **Body**:
  ```json
  {
    "success": true,
    "query_id": "{{$json.query_id}}",
    "source_type": "google_search",
    "response_data": "{{$json.formattedResponse}}",
    "execution_time": "{{$json.execution_time}}"
  }
  ```

### Error Handling
Same as Google AI Mode workflow - catch errors and store failed responses.

---

## Integration Strategy

### Option 1: Sequential Calls (Recommended)
The Next.js API route calls both workflows sequentially:

1. Frontend submits prompt
2. Backend creates query record in `user_search_queries` with status 'pending'
3. Backend calls Google AI Mode workflow (webhook 1)
4. Backend calls Google Search workflow (webhook 2)
5. Both workflows store their responses in `search_responses`
6. Backend returns combined results to frontend

**Pros**:
- Better error handling
- Can show partial results
- More control over flow

### Option 2: Parallel Calls
Call both workflows simultaneously using `Promise.all()`.

**Pros**:
- Faster overall response time
- Both responses arrive together

**Cons**:
- If one fails, need to handle partial results

### Option 3: Async/Polling
N8N workflows write directly to database, frontend polls for results.

**Pros**:
- Non-blocking
- Can show "processing" state

**Cons**:
- More complex frontend logic
- Requires polling mechanism

**Recommendation**: Start with **Option 1** for reliability.

---

## Testing Workflows

### Test with cURL

**Google AI Mode:**
```bash
curl -X POST https://your-n8n-instance.com/webhook/da1fe02d-2a0c-4c04-a082-6fe722c9684f \
  -H "Content-Type: application/json" \
  -d '{
    "query_id": "test-123",
    "user_id": "test-user",
    "prompt_text": "What is the best legal software?"
  }'
```

**Google Search:**
```bash
curl -X POST https://your-n8n-instance.com/webhook/17094fa1-9051-4eed-b0cb-f9d2fd48f7a1 \
  -H "Content-Type: application/json" \
  -d '{
    "query_id": "test-123",
    "user_id": "test-user",
    "prompt_text": "legal software comparison"
  }'
```

### Verify in Supabase

After running tests, check the database:

```sql
-- View queries
SELECT * FROM user_search_queries ORDER BY created_at DESC LIMIT 10;

-- View responses
SELECT * FROM search_responses ORDER BY created_at DESC LIMIT 10;

-- View query with responses
SELECT
  q.query_id,
  q.prompt_text,
  q.query_status,
  r.source_type,
  r.response_status,
  r.execution_time
FROM user_search_queries q
LEFT JOIN search_responses r ON q.query_id = r.query_id
ORDER BY q.created_at DESC;
```

---

## Environment Variables

Add these to n8n environment or credentials:

```
SUPABASE_URL=https://lqithgkebyqogoeynfmp.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GOOGLE_API_KEY=your_google_api_key
GOOGLE_SEARCH_ENGINE_ID=your_cx_id
```

---

## Next Steps

1. ✅ Run the migration SQL in Supabase dashboard
2. ⬜ Set up n8n workflows following this guide
3. ⬜ Test workflows with sample data
4. ⬜ Verify data appears correctly in Supabase
5. ⬜ Document actual response formats from your APIs
6. ⬜ Proceed with Next.js API route implementation

---

## Troubleshooting

### Issue: RLS prevents n8n from writing to database
**Solution**: Ensure you're using the **Service Role Key**, not the Anon Key.

### Issue: Responses not showing in queries
**Solution**: Check foreign key relationships - `query_id` must match between tables.

### Issue: Workflow times out
**Solution**:
- Increase n8n workflow timeout
- Add timeout handling to HTTP Request nodes
- Store partial results even on timeout

### Issue: Invalid JSON in response_data
**Solution**: Ensure data is properly JSON stringified before storing in JSONB field.

---

## Support

For questions or issues:
- Check n8n workflow execution logs
- Review Supabase database logs
- Test workflows individually before integration
