import { useEffect, useState, useCallback } from 'react';
import { Platform } from 'react-native';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = Platform.OS === 'android' ? 'http://10.0.2.2:4000' : 'http://localhost:4000';

export interface Player {
  id: string;
  name: string;
  lastPressTimestamp: number;
  cooldownUntil: number;
}

export interface GameState {
  status: 'LOBBY' | 'PLAYING' | 'WINNER_REVEALED';
  leaderId: string | null;
  timerValue: number;
  timerDuration: number;
  players: Record<string, Player>;
  minPlayers: number;
}

let socket: Socket;

export const useSocket = () => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [myId, setMyId] = useState<string | null>(null);
  const [winnerId, setWinnerId] = useState<string | null>(null);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockReason, setLockReason] = useState<string | null>(null);

  useEffect(() => {
    if (!socket) {
      socket = io(SOCKET_URL);
    }

    const onConnect = () => {
      setIsConnected(true);
      setMyId(socket.id || null);
    };

    const onDisconnect = () => {
      setIsConnected(false);
    };

    const onGameStateUpdate = (state: GameState) => {
      setGameState(state);
    };
    
    const onGameEnded = (data: { winnerId: string }) => {
        setWinnerId(data.winnerId);
    };
    
    const onGameStarted = () => {
        setWinnerId(null);
    };

    const onAccountLocked = (data: { reason: string; message: string }) => {
      setIsLocked(true);
      setLockReason(data.reason || 'Security Violation');
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('gameStateUpdate', onGameStateUpdate);
    socket.on('gameEnded', onGameEnded);
    socket.on('gameStarted', onGameStarted);
    socket.on('accountLocked', onAccountLocked);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('gameStateUpdate', onGameStateUpdate);
      socket.off('gameEnded', onGameEnded);
      socket.off('gameStarted', onGameStarted);
      socket.off('accountLocked', onAccountLocked);
    };
  }, []);
  
  useEffect(() => {
      let interval: ReturnType<typeof setInterval>;
      if (gameState && myId) {
          const me = gameState.players[myId];
          if (me && me.cooldownUntil > Date.now()) {
              setCooldownRemaining(me.cooldownUntil - Date.now());
              interval = setInterval(() => {
                  const remaining = me.cooldownUntil - Date.now();
                  if (remaining <= 0) {
                      setCooldownRemaining(0);
                      clearInterval(interval);
                  } else {
                      setCooldownRemaining(remaining);
                  }
              }, 100);
          } else {
              setCooldownRemaining(0);
          }
      }
      return () => clearInterval(interval);
  }, [gameState, myId]);

  const joinLobby = useCallback((name: string) => {
    socket.emit('joinLobby', { name });
  }, []);

  const pressButton = useCallback(() => {
    socket.emit('pressButton');
  }, []);

  return { isConnected, gameState, myId, winnerId, cooldownRemaining, isLocked, lockReason, joinLobby, pressButton };
};
