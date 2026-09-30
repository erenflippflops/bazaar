export interface JudgeResult {
  ranking: { player: string; rank: number; reason: string }[];
  commentary: string;
}

export function parseAndValidateJudgeResponse(rawText: string, expectedPlayerCount: number): JudgeResult {
  // Try to extract JSON from response
  let jsonText = rawText.trim();
  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    jsonText = jsonMatch[0];
  }

  const result = JSON.parse(jsonText);

  // Validate structure
  if (!result.ranking || !Array.isArray(result.ranking) || !result.commentary) {
    throw new Error('Invalid judge response format');
  }

  if (result.ranking.length !== expectedPlayerCount) {
    throw new Error(`Expected ${expectedPlayerCount} players in ranking, got ${result.ranking.length}`);
  }

  // Validate commentary is non-empty string
  if (typeof result.commentary !== 'string' || result.commentary.trim() === '') {
    throw new Error('Commentary must be a non-empty string');
  }

  // Collect player names and ranks
  const playerNames = new Set<string>();
  const ranks = new Set<number>();

  for (const entry of result.ranking) {
    // Validate player name
    if (typeof entry.player !== 'string' || entry.player.trim() === '') {
      throw new Error('Each player name must be a non-empty string');
    }

    // Check for duplicate players
    if (playerNames.has(entry.player)) {
      throw new Error(`Player "${entry.player}" appears more than once`);
    }
    playerNames.add(entry.player);

    // Validate rank
    if (typeof entry.rank !== 'number' || !Number.isInteger(entry.rank)) {
      throw new Error('Each rank must be an integer');
    }
    if (entry.rank < 1 || entry.rank > expectedPlayerCount) {
      throw new Error(`Rank must be between 1 and ${expectedPlayerCount}`);
    }

    // Check for duplicate ranks
    if (ranks.has(entry.rank)) {
      throw new Error(`Rank ${entry.rank} appears more than once`);
    }
    ranks.add(entry.rank);

    // Validate reason is non-empty string
    if (typeof entry.reason !== 'string' || entry.reason.trim() === '') {
      throw new Error('Each reason must be a non-empty string');
    }
  }

  // Verify all ranks from 1 to n are present
  for (let i = 1; i <= expectedPlayerCount; i++) {
    if (!ranks.has(i)) {
      throw new Error(`Missing rank ${i}`);
    }
  }

  return result as JudgeResult;
}
