import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TrendingDown, LucideIcon } from 'lucide-react-native';

// --- TIPO 1: TARJETA PRINCIPAL (Resumen de Glucosa) ---
interface MainStatProps {
  label: string;
  value: number | string;
  unit: string;
  trendText: string;
  trendIcon: LucideIcon;
}

export const MainBentoCard = ({ label, value, unit, trendText, trendIcon: Icon }: MainStatProps) => (
  <View style={styles.mainStatCard}>
    <Text style={styles.statLabel}>{label}</Text>
    <View style={styles.statRow}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statUnit}>{unit}</Text>
    </View>
    <View style={styles.trendBadge}>
      <Icon color="#89d89d" size={14} />
      <Text style={styles.trendText}>{trendText}</Text>
    </View>
  </View>
);

// --- TIPO 2: MINI TARJETAS (Detalles, Hyper, TIR, Carbs) ---
interface MiniCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  icon?: LucideIcon;
  iconColor?: string;
  variant?: 'dark' | 'glass'; // 'dark' para detalles, 'glass' para el dashboard
}

export const BentoStatCard = ({ label, value, subValue, icon: Icon, iconColor, variant = 'dark' }: MiniCardProps) => (
  <View style={[styles.miniCard, variant === 'glass' && styles.glassEffect]}>
    <View style={styles.miniHeader}>
      {Icon && <Icon color={iconColor || '#c4ebe0'} size={18} />}
      <Text style={styles.miniLabel}>{label}</Text>
    </View>
    <View style={styles.valueContainer}>
      <Text style={styles.miniValue}>{value}</Text>
      {subValue && <Text style={styles.subValueText}>{subValue}</Text>}
    </View>
  </View>
);

const styles = StyleSheet.create({
  // Main Card Styles (Dashboard)
  mainStatCard: { 
    flex: 1.2, 
    backgroundColor: '#004e63', 
    borderRadius: 28, 
    padding: 20, 
    justifyContent: 'center' 
  },
  statLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
  statRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4, marginVertical: 4 },
  statValue: { color: '#fff', fontSize: 38, fontWeight: '800' },
  statUnit: { color: 'rgba(255,255,255,0.6)', fontSize: 14 },
  trendBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6, 
    backgroundColor: 'rgba(255,255,255,0.1)', 
    paddingHorizontal: 10, 
    paddingVertical: 6, 
    borderRadius: 20, 
    alignSelf: 'flex-start' 
  },
  trendText: { color: '#fff', fontSize: 10, fontWeight: '600' },

  // Mini Card Styles (Reutilizables en Detalle y Dashboard)
  miniCard: { 
    flex: 1, 
    backgroundColor: '#1d2426', 
    borderRadius: 24, 
    padding: 15, 
    minHeight: 110,
    justifyContent: 'space-between' 
  },
  glassEffect: { backgroundColor: '#1d2426' }, // Puedes ajustar para que sea distinto al de detalle
  miniHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  miniLabel: { color: '#6f787d', fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  valueContainer: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  miniValue: { color: '#c4ebe0', fontSize: 22, fontWeight: '800' },
  subValueText: { color: '#bfc8ca', fontSize: 12, fontWeight: '600' },
});