# BAZAAR – Durum dosyası (yönetici / "beyin" için) – 30 Eylül 2026

Bu dosyayı ana oturum (beyin) her açılışta okur ve her karardan sonra "9. Şu anki durum"u günceller.
Çalışma şekli CLAUDE.md'de ve .claude/agents/ altında. Eren'le kısa, sade Türkçe; kural sorularını Eren'e sor.

## 1. Proje
- **Bazaar:** 2-6 arkadaşın tarayıcıda oynadığı mezat parti oyunu. Çark kapalı öğeleri açar, 20 altınla
  3 slot doldurulur, sonunda yapay zekâ hakem sıralar. İlk tema: 40 süper güç. Fikir kâğıt-kalem oyunundan.
- Repo: https://github.com/erenflippflops/bazaar (public, main). GitHub'da "main koruma" ruleset'i var
  (force push ve dal silme engelli).
- Klasör: `C:\Users\lolse\Projects\BAZAAR` (tek çalışma klasörü; alt ajanlar `.claude/worktrees/` altında çalışır).
- Teknik: TypeScript; Node + Express + Socket.IO (tsx); istemci React + Vite (`client/`, şimdilik yer tutucu).
  - `server/engine/game.ts`, `types.ts`: saf motor (RNG ve saat dışarıdan).
    Fazlar: waiting → playing (açıcının sırası) → opening (çevrildi, açılış teklifi bekleniyor) → bidding →
    … → judging → finished / judge_failed.
  - `server/index.ts`: `createServer({port, judge, timeScale})` → `{port, close()}`; import edince başlamaz.
  - `server/main.ts`: tek giriş; PORT, GAME_TIME_SCALE, ANTHROPIC_API_KEY burada okunur.
  - `server/judge.ts`: sadece Anthropic çağrısı (`claude-haiku-4-5-20251001`), ham metin döner.
  - `server/judgeResult.ts`: JSON ayrıştırma + doğrulama. `server/roomTimers.ts` (Task 03'te eklendi).
  - Socket olayları: create_room {nickname} · join_room {roomCode, nickname, playerToken?} ·
    start_game · spin_wheel · place_bid {amount} · retry_judge · rematch. Yayın: `state_update`.
  - Testler: `tests/*.test.ts` (39 birim testi), `tests/integration/*` (denetçinin socket testleri).
- İlke: her dosyanın tek işi olsun.

## 2. Ekip ve akış (yeni sistem, 30 Eylül 2026)
- Tek terminal: beyin (Opus 5.5) `C:\Users\lolse\Projects\BAZAAR` içinde. Alt ajanlar:
  `builder` (Fable 5.1, en fazla 3 paralel) ve `auditor` (Opus 5.5), her biri kendi git worktree'sinde/dalında.
- Eski düzen (ayrı Fable/denetçi terminalleri, `BAZAAR-audit`, `BAZAAR-manager` klasörleri) kullanılmıyor.
- İşler dosya sahipliğine göre bölünür; önce test (denetçi), sonra kod (builder); beyin diff'leri okur,
  `tests/` dokunuşunu mekanik kontrol eder, dalları tek tek birleştirir, her birleşmeden sonra tüm testleri koşar, push eder.
- Korumalar: `.claude/settings.local.json` (reset/force push/rebase/clean/vercel, CLAUDE.md ve GAME_RULES.md
  düzenleme yasak), GitHub "main koruma" ruleset'i. Maliyet sınırsız varsayılıyor (Eren'in kararı).

## 3. Dersler
- **Fable:** kanıtsız "✓" özet; testi/kuralı değiştirmeye kalktı; "davranış aynı kalsın" dediğimiz refactor'da
  hakem modelini eski bir modele ve talimatı basitleştirdi (geri aldırıldı); ek "fix" commit'leri atar; kontrolü
  yanlış katmana koyar (tam sayı kontrolünü motora değil socket katmanına koydu). Dar, dosya listeli, ham çıktı
  isteyen görevlerde iyi.
- **Denetçi:** sayıları yanlış saydı; testleri olmayan kurallar için satır numarası uydurdu; alıntıladığı kodun
  tersini söyledi (hakem zaman aşımı); "TEST BUG likely" diye kanıtsız geçti; protokol alan adlarını yanlış
  yazdı (`code`/`currentItem`). **Test dosyalarını ve diff'leri kendin oku.** Uzun oturumda kalite düşüyor:
  büyük işten önce yeni oturum (/clear).
- Otomatik mod sınıflandırıcısı, sohbetteki "tests/ dışına dokunma" gibi cümleler yüzünden sabotajı engelleyebilir;
  sabotaj için açık izin ver.
- Sabotaj kontrolü işe yarıyor: açılış sırası hatası böyle bulundu.

## 4. Oyun kuralları (docs/GAME_RULES.md özü)
1. Oda 2-6, bot yok; kuran host; en az 2 ile host başlatır; başlayınca katılım yok; ad 1-16, benzersiz.
2. Herkese 20 altın, 3 boş slot.
3. Çarkta temanın bütün öğeleri (40), kapalı; her çevirişte biri rastgele açılır ve çıkar. İstemciye kapalı
   öğe adı asla gitmez, sadece sayı.
4. Açılış sırası katılma sırasıyla döngüsel, 3 slotu dolu atlanır. Sırası gelen çevirir ve **ilk teklifi (≥1) o
   verir**; açılış teklifi verilmeden kimse teklif veremez. 20 sn içinde yapmazsa sunucu gerekirse çevirir ve 1 altın açar.
5. Açılıştan sonra slotu boş olan herkes teklif verir; ≥ mevcut+1; en yüksek teklif sahibi kendini artıramaz.
   Sayaç 10 sn; son 5 sn'de gelen teklif kalan süreyi 5 sn'ye çeker. Bitince en yüksek öder ve alır.
   **Teklifler tam sayıdır** (karar verildi, GAME_RULES.md'ye henüz eklenmedi).
6. En fazla teklif = altın − (boş slot − 1), açılış dahil.
7. Herkes 3 slotu doldurunca hakem.
8. Hakem tek seferde sıralar; katı JSON: sıralama + her oyuncuya 2-3 cümle Türkçe gerekçe + esprili kapanış.
   Doğrulama: her oyuncu bir kez, sıralar 1..n, boş olmayan metinler. 30 sn zaman aşımı / hata → judge_failed,
   host tekrar dener.
9. Sonuç herkese; host "yeniden oyna": aynı oyuncular, sıfırlanmış altın/slot, yeni tam çark.
10. Yeniden bağlanma: **oda kodu + gizli token yeter** (isim gerekmez); yer, altın, slot geri gelir.
11. GAME_TIME_SCALE bütün süreleri çarpar (testlerde 0.1).
12. Sağlamlık: bozuk mesaj çökertmez; kimlik sunucuda; eski zamanlayıcı yeni mezatı etkilemez; çift tık tek etki; GET /health.

## 5. Tasarım ve gelecek kararları
- Tasarım yönü "C: oyun şovu + gece pazarı" (kraliyet mavisi, ışık huzmeleri, büyük çark; fenerler, çini yıldız,
  soğan kubbe kart; safran/İznik turkuazı/nar kırmızısı; Bungee + Rubik; telefon + masaüstü).
  Tuval: https://claude.ai/artifact/3Ukyosvt76Lfmt374EngJ4 . `bazaar-design-package.zip` (DESIGN.md + 2 HTML)
  Eren'de; Task 3'ten önce `BAZAAR\docs\design\` altına konacak (Fable docs'a yazamaz; Eren koyar, Fable commit'ler).
  Gerçek çark kalan öğe sayısı kadar dilimli + "Çarkta 34 güç kaldı" sayacı; satışta kısa bant; altın sınırı hep görünür.
- Task 3 notları: istemci yeni `opening` fazını bilmeli; geri sayım için sunucu `auctionEndsAt` / `openingEndsAt`
  yayınlıyor olmalı (Task 03'te istendi, doğrula); saat farkı için ping ile ofset ölçümü fikri; çark animasyonu için
  MIT lisanslı "spin-wheel" kütüphanesi fikri (sonucu sunucu seçer, ekran oraya döner).
- **Karakterler (Task 3'ten sonra):** Kahoot/Gartic tarzı, **insan** karakterler: 8 taban (farklı yaş/ten/saç,
  büyük kafalı çizgi film), giydirme: şapka, yüz (gözlük/bıyık), eşya, arka plan rengi (6-8 seçenek, pazar + oyun
  şovu parçaları, karikatüre kaçmadan), "rastgele" butonu. İfadeler: normal/heyecanlı/stresli/sevinçli/üzgün.
  Teklif verince emote, son 5 sn'de en yüksek teklif sahibi kızarıp titrer, kazanan sevinir; hazır emote butonları.
  Sunucu sadece seçim numaralarını saklar/doğrular. İlham: Scam With Your Friends'teki büyüyen/kızaran kafalar.
- **Jokerler (sonra):** oyun başında herkese 1, **gizli** (sunucu sadece sahibine gönderir; test gerekir).
  Nadirlik: yaygın %50, nadir %30, destansı %15, efsanevi %5 (seviye içinde eşit), bağımsız çekiliş.
  Aday liste: Mezat Kilidi (efsanevi; kilitlerken en az 5 altın önerildi), Takas teklifi, Dürbün (sonraki 2 öğeyi
  gör; çark sırasının önceden belirlenmesini gerektirir), Geri sat/iade, Pas, Altın kesesi +3, Sayaç dondur, Casus,
  Yeniden çevir, İndirim (yarı fiyat), Sıra çalma, Çifte çark, İtiraz, Son söz, Avukat (hakeme 1 cümle savunma).
  Açık soru: joker kullanılınca herkese "X şunu kullandı" gösterilsin mi (öneri: evet, bazıları sessiz olabilir).
- Açık sorular: hakem neye göre sıralasın (savaş gücü / işe yararlık / eğlence)? "Ali" ile "ali" aynı ad mı?
- `C:\Users\lolse\Desktop\Alinanlar`: arkadaşın verdiği projeler incelendi; kod kopyalanmayacak. Colyseus var
  (geçiş yok). "Online Auction System" (MERN) mimarisi bize uymuyor.
- Arkadaşa teknik tanıtım dokümanı yazıldı (Claude Doc "Bazaar – Teknik Tanıtım").

## 6. Yol haritası
| Adım | İçerik | Durum |
|---|---|---|
| Task 1/1b, Denetim 1, 01, 02 | Motor, hakem, sunucu, çark, açılış fazı, test edilebilir sunucu, entegrasyon testleri | Onaylı |
| 03 | Mezat sayacı, tam sayı teklif, hakem zaman aşımı + doğrulama | Denetimi yarım (bkz. 9) |
| 04 | Kalan sunucu hataları + GAME_RULES güncellemesi | Sırada |
| Ekranlar | A) temel (1 builder), B) ekranlar (3 builder paralel) – bkz. 9 | Sonra |
| Karakterler | Bkz. 5 | Sonra |
| Yayın | Render + Vercel, elle, onaydan sonra; API anahtarını Eren girer | Sonra |
| Sonra | Jokerler, yeni temalar, gizli öğe yazma, "kendi mezadını oluştur" | Sonra |

## 7. Önemli bulunan hatalar (tarihçe)
- Çark 6 öğelik küçülen çarktı → 40'lık çark (4747a46).
- Açıcı çevirince herkes açılış teklifi verebiliyordu → `opening` fazı (a486670).
- Manuel açılış teklifinden sonra mezat sayacı hiç kurulmuyordu (oyun ilk mezatta donuyordu) → Task 03.
- 2,5 gibi küsuratlı teklifler kabul ediliyordu → Task 03.
- Hakem zaman aşımında faz "judging"de kalıyordu; doğrulama zayıftı → Task 03.

## 8. Task 03 commit'leri (Fable 6 commit attı, 4 değil)
775193c timer · f0e242c integer · 77dbfba validate · d2f4d94, 931d76b, 3d492b9 (Fable'ın kendi hatalarına
"fix" commit'leri). "Judge timeout" adlı ayrı commit görünmüyor; zaman aşımının gerçekten judge_failed'a
geçtiğini testle doğrula.

## 9. Şu anki durum (buradan devam et)
0. Kurulum: Eren bu dosyayı, yeni CLAUDE.md'yi, `.claude/agents/builder.md`, `.claude/agents/auditor.md` ve
   `.claude/settings.local.json`'u klasöre koydu. İlk iş: `.gitignore`'a `.claude/worktrees/` ekle; CLAUDE.md,
   docs/STATUS.md, .claude/agents/*, .gitignore'u commit'le ("Switch to manager + parallel agents workflow"), push.
   settings.local.json commit'lenmez. Alt ajanların model adlarının (claude-fable-5-1, claude-opus-5-5) çalıştığını
   küçük bir denemeyle doğrula.
1. Task 03 denetimi yarım kaldı. Main'de Fable'ın 6 commit'i var (775193c timer, f0e242c integer, 77dbfba validate,
   d2f4d94/931d76b/3d492b9 fix-up). Denetçinin ilk raporu: 63 yeşil / 16 kırmızı. Önceki yönetici test dosyalarını
   okudu: judge/fullGame/secrecy testleri hâlâ yanlış alan adı kullanıyor (join_room {code} → roomCode;
   currentItem → revealedItem; `results` alanı yanlış – engine setJudgeResult'taki gerçek adı kullan);
   secrecy testi zayıf (40 adın tümünü her mesajın JSON'unda aramalı); probe_auction_bug.test.ts silinecek;
   reconnect testi **gerçek sunucu hatası**: join_room yeniden bağlanmada da nickname istiyor (kural 10'a aykırı).
   Eski denetçi terminaline bu düzeltmeler gönderilmişti; yeni sistemde bunu auditor alt ajanıyla yeniden yap:
   test düzeltmeleri + iki koşu + sabotaj a-d (açılış teklifinden sonra mezat sonunu kurmama / tam sayı kontrolünü
   kaldırma / bir oyuncusu eksik hakem sonucunu kabul etme / hakem zaman aşımını kaldırma) + her kırmızı için
   SERVER BUG (satır) ya da TEST BUG. Test dosyalarını kendin oku, sonra birleştir.
2. Task 04 (builder): (a) yeniden bağlanmada nickname zorunluluğunu kaldır; (b) tam sayı kontrolünü motorun
   placeBid'ine taşı + motor birim testi (auditor); (c) 1. adımdan çıkan diğer SERVER BUG'lar; (d) `auctionEndsAt` /
   `openingEndsAt` yayınlanıyor mu doğrula; (e) GAME_RULES.md kural 5'e "Teklifler tam sayıdır." (Eren onayladı;
   CLAUDE.md düzenleme yasağı olduğu için Eren'e bu tek değişiklik için onay sor ya da elle ekletir).
3. Ekranlar için Eren'den gereken: `bazaar-design-package.zip` içeriğini `docs/design/` altına koyması
   (DESIGN.md + Auction-Phone.html + Auction-Desktop.html). Sonra plan:
   A) tek builder: istemci temeli (socket bağlantısı + token saklama + otomatik yeniden bağlanma, durum tipleri,
      DESIGN.md'den renk/yazı tipi değişkenleri, ekran yönlendirici, `opening` fazı dahil tüm fazlar).
   B) üç builder paralel, ayrı dosyalar: (1) giriş + lobi + yeniden bağlanma; (2) çark + açılış + mezat + satış bandı
      (geri sayım `auctionEndsAt`'ten); (3) hakem bekleme/hata + sonuç + yeniden oyna.
   Auditor: istemci için uçtan uca test önerisi (ör. Playwright) – Eren'e sorulmadan eklenebilir, bağımlılık ekler.
