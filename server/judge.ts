import Anthropic from '@anthropic-ai/sdk';
import type { Player } from './engine/types.js';

export interface JudgeResult {
  ranking: { player: string; rank: number; reason: string }[];
  commentary: string;
}

export interface JudgeService {
  judge(players: Player[]): Promise<JudgeResult>;
}

export class AnthropicJudge implements JudgeService {
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async judge(players: Player[]): Promise<JudgeResult> {
    const playersData = players.map(p => ({
      nickname: p.nickname,
      items: p.slots.filter(s => s !== null).map(s => ({ name: s!.name, description: s!.description }))
    }));

    const prompt = `Sen bir süper güç koleksiyonu hakemisin. ${players.length} oyuncunun topladığı süper güçlere bakarak en iyi koleksiyonu seç.

Oyuncular ve koleksiyonları:
${playersData.map(p => `${p.nickname}: ${p.items.map(i => `${i.name} (${i.description})`).join(', ')}`).join('\n')}

SADECE şu JSON formatında yanıt ver (başka hiçbir metin ekleme):
{
  "ranking": [
    { "player": "oyuncu_ismi", "rank": 1, "reason": "2-3 cümlelik Türkçe açıklama" }
  ],
  "commentary": "kısa, komik bir Türkçe kapanış cümlesi"
}

Her oyuncu tam olarak bir kez görünmeli ve sıralamalar 1'den ${players.length}'e kadar olmalı.`;

    const message = await this.client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }]
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '';

    // Try to extract JSON from response
    let jsonText = text.trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonText = jsonMatch[0];
    }

    const result = JSON.parse(jsonText);

    // Validate
    if (!result.ranking || !Array.isArray(result.ranking) || !result.commentary) {
      throw new Error('Invalid judge response format');
    }

    return result as JudgeResult;
  }
}

export class FakeJudge implements JudgeService {
  async judge(players: Player[]): Promise<JudgeResult> {
    const ranking = players.map((p, i) => ({
      player: p.nickname,
      rank: i + 1,
      reason: 'Test sıralaması'
    }));

    return {
      ranking,
      commentary: 'Test yargılaması'
    };
  }
}
