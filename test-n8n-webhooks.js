/**
 * Test N8N Webhooks Directly
 * This script tests your n8n webhooks to see what they're actually returning
 */

const GOOGLE_SEARCH_WEBHOOK = 'https://free-n8n.anduin.center/webhook/17094fa1-9051-4eed-b0cb-f9d2fd48f7a1'
const GOOGLE_AI_WEBHOOK = 'https://free-n8n.anduin.center/webhook/152cb399-0f55-4bb0-9196-70c129f5486b'

const testPayload = {
  query_id: '550e8400-e29b-41d4-a716-446655440000',
  user_id: 'test_user',
  prompt_text: 'best legal software',
  response_id: '660e8400-e29b-41d4-a716-446655440001'
}

async function testWebhook(name, url) {
  console.log(`\n${'='.repeat(80)}`)
  console.log(`Testing: ${name}`)
  console.log(`URL: ${url}`)
  console.log(`${'='.repeat(80)}`)

  try {
    console.log('\n📤 Sending payload:')
    console.log(JSON.stringify(testPayload, null, 2))

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload)
    })

    console.log(`\n📥 Response Status: ${response.status} ${response.statusText}`)
    console.log(`Content-Type: ${response.headers.get('content-type')}`)

    // Get the raw text first
    const rawText = await response.text()
    console.log(`\n📄 Raw Response (first 500 chars):`)
    console.log(rawText.substring(0, 500))

    // Try to parse as JSON
    try {
      const data = JSON.parse(rawText)
      console.log(`\n✅ Valid JSON received:`)
      console.log(JSON.stringify(data, null, 2))

      // Check if it has the required fields
      if (data.success !== undefined) {
        console.log(`\n✓ Has 'success' field: ${data.success}`)
      } else {
        console.log(`\n❌ Missing 'success' field!`)
      }

      if (data.query_id) {
        console.log(`✓ Has 'query_id' field: ${data.query_id}`)
      } else {
        console.log(`❌ Missing 'query_id' field!`)
      }

      if (data.response_id) {
        console.log(`✓ Has 'response_id' field: ${data.response_id}`)
      } else {
        console.log(`❌ Missing 'response_id' field!`)
      }

      if (data.response_data) {
        console.log(`✓ Has 'response_data' field (length: ${data.response_data.length} chars)`)
        console.log(`  First 200 chars: ${data.response_data.substring(0, 200)}`)
      } else {
        console.log(`❌ Missing 'response_data' field!`)
      }

      if (data.execution_time !== undefined) {
        console.log(`✓ Has 'execution_time' field: ${data.execution_time}ms`)
      } else {
        console.log(`❌ Missing 'execution_time' field!`)
      }

    } catch (parseError) {
      console.log(`\n❌ NOT valid JSON!`)
      console.log(`Parse error: ${parseError.message}`)
      console.log(`\nThis means n8n is returning plain text, not JSON.`)
      console.log(`You need to fix the workflow configuration!`)
    }

  } catch (error) {
    console.log(`\n❌ ERROR:`)
    console.log(error.message)
  }
}

async function main() {
  console.log('\n🧪 N8N Webhook Test Script')
  console.log('This will test both webhooks and show you exactly what they return\n')

  await testWebhook('Google Search Workflow', GOOGLE_SEARCH_WEBHOOK)
  await testWebhook('Google AI Mode Workflow', GOOGLE_AI_WEBHOOK)

  console.log(`\n${'='.repeat(80)}`)
  console.log('Test Complete!')
  console.log(`${'='.repeat(80)}\n`)
}

main().catch(console.error)
