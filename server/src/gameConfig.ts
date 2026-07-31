/**
 * COUNTDOWN GAME CONFIGURATION
 * Edit the values below to adjust game rules, timer duration, player limits, and security thresholds.
 */
export const GAME_CONFIG = {
  // -------------------------------------------------------------
  // GAMEPLAY MECHANICS
  // -------------------------------------------------------------
  
  /** Round duration in seconds. Clock resets to this value on crown steal. */
  TIMER_DURATION_SEC: 30,

  /** Cooldown duration per button press in milliseconds (2000ms = 2.0 seconds). */
  COOLDOWN_MS: 2000,

  /** Minimum players required in lobby to automatically start a match. */
  MIN_PLAYERS: 2,

  /** Delay in milliseconds between match end and returning to lobby. */
  RESTART_DELAY_MS: 5000,

  // -------------------------------------------------------------
  // SECURITY ENGINE THRESHOLDS
  // -------------------------------------------------------------
  SECURITY: {
    /** Maximum allowed button presses per second per socket before anti-spam trigger. */
    MAX_REQUESTS_PER_SEC: 8,

    /** Number of spam rate violations before immediate account locking. */
    MAX_VIOLATIONS: 2,

    /** Grace period in milliseconds for latency/network jitter on cooldown checks. */
    COOLDOWN_GRACE_MS: 300,
  }
};
