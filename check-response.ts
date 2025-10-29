import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function checkResponse() {
  const responseId = '8bfa089b-87e8-465a-9d31-8ef0983ff249'

  console.log('🔍 Checking response:', responseId)
  console.log('='.repeat(60))

  // Get the response details
  const { data: response, error } = await supabase
    .from('search_responses')
    .select('*')
    .eq('response_id', responseId)
    .single()

  if (error) {
    console.log('❌ Error fetching response:', error.message)
    return
  }

  if (!response) {
    console.log('❌ Response not found')
    return
  }

  console.log('\n📋 Response Details:')
  console.log('Response ID:', response.response_id)
  console.log('Query ID:', response.query_id)
  console.log('Source Type:', response.source_type)
  console.log('Status:', response.response_status)
  console.log('Execution Time:', response.execution_time, 'ms')
  console.log('Created:', response.created_at)

  if (response.error_message) {
    console.log('\n❌ ERROR MESSAGE:')
    console.log(response.error_message)
  }

  console.log('\n📦 Response Data:')
  console.log(JSON.stringify(response.response_data, null, 2))

  // Get the associated query
  console.log('\n' + '='.repeat(60))
  console.log('📝 Associated Query:')

  const { data: query, error: queryError } = await supabase
    .from('user_search_queries')
    .select('*')
    .eq('query_id', response.query_id)
    .single()

  if (queryError) {
    console.log('❌ Error fetching query:', queryError.message)
    return
  }

  console.log('Query ID:', query.query_id)
  console.log('User ID:', query.user_id)
  console.log('Status:', query.query_status)
  console.log('Prompt:', query.prompt_text)
  console.log('Created:', query.created_at)
  console.log('Updated:', query.updated_at)

  // Get all responses for this query
  console.log('\n' + '='.repeat(60))
  console.log('📊 All Responses for this Query:')

  const { data: allResponses } = await supabase
    .from('search_responses')
    .select('*')
    .eq('query_id', response.query_id)
    .order('created_at', { ascending: true })

  if (allResponses) {
    allResponses.forEach((r, i) => {
      console.log(`\n${i + 1}. ${r.source_type}`)
      console.log(`   Status: ${r.response_status}`)
      console.log(`   Error: ${r.error_message || 'None'}`)
      console.log(`   Execution: ${r.execution_time}ms`)
    })
  }
}

checkResponse().then(() => process.exit(0))
