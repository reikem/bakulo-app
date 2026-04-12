import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronRight } from 'lucide-react-native';

// --- BADGE DE ESTADO (LIVE / RECOMENDADO) ---
export const StatusBadge = ({ label, color = '#c4ebe0', textColor = '#00201a' }: { label: string, color?: string, textColor?: string }) => (
  <View style={[styles.badge, { backgroundColor: color }]}>
    <Text style={[styles.badgeText, { color: textColor }]}>{label}</Text>
  </View>
);

// --- TARJETA TIPO BENTO (PARA SYNC) ---
export const BentoCard = ({ children, style }: { children: React.ReactNode, style?: any }) => (
  <View style={[styles.bentoCard, style]}>
    {children}
  </View>
);

// --- ITEM DE LISTA CON INTERRUPTOR (PARA SEGURIDAD/PRIVACIDAD) ---
interface ToggleItemProps {
  title: string;
  desc: string;
  icon: React.ReactNode;
  isEnabled: boolean;
  onToggle: () => void;
}

export const HealthToggleItem = ({ title, desc, icon, isEnabled, onToggle }: ToggleItemProps) => (
  <View style={styles.toggleItem}>
    <View style={styles.toggleContent}>
      <View style={styles.iconBox}>{icon}</View>
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

// --- BOTÓN DE ACCIÓN CRÍTICA (ELIMINAR) ---
export const CriticalButton = ({ title, icon, onPress }: { title: string, icon: React.ReactNode, onPress: () => void }) => (
  <TouchableOpacity style={styles.criticalBtn} onPress={onPress} activeOpacity={0.7}>
    <View style={styles.criticalLeft}>
      {icon}
      <Text style={styles.criticalText}>{title}</Text>
    </View>
    <ChevronRight color="rgba(186,26,26,0.4)" size={20} />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, alignSelf: 'flex-start' },
  badgeText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  
  bentoCard: { backgroundColor: '#1d2426', borderRadius: 28, padding: 20 },
  
  toggleItem: { flexDirection: 'row', alignItems: 'center', padding: 20 },
  toggleContent: { flexDirection: 'row', gap: 14, flex: 1 },
  iconBox: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.03)', alignItems: 'center', justifyContent: 'center' },
  toggleTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  toggleDesc: { color: '#6f787d', fontSize: 12, marginTop: 2 },
  
  switchBase: { width: 46, height: 24, borderRadius: 20, padding: 2 },
  switchOn: { backgroundColor: '#005229' },
  switchOff: { backgroundColor: '#3f484c' },
  switchCircle: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff' },
  circleOn: { alignSelf: 'flex-end' },
  circleOff: { alignSelf: 'flex-start' },

  criticalBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    backgroundColor: 'rgba(186, 26, 26, 0.05)', 
    padding: 20, 
    borderRadius: 28, 
    borderWidth: 1, 
    borderColor: 'rgba(186, 26, 26, 0.2)' 
  },
  criticalLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  criticalText: { color: '#ba1a1a', fontWeight: '800', fontSize: 14 },
});