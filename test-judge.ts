import { callAnthropicJudge } from './server/judge.js';
import * as dotenv from 'dotenv';

dotenv.config();

const testPlayers = [
  {
    nickname: 'Alice',
    items: [
      { name: 'Uçma', description: 'Havada uç' },
      { name: 'Görünmezlik', description: 'Görünmez ol' },
      { name: 'Telepati', description: 'Düşünceleri oku' }
    ]
  },
  {
    nickname: 'Bob',
    items: [
      { name: 'Süper Hız', description: 'Çok hızlı koş' },
      { name: 'Zaman Durdurma', description: 'Zamanı durdur' },
      { name: 'Işınlanma', description: 'Bir anda başka yere git' }
    ]
  }
];

const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  console.error('ERROR: ANTHROPIC_API_KEY not found in .env');
  process.exit(1);
}

console.log('Testing real judge with Anthropic API...');
console.log('Players:', JSON.stringify(testPlayers, null, 2));

callAnthropicJudge(apiKey, testPlayers)
  .then(result => {
    console.log('\n=== JUDGE RESULT (RAW) ===');
    console.log(result);
    console.log('\n=== PARSED JSON ===');
    const parsed = JSON.parse(result);
    console.log(JSON.stringify(parsed, null, 2));
    console.log('\nTest complete!');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
