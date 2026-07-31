import React, { useState } from 'react';
import { SafeAreaView, StyleSheet, Text, View, TextInput, TouchableOpacity, StatusBar } from 'react-native';
import { useSocket } from './src/hooks/useSocket';

import { LobbyScreen } from './src/screens/LobbyScreen';
import { GameScreen } from './src/screens/GameScreen';
import { WinnerScreen } from './src/screens/WinnerScreen';

export default function App() {
  const { isConnected, gameState, myId, winnerId, cooldownRemaining, isLocked, lockReason, joinLobby, pressButton } = useSocket();
  const [name, setName] = useState('');
  const [hasJoined, setHasJoined] = useState(false);

  if (isLocked) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: '#800000' }]}>
        <StatusBar barStyle="light-content" />
        <View style={styles.joinContainer}>
          <Text style={[styles.title, { color: '#ff4757', fontSize: 32 }]}>ACCOUNT LOCKED</Text>
          <Text style={{ color: '#fff', fontSize: 18, textAlign: 'center', marginBottom: 20 }}>
            Your account was locked immediately by Security Engine.
          </Text>
          <Text style={{ color: '#ffb8b8', fontSize: 14, textAlign: 'center', fontWeight: 'bold' }}>
            Reason: {lockReason || 'Security Violation'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!isConnected) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <Text style={styles.loadingText}>Connecting to server...</Text>
      </SafeAreaView>
    );
  }

  if (!hasJoined) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.joinContainer}>
          <Text style={styles.title}>COUNTDOWN</Text>
          <TextInput 
            style={styles.input} 
            placeholder="Enter your name" 
            placeholderTextColor="#666"
            value={name} 
            onChangeText={setName} 
            maxLength={12}
          />
          <TouchableOpacity style={styles.button} onPress={() => {
            if (name.trim()) {
              joinLobby(name);
              setHasJoined(true);
            }
          }}>
            <Text style={styles.buttonText}>Join Game</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!gameState || gameState.status === 'LOBBY') {
    return <LobbyScreen gameState={gameState} myId={myId} />;
  }

  if (gameState.status === 'WINNER_REVEALED') {
    return <WinnerScreen gameState={gameState} winnerId={winnerId} myId={myId} />;
  }

  return (
    <>
      <StatusBar barStyle="light-content" />
      <GameScreen 
        gameState={gameState} 
        myId={myId} 
        cooldownRemaining={cooldownRemaining} 
        pressButton={pressButton} 
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
  },
  joinContainer: {
    width: '80%',
    alignItems: 'center',
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 40,
    letterSpacing: 2,
  },
  input: {
    width: '100%',
    backgroundColor: '#333',
    color: '#fff',
    padding: 15,
    borderRadius: 8,
    fontSize: 18,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#ff4757',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  }
});
