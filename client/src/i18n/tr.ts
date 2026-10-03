export default {
  // Wheel
  'wheel.ariaLabel': 'Çark: {count} kapalı güç',
  'wheel.spin': 'ÇEVİR!',

  // App
  'app.connecting': 'Bağlanıyor...',
  'app.connectingServer': 'Sunucuya bağlantı kuruluyor',

  // Header
  'header.room': 'ODA {code}',
  'header.lobby': 'LOBİ',
  'header.auction': 'MEZAT {current}/{total}',

  // Home Screen
  'home.title': 'BAZAAR',
  'home.selectTheme': 'Konsept Seç',
  'home.createRoom': 'Oda Oluştur',
  'home.joinRoom': 'Odaya Katıl',
  'home.nickname': 'İsmin',
  'home.roomCode': 'Oda Kodu (6 harf)',
  'home.createRoomButton': 'ODA OLUŞTUR',
  'home.joinRoomButton': 'ODAYA KATIL',
  'home.errorNoConnection': 'Bağlantı yok',
  'home.errorNicknameLength': 'İsim 1-16 karakter olmalı',
  'home.errorInvalidRoomCode': 'Geçerli bir oda kodu gir (6 harf)',
  'home.errorCreateFailed': 'Oda oluşturulamadı',
  'home.errorJoinFailed': 'Odaya katılınamadı',

  // Themes
  'theme.superpowers.name': 'Süper Güçler',
  'theme.superpowers.description': 'En güçlü ve yaratıcı güç takımı',
  'theme.legendary-fighters.name': 'Efsanevi Savaşçılar',
  'theme.legendary-fighters.description': '3\'e 3 takım savaşında kim kazanır',
  'theme.halisaha.name': '4\'lü Halı Saha',
  'theme.halisaha.description': 'En iyi 4\'lü futbol takımı',
  'theme.mythical-creatures.name': 'Mitolojik Yaratıklar',
  'theme.mythical-creatures.description': 'En güçlü yaratık takımı',

  // Lobby Screen
  'lobby.roomCode': 'ODA KODU',
  'lobby.copyCode': 'Kodu Kopyala',
  'lobby.players': 'Oyuncular ({count})',
  'lobby.host': 'EV SAHİBİ',
  'lobby.startGame': 'Oyunu Başlat',
  'lobby.minPlayersNeeded': 'En az 2 oyuncu gerekli',
  'lobby.waitingForHost': 'Ev sahibinin oyunu başlatması bekleniyor...',
  'lobby.errorStartFailed': 'Oyun başlatılamadı',

  // Briefing Screen
  'briefing.title': 'Nasıl Oynanır?',
  'briefing.step1.title': '1. Çark Çevir',
  'briefing.step1.text': 'Sıra sende mi? ÇARK ÇEVİR butonuna tıkla ve rastgele bir süper güç çıkar.',
  'briefing.step2.title': '2. Açılış Teklifi',
  'briefing.step2.text': 'Çarkı sen çevirdin mi? İlk teklifi sen verirsin (1-18 altın arası).',
  'briefing.step3.title': '3. Artır veya Pas',
  'briefing.step3.text': '+1, +2 veya +5 ile teklifi artır. İstemiyorsan PAS de. Herkes pas derse en yüksek teklif kazanır.',
  'briefing.step4.title': '4. Altın Limiti',
  'briefing.step4.text': 'Boş slotların için altın ayır. 2 boş slot = en fazla 18 altın teklif edebilirsin.',
  'briefing.step5.title': '5. Hakem',
  'briefing.step5.text': 'Herkes 3 güç topladı mı? Yapay zeka hakem sıralar ve kazananı açıklar.',
  'briefing.readyCount': '{ready} / {total} oyuncu hazır',
  'briefing.readyButton': 'Hazırım!',
  'briefing.readyButtonDone': 'Hazırsın ✓',

  // Game Screen
  'game.loading': 'Yükleniyor...',
  'game.room': 'ODA: {code}',
  'game.auction': 'MEZAT: {current}/{total}',
  'game.slot': 'Slot: {filled}/{total}',
  'game.empty': 'boş',
  'game.players': 'Oyuncular',
  'game.yourTurn': 'Senin sıran!',
  'game.playerSpinning': '{nickname} çarkı çeviriyor...',
  'game.spinInstruction': 'Çarka dokun ya da "ÇARKI ÇEVİR"e bas.',
  'game.errorSpinFailed': 'Çark çevrilemedi',

  // Player Card
  'player.you': 'SEN',
  'player.turn': 'SIRA',
  'player.yourTurn': 'SIRA SENDE',
  'player.theirTurn': 'SIRA ONDA',
  'player.passed': 'PAS',
  'player.disconnected': 'BAĞLANTI KOPTU',
  'player.gold': 'altın',
  'player.slot': 'slot',
  'player.slotEmpty': 'boş',
  'player.slotGoalie': 'kaleci',
  'player.slotPlayer': 'oyuncu',

  // Auction Panel - Opening
  'auction.opening.label': 'AÇILIŞ',
  'auction.opening.waiting': '{nickname} açılış teklifi veriyor...',
  'auction.opening.yourTurn': 'Açılış teklifi ver',
  'auction.opening.yourGold': 'Altının {gold}',
  'auction.opening.maxBid': 'En fazla {max} altın verebilirsin',
  'auction.opening.slotInfo': 'Slot {filled}/{total}',
  'auction.opening.placeBid': 'TEKLİF VER · {amount}',
  'auction.opening.limitReached': 'Limit: {max} altın',
  'auction.opening.exceedsLimit': 'Bu teklif altın limitini aşar',
  'auction.opening.bidAccepted': 'Teklifin alındı: {amount} altın',
  'auction.opening.bidFailed': 'Teklif verilemedi',
  'auction.opening.passFailed': 'Pas geçilemedi',

  // Auction Panel - Bidding
  'auction.bidding.highestBid': 'EN YÜKSEK TEKLİF',
  'auction.bidding.gold': 'ALTIN',
  'auction.bidding.leading': '{nickname} önde',
  'auction.bidding.nobody': 'Kimse',
  'auction.bidding.settled': 'Herkes pas dedi – SATILDI!',
  'auction.bidding.youreOut': 'Slotların dolu, izliyorsun',
  'auction.bidding.youreLeading': 'En yüksek teklif senin!',
  'auction.bidding.passButton': 'PAS',

  // Judge Waiting
  'judge.thinking': 'Hakem düşünüyor...',
  'judge.evaluating': 'Koleksiyonlar değerlendiriliyor',
  'judge.failed.title': 'Hakem Kafayı Yedi!',
  'judge.failed.message': 'Sıralamada bir sorun oluştu. {isHost}',
  'judge.failed.messageHost': 'Hakemi tekrar çalıştırabilirsin.',
  'judge.failed.messageGuest': 'Ev sahibi hakemi tekrar çalıştırabilir.',
  'judge.retry': 'Tekrar Dene',
  'judge.errorRetryFailed': 'Hakem tekrar çalıştırılamadı',

  // Sale Banner
  'sale.banner': '{item} → {winner} · {amount} altın',

  // Results Screen
  'results.title': 'BAZAAR KAPANDI!',
  'results.loading': 'Yükleniyor...',
  'results.rematch': 'Yeniden Oyna',
  'results.hostCanRematch': 'Ev sahibi yeni oyun başlatabilir',
  'results.errorRematchFailed': 'Yeniden oyun başlatılamadı',
  'results.emptySlot': 'boş',

  // Timer
  'timer.opening': 'AÇILIŞ',

  // Player List
  'playerList.gold': 'altın',
} as Record<string, string>;
