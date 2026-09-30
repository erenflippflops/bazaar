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

  // Validate
  if (!result.ranking || !Array.isArray(result.ranking) || !result.commentary) {
    throw new Error('Invalid judge response format');
  }

  if (result.ranking.length !== expectedPlayerCount) {
    throw new Error(`Expected ${expectedPlayerCount} players in ranking, got ${result.ranking.length}`);
  }

  return result as JudgeResult;
}
