const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lqithgkebyqogoeynfmp.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxaXRoZ2tlYnlxb2dvZXluZm1wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODQ2OTAxMSwiZXhwIjoyMDc0MDQ1MDExfQ.KGJCq83V_Rf0G9L15v8CT-99Cyt1gu1ypstylaX6XE8'
);

/**
 * Extract domain from URL
 */
function extractDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.toLowerCase();
  } catch (e) {
    return null;
  }
}

/**
 * Build entity domain map from existing matched citations
 */
async function buildEntityDomainMap() {
  console.log('Building entity-domain mapping from existing matched citations...\n');

  // Get all entities
  const { data: entities } = await supabase
    .from('entities')
    .select('entity_id, canonical_name, entity_type');

  // Get all matched citations
  const { data: matchedCitations } = await supabase
    .from('citation_listing')
    .select('url, entity_id')
    .not('entity_id', 'is', null);

  // Build map: domain → entity_id
  const domainToEntityMap = new Map();
  const entityInfo = new Map(entities.map(e => [e.entity_id, e]));

  matchedCitations?.forEach(citation => {
    const domain = extractDomain(citation.url);
    if (domain && citation.entity_id) {
      // Store domain mapping
      domainToEntityMap.set(domain, citation.entity_id);
    }
  });

  console.log(`Found ${domainToEntityMap.size} domain patterns from ${matchedCitations?.length} matched citations`);
  console.log('\nDomain → Entity mappings:');

  // Group by entity for display
  const entityDomains = new Map();
  domainToEntityMap.forEach((entityId, domain) => {
    if (!entityDomains.has(entityId)) {
      entityDomains.set(entityId, []);
    }
    entityDomains.get(entityId).push(domain);
  });

  entityDomains.forEach((domains, entityId) => {
    const entity = entityInfo.get(entityId);
    console.log(`  ${entity.canonical_name} (${entity.entity_type}): ${domains.join(', ')}`);
  });

  return { domainToEntityMap, entityInfo };
}

/**
 * Match unmatched citations to entities
 *
 * NOTE: The citation_listing table uses 'id' as its primary key, NOT 'citation_id'.
 * Always use 'id' when selecting or updating records in this table.
 */
async function matchUnmatchedCitations(domainToEntityMap, entityInfo, dryRun = true) {
  console.log('\n\n=== Matching Unmatched Citations ===\n');

  // Get all unmatched citations
  // IMPORTANT: Use 'id' not 'citation_id' - verified via check-db.js
  const { data: unmatchedCitations, error } = await supabase
    .from('citation_listing')
    .select('id, url, name, platform')
    .is('entity_id', null);

  if (error) {
    console.error('Error fetching unmatched citations:', error);
    return;
  }

  console.log(`Total unmatched citations: ${unmatchedCitations?.length}\n`);

  const matches = [];
  const unmatched = [];

  unmatchedCitations?.forEach(citation => {
    const domain = extractDomain(citation.url);
    if (domain && domainToEntityMap.has(domain)) {
      const entityId = domainToEntityMap.get(domain);
      const entity = entityInfo.get(entityId);
      matches.push({
        citation_id: citation.id, // citation.id is the primary key

        url: citation.url,
        name: citation.name,
        domain,
        entity_id: entityId,
        entity_name: entity.canonical_name,
        entity_type: entity.entity_type
      });
    } else {
      unmatched.push(citation);
    }
  });

  console.log(`Matched: ${matches.length}`);
  console.log(`Still unmatched: ${unmatched.length}\n`);

  // Show sample matches by entity
  console.log('Sample matches by entity:');
  const matchesByEntity = new Map();
  matches.forEach(match => {
    const key = `${match.entity_name} (${match.entity_type})`;
    if (!matchesByEntity.has(key)) {
      matchesByEntity.set(key, []);
    }
    matchesByEntity.get(key).push(match);
  });

  matchesByEntity.forEach((entityMatches, entityKey) => {
    console.log(`\n${entityKey}: ${entityMatches.length} citations`);
    entityMatches.slice(0, 3).forEach(match => {
      console.log(`  - ${match.name}`);
      console.log(`    ${match.url}`);
    });
  });

  if (dryRun) {
    console.log('\n\n⚠️  DRY RUN MODE - No database updates performed');
    console.log('Run with --apply flag to actually update the database');
    return { matches, unmatched };
  }

  // Apply updates
  console.log('\n\n=== Applying Updates ===\n');

  let successCount = 0;
  let errorCount = 0;

  // Update in batches of 100
  const batchSize = 100;
  for (let i = 0; i < matches.length; i += batchSize) {
    const batch = matches.slice(i, i + batchSize);

    console.log(`Updating batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(matches.length / batchSize)}...`);

    for (const match of batch) {
      // Use 'id' column (primary key) for matching, not 'citation_id'
      const { error: updateError } = await supabase
        .from('citation_listing')
        .update({ entity_id: match.entity_id })
        .eq('id', match.citation_id);

      if (updateError) {
        console.error(`Error updating citation ${match.citation_id}:`, updateError);
        errorCount++;
      } else {
        successCount++;
      }
    }
  }

  console.log(`\n✅ Successfully updated: ${successCount} citations`);
  if (errorCount > 0) {
    console.log(`❌ Failed to update: ${errorCount} citations`);
  }

  return { matches, unmatched };
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  const dryRun = !args.includes('--apply');

  console.log('=== Entity Matching Script ===\n');

  if (dryRun) {
    console.log('Mode: DRY RUN (use --apply to update database)\n');
  } else {
    console.log('Mode: APPLY (will update database)\n');
  }

  try {
    // Build entity-domain mapping
    const { domainToEntityMap, entityInfo } = await buildEntityDomainMap();

    // Match unmatched citations
    const { matches, unmatched } = await matchUnmatchedCitations(domainToEntityMap, entityInfo, dryRun);

    console.log('\n\n=== Summary ===');
    console.log(`Total citations matched: ${matches.length}`);
    console.log(`Total citations still unmatched: ${unmatched.length}`);

    if (dryRun) {
      console.log('\n💡 To apply these changes, run: node scripts/match-entities.js --apply');
    } else {
      console.log('\n✅ Database updated successfully!');
    }

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
