import React, { useRef, useEffect } from 'react';
import { SafeAreaView, StyleSheet, Text, View, TouchableOpacity, Animated } from 'react-native';
import { GameState } from '../hooks/useSocket';

interface Props {
  gameState: GameState;
  myId: string | null;
  cooldownRemaining: number;
  pressButton: () => void;
}

export const GameScreen: React.FC<Props> = ({ gameState, myId, cooldownRemaining, pressButton }) => {
  const isLeader = gameState.leaderId === myId;
  const currentLeader = gameState.leaderId ? gameState.players[gameState.leaderId] : null;
  
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (gameState.timerValue <= 5 && gameState.timerValue > 0) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.2, duration: 500, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true })
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
      pulseAnim.stopAnimation();
    }
  }, [gameState.timerValue, pulseAnim]);

  return (
    <SafeAreaView style={[styles.container, isLeader ? styles.containerLeader : null]}>
      
      <View style={styles.header}>
        {currentLeader ? (
          <Text style={styles.leaderText}>
            CROWN HOLDER: {isLeader ? 'YOU' : currentLeader.name}
          </Text>
        ) : (
          <Text style={styles.leaderText}>NO LEADER</Text>
        )}
      </View>

      <Animated.View style={[styles.timerContainer, { transform: [{ scale: pulseAnim }] }]}>
        <Text style={[styles.timerText, gameState.timerValue <= 5 ? styles.timerTextDanger : null]}>
          {gameState.timerValue}
        </Text>
        <Text style={styles.timerSub}>SECONDS</Text>
      </Animated.View>

      <View style={styles.actionContainer}>
        <TouchableOpacity 
          style={[
            styles.button, 
            isLeader && styles.buttonLeader,
            cooldownRemaining > 0 && styles.buttonDisabled
          ]} 
          onPress={pressButton}
          activeOpacity={0.7}
          disabled={cooldownRemaining > 0}
        >
          {cooldownRemaining > 0 ? (
            <Text style={styles.buttonText}>COOLDOWN {(cooldownRemaining/1000).toFixed(1)}s</Text>
          ) : isLeader ? (
            <Text style={styles.buttonText}>YOU ARE LEADING</Text>
          ) : (
            <Text style={styles.buttonText}>TAKE CROWN</Text>
          )}
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 40,
  },
  containerLeader: {
    backgroundColor: '#2c1e16',
  },
  header: {
    paddingTop: 20,
  },
  leaderText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f1c40f',
    letterSpacing: 1,
  },
  timerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 250,
    height: 250,
    borderRadius: 125,
    borderWidth: 8,
    borderColor: '#333',
    backgroundColor: '#111',
  },
  timerText: {
    fontSize: 80,
    fontWeight: 'bold',
    color: '#fff',
  },
  timerTextDanger: {
    color: '#ff4757',
  },
  timerSub: {
    fontSize: 18,
    color: '#888',
    marginTop: -10,
  },
  actionContainer: {
    width: '100%',
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  button: {
    backgroundColor: '#ff4757',
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#ff4757',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  buttonLeader: {
    backgroundColor: '#f1c40f',
    shadowColor: '#f1c40f',
  },
  buttonDisabled: {
    backgroundColor: '#555',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 2,
  }
});
