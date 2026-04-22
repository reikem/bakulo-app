import React from 'react';
import { TouchableOpacity, Image, View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Camera } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export const PhotoUpload = ({ image, onPress, loading }: any) => (
  <TouchableOpacity style={styles.container} onPress={onPress}>
    {image ? (
      <Image source={{ uri: image }} style={styles.image} />
    ) : (
      <LinearGradient colors={['#004e63', '#006782']} style={styles.gradient}>
        <Camera color="#c4ebe0" size={32} />
        <Text style={styles.text}>Subir Foto</Text>
      </LinearGradient>
    )}
    {loading && (
      <View style={styles.loader}><ActivityIndicator color="#fff" /></View>
    )}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { width: 120, height: 120, borderRadius: 24, overflow: 'hidden', backgroundColor: '#1d2426' },
  gradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  image: { width: '100%', height: '100%' },
  text: { color: '#c4ebe0', fontSize: 10, fontWeight: 'bold', marginTop: 5 },
  loader: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center' }
});