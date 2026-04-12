import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BellRing, AlarmClock, Volume2 } from 'lucide-react-native';

export const AlertSettings = () => {
  const [style, setStyle] = useState('push');
  
  return (
    <View style={styles.bentoRow}>
      <View style={styles.notificationCard}>
        <Text style={styles.cardTitle}>Alert Style</Text>
        <View style={styles.buttonGroup}>
          <TouchableOpacity 
            onPress={() => setStyle('push')}
            style={[styles.miniBtn, style === 'push' && styles.activeBtn]}>
            <BellRing color="#fff" size={16} />
            <Text style={styles.btnText}>Push</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setStyle('alarm')}
            style={[styles.miniBtn, style === 'alarm' && styles.activeBtn]}>
            <AlarmClock color="#fff" size={16} />
            <Text style={styles.btnText}>Alarm</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.toneCard}>
        <View style={styles.iconCircle}><Volume2 color="#baeaff" size={20} /></View>
        <Text style={styles.toneText}>Zen Chime</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  bentoRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  notificationCard: { flex: 1.8, backgroundColor: '#1a1a1a', borderRadius: 24, padding: 18 },
  toneCard: { flex: 1.2, backgroundColor: '#004e63', borderRadius: 24, padding: 18, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { color: '#f5f5f5', fontSize: 14, fontWeight: '700', marginBottom: 12 },
  buttonGroup: { flexDirection: 'row', gap: 8 },
  miniBtn: { flex: 1, height: 42, borderRadius: 12, backgroundColor: '#242424', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  activeBtn: { backgroundColor: '#006782' },
  btnText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  iconCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(186, 234, 255, 0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  toneText: { color: '#baeaff', fontSize: 13, fontWeight: '800' },
});