# Product Brief: Countdown

## 1. Overview
"Countdown" is a real-time multiplayer competitive game where players battle for control of a shared button. The objective is to be the last player holding the lead position ("crown holder") when the countdown timer reaches zero. The game creates continuous tension through a dynamic timer that resets every time a new player takes control.

## 2. Core Gameplay Loop
1. Players join a game lobby.
2. The game starts once a minimum number of players (configurable) is reached.
3. A shared button becomes active.
4. A player presses the button and becomes the **leader (crown holder)**.
5. The countdown timer resets to a predefined duration.
6. Other players attempt to press the button to take over the lead.
7. Each takeover resets the timer again.
8. The loop continues until the timer reaches zero.
9. The current leader at that moment is declared the winner.
10. A new round begins automatically once enough players join again.

## 3. Game Mechanics
### Leader Control (Crown System)
- Only one player can hold the crown at a time.
- Pressing the button replaces the current leader instantly.

### Dynamic Countdown
- The timer resets after every successful takeover.
- Timer duration is configurable per game/session.

### Cooldown System (Anti-Spam)
- After pressing the button, a player enters a cooldown period.
- During cooldown, the player cannot press the button again.
- Cooldown duration is configurable.

### Game Start Conditions
- Minimum number of players required to start (configurable).
- Game does not begin until threshold is reached.

### Game End Condition
- The player holding the crown when the timer reaches zero wins.

## 4. Key Features
- Real-time multiplayer interactions.
- Instant leader switching ("king of the hill" mechanic).
- Resetting countdown timer creates high tension.
- Configurable game rules: Minimum players, Timer duration, Cooldown duration.
- Automatic round lifecycle (start -> play -> win -> restart).
- Anti-spam protection via cooldown.
- Live state synchronization across all players.

## 5. Visual & UX Direction
- Minimalist, clean, and highly responsive UI.
- Core elements: Large central action button, Prominent countdown timer, Leader display (crown indicator), Player count / lobby state.
- Real-time updates with no refresh.
- Focus on urgency, clarity, and competition.

## 6. Technical Considerations
- Real-time communication (WebSockets or similar).
- Scalable state management for leader state, timer synchronization, and player actions.
- Event-driven architecture for button presses and state updates.
- Server-side authority for timing and leader state to prevent cheating.

## 7. Future Roadmap
- Private rooms / friends mode.
- Global leaderboards.
- Rewards / points system.
- Power-ups or modifiers (e.g., freeze timer, double cooldown).
- Different game modes (long timer, blitz mode, team mode).
