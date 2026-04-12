import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface TimeInRangeProps {
  percentage: number;
}

export const TimeInRange = ({ percentage }: TimeInRangeProps) => {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Time In Range</Text>
        <Text style={styles.percent}>{percentage}%</Text>
      </View>
      <View style={styles.progressBar}>
        {/* Muy Alto */}
        <View style={[styles.segment, { width: '5%', backgroundColor: '#ba1a1a' }]} />
        {/* En Rango */}
        <View style={[styles.segment, { width: `${percentage}%`, backgroundColor: '#005229' }]} />
        {/* Muy Bajo */}
        <View style={[styles.segment, { width: `${95 - percentage}%`, backgroundColor: '#004e63' }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: { backgroundColor: '#1d2426', borderRadius: 24, padding: 20, marginBottom: 25 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title: { color: '#c4ebe0', fontSize: 16, fontWeight: '700' },
  percent: { color: '#89d89d', fontSize: 20, fontWeight: '800' },
  progressBar: { height: 10, backgroundColor: '#333b3d', borderRadius: 10, flexDirection: 'row', overflow: 'hidden' },
  segment: { height: '100%' },
});