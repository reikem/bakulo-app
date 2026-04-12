import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Shield } from 'lucide-react-native';

// --- COMPONENTE: HERO DE SEGURIDAD ---
export const SecurityHero = ({ status }: { status: string }) => (
  <View style={styles.heroCard}>
    <View style={{ position: 'relative', zIndex: 10 }}>
      <Text style={styles.heroLabel}>ESTADO DE LA CUENTA</Text>
      <Text style={styles.heroTitle}>{status}</Text>
      <View style={styles.heroBadge}>
        <View style={styles.pulseDot} />
        <Text style={styles.heroBadgeText}>Cifrado de extremo a extremo</Text>
      </View>
    </View>
    <Shield color="rgba(255,255,255,0.1)" size={120} style={styles.heroIcon} />
  </View>
);

// --- COMPONENTE: ITEM DE SEGURIDAD CON SWITCH ---
interface SecurityToggleProps {
  title: string;
  desc: string;
  icon: React.ReactNode;
  isEnabled: boolean;
  onToggle: () => void;
}

export const SecurityToggleItem = ({ title, desc, icon, isEnabled, onToggle }: SecurityToggleProps) => (
  <View style={styles.toggleCard}>
    <View style={{ flexDirection: 'row', gap: 12, flex: 1 }}>
      <View style={styles.toggleIconWrapper}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={styles.toggleTitle}>{title}</Text>
        <Text style={styles.toggleDesc}>{desc}</Text>
      </View>
    </View>
    <TouchableOpacity 
      activeOpacity={0.8}
      onPress={onToggle}
      style={[styles.switchBase, isEnabled ? styles.switchOn : styles.switchOff]}
    >
      <View style={[styles.switchCircle, isEnabled ? styles.circleOn : styles.circleOff]} />
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  heroCard: { backgroundColor: '#004e63', borderRadius: 32, padding: 24, overflow: 'hidden', marginBottom: 24 },
  heroLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  heroTitle: { color: '#fff', fontSize: 28, fontWeight: '800', marginVertical: 8 },
  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.1)', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  pulseDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#89d89d' },
  heroBadgeText: { color: '#fff', fontSize: 10, fontWeight: '600' },
  heroIcon: { position: 'absolute', right: -20, bottom: -20 },
  toggleCard: { backgroundColor: '#1c2527', padding: 20, borderRadius: 24, flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  toggleIconWrapper: { width: 44, height: 44, borderRadius: 16, backgroundColor: 'rgba(169,206,196,0.1)', alignItems: 'center', justifyContent: 'center' },
  toggleTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  toggleDesc: { color: '#6f787d', fontSize: 12, marginTop: 2 },
  switchBase: { width: 48, height: 26, borderRadius: 20, padding: 2, justifyContent: 'center' },
  switchOn: { backgroundColor: '#005229' },
  switchOff: { backgroundColor: '#3f484c' },
  switchCircle: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff' },
  circleOn: { alignSelf: 'flex-end' },
  circleOff: { alignSelf: 'flex-start' }
});