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

async function testSlackWebhook() {
  try {
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;
    if (!webhookUrl) {
      throw new Error('SLACK_WEBHOOK_URL environment variable is not set');
    }

    console.log('🔧 Webhook URL:', webhookUrl);

    const testMessage = {
      text: "📊 テスト週報",
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: "📊 PMplatto 週報テスト"
          }
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "*今週のイベント*\n• 2025-08-05 📦 完パケ納品 [018] 戦争と創造 @上野公園 (出演: 岡本 裕一朗、今日 マチ子)"
          }
        },
        {
          type: "context",
          elements: [
            {
              type: "mrkdwn",
              text: "📝 Generated: テスト実行"
            }
          ]
        }
      ]
    };

    console.log('🚀 Sending test message to Slack...');

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testMessage),
    });

    console.log('📈 Response status:', response.status);
    console.log('📈 Response status text:', response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Response body:', errorText);
      throw new Error(`Failed to send message to Slack: ${response.statusText}`);
    }

    const responseText = await response.text();
    console.log('✅ Success! Response:', responseText);

  } catch (error) {
    console.error('💥 Error:', error);
    throw error;
  }
}

// Run the test
testSlackWebhook()
  .then(() => {
    console.log('\n🎉 Slack webhook test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Slack webhook test failed:', error);
    process.exit(1);
  });