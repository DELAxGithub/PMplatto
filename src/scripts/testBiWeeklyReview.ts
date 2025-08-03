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

// Import the bi-weekly review function
import { runBiWeeklyReportTest } from '../lib/biWeeklyReview.js';

// Run the test
runBiWeeklyReportTest()
  .then(() => {
    console.log('\n🎉 テスト完了');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 テスト失敗:', error);
    process.exit(1);
  });