import Anthropic from '@anthropic-ai/sdk';

export async function callAnthropicJudge(apiKey: string, players: { nickname: string; items: { name: string; description: string }[] }[], themeCriterion: string): Promise<string> {
  const client = new Anthropic({ apiKey });

  const prompt = `Sen bir ${themeCriterion} hakemisin. ${players.length} oyuncunun topladığı koleksiyonlara bakarak en iyi koleksiyonu seç.

Oyuncular ve koleksiyonları:
${players.map(p => `${p.nickname}: ${p.items.map(i => `${i.name} (${i.description})`).join(', ')}`).join('\n')}

SADECE şu JSON formatında yanıt ver (başka hiçbir metin ekleme):
{
  "ranking": [
    { "player": "oyuncu_ismi", "rank": 1, "reason": "2-3 cümlelik Türkçe açıklama" }
  ],
  "commentary": "kısa, komik bir Türkçe kapanış cümlesi"
}

Her oyuncu tam olarak bir kez görünmeli ve sıralamalar 1'den ${players.length}'e kadar olmalı.`;

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }]
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '';
  return text;
}
