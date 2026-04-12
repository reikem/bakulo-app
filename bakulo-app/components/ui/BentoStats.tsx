import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TrendingDown, AlertTriangle, CheckCircle2 } from 'lucide-react-native';

interface BentoProps {
  average: number;
  trend: string;
  hyper: number;
  tir: string;
}

export const BentoStats = ({ average, trend, hyper, tir }: BentoProps) => {
  return (
    <View style={styles.bentoGrid}>
      {/* Tarjeta Principal Izquierda */}
      <View style={styles.mainStatCard}>
        <Text style={styles.statLabel}>AVG GLUCOSE</Text>
        <View style={styles.statRow}>
          <Text style={styles.statValue}>{average}</Text>
          <Text style={styles.statUnit}>mg/dL</Text>
        </View>
        <View style={styles.trendBadge}>
          <TrendingDown color="#89d89d" size={14} />
          <Text style={styles.trendText}>{trend} from last period</Text>
        </View>
      </View>

      {/* Columna Derecha */}
      <View style={styles.statsColumn}>
        <View style={styles.miniCard}>
          <View style={styles.miniHeader}>
            <AlertTriangle color="#86d0ef" size={18} />
            <Text style={styles.miniLabel}>Hyper</Text>
          </View>
          <Text style={styles.miniValue}>{hyper}</Text>
        </View>

        <View style={styles.miniCard}>
          <View style={styles.miniHeader}>
            <CheckCircle2 color="#89d89d" size={18} />
            <Text style={styles.miniLabel}>T.I.R</Text>
          </View>
          <Text style={styles.miniValue}>{tir}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  bentoGrid: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  mainStatCard: { flex: 1.2, backgroundColor: '#004e63', borderRadius: 28, padding: 20, justifyContent: 'center' },
  statLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  statRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4, marginVertical: 4 },
  statValue: { color: '#fff', fontSize: 38, fontWeight: '800' },
  statUnit: { color: 'rgba(255,255,255,0.6)', fontSize: 14 },
  trendBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, alignSelf: 'flex-start' },
  trendText: { color: '#fff', fontSize: 10, fontWeight: '600' },
  statsColumn: { flex: 0.8, gap: 12 },
  miniCard: { flex: 1, backgroundColor: '#1d2426', borderRadius: 24, padding: 15, justifyContent: 'space-between' },
  miniHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  miniLabel: { color: '#6f787d', fontSize: 10, fontWeight: '700' },
  miniValue: { color: '#c4ebe0', fontSize: 22, fontWeight: '800', marginTop: 4 },
});