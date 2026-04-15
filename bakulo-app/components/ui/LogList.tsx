import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronRight } from 'lucide-react-native';

export const LogItem = ({ icon, title, time, value, unit, desc, color, onPress }: any) => (
  <TouchableOpacity style={styles.card} activeOpacity={0.7} onPress={onPress}>
    <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
      {icon}
    </View>
    <View style={styles.cardContent}>
      <View style={styles.row}>
        <Text style={[styles.title, { color }]}>{title}</Text>
        <Text style={styles.time}>{time}</Text>
      </View>
      {value ? (
        <View style={styles.valueRow}>
          <Text style={styles.valueText}>{value}</Text>
          <Text style={styles.unitText}>{unit}</Text>
        </View>
      ) : (
        <Text style={styles.descText}>{desc}</Text>
      )}
    </View>
    <ChevronRight color="#6f787d" size={18} />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  card: { flexDirection: 'row', backgroundColor: '#1d2426', padding: 16, borderRadius: 24, alignItems: 'center', gap: 12, marginBottom: 12 },
  iconContainer: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  cardContent: { flex: 1 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  title: { fontSize: 14, fontWeight: '700' },
  time: { color: '#6f787d', fontSize: 10 },
  valueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  valueText: { color: '#f5f5f5', fontSize: 22, fontWeight: '800' },
  unitText: { color: '#6f787d', fontSize: 12 },
  descText: { color: '#f5f5f5', fontSize: 14, fontWeight: '600' }
});