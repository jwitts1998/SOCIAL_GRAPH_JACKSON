#!/usr/bin/env tsx
/**
 * Batch Generate Embeddings for Contacts
 * 
 * This script calls the embed-contacts Edge Function in batch mode
 * to generate embeddings for all contacts that don't have them yet.
 * 
 * Usage: npx tsx scripts/batch-generate-embeddings.ts
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { resolve } from 'path';

// Load .env file
dotenv.config({ path: resolve(process.cwd(), '.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Error: Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables');
  console.error('   Set them in .env or export them before running this script');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function batchGenerateEmbeddings() {
  console.log('🚀 Starting batch embedding generation...\n');

  // First, check how many contacts need embeddings
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error('❌ Error: Not authenticated. Please log in first.');
    process.exit(1);
  }

  const { count } = await supabase
    .from('contacts')
    .select('*', { count: 'exact', head: true })
    .eq('owned_by_profile', user.id)
    .or('bio_embedding.is.null,thesis_embedding.is.null');

  console.log(`📊 Found ${count || 0} contacts that need embeddings\n`);

  if (count === 0) {
    console.log('✅ All contacts already have embeddings!');
    return;
  }

  let totalProcessed = 0;
  let batchNumber = 1;
  let hasMore = true;

  while (hasMore) {
    console.log(`📦 Processing batch ${batchNumber}...`);

    try {
      const { data, error } = await supabase.functions.invoke('embed-contacts', {
        body: { mode: 'batch' },
      });

      if (error) {
        console.error('❌ Error:', error);
        throw error;
      }

      if (!data) {
        console.error('❌ No data returned from function');
        break;
      }

      const processed = data.processed || 0;
      const total = data.total || 0;
      const errors = data.errors || [];
      hasMore = data.hasMore === true;

      totalProcessed += processed;

      console.log(`   ✅ Processed ${processed}/${total} contacts in this batch`);
      if (errors.length > 0) {
        console.log(`   ⚠️  ${errors.length} errors:`);
        errors.slice(0, 5).forEach((err: string) => console.log(`      - ${err}`));
        if (errors.length > 5) {
          console.log(`      ... and ${errors.length - 5} more`);
        }
      }

      if (hasMore) {
        console.log(`   ⏳ ${totalProcessed} total processed so far, continuing...\n`);
        // Wait a bit between batches to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        console.log(`\n✅ Complete! Processed ${totalProcessed} contacts total.`);
      }

      batchNumber++;
    } catch (err: any) {
      console.error('❌ Fatal error:', err.message || err);
      process.exit(1);
    }
  }

  // Final count check
  const { count: remainingCount } = await supabase
    .from('contacts')
    .select('*', { count: 'exact', head: true })
    .eq('owned_by_profile', user.id)
    .or('bio_embedding.is.null,thesis_embedding.is.null');

  if (remainingCount && remainingCount > 0) {
    console.log(`\n⚠️  Note: ${remainingCount} contacts still need embeddings (may not have bio or investor_notes)`);
  } else {
    console.log('\n🎉 All contacts with available data now have embeddings!');
  }
}

// Run the script
batchGenerateEmbeddings()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ Script failed:', err);
    process.exit(1);
  });

