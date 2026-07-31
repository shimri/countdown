import React from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { GameState } from '../hooks/useSocket';

interface Props {
  gameState: GameState;
  winnerId: string | null;
  myId: string | null;
}

export const WinnerScreen: React.FC<Props> = ({ gameState, winnerId, myId }) => {
  const isMe = winnerId === myId;
  const winner = winnerId ? gameState.players[winnerId] : null;

  return (
    <SafeAreaView style={[styles.container, isMe ? styles.containerWin : styles.containerLose]}>
      <View style={styles.content}>
        <Text style={styles.gameOverText}>GAME OVER</Text>
        
        {winner ? (
          <>
            <Text style={styles.winnerText}>{isMe ? 'YOU WON!' : `${winner.name} WINS!`}</Text>
            <Text style={styles.subText}>They held the crown when time ran out.</Text>
          </>
        ) : (
          <Text style={styles.winnerText}>NOBODY WON</Text>
        )}
      </View>
      
      <Text style={styles.restartText}>Returning to lobby in a few seconds...</Text>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 60,
  },
  containerWin: {
    backgroundColor: '#218c53',
  },
  containerLose: {
    backgroundColor: '#b33939',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  gameOverText: {
    fontSize: 24,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 20,
    letterSpacing: 4,
  },
  winnerText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  subText: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  restartText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
  }
});
