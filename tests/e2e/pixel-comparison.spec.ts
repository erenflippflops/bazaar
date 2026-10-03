import { test, expect } from '@playwright/test';
import { compareScreenshots } from './helpers';
import * as path from 'path';
import * as fs from 'fs';

// Screen IDs to test
const screenIds = [
  'connecting',
  'login',
  'lobby-host',
  'lobby-guest',
  'briefing',
  'your-turn',
  'not-your-turn',
  'spinning',
  'opening-you',
  'opening-other',
  'bidding',
  'last-seconds',
  'top-bidder',
  'passed',
  'out',
  'sold',
  'judge-thinking',
  'judge-error',
  'results',
  'disconnected',
  'halisaha',
];

// Map screen IDs to mockup file names
const screenToMockupMap: Record<string, string> = {
  'connecting': '01-Connecting',
  'login': '02-Login',
  'lobby-host': '03-Lobby-Host',
  'lobby-guest': '03b-Lobby-Guest',
  'briefing': '04-HowToPlay',
  'your-turn': '05-YourTurn',
  'not-your-turn': '06-NotYourTurn',
  'spinning': '07-Spinning',
  'opening-you': '08-Opening-You',
  'opening-other': '09-Opening-Other',
  'bidding': '10-Bidding',
  'last-seconds': '11-LastSeconds',
  'top-bidder': '12-TopBidder',
  'passed': '13-Passed',
  'out': '14-Out',
  'sold': '15-Sold',
  'judge-thinking': '16-JudgeThinking',
  'judge-error': '17-JudgeError',
  'results': '18-Results',
  'disconnected': '19-Disconnected',
  'halisaha': '20-Halisaha',
};

const stages = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'phone', width: 390, height: 844 },
];

test.describe('Pixel Comparison Tests', () => {
  for (const screenId of screenIds) {
    for (const stage of stages) {
      test(`${screenId} - ${stage.name}`, async ({ page, browser }) => {
        const mockupFileName = screenToMockupMap[screenId];
        if (!mockupFileName) {
          throw new Error(`No mockup mapping for screen: ${screenId}`);
        }

        // Construct paths
        const mockupPath = path.resolve(
          __dirname,
          '../../docs/design/mockups',
          `${mockupFileName}-${stage.name === 'desktop' ? 'Desktop' : 'Phone'}.html`
        );

        if (!fs.existsSync(mockupPath)) {
          throw new Error(`Mockup file not found: ${mockupPath}`);
        }

        // Navigate to the design harness
        await page.setViewportSize({ width: stage.width, height: stage.height });
        await page.goto(`http://localhost:5173/?mock=${screenId}&stage=${stage.name}`, {
          waitUntil: 'networkidle',
        });

        // Wait for fonts to load
        await page.evaluate(() => document.fonts.ready);
        await page.waitForTimeout(1000); // Extra stabilization time

        // Compare screenshots
        const result = await compareScreenshots(
          page,
          mockupPath,
          stage.width,
          stage.height,
          0.015 // 1.5% threshold
        );

        // If failed, save the diff image
        if (!result.passed && result.diffBuffer) {
          const diffDir = path.resolve(__dirname, '../../docs/screenshots/diff');
          if (!fs.existsSync(diffDir)) {
            fs.mkdirSync(diffDir, { recursive: true });
          }
          const diffPath = path.join(diffDir, `${screenId}-${stage.name}.png`);
          fs.writeFileSync(diffPath, result.diffBuffer);
          console.log(`Diff image saved to: ${diffPath}`);
        }

        // Log the result
        console.log(
          `${screenId} (${stage.name}): ${result.passed ? 'PASS' : 'FAIL'} - ${(result.diffPercent * 100).toFixed(2)}% different`
        );

        // Assert that the difference is within threshold
        expect(result.diffPercent).toBeLessThan(0.015);
      });
    }
  }
});
