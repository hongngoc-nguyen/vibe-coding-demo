# Database Migration Instructions

## Step 1: Run the Migration in Supabase

You have two options:

### Option A: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project: https://supabase.com/dashboard/project/lqithgkebyqogoeynfmp
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**
4. Open the file `scripts/run-migration.sql` in this project
5. Copy all the SQL content
6. Paste it into the Supabase SQL Editor
7. Click **Run** (or press Cmd/Ctrl + Enter)
8. Wait for confirmation message "Success. No rows returned"

### Option B: Using Supabase CLI (if installed)

```bash
# If you have Supabase CLI installed
supabase db push
```

## Step 2: Verify Migration Success

After running the migration, you can verify it worked by running these queries in the SQL Editor:

### Check if tables exist:
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('user_search_queries', 'search_responses');
```
Expected result: 2 rows showing both table names

### Check if indexes exist:
```sql
SELECT indexname, tablename
FROM pg_indexes
WHERE tablename IN ('user_search_queries', 'search_responses')
ORDER BY tablename, indexname;
```
Expected result: 6 indexes total

### Check if RLS is enabled:
```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('user_search_queries', 'search_responses');
```
Expected result: Both tables should have `rowsecurity = true`

### Check policies:
```sql
SELECT tablename, policyname
FROM pg_policies
WHERE tablename IN ('user_search_queries', 'search_responses')
ORDER BY tablename, policyname;
```
Expected result: 5-6 policies total

## Step 3: Run the Test Script

Once the migration is complete, test the database setup:

```bash
npm run test:search-db
```

This will:
- ✅ Verify tables exist
- ✅ Test inserting a query
- ✅ Test updating query status
- ✅ Test inserting Google Search response
- ✅ Test inserting Google AI Mode response
- ✅ Test fetching queries with responses
- ✅ Test RLS policies
- ✅ Clean up test data

### Expected Output:

```
🧪 Starting Search Assistant Database Tests

============================================================

📋 Test 1: Checking if tables exist...
   ✓ user_search_queries table exists
   ✓ search_responses table exists

📝 Test 2: Inserting test search query...
   ✓ Query inserted with ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
   ✓ User ID: test_user_1234567890
   ✓ Status: pending

🔄 Test 3: Updating query status...
   ✓ Query status updated to: processing
   ✓ Updated at: 2025-10-27T12:34:56.789Z

🔍 Test 4: Inserting Google Search response...
   ✓ google_search response inserted
   ✓ Response ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
   ✓ Execution time: 723ms

🤖 Test 5: Inserting Google AI Mode response...
   ✓ google_ai_mode response inserted
   ✓ Response ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
   ✓ Execution time: 891ms

📊 Test 6: Fetching query with responses...
   ✓ Query fetched successfully
   ✓ Prompt: "What is the best legal software for small firms?"
   ✓ Found 2 responses
   ✓ - google_search: success (723ms)
   ✓ - google_ai_mode: success (891ms)

🔒 Test 7: Testing RLS policies...
   Testing anon access (should fail without auth)...
   ✓ Unauthenticated access correctly blocked
   ✓ Service role has full access

🧹 Test 8: Cleaning up test data...
   ✓ Test data cleaned up (query and responses deleted)

============================================================
✅ All tests passed successfully!
============================================================
```

## Troubleshooting

### Error: "relation user_search_queries does not exist"
**Solution**: The migration hasn't been run yet. Go back to Step 1.

### Error: "Missing Supabase environment variables"
**Solution**: Make sure your `.env.local` file has:
```
NEXT_PUBLIC_SUPABASE_URL=https://lqithgkebyqogoeynfmp.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### Error: "permission denied for table"
**Solution**: Make sure you're using the SERVICE_ROLE_KEY, not the ANON_KEY in the test script.

### Warning: "Unauthenticated access returned data"
**Solution**: RLS policies might not be set correctly. Re-run the RLS portion of the migration.

## Next Steps

After all tests pass:

1. ✅ Database is ready
2. ⬜ Set up n8n workflows (see `docs/N8N_SEARCH_ASSISTANT_SETUP.md`)
3. ⬜ Build Next.js API routes
4. ⬜ Create frontend components
5. ⬜ Test end-to-end integration
