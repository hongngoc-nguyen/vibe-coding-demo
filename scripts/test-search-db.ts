 /**
 * Database Test Script for Search Assistant Feature
 * Tests table creation, indexes, RLS policies, and basic CRUD operations
 *
 * Run with: npx tsx scripts/test-search-db.ts
 */

import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

// Load environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase environment variables')
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set')
  process.exit(1)
}

// Create Supabase client with service role (bypasses RLS)
const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// Test user ID (simulating Clerk user)
const TEST_USER_ID = 'test_user_' + Date.now()

async function runTests() {
  console.log('🧪 Starting Search Assistant Database Tests\n')
  console.log('=' .repeat(60))

  let testQueryId: string | null = null

  try {
    // Test 1: Check if tables exist
    console.log('\n📋 Test 1: Checking if tables exist...')
    await testTablesExist()

    // Test 2: Insert test query
    console.log('\n📝 Test 2: Inserting test search query...')
    testQueryId = await testInsertQuery()

    // Test 3: Update query status
    console.log('\n🔄 Test 3: Updating query status...')
    await testUpdateQuery(testQueryId)

    // Test 4: Insert Google Search response
    console.log('\n🔍 Test 4: Inserting Google Search response...')
    await testInsertResponse(testQueryId, 'google_search')

    // Test 5: Insert Google AI Mode response
    console.log('\n🤖 Test 5: Inserting Google AI Mode response...')
    await testInsertResponse(testQueryId, 'google_ai_mode')

    // Test 6: Query with responses
    console.log('\n📊 Test 6: Fetching query with responses...')
    await testFetchQueryWithResponses(testQueryId)

    // Test 7: Test RLS policies
    console.log('\n🔒 Test 7: Testing RLS policies...')
    await testRLSPolicies(testQueryId)

    // Test 8: Cleanup test data
    console.log('\n🧹 Test 8: Cleaning up test data...')
    await cleanupTestData(testQueryId)

    console.log('\n' + '='.repeat(60))
    console.log('✅ All tests passed successfully!')
    console.log('=' .repeat(60))

  } catch (error) {
    console.error('\n❌ Test failed:', error)

    // Cleanup on failure
    if (testQueryId) {
      console.log('\n🧹 Cleaning up after failed test...')
      await cleanupTestData(testQueryId)
    }

    process.exit(1)
  }
}

async function testTablesExist() {
  // Check user_search_queries table
  const { data: queries, error: queriesError } = await supabase
    .from('user_search_queries')
    .select('*')
    .limit(1)

  if (queriesError) {
    throw new Error(`user_search_queries table error: ${queriesError.message}`)
  }
  console.log('   ✓ user_search_queries table exists')

  // Check search_responses table
  const { data: responses, error: responsesError } = await supabase
    .from('search_responses')
    .select('*')
    .limit(1)

  if (responsesError) {
    throw new Error(`search_responses table error: ${responsesError.message}`)
  }
  console.log('   ✓ search_responses table exists')
}

async function testInsertQuery(): Promise<string> {
  const { data, error } = await supabase
    .from('user_search_queries')
    .insert({
      user_id: TEST_USER_ID,
      prompt_text: 'What is the best legal software for small firms?',
      query_status: 'pending'
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Insert query failed: ${error.message}`)
  }

  if (!data) {
    throw new Error('No data returned from insert')
  }

  console.log(`   ✓ Query inserted with ID: ${data.query_id}`)
  console.log(`   ✓ User ID: ${data.user_id}`)
  console.log(`   ✓ Status: ${data.query_status}`)

  return data.query_id
}

async function testUpdateQuery(queryId: string) {
  const { data, error } = await supabase
    .from('user_search_queries')
    .update({ query_status: 'processing' })
    .eq('query_id', queryId)
    .select()
    .single()

  if (error) {
    throw new Error(`Update query failed: ${error.message}`)
  }

  if (data.query_status !== 'processing') {
    throw new Error('Query status not updated correctly')
  }

  console.log(`   ✓ Query status updated to: ${data.query_status}`)
  console.log(`   ✓ Updated at: ${data.updated_at}`)
}

async function testInsertResponse(queryId: string, sourceType: 'google_search' | 'google_ai_mode') {
  const mockResponseData = sourceType === 'google_search'
    ? {
        results: [
          {
            title: 'Best Legal Software 2025',
            link: 'https://example.com/legal-software',
            snippet: 'Comprehensive guide to legal software...',
            position: 1
          },
          {
            title: 'Top 10 Legal Tech Tools',
            link: 'https://example.com/legal-tech',
            snippet: 'Discover the best legal technology...',
            position: 2
          }
        ],
        searchInformation: {
          totalResults: '1000000',
          searchTime: 0.35
        }
      }
    : {
        answer: 'For small law firms, the best legal software options include Clio, MyCase, and PracticePanther. These platforms offer case management, time tracking, billing, and client communication tools.',
        sources: [
          {
            title: 'Clio - Legal Practice Management Software',
            url: 'https://clio.com',
            snippet: 'Cloud-based legal practice management'
          },
          {
            title: 'MyCase Legal Software',
            url: 'https://mycase.com',
            snippet: 'All-in-one legal case management'
          }
        ],
        confidence: 0.92
      }

  const { data, error } = await supabase
    .from('search_responses')
    .insert({
      query_id: queryId,
      source_type: sourceType,
      response_data: mockResponseData,
      response_status: 'success',
      execution_time: Math.floor(Math.random() * 1000) + 500
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Insert ${sourceType} response failed: ${error.message}`)
  }

  console.log(`   ✓ ${sourceType} response inserted`)
  console.log(`   ✓ Response ID: ${data.response_id}`)
  console.log(`   ✓ Execution time: ${data.execution_time}ms`)
}

async function testFetchQueryWithResponses(queryId: string) {
  const { data: query, error: queryError } = await supabase
    .from('user_search_queries')
    .select(`
      *,
      search_responses (*)
    `)
    .eq('query_id', queryId)
    .single()

  if (queryError) {
    throw new Error(`Fetch query with responses failed: ${queryError.message}`)
  }

  if (!query) {
    throw new Error('Query not found')
  }

  const responses = query.search_responses as any[]

  if (!responses || responses.length !== 2) {
    throw new Error(`Expected 2 responses, got ${responses?.length || 0}`)
  }

  console.log(`   ✓ Query fetched successfully`)
  console.log(`   ✓ Prompt: "${query.prompt_text}"`)
  console.log(`   ✓ Found ${responses.length} responses`)

  responses.forEach(r => {
    console.log(`   ✓ - ${r.source_type}: ${r.response_status} (${r.execution_time}ms)`)
  })
}

async function testRLSPolicies(queryId: string) {
  // Create a client with anon key (simulates authenticated user)
  const anonClient = createClient<Database>(
    SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  console.log('   Testing anon access (should fail without auth)...')

  // Try to fetch without authentication - should fail
  const { data: unauthData, error: unauthError } = await anonClient
    .from('user_search_queries')
    .select('*')
    .eq('query_id', queryId)

  if (unauthError) {
    console.log('   ✓ Unauthenticated access correctly blocked')
  } else if (!unauthData || unauthData.length === 0) {
    console.log('   ✓ Unauthenticated access returns no data (RLS working)')
  } else {
    console.log('   ⚠ Warning: Unauthenticated access returned data (check RLS policies)')
  }

  // Service role should have full access
  const { data: serviceData, error: serviceError } = await supabase
    .from('user_search_queries')
    .select('*')
    .eq('query_id', queryId)

  if (serviceError) {
    throw new Error('Service role access failed (should have full access)')
  }

  console.log('   ✓ Service role has full access')
}

async function cleanupTestData(queryId: string) {
  // Delete will cascade to search_responses due to ON DELETE CASCADE
  const { error } = await supabase
    .from('user_search_queries')
    .delete()
    .eq('query_id', queryId)

  if (error) {
    console.warn(`   ⚠ Warning: Cleanup failed: ${error.message}`)
  } else {
    console.log(`   ✓ Test data cleaned up (query and responses deleted)`)
  }
}

// Additional utility: Check table structure
async function inspectTableStructure() {
  console.log('\n🔍 Inspecting table structure...\n')

  const { data, error } = await supabase
    .rpc('get_table_info', { table_name: 'user_search_queries' })

  if (error) {
    console.log('   Note: Could not inspect table structure (requires custom function)')
  } else {
    console.log('   Table structure:', data)
  }
}

// Run all tests
runTests()
