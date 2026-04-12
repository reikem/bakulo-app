import React from 'react';
import { Image, StyleSheet, View, Text } from 'react-native';

export const FileImagePreview = ({ uri }: { uri: string }) => (
  <View style={styles.container}>
    <Image source={{ uri }} style={styles.image} resizeMode="contain" />
    <Text style={styles.caption}>Image Attachment</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { borderRadius: 20, overflow: 'hidden', backgroundColor: '#1d2426' },
  image: { width: '100%', height: 200 },
  caption: { color: '#6f787d', fontSize: 10, padding: 8, textAlign: 'center' }
});