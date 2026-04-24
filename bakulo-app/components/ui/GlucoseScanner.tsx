import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, ActivityIndicator } from 'react-native';
import { Radio, Bluetooth, Smartphone } from 'lucide-react-native';

interface GlucoseScannerProps {
  isScanning: boolean;
  onScanPress: () => void;
  glucoseValue: string;
}

export const GlucoseScanner = ({ isScanning, onScanPress, glucoseValue }: GlucoseScannerProps) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isScanning) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.2, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isScanning]);

  return (
    <View style={styles.syncView}>
      <Animated.View 
        style={[
          styles.pulseCircle, 
          { transform: [{ scale: pulseAnim }] },
          isScanning && styles.pulseCircleActive
        ]}
      >
        <View style={styles.innerCircle}>
          {isScanning ? (
            <ActivityIndicator color="#86d0ef" size="large" />
          ) : (
            <Bluetooth color="#006782" size={48} />
          )}
          
          <Text style={styles.statusLabel}>
            {isScanning ? "BUSCANDO DISPOSITIVO..." : "LISTO PARA VINCULAR"}
          </Text>

          {glucoseValue !== '' && !isScanning && (
            <View style={styles.valueContainer}>
              <Text style={styles.largeValue}>{glucoseValue}</Text>
              <Text style={styles.unit}>mg/dL</Text>
            </View>
          )}
        </View>
      </Animated.View>
      
      <TouchableOpacity 
        activeOpacity={0.8}
        style={[styles.mainActionBtn, isScanning && styles.btnScanning]} 
        onPress={onScanPress}
      >
        <Text style={styles.mainActionText}>
          {isScanning ? "Cancelar" : "Escanear Dispositivo"}
        </Text>
      </TouchableOpacity>
      
      <Text style={styles.hint}>
        Acerca tu glucómetro Bluetooth o sensor NFC
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  syncView: { alignItems: 'center', justifyContent: 'center' },
  pulseCircle: { 
    width: 260, height: 260, borderRadius: 130, borderWidth: 2, 
    borderColor: 'rgba(0,103,130,0.1)', justifyContent: 'center', 
    alignItems: 'center', backgroundColor: 'rgba(0,103,130,0.02)' 
  },
  pulseCircleActive: { borderColor: '#86d0ef', backgroundColor: 'rgba(134,208,239,0.1)' },
  innerCircle: { alignItems: 'center' },
  statusLabel: { color: '#6f787d', fontSize: 12, fontWeight: '800', marginTop: 15, letterSpacing: 1 },
  valueContainer: { alignItems: 'center', marginTop: 10 },
  largeValue: { color: 'white', fontSize: 58, fontWeight: '900' },
  unit: { fontSize: 16, color: '#006782', fontWeight: '700' },
  mainActionBtn: { 
    marginTop: 30, backgroundColor: '#006782', paddingHorizontal: 40, 
    paddingVertical: 18, borderRadius: 100 
  },
  btnScanning: { backgroundColor: '#ba1a1a' },
  mainActionText: { color: 'white', fontWeight: '800', fontSize: 16 },
  hint: { color: '#6f787d', fontSize: 12, marginTop: 20, textAlign: 'center' }
});