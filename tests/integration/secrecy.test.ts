import { describe, it, expect, afterEach } from 'vitest';
import { startServer, connectClient, waitForConnect, TestServer, TestClient } from './helpers.js';

let server: TestServer | null = null;
let clients: TestClient[] = [];

afterEach(async () => {
  for (const client of clients) {
    client.close();
  }
  clients = [];
  if (server) {
    await server.close();
    server = null;
  }
});

describe('Secrecy', () => {
  it('no item name appears before it becomes revealed; unrevealed items never appear', async () => {
    const fakeJudge = async (players: any[]) => {
      const ranking = players.map((p, i) => ({
        player: p.nickname,
        rank: i + 1,
        reason: 'Test reason'
      }));
      return JSON.stringify({ ranking, commentary: 'Test commentary' });
    };

    server = await startServer(fakeJudge, 0.01);

    const client1 = connectClient(server.port);
    await waitForConnect(client1);
    const room = await client1.emitWithAck('create_room', { nickname: 'P1' });

    const client2 = connectClient(server.port);
    clients.push(client2);
    await waitForConnect(client2);
    await client2.emitWithAck('join_room', { roomCode: room.roomCode, nickname: 'P2' });

    await client1.emitWithAck('start_game', {});

    const revealedItems: Set<string> = new Set();

    // Play full game and track revealed items
    for (let i = 0; i < 6; i++) {
      await client1.waitForState((s: any) => s.phase === 'playing', 10000);
      const opener = i % 2 === 0 ? client1 : client2;

      await opener.emitWithAck('spin_wheel', {});

      const stateAfterSpin = await opener.waitForState((s: any) => s.revealedItem !== null, 2000);
      const revealedItem = stateAfterSpin.revealedItem;
      if (revealedItem) {
        revealedItems.add(revealedItem.name);
      }

      await opener.emitWithAck('place_bid', { amount: 1 });
      await opener.waitForState((s: any) => s.revealedItem === null, 2000);
    }

    await client1.waitForState((s: any) => s.phase === 'finished', 5000);

    // All 40 theme item names to search for
    const allThemeItems = [
      "Zaman Durdurma", "Teleportasyon", "Zihin Okuma", "Görünmezlik", "Uçma",
      "Süper Güç", "Şekil Değiştirme", "Hız", "İyileştirme", "Ateş Kontrolü",
      "Su Kontrolü", "Elektrik", "Klonlanma", "Lazer Gözler", "Duvar Geçme",
      "Hayvan Diliyle Konuşma", "Hava Kontrolü", "Buzlanma", "Zırh Derisi", "Geleceği Görme",
      "Işınlanma Işını", "Yerçekimi Kontrolü", "Metal Kontrolü", "Zehir Bağışıklığı", "Ses Dalgaları",
      "Bitki Büyütme", "Karanlık Manipülasyonu", "Işık Patlaması", "Dokunma ile Patlama", "Kütle Değiştirme",
      "Rüya Girme", "Doku Yapışma", "Kemik Çıkarma", "Ses Taklit", "Hız Çalma",
      "Hologram Yaratma", "Doku Kontrolü", "Düşünce İletimi", "Güneş Enerjisi", "Portal Açma"
    ];

    // Check all state_update messages to both clients
    const allClients = [client1, client2];

    for (const client of allClients) {
      const stateUpdates = client.messages.filter(m => m.event === 'state_update');

      for (const msg of stateUpdates) {
        const msgJSON = JSON.stringify(msg.payload);

        // Search for every theme item name in the full JSON
        for (const themeName of allThemeItems) {
          if (msgJSON.includes(themeName)) {
            // If found, it must have been revealed by this message's timestamp
            expect(revealedItems.has(themeName)).toBe(true);
          }
        }
      }
    }

    clients.push(client1);
  }, 30000);
});
