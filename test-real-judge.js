// Quick script to test real judge with API key
// Run: node test-real-judge.js

import { judge } from './server/judge.js';

const testPlayers = [
  {
    nickname: 'Alice',
    slots: [
      { name: 'Uçma', description: 'Havada uç' },
      { name: 'Görünmezlik', description: 'Görünmez ol' },
      { name: 'Telepati', description: 'Düşünceleri oku' }
    ]
  },
  {
    nickname: 'Bob',
    slots: [
      { name: 'Süper Hız', description: 'Çok hızlı koş' },
      { name: 'Zaman Durdurma', description: 'Zamanı durdur' },
      { name: 'Işınlanma', description: 'Bir anda başka yere git' }
    ]
  }
];

console.log('Testing real judge with Anthropic API...');
console.log('Players:', JSON.stringify(testPlayers, null, 2));

const result = await judge(testPlayers, 'superpowers');
console.log('\n=== JUDGE RESULT ===');
console.log(JSON.stringify(result, null, 2));
console.log('\nTest complete!');
