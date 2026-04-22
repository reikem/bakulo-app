import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';

interface MacroCardProps {
  label: string;
  value: string;
  unit: string;
  color: string;
  onChange: (val: string) => void;
  isMain?: boolean; // Para diferenciar la tarjeta de Calorías
}

export const MacroCard = ({ label, value, unit, color, onChange, isMain }: MacroCardProps) => (
  <View style={[styles.card, { borderLeftColor: isMain ? 'transparent' : color, backgroundColor: isMain ? '#004e63' : '#1d2426' }]}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.valueRow}>
      <TextInput 
        keyboardType="numeric" 
        style={styles.input} 
        value={value} 
        onChangeText={onChange} 
      />
      <Text style={[styles.unit, { color: isMain ? '#c4ebe0' : color }]}>{unit}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  card: { width: '48%', padding: 16, borderRadius: 24, borderLeftWidth: 4, marginBottom: 12 },
  label: { fontSize: 10, fontWeight: '800', color: '#bfc8cd', marginBottom: 5, letterSpacing: 1 },
  valueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  input: { color: 'white', fontSize: 24, fontWeight: '800', flex: 1, padding: 0 },
  unit: { fontSize: 14, fontWeight: 'bold' }
});