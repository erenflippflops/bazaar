import Anthropic from '@anthropic-ai/sdk';

export async function callAnthropicJudge(apiKey: string, players: { nickname: string; items: { name: string; description: string }[] }[]): Promise<string> {
  const client = new Anthropic({ apiKey });

  const prompt = `Sen bir süper güç koleksiyonu hakemisin. ${players.length} oyuncunun topladığı süper güçlere bakarak en iyi koleksiyonu seç.

Oyuncular ve koleksiyonları:
${players.map(p => `${p.nickname}: ${p.items.map(i => i.name).join(', ')}`).join('\n')}

Her oyuncu için detaylı açıklamalar:
${players.map(p => `${p.nickname}:\n${p.items.map(i => `- ${i.name}: ${i.description}`).join('\n')}`).join('\n\n')}

Lütfen aşağıdaki JSON formatında değerlendirmeni yap:
{
  "ranking": [
    { "player": "Oyuncu1", "rank": 1, "reason": "Kısa açıklama" },
    { "player": "Oyuncu2", "rank": 2, "reason": "Kısa açıklama" }
  ],
  "commentary": "Genel yorum (2-3 cümle)"
}`;

  const message = await client.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }]
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '';
  return text;
}
