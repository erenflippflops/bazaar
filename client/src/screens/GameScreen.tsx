import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Socket } from 'socket.io-client';
import { t } from '../i18n';
import { Background } from '../components/Background';
import { Lanterns } from '../components/Lanterns';
import { Header } from '../components/Header';
import Wheel from '../components/Wheel';
import PlayerCard from '../components/PlayerCard';
import PlayerCardMini from '../components/PlayerCardMini';
import ArchCard from '../components/ArchCard';
import SaleBanner from '../components/SaleBanner';
import StatusBox from '../components/StatusBox';
import BidHistory from '../components/BidHistory';
import Controls from '../components/Controls';

interface Item {
  name: string;
  description: string;
}

interface Player {
  id: string;
  nickname: string;
  gold: number;
  slots: (Item | null)[];
  token: string;
  maxBid?: number;
  disconnected?: boolean;
}

interface GameState {
  phase: string;
  hostId: string;
  players: Player[];
  wheel: number;
  revealedItem: Item | null;
  currentOpenerIndex: number;
  currentHighestBid: number;
  currentHighestBidderId: string | null;
  auctionEndsAt?: number;
  openingEndsAt?: number;
  roomCode?: string;
  auctionNumber?: number;
  passedPlayerIds?: string[];
  isAuctionSettled?: boolean;
  theme?: {
    id: string;
    slots: number;
    name: { tr: string };
  };
  spinKey?: number;
  outReasons?: Record<string, string>;
  bidHistory?: Array<{ playerId: string; amount: number; at: number }>;
}

interface GameScreenProps {
  socket: Socket | null;
  gameState: GameState | null;
}

export default function GameScreen({ socket, gameState }: GameScreenProps) {
  const [spinKey, setSpinKey] = useState<number>(0);
  const [showArchCard, setShowArchCard] = useState(false);
  const [showSoldBanner, setShowSoldBanner] = useState(false);
  const [soldInfo, setSoldInfo] = useState<{ item: string; winner: string; amount: number } | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [pendingBid, setPendingBid] = useState(0);
  const navigate = useNavigate();

  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 768;
  const myPlayerId = sessionStorage.getItem('playerId');

  // Navigate to results when game finishes
  useEffect(() => {
    if (gameState?.phase === 'finished') {
      navigate('/results');
    }
  }, [gameState?.phase, navigate]);

  // Handle spin animation trigger
  useEffect(() => {
    if (gameState?.spinKey !== undefined && gameState.spinKey !== spinKey) {
      setSpinKey(gameState.spinKey);
      setShowArchCard(false);

      setTimeout(() => {
        if (gameState.revealedItem) {
          setShowArchCard(true);
        }
      }, 3200);
    }
  }, [gameState?.spinKey, gameState?.revealedItem, spinKey]);

  // Handle sold banner
  useEffect(() => {
    if (gameState?.isAuctionSettled && gameState.revealedItem && gameState.currentHighestBidderId) {
      const winner = gameState.players.find(p => p.id === gameState.currentHighestBidderId);
      if (winner) {
        setSoldInfo({
          item: gameState.revealedItem.name,
          winner: winner.nickname,
          amount: gameState.currentHighestBid,
        });
        setShowSoldBanner(true);
      }
    } else {
      setShowSoldBanner(false);
    }
  }, [gameState?.isAuctionSettled, gameState?.revealedItem, gameState?.currentHighestBidderId, gameState?.currentHighestBid, gameState?.players]);

  // Handle countdown
  useEffect(() => {
    if (!gameState) return;

    const endTime = gameState.phase === 'bidding' ? gameState.auctionEndsAt : gameState.openingEndsAt;
    if (!endTime) {
      setCountdown(null);
      return;
    }

    const updateCountdown = () => {
      const remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
      setCountdown(remaining);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 100);
    return () => clearInterval(interval);
  }, [gameState?.phase, gameState?.auctionEndsAt, gameState?.openingEndsAt]);

  if (!gameState) {
    return null;
  }

  const myPlayer = gameState.players.find(p => p.id === myPlayerId);
  const currentOpener = gameState.players[gameState.currentOpenerIndex];
  const isMyTurn = currentOpener?.id === myPlayerId;
  const slotsPerPlayer = gameState.theme?.slots || 3;
  const themeId = gameState.theme?.id || '';
  const themeName = gameState.theme?.name.tr || '';
  const topBidder = gameState.players.find(p => p.id === gameState.currentHighestBidderId);
  const amITopBidder = gameState.currentHighestBidderId === myPlayerId;
  const havIPassed = gameState.passedPlayerIds?.includes(myPlayerId || '');
  const myOutReason = myPlayer ? gameState.outReasons?.[myPlayer.id] : undefined;

  // Calculate auction number
  const completedAuctions = gameState.players.reduce((n, p) => n + p.slots.filter(s => s !== null).length, 0);
  const totalAuctions = gameState.players.length * slotsPerPlayer;
  const currentAuction = completedAuctions + 1;

  // Determine wheel state
  let wheelState: 'your-turn' | 'not-your-turn' | 'spinning' = 'not-your-turn';
  if (gameState.phase === 'playing') {
    if (isMyTurn) {
      wheelState = 'your-turn';
    }
  }
  if (gameState.spinKey !== undefined && gameState.spinKey === spinKey && !showArchCard) {
    wheelState = 'spinning';
  }

  const handleSpin = () => {
    if (!socket || !isMyTurn || gameState.phase !== 'playing') return;
    socket.emit('spin_wheel', {}, (response: any) => {
      if (response?.success === false) {
        alert(response.error || 'Çark çevrilemedi');
      }
    });
  };

  const handleSoldBannerComplete = () => {
    setShowSoldBanner(false);
  };

  const handleBidIncrement = (amount: number) => {
    setPendingBid(prev => prev + amount);
  };

  const handlePass = () => {
    if (!socket) return;
    socket.emit('pass', {});
    setPendingBid(0);
  };

  const handleSubmitBid = () => {
    if (!socket || pendingBid === 0) return;
    const totalBid = gameState.currentHighestBid + pendingBid;
    socket.emit('place_bid', { amount: totalBid });
    setPendingBid(0);
  };

  // Map players to PlayerCard/PlayerCardMini props
  const mapPlayers = () => {
    return gameState.players.map(player => {
      let label: 'SIRA SENDE' | 'SIRA ONDA' | 'SEN' | 'PAS' | 'BAĞLANTI KOPTU' | undefined;

      if (player.disconnected) {
        label = 'BAĞLANTI KOPTU';
      } else if (gameState.phase === 'playing') {
        if (player.id === currentOpener?.id) {
          label = player.id === myPlayerId ? 'SIRA SENDE' : 'SIRA ONDA';
        } else if (player.id === myPlayerId) {
          label = 'SEN';
        }
      } else if (gameState.phase === 'bidding' || gameState.phase === 'opening') {
        if (gameState.passedPlayerIds?.includes(player.id)) {
          label = 'PAS';
        } else if (player.id === myPlayerId) {
          label = 'SEN';
        }
      }

      return {
        nickname: player.nickname,
        gold: player.gold,
        slots: player.slots.map(slot => ({ itemName: slot?.name || null })),
        label,
        isYou: player.id === myPlayerId,
        isDisconnected: player.disconnected,
        outReason: gameState.outReasons?.[player.id],
      };
    });
  };

  const players = mapPlayers();

  // Build bid history
  const buildBidHistory = () => {
    if (!gameState.bidHistory || gameState.bidHistory.length === 0) return [];

    const now = Date.now();
    return gameState.bidHistory
      .slice()
      .reverse()
      .slice(0, 3)
      .map((bid, index) => {
        const player = gameState.players.find(p => p.id === bid.playerId);
        const elapsed = Math.floor((now - bid.at) / 1000);
        let timing = 'açılış';
        if (index === 0) timing = 'şimdi';
        else if (elapsed < 60) timing = `${elapsed} sn önce`;

        return {
          playerName: player?.nickname || 'Unknown',
          amount: bid.amount,
          timing,
        };
      });
  };

  // Render StatusBox for right column
  const renderStatusBox = () => {
    if (gameState.phase === 'playing') {
      return (
        <StatusBox
          label={isMyTurn ? 'SENİN SIRAN!' : `${currentOpener?.nickname?.toUpperCase()} OYNUYOR`}
          bigText="ÇEVİR"
          subText={isMyTurn ? 'Çarka dokun ya da butona bas' : 'Sıra onda'}
          gold={myPlayer?.gold || 0}
        />
      );
    }

    if (gameState.phase === 'opening') {
      const isOpener = currentOpener?.id === myPlayerId;
      return (
        <StatusBox
          label={isOpener ? 'SEN AÇIYORSUN' : `${currentOpener?.nickname?.toUpperCase()} AÇIYOR`}
          bigText={isOpener ? 'TEKLİF VER' : 'AÇILIŞ'}
          subText={isOpener ? 'İlk teklifi sen veriyorsun' : 'İlk teklifi veriyor'}
          countdown={countdown || undefined}
          gold={myPlayer?.gold || 0}
        />
      );
    }

    if (gameState.phase === 'bidding') {
      const urgent = (countdown || 0) <= 5;

      if (amITopBidder) {
        return (
          <StatusBox
            label="SEN ÖNDESIN!"
            bigText={`${gameState.currentHighestBid} ALTIN`}
            subText="En yüksek teklif senin"
            countdown={countdown || undefined}
            urgent={urgent}
            gold={myPlayer?.gold || 0}
          />
        );
      }

      if (havIPassed) {
        return (
          <StatusBox
            label="PAS DEDİN"
            bigText="BEKLİYORSUN"
            subText="Teklifler devam ediyor"
            countdown={countdown || undefined}
            gold={myPlayer?.gold || 0}
          />
        );
      }

      if (myOutReason) {
        return (
          <StatusBox
            label="DIŞARIDASIN"
            bigText="OUT"
            subText={myOutReason}
            countdown={countdown || undefined}
            gold={myPlayer?.gold || 0}
          />
        );
      }

      return (
        <StatusBox
          label="EN YÜKSEK TEKLİF"
          bigText={`${gameState.currentHighestBid} ALTIN`}
          subText={topBidder ? `${topBidder.nickname} önde` : 'Teklif ver'}
          countdown={countdown || undefined}
          urgent={urgent}
          gold={myPlayer?.gold || 0}
        />
      );
    }

    return null;
  };

  const canBid = gameState.phase === 'bidding' && !havIPassed && !myOutReason && myPlayer && myPlayer.gold > gameState.currentHighestBid;
  const canPass = (gameState.phase === 'bidding' || gameState.phase === 'opening') && !havIPassed && !myOutReason;
  const nextBid = gameState.currentHighestBid + pendingBid;

  // Render desktop layout
  if (isDesktop) {
    return (
      <div
        style={{
          width: '1440px',
          height: '900px',
          position: 'relative',
          overflow: 'hidden',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          background: '#16187A',
          fontFamily: "'Rubik', 'Helvetica Neue', sans-serif",
          color: '#FFFFFF',
        }}
      >
        <Background />
        <Lanterns stage="desktop" />
        <Header
          roomCode={gameState.roomCode || null}
          theme={themeName}
          auctionNumber={currentAuction}
          totalAuctions={totalAuctions}
          mode="game"
        />

        <div
          style={{
            position: 'relative',
            flexGrow: 1,
            display: 'grid',
            gridTemplateColumns: '320px minmax(0, 1fr) 360px',
            gap: '36px',
            padding: '10px 40px 32px',
          }}
        >
          {/* Left: Players */}
          <aside style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: 800, letterSpacing: '0.12em', color: '#C9CBFF' }}>
              OYUNCULAR VE KOLEKSİYONLAR
            </span>
            {players.map((player, i) => (
              <PlayerCard key={i} player={player} themeId={themeId} />
            ))}
          </aside>

          {/* Center: Wheel + ArchCard */}
          <main style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '4px' }}>
            <Wheel itemsLeft={gameState.wheel} state={wheelState} onSpin={handleSpin} spinKey={spinKey} />
            {showArchCard && gameState.revealedItem && <ArchCard item={gameState.revealedItem} />}
            {gameState.phase === 'playing' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', marginTop: '14px', width: '100%' }}>
                <button
                  onClick={handleSpin}
                  disabled={!isMyTurn}
                  style={{
                    height: '64px',
                    border: '3px solid #0B0C3F',
                    borderRadius: '16px',
                    background: isMyTurn ? '#FFC93C' : '#555',
                    color: '#0B0C3F',
                    boxShadow: '0 6px 0 #0B0C3F',
                    fontFamily: "'Bungee', 'Impact', sans-serif",
                    fontSize: '24px',
                    width: '360px',
                    cursor: isMyTurn ? 'pointer' : 'not-allowed',
                  }}
                >
                  ÇARKI ÇEVİR
                </button>
                <span style={{ fontSize: '15px', fontWeight: 700, color: '#C9CBFF' }}>
                  Çarkta {gameState.wheel} güç kaldı
                </span>
              </div>
            )}
          </main>

          {/* Right: StatusBox + BidHistory + Controls */}
          <aside style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {renderStatusBox()}
            {(gameState.phase === 'bidding' || gameState.phase === 'opening') && gameState.bidHistory && gameState.bidHistory.length > 0 && (
              <BidHistory bids={buildBidHistory()} />
            )}
            {(gameState.phase === 'bidding' || gameState.phase === 'opening') && canBid && myPlayer && (
              <Controls
                myGold={myPlayer.gold}
                maxBid={myPlayer.maxBid || myPlayer.gold}
                slotsUsed={myPlayer.slots.filter(s => s !== null).length}
                totalSlots={slotsPerPlayer}
                currentBid={gameState.currentHighestBid}
                canBid={canBid}
                canPass={canPass}
                onBidIncrement={handleBidIncrement}
                onPass={handlePass}
                onSubmitBid={handleSubmitBid}
                nextBid={nextBid}
              />
            )}
          </aside>
        </div>

        {showSoldBanner && soldInfo && (
          <SaleBanner item={soldInfo.item} winner={soldInfo.winner} amount={soldInfo.amount} onComplete={handleSoldBannerComplete} />
        )}
      </div>
    );
  }

  // Phone layout
  return (
    <div
      style={{
        width: '390px',
        minHeight: '844px',
        position: 'relative',
        overflow: 'auto',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        background: '#16187A',
        fontFamily: "'Rubik', 'Helvetica Neue', sans-serif",
        color: '#FFFFFF',
      }}
    >
      <Background />
      <Lanterns stage="phone" />
      <Header roomCode={gameState.roomCode || null} theme={themeName} auctionNumber={currentAuction} totalAuctions={totalAuctions} mode="game" />

      <div style={{ padding: '10px 16px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
          {players.map((player, i) => (
            <PlayerCardMini key={i} player={player} themeId={themeId} />
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{ transform: 'scale(0.7)', transformOrigin: 'center' }}>
            <Wheel itemsLeft={gameState.wheel} state={wheelState} onSpin={handleSpin} spinKey={spinKey} />
          </div>
        </div>

        {showArchCard && gameState.revealedItem && (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <ArchCard item={gameState.revealedItem} />
          </div>
        )}

        {gameState.phase === 'playing' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={handleSpin}
              disabled={!isMyTurn}
              style={{
                height: '56px',
                border: '3px solid #0B0C3F',
                borderRadius: '14px',
                background: isMyTurn ? '#FFC93C' : '#555',
                color: '#0B0C3F',
                boxShadow: '0 5px 0 #0B0C3F',
                fontFamily: "'Bungee', 'Impact', sans-serif",
                fontSize: '20px',
                width: '100%',
                cursor: isMyTurn ? 'pointer' : 'not-allowed',
              }}
            >
              ÇARKI ÇEVİR
            </button>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#C9CBFF' }}>Çarkta {gameState.wheel} güç kaldı</span>
          </div>
        )}
      </div>

      {showSoldBanner && soldInfo && (
        <SaleBanner item={soldInfo.item} winner={soldInfo.winner} amount={soldInfo.amount} onComplete={handleSoldBannerComplete} />
      )}
    </div>
  );
}
