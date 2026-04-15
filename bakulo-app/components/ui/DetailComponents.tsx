import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// 1. Hero Card: Resumen Principal (Dosis o Glucosa)
export const HeroDetailCard = ({ value, unit, label, subtitle, color = "#004e63", icon }: any) => (
  <View style={[styles.heroCard, { backgroundColor: color }]}>
    <View style={styles.heroContent}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>COMPLETADO</Text>
      </View>
      <Text style={styles.heroValue}>{value} <Text style={styles.heroUnit}>{unit}</Text></Text>
      <Text style={styles.heroLabel}>{label}</Text>
      {subtitle && <Text style={styles.heroSubtitle}>{subtitle}</Text>}
    </View>
    <MaterialCommunityIcons name={icon} size={100} color="rgba(255,255,255,0.1)" style={styles.heroIcon} />
  </View>
);

// 2. Bento Card: Cuadro de información pequeño
export const BentoStat = ({ label, value, subValue, icon, color = "#c4ebe0" }: any) => (
  <View style={styles.bentoStat}>
    <View style={styles.bentoHeader}>
      <View style={[styles.iconBg, { backgroundColor: 'rgba(196, 235, 224, 0.1)' }]}>
        <MaterialCommunityIcons name={icon} size={20} color={color} />
      </View>
      <Text style={styles.bentoLabel}>{label}</Text>
    </View>
    <View>
      <Text style={styles.bentoValue}>{value}</Text>
      {subValue && <Text style={styles.bentoSubValue}>{subValue}</Text>}
    </View>
  </View>
);

// 3. Note Card: Sección de comentarios
export const NoteSection = ({ note }: { note: string }) => (
  <View style={styles.noteCard}>
    <View style={styles.noteHeader}>
      <MaterialCommunityIcons name="note-text-outline" size={20} color="#86d0ef" />
      <Text style={styles.noteTitle}>Notas del Registro</Text>
    </View>
    <View style={styles.noteBox}>
      <Text style={styles.noteText}>"{note}"</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  heroCard: {
    borderRadius: 32,
    padding: 24,
    overflow: 'hidden',
    marginBottom: 16,
    minHeight: 180,
    justifyContent: 'center',
  },
  heroContent: { zIndex: 1 },
  heroIcon: { position: 'absolute', right: -10, top: 20 },
  badge: {
    backgroundColor: '#c4ebe0',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 100,
    marginBottom: 12,
  },
  badgeText: { color: '#00201a', fontSize: 10, fontWeight: '800' },
  heroValue: { color: 'white', fontSize: 48, fontWeight: '800' },
  heroUnit: { fontSize: 20, fontWeight: '400', opacity: 0.7 },
  heroLabel: { color: '#86d0ef', fontSize: 18, fontWeight: '600' },
  heroSubtitle: { color: 'white', opacity: 0.6, fontSize: 12, marginTop: 4 },
  bentoStat: {
    flex: 1,
    backgroundColor: '#1d2426',
    borderRadius: 24,
    padding: 20,
    minHeight: 120,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  bentoHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  iconBg: { pading: 8, borderRadius: 12, width: 36, height: 36, alignItems: 'center', justify: 'center' },
  bentoLabel: { color: '#bfc8ca', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  bentoValue: { color: 'white', fontSize: 22, fontWeight: '700' },
  bentoSubValue: { color: '#6f787d', fontSize: 12 },
  noteCard: { marginTop: 20 },
  noteHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  noteTitle: { color: 'white', fontSize: 18, fontWeight: '700' },
  noteBox: { 
    backgroundColor: '#1d2426', 
    padding: 20, 
    borderRadius: 24, 
    borderLeftWidth: 4, 
    borderLeftColor: '#c4ebe0' 
  },
  noteText: { color: '#bfc8ca', fontSize: 14, fontStyle: 'italic', lineHeight: 20 },
});