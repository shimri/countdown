import express from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import { createClient } from 'redis';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import { checkIsAccountLocked, lockUserAccount, validateRateLimitAndAntiSpam, cleanupSocketSecurity } from './securityEngine';
import { GAME_CONFIG } from './gameConfig';

import path from 'path';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.static(path.join(__dirname, '../public')));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Database Connections
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

const pgPool = process.env.DATABASE_URL ? new Pool({ connectionString: process.env.DATABASE_URL }) : null;

// Initialize DB schema
const initDB = async () => {
    if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
        console.log('[Supabase SaaS] Database persistence connected & active (https://ughcjatkftijiwlcukkn.supabase.co)');
        return;
    }

    if (pgPool) {
        try {
            await pgPool.query(`
                CREATE TABLE IF NOT EXISTS players (
                    id VARCHAR(255) PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    wins INTEGER DEFAULT 0,
                    last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);
            console.log('PostgreSQL schema initialized');
        } catch (err) {
            console.error('PostgreSQL connection/init failed:', err);
        }
    }
};

interface Player {
  id: string;
  name: string;
  userId?: string;
  lastPressTimestamp: number;
  cooldownUntil: number;
}

interface GameState {
  status: 'LOBBY' | 'PLAYING' | 'WINNER_REVEALED';
  leaderId: string | null;
  timerValue: number;
  timerDuration: number;
  players: Record<string, Player>;
  minPlayers: number;
}

let gameState: GameState = {
  status: 'LOBBY',
  leaderId: null,
  timerValue: GAME_CONFIG.TIMER_DURATION_SEC,
  timerDuration: GAME_CONFIG.TIMER_DURATION_SEC,
  players: {},
  minPlayers: GAME_CONFIG.MIN_PLAYERS,
};

let timerInterval: NodeJS.Timeout | null = null;

// Synchronize with Redis (State Persistence)
async function syncToRedis() {
    try {
        await redisClient.set('gameState', JSON.stringify(gameState));
    } catch (err) {
        console.error('Redis sync failed:', err);
    }
}

function broadcastState() {
  io.emit('gameStateUpdate', gameState);
  syncToRedis();
}

async function recordWin(playerId: string, name: string, userId?: string) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
        try {
            // Record in players table
            const getRes = await fetch(`${supabaseUrl}/rest/v1/players?id=eq.${encodeURIComponent(playerId)}&select=wins`, {
                headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
            });
            const existing = await getRes.json() as { wins: number }[];
            const currentWins = (existing && existing.length > 0) ? existing[0].wins : 0;

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
                    name: name,
                    wins: currentWins + 1,
                    last_active: new Date().toISOString()
                })
            });

            // Insert into game_history
            await fetch(`${supabaseUrl}/rest/v1/game_history`, {
                method: 'POST',
                headers: {
                    'apikey': supabaseKey,
                    'Authorization': `Bearer ${supabaseKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    winner_id: userId && userId.length === 36 ? userId : null,
                    winner_name: name
                })
            });

            // If authenticated userId is present, update profiles
            if (userId && userId.length === 36) {
                const profileRes = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}&select=wins,games_played`, {
                    headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
                });
                const profData = await profileRes.json() as { wins: number; games_played: number }[];
                const pWins = (profData && profData.length > 0) ? profData[0].wins : 0;
                const pGames = (profData && profData.length > 0) ? profData[0].games_played : 0;

                await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}`, {
                    method: 'PATCH',
                    headers: {
                        'apikey': supabaseKey,
                        'Authorization': `Bearer ${supabaseKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        wins: pWins + 1,
                        games_played: pGames + 1,
                        updated_at: new Date().toISOString()
                    })
                });
            }

            console.log(`[Supabase Auth] Recorded win for player ${name} (User: ${userId || 'Guest'})!`);
            return;
        } catch (err) {
            console.error('[Supabase] recordWin failed:', err);
        }
    }

    if (pgPool) {
        try {
            await pgPool.query(`
                INSERT INTO players (id, name, wins)
                VALUES ($1, $2, 1)
                ON CONFLICT (id) DO UPDATE
                SET wins = players.wins + 1, name = $2, last_active = CURRENT_TIMESTAMP;
            `, [playerId, name]);
        } catch (err) {
            console.error('PostgreSQL record win failed:', err);
        }
    }
}

async function getTopPlayers() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
        try {
            const res = await fetch(`${supabaseUrl}/rest/v1/players?select=name,wins&order=wins.desc&limit=10`, {
                headers: {
                    'apikey': supabaseKey,
                    'Authorization': `Bearer ${supabaseKey}`
                }
            });
            if (res.ok) {
                const data = await res.json();
                return data;
            }
        } catch (err) {
            console.error('[Supabase] getTopPlayers failed:', err);
        }
    }

    if (pgPool) {
        try {
            const result = await pgPool.query('SELECT name, wins FROM players ORDER BY wins DESC LIMIT 10');
            return result.rows;
        } catch (err) {
            console.error('PostgreSQL fetch leaderboard failed:', err);
            return [];
        }
    }
    return [];
}

function startGame() {
  if (Object.keys(gameState.players).length >= GAME_CONFIG.MIN_PLAYERS) {
    gameState.status = 'PLAYING';
    gameState.timerValue = GAME_CONFIG.TIMER_DURATION_SEC;
    gameState.leaderId = null;
    broadcastState();
    io.emit('gameStarted');

    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      if (gameState.status === 'PLAYING') {
        gameState.timerValue--;
        if (gameState.timerValue <= 0) {
          endGame();
        } else {
          broadcastState();
        }
      }
    }, 1000);
  }
}

async function endGame() {
  if (timerInterval) clearInterval(timerInterval);
  gameState.status = 'WINNER_REVEALED';
  
  const winnerId = gameState.leaderId;
  const winner = winnerId ? gameState.players[winnerId] : null;
  
  if (winnerId && winner) {
      await recordWin(winnerId, winner.name, winner.userId);
  }

  broadcastState();
  io.emit('gameEnded', { winnerId });
  
  setTimeout(() => {
    gameState.status = 'LOBBY';
    gameState.timerValue = GAME_CONFIG.TIMER_DURATION_SEC;
    gameState.leaderId = null;
    for (const id in gameState.players) {
      gameState.players[id].cooldownUntil = 0;
      gameState.players[id].lastPressTimestamp = 0;
    }
    broadcastState();
    if (Object.keys(gameState.players).length >= GAME_CONFIG.MIN_PLAYERS) {
      startGame();
    }
  }, GAME_CONFIG.RESTART_DELAY_MS);
}

io.on('connection', (socket: Socket) => {
  console.log(`Player connected: ${socket.id}`);

  socket.on('joinLobby', async (data: { name: string; userId?: string; playerToken?: string }) => {
    const playerName = data.name || `Player ${socket.id.substring(0, 4)}`;

    // Anti-Spoofing & Security Check 1: Check if account is locked in Supabase
    const isLocked = await checkIsAccountLocked(socket.id);
    if (isLocked) {
      socket.emit('accountLocked', {
        reason: 'ACCOUNT_LOCKED',
        message: 'Your account is locked and cannot join game sessions.'
      });
      socket.disconnect(true);
      return;
    }

    gameState.players[socket.id] = {
      id: socket.id,
      name: playerName,
      userId: data.userId,
      lastPressTimestamp: 0,
      cooldownUntil: 0,
    };
    broadcastState();
    if (gameState.status === 'LOBBY' && Object.keys(gameState.players).length >= GAME_CONFIG.MIN_PLAYERS) {
      startGame();
    }
  });

  socket.on('pressButton', (data?: { spoofedPlayerId?: string }) => {
    if (gameState.status !== 'PLAYING') return;

    // Anti-Spoofing Check: Detect forged player IDs
    if (data && data.spoofedPlayerId && data.spoofedPlayerId !== socket.id) {
      lockUserAccount(
        socket.id,
        gameState.players[socket.id]?.name || 'Unknown',
        'SPOOFING_ATTEMPT (Forged Socket Identity)',
        socket,
        () => {
          delete gameState.players[socket.id];
          if (gameState.leaderId === socket.id) gameState.leaderId = null;
          broadcastState();
        }
      );
      return;
    }

    const player = gameState.players[socket.id];
    if (!player) return;

    // Anti-Spamming Check: Rate limiting & rapid press detection
    const isValidRate = validateRateLimitAndAntiSpam(
      socket,
      socket.id,
      player.name,
      () => {
        delete gameState.players[socket.id];
        if (gameState.leaderId === socket.id) gameState.leaderId = null;
        broadcastState();
      }
    );
    if (!isValidRate) return;

    const now = Date.now();
    
    // Cooldown Bypass Detection: If button press occurs > grace period before cooldown finishes
    if (player.cooldownUntil > 0 && now < player.cooldownUntil - GAME_CONFIG.SECURITY.COOLDOWN_GRACE_MS) {
      lockUserAccount(
        socket.id,
        player.name,
        'COOLDOWN_BYPASS_ATTEMPT (Automated Macro / Bot Detected)',
        socket,
        () => {
          delete gameState.players[socket.id];
          if (gameState.leaderId === socket.id) gameState.leaderId = null;
          broadcastState();
        }
      );
      return;
    }

    if (now < player.cooldownUntil) {
      return;
    }

    player.lastPressTimestamp = now;
    player.cooldownUntil = now + GAME_CONFIG.COOLDOWN_MS;
    
    gameState.leaderId = socket.id;
    gameState.timerValue = GAME_CONFIG.TIMER_DURATION_SEC;
    
    io.emit('leaderChanged', { leaderId: socket.id });
    broadcastState();
  });

  socket.on('getLeaderboard', async () => {
      const topPlayers = await getTopPlayers();
      socket.emit('leaderboardData', topPlayers);
  });

  socket.on('updateGameConfig', async (data: {
    userEmail: string;
    timerDurationSec?: number;
    cooldownMs?: number;
    minPlayers?: number;
  }) => {
    if (!data || data.userEmail !== 'shimri86@gmail.com') {
      socket.emit('adminError', { message: 'Unauthorized: Admin access restricted to shimri86@gmail.com.' });
      return;
    }

    if (data.timerDurationSec && data.timerDurationSec > 0) {
      GAME_CONFIG.TIMER_DURATION_SEC = Number(data.timerDurationSec);
      gameState.timerDuration = GAME_CONFIG.TIMER_DURATION_SEC;
    }
    if (data.cooldownMs && data.cooldownMs > 0) {
      GAME_CONFIG.COOLDOWN_MS = Number(data.cooldownMs);
    }
    if (data.minPlayers && data.minPlayers > 0) {
      GAME_CONFIG.MIN_PLAYERS = Number(data.minPlayers);
      gameState.minPlayers = GAME_CONFIG.MIN_PLAYERS;
    }

    console.log(`[ADMIN DASHBOARD] Settings updated by ${data.userEmail}: Timer=${GAME_CONFIG.TIMER_DURATION_SEC}s, Cooldown=${GAME_CONFIG.COOLDOWN_MS}ms, MinPlayers=${GAME_CONFIG.MIN_PLAYERS}`);

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    if (supabaseUrl && supabaseKey) {
      try {
        await fetch(`${supabaseUrl}/rest/v1/game_settings?id=eq.default`, {
          method: 'PATCH',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            timer_duration_sec: GAME_CONFIG.TIMER_DURATION_SEC,
            cooldown_ms: GAME_CONFIG.COOLDOWN_MS,
            min_players: GAME_CONFIG.MIN_PLAYERS,
            updated_by: data.userEmail,
            updated_at: new Date().toISOString()
          })
        });
      } catch (err) {
        console.error('[Admin] Failed to update Supabase game_settings:', err);
      }
    }

    broadcastState();
    io.emit('configUpdated', GAME_CONFIG);
    socket.emit('adminSuccess', { message: 'Game settings updated successfully!', config: GAME_CONFIG });
  });

  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);
    cleanupSocketSecurity(socket.id);
    delete gameState.players[socket.id];
    
    if (gameState.leaderId === socket.id) {
      gameState.leaderId = null;
    }

    if (gameState.status === 'PLAYING' && Object.keys(gameState.players).length < GAME_CONFIG.MIN_PLAYERS) {
      if (timerInterval) clearInterval(timerInterval);
      gameState.status = 'LOBBY';
      gameState.timerValue = GAME_CONFIG.TIMER_DURATION_SEC;
      gameState.leaderId = null;
    }
    broadcastState();
  });
});

const PORT = process.env.PORT || 4000;

async function start() {
    await redisClient.connect().catch(console.error);
    await initDB();
    server.listen(PORT, () => {
        console.log(`Server listening on port ${PORT}`);
    });
}

start();
