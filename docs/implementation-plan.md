# Implementation Plan: Countdown

## Phase 1: Project Scaffolding & Setup
- [ ] Initialize the React Native project (Complete).
- [ ] Set up the backend project directory (`/server`).
- [ ] Configure TypeScript for both frontend and backend.
- [ ] Install essential dependencies: `socket.io`, `express`, `cors` (backend); `socket.io-client`, `react-native-reanimated`, `react-native-vector-icons` (frontend).

## Phase 2: Core Real-time Engine (Backend)
- [ ] Build basic Express server with Socket.io.
- [ ] Implement the `GameState` management object.
- [ ] Develop the lobby system (joining/leaving).
- [ ] Implement the game loop (start game, timer decrement, end game).
- [ ] Implement the `pressButton` logic with cooldown validation.

## Phase 3: Game UI & Interaction (Frontend)
- [ ] Create the `useSocket` custom hook for global state sync.
- [ ] Implement the **Lobby Screen** (Waiting for players UI).
- [ ] Implement the **Game Screen**:
    - Animated countdown timer.
    - Large tactile action button.
    - Leader/Crown visual indicator.
    - Feedback for successful/failed (cooldown) presses.
- [ ] Implement the **Winner Screen** with replay options.

## Phase 4: Polish & Refinement
- [ ] Add sound effects for button presses, leader changes, and countdown warnings.
- [ ] Enhance UI with `react-native-reanimated` for smooth transitions.
- [ ] Add local feedback for the cooldown timer.
- [ ] Basic error handling for connection issues.

## Phase 5: Testing & Deployment Preparation
- [ ] Manual testing with multiple simulated players.
- [ ] Stress test the WebSocket connection.
- [ ] Ensure consistent behavior across iOS and Android.
