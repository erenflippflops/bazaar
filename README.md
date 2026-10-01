# Bazaar

A multiplayer fantasy auction game where players use superpowers to acquire mystical items.

## Quick Start (3 Steps)

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the game:**
   ```bash
   npm run dev
   ```

3. **Open in browser:**
   ```
   http://localhost:5200
   ```

That's it! Create a room, share the code with friends, and start playing.

## Game Overview

- **2-6 players** compete in 6 auction rounds
- Each player has **3 unique superpowers** (randomly assigned)
- Spin the **wheel of items** to reveal mystical artifacts
- **Bid strategically** using your limited gold
- An **AI judge** ranks players based on item synergy and creative power use
- Winner gets the glory! 🏆

## Development

### Project Structure

```
├── client/          # React + Vite frontend
│   ├── src/
│   │   ├── screens/     # LobbyScreen, GameScreen, ResultsScreen
│   │   ├── components/  # Reusable UI components
│   │   └── hooks/       # useSocket, etc.
│   └── public/
├── server/          # Node.js + Socket.IO backend
│   ├── index.ts         # Main server & socket handlers
│   ├── gameEngine.ts    # Core game logic
│   └── judgeResult.ts   # AI judge integration
├── tests/
│   ├── unit/            # Game engine unit tests
│   ├── integration/     # Socket & server tests
│   └── e2e/             # Playwright browser tests
└── docs/
    ├── GAME_RULES.md    # Complete rulebook
    └── DESIGN.md        # UI/UX specifications
```

### Available Commands

```bash
# Development
npm run dev              # Start both client & server with hot reload

# Testing
npm run test:unit        # Run all tests (unit + integration)
npm run test:e2e         # Run end-to-end browser tests

# Building
npm run build            # Build client for production
npm run preview          # Preview production build locally

# Server only (for debugging)
npm run server           # Start server on port 3100
```

### Environment Variables

Create `.env` in the project root:

```env
# Optional: OpenAI API key for AI judge
OPENAI_API_KEY=your_key_here

# Optional: Custom ports
PORT=3100
VITE_PORT=5200
```

**Note:** The game works without an API key in development (uses mock judge responses).

## Testing

### Run All Tests

```bash
npm run test:unit        # 78 tests (unit + integration)
npm run test:e2e         # 5 E2E scenarios
```

### Test Coverage

- **Unit tests:** Game engine logic (spinning, bidding, scoring)
- **Integration tests:** Socket events, reconnection, judging flow
- **E2E tests:** Full game flow, multiplayer scenarios, browser reconnect

All tests must pass before deployment.

## Deployment

### Prerequisites

- Node.js 18+ 
- OpenAI API key (for production judge)

### Deploy to Vercel (Recommended)

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Deploy:**
   ```bash
   vercel
   ```

3. **Set environment variables in Vercel dashboard:**
   - `OPENAI_API_KEY` - Your OpenAI API key
   - `NODE_ENV` - Set to `production`

4. **Done!** Your game is live at `https://your-app.vercel.app`

### Deploy to Other Platforms

The app is a standard Node.js + Vite app. Build steps:

```bash
npm run build            # Builds client to client/dist
npm run server           # Starts server (set PORT env var)
```

**Requirements:**
- Serve `client/dist` as static files
- Run `npm run server` as the backend process
- Enable WebSocket support (for Socket.IO)

## Game Rules

Players compete over 6 auction rounds. Each round:

1. **Spin Phase:** Current player spins the wheel (costs 1 gold)
2. **Opening Bid:** Spinner makes the first bid
3. **Bidding Phase:** Others can outbid (10s timer)
4. **Winner:** Highest bidder gets the item

After 6 rounds, the **AI judge** evaluates each player's collection and ranks them based on:
- **Synergy:** How well powers and items work together
- **Creativity:** Unique or clever combinations
- **Storytelling:** Narrative coherence of the collection

See [docs/GAME_RULES.md](docs/GAME_RULES.md) for complete rules.

## Architecture

### Client

- **React 18** with TypeScript
- **Socket.IO client** for real-time multiplayer
- **Vite** for fast development and building
- Responsive design (mobile + desktop)

### Server

- **Node.js** with TypeScript
- **Socket.IO** for WebSocket communication
- **Express** for serving static files
- **OpenAI API** for judging (GPT-4)

### Game Flow

```
Lobby → Game (6 rounds) → Judging → Results → Rematch/Exit
   ↓         ↓               ↓
 Join    Spin/Bid      AI Evaluation
```

## Contributing

1. Fork the repo
2. Create a feature branch
3. Write tests for new features
4. Ensure all tests pass (`npm run test:unit && npm run test:e2e`)
5. Submit a pull request

## License

MIT

---

**Questions?** Check [docs/GAME_RULES.md](docs/GAME_RULES.md) or open an issue.
