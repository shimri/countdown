import { Socket } from 'socket.io';
import { GAME_CONFIG } from './gameConfig';

interface RateTracker {
  count: number;
  resetAt: number;
  violationScore: number;
}

const rateMap = new Map<string, RateTracker>();

export async function checkIsAccountLocked(playerId: string): Promise<boolean> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) return false;

  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/players?id=eq.${encodeURIComponent(playerId)}&select=is_locked,lock_reason`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });
    if (res.ok) {
      const data = await res.json() as { is_locked?: boolean; lock_reason?: string }[];
      if (data && data.length > 0 && data[0].is_locked) {
        return true;
      }
    }
  } catch (err) {
    console.error('[SecurityEngine] Lock check failed:', err);
  }
  return false;
}

export async function lockUserAccount(
  playerId: string,
  playerName: string,
  reason: string,
  socket: Socket,
  onAccountLockedCallback?: () => void
): Promise<void> {
  console.warn(`[SECURITY ENGINE ALERT] 🚨 locking account ${playerName} (${playerId})! Reason: ${reason}`);

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey) {
    try {
      await fetch(`${supabaseUrl}/rest/v1/players`, {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates,return=representation'
        },
        body: JSON.stringify({
          id: playerId,
          name: playerName,
          is_locked: true,
          lock_reason: reason,
          locked_at: new Date().toISOString()
        })
      });
      console.log(`[SecurityEngine] Persisted lock status for ${playerName} to Supabase.`);
    } catch (err) {
      console.error('[SecurityEngine] Failed to write lock to Supabase:', err);
    }
  }

  // Send security lock event to client
  socket.emit('accountLocked', {
    reason,
    message: 'Your account has been locked immediately due to a security violation (spoofing/spamming).'
  });

  if (onAccountLockedCallback) {
    onAccountLockedCallback();
  }

  // Force disconnect socket
  setTimeout(() => {
    socket.disconnect(true);
  }, 200);
}

export function validateRateLimitAndAntiSpam(
  socket: Socket,
  playerId: string,
  playerName: string,
  onLock: () => void
): boolean {
  const now = Date.now();
  let tracker = rateMap.get(socket.id);

  if (!tracker || now > tracker.resetAt) {
    tracker = { count: 1, resetAt: now + 1000, violationScore: tracker?.violationScore || 0 };
    rateMap.set(socket.id, tracker);
    return true;
  }

  tracker.count++;

  if (tracker.count > GAME_CONFIG.SECURITY.MAX_REQUESTS_PER_SEC) {
    tracker.violationScore++;
    console.warn(`[SecurityEngine] High frequency press detected for ${playerName}. Violation count: ${tracker.violationScore}`);

    if (tracker.violationScore >= GAME_CONFIG.SECURITY.MAX_VIOLATIONS) {
      lockUserAccount(
        playerId,
        playerName,
        `SPAM_ATTACK_DETECTED (${tracker.count} req/s, exceeds ${GAME_CONFIG.SECURITY.MAX_REQUESTS_PER_SEC}/s threshold)`,
        socket,
        onLock
      );
      return false;
    }
  }

  return true;
}

export function cleanupSocketSecurity(socketId: string) {
  rateMap.delete(socketId);
}
