import dotenv from 'dotenv';
import { createServer } from './index.js';
import { callAnthropicJudge } from './judge.js';

dotenv.config();

const PORT = parseInt(process.env.PORT || '3001');
const GAME_TIME_SCALE = parseFloat(process.env.GAME_TIME_SCALE || '1') || 1;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

if (!ANTHROPIC_API_KEY) {
  console.error('ANTHROPIC_API_KEY is required');
  process.exit(1);
}

const judge = (players: { nickname: string; items: { name: string; description: string }[] }[]) => {
  return callAnthropicJudge(ANTHROPIC_API_KEY, players);
};

createServer({
  port: PORT,
  judge,
  timeScale: GAME_TIME_SCALE
}).then(({ port }) => {
  console.log(`Server running on port ${port}`);
}).catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
