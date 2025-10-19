import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Try to query different possible table names
    const tablesToCheck = [
      'citation_listing',
      'citations',
      'brand_mentions',
      'brand_citations',
      'entity_mentions',
      'mention_listing',
      'response_citations'
    ]

    const results: any = {}

    for (const tableName of tablesToCheck) {
      const { data, error, count } = await supabase
        .from(tableName)
        .select('*', { count: 'exact' })
        .limit(3)

      results[tableName] = {
        exists: !error,
        error: error?.message || null,
        rowCount: count,
        sample: data || []
      }
    }

    return NextResponse.json(results, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
