import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

// Get the directory path of the current file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file in the project root
const envPath = join(__dirname, '../../.env');
try {
  const envFile = readFileSync(envPath, 'utf-8');
  config({ path: envPath });
  console.log('✅ Environment variables loaded successfully\n');
} catch (error) {
  console.error('❌ Error loading .env file:', error);
  process.exit(1);
}

import { supabase } from '../lib/supabase.js';

async function updateProgram018() {
  try {
    console.log('🔄 Updating program 018...');
    
    const { data, error } = await supabase
      .from('platto_programs')
      .update({
        title: '戦争と創造',
        subtitle: '@上野公園',
        complete_date: '2025-08-05',
        cast1: '岡本 裕一朗',
        cast2: '今日 マチ子',
        status: '完パケ納品'
      })
      .eq('program_id', '018')
      .select();

    if (error) {
      console.error('❌ Error updating program:', error);
      return;
    }

    if (data && data.length > 0) {
      console.log('✅ Program 018 updated successfully:');
      console.log(`   タイトル: ${data[0].title}`);
      console.log(`   サブタイトル: ${data[0].subtitle}`);
      console.log(`   完パケ納品日: ${data[0].complete_date}`);
      console.log(`   出演者1: ${data[0].cast1}`);
      console.log(`   出演者2: ${data[0].cast2}`);
      console.log(`   ステータス: ${data[0].status}`);
    } else {
      console.log('⚠️ Program 018 not found');
    }

  } catch (error) {
    console.error('💥 Error:', error);
    throw error;
  }
}

// Run the update
updateProgram018()
  .then(() => {
    console.log('\n🎉 Update completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Update failed:', error);
    process.exit(1);
  });