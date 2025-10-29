import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function checkLatestSearch() {
  console.log('🔍 Checking Latest Search Queries')
  console.log('='.repeat(60))

  // Get the most recent queries
  const { data: queries, error } = await supabase
    .from('user_search_queries')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5)

  if (error) {
    console.log('❌ Error fetching queries:', error.message)
    return
  }

  if (!queries || queries.length === 0) {
    console.log('❌ No queries found')
    return
  }

  console.log(`\n📊 Found ${queries.length} recent queries\n`)

  for (const query of queries) {
    console.log('='.repeat(60))
    console.log('📝 Query Details:')
    console.log('Query ID:', query.query_id)
    console.log('User ID:', query.user_id)
    console.log('Status:', query.query_status)
    console.log('Prompt:', query.prompt_text)
    console.log('Created:', new Date(query.created_at).toLocaleString())
    console.log('Updated:', new Date(query.updated_at).toLocaleString())

    // Get responses for this query
    const { data: responses } = await supabase
      .from('search_responses')
      .select('*')
      .eq('query_id', query.query_id)
      .order('created_at', { ascending: true })

    if (responses && responses.length > 0) {
      console.log('\n📡 Responses:')
      responses.forEach((r, i) => {
        console.log(`\n  ${i + 1}. ${r.source_type}`)
        console.log(`     Response ID: ${r.response_id}`)
        console.log(`     Status: ${r.response_status}`)
        console.log(`     Execution Time: ${r.execution_time || 'N/A'}ms`)

        if (r.error_message) {
          console.log(`     ❌ Error: ${r.error_message}`)
        } else if (r.response_status === 'success') {
          console.log(`     ✅ Success`)

          // Show a preview of the response data
          const data = r.response_data
          if (data) {
            if (r.source_type === 'google_search') {
              const results = data.results || []
              console.log(`     Results count: ${results.length}`)
              if (results.length > 0) {
                console.log(`     First result: ${results[0].title}`)
              }
            } else if (r.source_type === 'google_ai_mode') {
              const answer = data.answer || ''
              console.log(`     Answer length: ${answer.length} chars`)
              console.log(`     Answer preview: ${answer.substring(0, 100)}...`)
            }
          }
        }
      })
    } else {
      console.log('\n⚠️  No responses found for this query')
    }

    console.log()
  }
}

checkLatestSearch().then(() => process.exit(0))
