# Technical Specification: Countdown

## 1. System Architecture
"Countdown" will follow a Client-Server architecture to ensure real-time synchronization and server-side authority for game logic.

### 1.1 Tech Stack
- **Frontend:** React Native (TypeScript).
- **Backend:** Node.js with Express.
- **Real-time Communication:** Socket.io (WebSockets).
- **State Management:** React Context or Redux (Frontend).
- **Styling:** Vanilla CSS-in-JS (StyleSheet).

## 2. Core Modules & Data Models

### 2.1 Game State (Server-side)
```typescript
interface GameState {
  status: 'LOBBY' | 'PLAYING' | 'WINNER_REVEALED';
  leaderId: string | null;
  timerValue: number; // Current seconds remaining
  timerDuration: number; // Initial reset value
  players: Record<string, Player>;
  minPlayers: number;
}

interface Player {
  id: string;
  name: string;
  lastPressTimestamp: number;
  cooldownUntil: number;
}
```

### 2.2 Event System (Socket.io)
- **Client -> Server:**
  - `joinLobby`: Player joins the game.
  - `pressButton`: Player attempts to take the crown.
- **Server -> Client:**
  - `gameStateUpdate`: Broadcasts the entire game state.
  - `leaderChanged`: Specific event for visual feedback when crown shifts.
  - `gameStarted`: Signals the transition from LOBBY to PLAYING.
  - `gameEnded`: Signals a winner and starts the reveal phase.

## 3. Key Logic Implementation

### 3.1 The "Resetting" Timer
The server maintains a single source of truth for the timer.
- When `pressButton` is received:
  1. Validate player cooldown.
  2. Set `leaderId` to the current player.
  3. Reset `timerValue` to `timerDuration`.
  4. Broadcast update.
- A background interval on the server decrements `timerValue` every second.

### 3.2 Anti-Spam (Cooldown)
- Server checks `Date.now() < player.cooldownUntil` before accepting a press.
- `cooldownDuration` (e.g., 2 seconds) is added to the player's timestamp after a successful press.

### 3.3 Synchronization
- To account for network latency, the server broadcasts the current `timerValue` frequently. 
- The client "smooths" the countdown locally but snaps to the server's value on every update.

## 4. UI/UX Component Tree (React Native)
- `App.tsx`: Navigation and Socket initialization.
- `LobbyScreen.tsx`: Waiting room, player count display.
- `GameScreen.tsx`: 
    - `Header`: Shows player names and connection status.
    - `CountdownDisplay`: Large animated timer.
    - `ActionButton`: The main game interaction.
    - `CrownIndicator`: Visual highlight of the current leader.
- `WinnerModal.tsx`: Celebration overlay when the timer hits zero.

## 5. Security & Fairness
- **Server Authority:** The client only sends "intent" (`pressButton`). The server calculates the winner and validates the timer.
- **Rate Limiting:** Socket.io connections are throttled to prevent DDoS from malicious clients.
