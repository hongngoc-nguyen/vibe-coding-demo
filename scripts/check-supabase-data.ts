import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkData() {
  console.log('🔍 Checking Supabase Data...\n')

  // Check citation_listing table
  console.log('📊 Checking citation_listing table...')
  const { data: citations, error: citationsError } = await supabase
    .from('citation_listing')
    .select('*')
    .limit(5)

  if (citationsError) {
    console.log('❌ Error:', citationsError.message)
  } else {
    console.log(`✅ Found ${citations?.length || 0} citations (showing first 5)`)
    console.log(JSON.stringify(citations, null, 2))
  }

  console.log('\n' + '='.repeat(80) + '\n')

  // Check entities table
  console.log('📊 Checking entities table...')
  const { data: entities, error: entitiesError } = await supabase
    .from('entities')
    .select('*')
    .limit(10)

  if (entitiesError) {
    console.log('❌ Error:', entitiesError.message)
  } else {
    console.log(`✅ Found ${entities?.length || 0} entities (showing first 10)`)
    console.log(JSON.stringify(entities, null, 2))
  }

  console.log('\n' + '='.repeat(80) + '\n')

  // Check responses table
  console.log('📊 Checking responses table...')
  const { data: responses, error: responsesError } = await supabase
    .from('responses')
    .select('response_date')
    .order('response_date', { ascending: false })
    .limit(10)

  if (responsesError) {
    console.log('❌ Error:', responsesError.message)
  } else {
    console.log(`✅ Found response dates:`)
    console.log(JSON.stringify(responses, null, 2))
  }

  console.log('\n' + '='.repeat(80) + '\n')

  // Check prompts table
  console.log('📊 Checking prompts table...')
  const { data: prompts, error: promptsError } = await supabase
    .from('prompts')
    .select('prompt_cluster')
    .limit(10)

  if (promptsError) {
    console.log('❌ Error:', promptsError.message)
  } else {
    console.log(`✅ Found ${prompts?.length || 0} prompts (showing first 10 clusters)`)
    const uniqueClusters = [...new Set(prompts?.map(p => p.prompt_cluster))]
    console.log('Unique clusters:', uniqueClusters)
  }

  console.log('\n' + '='.repeat(80) + '\n')

  // Test the actual query from trends API
  console.log('📊 Testing trends API query...')
  const { data: trendData, error: trendError } = await supabase
    .from('citation_listing')
    .select(`
      url,
      responses!inner(response_date),
      entities!inner(canonical_name)
    `)
    .eq('entities.canonical_name', 'Anduin')
    .order('responses(response_date)', { ascending: true })

  if (trendError) {
    console.log('❌ Error:', trendError.message)
    console.log('Full error:', JSON.stringify(trendError, null, 2))
  } else {
    console.log(`✅ Found ${trendData?.length || 0} Anduin citations`)
    if (trendData && trendData.length > 0) {
      console.log('Sample:', JSON.stringify(trendData.slice(0, 3), null, 2))
    }
  }

  console.log('\n' + '='.repeat(80) + '\n')

  // Test summary API query
  console.log('📊 Testing summary API query...')
  const { data: dates, error: datesError } = await supabase
    .from('responses')
    .select('response_date')
    .order('response_date', { ascending: false })
    .limit(2)

  if (datesError) {
    console.log('❌ Error:', datesError.message)
  } else {
    console.log('✅ Latest dates:', JSON.stringify(dates, null, 2))
  }

  console.log('\n✅ Data check complete!')
}

checkData().catch(console.error)
