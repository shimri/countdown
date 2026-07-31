import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';

/**
 * AdMob Banner Component for React Native
 * Uses official Google Test Ad Unit IDs for Android & iOS
 */
export const AdBanner: React.FC = () => {
  const adUnitId = Platform.select({
    android: 'ca-app-pub-3940256099942544/6300978111',
    ios: 'ca-app-pub-3940256099942544/2934735716',
    default: 'ca-app-pub-3940256099942544/6300978111',
  });

  return (
    <View style={styles.adContainer}>
      <Text style={styles.adTag}>SPONSORED AD</Text>
      <View style={styles.adBox}>
        <Text style={styles.adText}>Google AdMob Banner ({Platform.OS.toUpperCase()})</Text>
        <Text style={styles.adSubText}>ID: {adUnitId}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  adContainer: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 10,
    backgroundColor: '#111',
    borderTopWidth: 1,
    borderTopColor: '#222',
  },
  adTag: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#666',
    letterSpacing: 1,
    marginBottom: 4,
  },
  adBox: {
    width: 320,
    height: 50,
    backgroundColor: '#222',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  adText: {
    color: '#f1c40f',
    fontSize: 12,
    fontWeight: 'bold',
  },
  adSubText: {
    color: '#888',
    fontSize: 10,
    marginTop: 2,
  }
});
