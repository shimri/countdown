import React from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { GameState } from '../hooks/useSocket';

interface Props {
  gameState: GameState | null;
  myId: string | null;
}

export const LobbyScreen: React.FC<Props> = ({ gameState, myId }) => {
  const playersCount = gameState ? Object.keys(gameState.players).length : 0;
  const minPlayers = gameState?.minPlayers || 2;

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>WAITING FOR PLAYERS</Text>
      
      <View style={styles.playerCountContainer}>
        <Text style={styles.countText}>{playersCount} / {minPlayers}</Text>
        <Text style={styles.subText}>players joined</Text>
      </View>
      
      {playersCount < minPlayers ? (
        <Text style={styles.waitingText}>Waiting for {minPlayers - playersCount} more player(s)...</Text>
      ) : (
        <Text style={styles.readyText}>Game starting soon...</Text>
      )}

      <View style={styles.playerList}>
        {gameState && Object.values(gameState.players).map(p => (
          <Text key={p.id} style={[styles.playerItem, p.id === myId && styles.myPlayer]}>
            {p.name} {p.id === myId ? '(You)' : ''}
          </Text>
        ))}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 40,
    letterSpacing: 2,
  },
  playerCountContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 4,
    borderColor: '#333',
    marginBottom: 20,
  },
  countText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ff4757',
  },
  subText: {
    fontSize: 16,
    color: '#999',
  },
  waitingText: {
    color: '#aaa',
    fontSize: 18,
    marginTop: 20,
  },
  readyText: {
    color: '#2ed573',
    fontSize: 18,
    marginTop: 20,
    fontWeight: 'bold',
  },
  playerList: {
    marginTop: 40,
    width: '80%',
  },
  playerItem: {
    color: '#fff',
    fontSize: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    textAlign: 'center',
  },
  myPlayer: {
    color: '#ff4757',
    fontWeight: 'bold',
  }
});
