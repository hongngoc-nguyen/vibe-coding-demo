const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://lqithgkebyqogoeynfmp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxaXRoZ2tlYnlxb2dvZXluZm1wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODQ2OTAxMSwiZXhwIjoyMDc0MDQ1MDExfQ.KGJCq83V_Rf0G9L15v8CT-99Cyt1gu1ypstylaX6XE8'
);

async function checkSchema() {
  console.log('=== Checking citation_listing table schema ===\n');

  const { data, error } = await supabase
    .from('citation_listing')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error:', error);
    return;
  }

  if (data && data.length > 0) {
    console.log('Columns in citation_listing:');
    Object.keys(data[0]).forEach(key => {
      console.log(`  - ${key}`);
    });

    console.log('\nSample row:');
    console.log(JSON.stringify(data[0], null, 2));
  }
}

checkSchema().catch(console.error);
