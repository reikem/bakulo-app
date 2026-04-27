/**
 * BloodSugarChart.tsx
 * 
 * Gráfico del Dashboard que muestra datos REALES del GlucoseStore.
 * Se actualiza automáticamente al registrar nuevos valores.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Download, TrendingUp, TrendingDown, Minus } from 'lucide-react-native';
import { useGlucose } from '@/store/GlucoseStore';


type Range = 'Semanal' | 'Mensual';

export const BloodSugarChart = () => {
  const [range, setRange] = useState<Range>('Semanal');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const { getWeeklyData, getMonthlyData, latestEntry, entries } = useGlucose();

  const data = range === 'Semanal' ? getWeeklyData() : getMonthlyData();

  // Calcular promedio del período visible
  const visibleValues = data.filter(d => d.value > 0).map(d => d.value);
  const avg = visibleValues.length > 0
    ? Math.round(visibleValues.reduce((a, b) => a + b, 0) / visibleValues.length)
    : 0;

  // Tendencia: comparar primera mitad vs segunda mitad
  const half = Math.floor(visibleValues.length / 2);
  const firstHalf  = visibleValues.slice(0, half);
  const secondHalf = visibleValues.slice(half);
  const avgFirst  = firstHalf.length  ? firstHalf.reduce((a,b)=>a+b,0)/firstHalf.length   : 0;
  const avgSecond = secondHalf.length ? secondHalf.reduce((a,b)=>a+b,0)/secondHalf.length : 0;
  const trend = avgSecond > avgFirst + 5 ? 'up' : avgSecond < avgFirst - 5 ? 'down' : 'stable';

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? '#f59e0b' : trend === 'down' ? '#86d0ef' : '#22c55e';

  // Color de barra según valor glucémico
  const barColor = (value: number) => {
    if (value === 0)   return 'rgba(255,255,255,0.04)';
    if (value < 70)    return '#ef4444';
    if (value <= 140)  return '#86d0ef';
    if (value <= 199)  return '#f59e0b';
    return '#ef4444';
  };

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.cardLabel}>GLUCOSE TRENDS</Text>
          <View style={styles.avgRow}>
            <Text style={styles.avgValue}>{avg > 0 ? `${avg}` : '—'}</Text>
            <Text style={styles.avgUnit}> mg/dL avg</Text>
            <View style={[styles.trendBadge, { backgroundColor: `${trendColor}18` }]}>
              <TrendIcon color={trendColor} size={12} />
              <Text style={[styles.trendText, { color: trendColor }]}>
                {trend === 'up' ? 'Rising' : trend === 'down' ? 'Falling' : 'Stable'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.headerRight}>
          {/* Toggle Semanal / Mensual */}
          <View style={styles.rangeToggle}>
            {(['Semanal', 'Mensual'] as Range[]).map(r => (
              <TouchableOpacity
                key={r}
                style={[styles.rangeBtn, range === r && styles.rangeBtnActive]}
                onPress={() => setRange(r)}
              >
                <Text style={[styles.rangeBtnText, range === r && styles.rangeBtnTextActive]}>
                  {r}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Líneas de referencia */}
      <View style={styles.chartArea}>
        {/* Zona de rango normal */}
        <View style={styles.normalZone} />
        <Text style={styles.refLabel70}>70</Text>
        <Text style={styles.refLabel140}>140</Text>

        {/* Barras */}
        <View style={styles.barsRow}>
          {data.map((item, index) => {
            const isHovered = hoveredIndex === index;
            const color = barColor(item.value);
            const hasData = item.value > 0;

            return (
              <View key={`${range}-${index}`} style={styles.barWrapper}>
                {/* Tooltip */}
                {isHovered && hasData && (
                  <View style={[styles.tooltip, { borderColor: color }]}>
                    <Text style={[styles.tooltipValue, { color }]}>{item.value}</Text>
                    <Text style={styles.tooltipUnit}>mg/dL</Text>
                  </View>
                )}

                {/* Barra */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.barTouchable}
                  {...(Platform.OS === 'web'
                    ? { onMouseEnter: () => setHoveredIndex(index), onMouseLeave: () => setHoveredIndex(null) }
                    : { onPressIn: () => setHoveredIndex(index), onPressOut: () => setHoveredIndex(null) }
                  )}
                >
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          height: `${item.h}%`,
                          backgroundColor: color,
                          opacity: isHovered ? 1 : hasData ? 0.75 : 1,
                          borderRadius: 6,
                        },
                      ]}
                    />
                  </View>
                </TouchableOpacity>

                {/* Etiqueta día/mes */}
                <Text style={[styles.barLabel, isHovered && { color: '#ecf2f3' }]}>
                  {item.label}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Leyenda */}
      <View style={styles.legend}>
        <LegendItem color="#86d0ef" label="Normal (70–140)" />
        <LegendItem color="#f59e0b" label="Elevado" />
        <LegendItem color="#ef4444" label="Crítico" />
      </View>
    </View>
  );
};

const LegendItem = ({ color, label }: { color: string; label: string }) => (
  <View style={styles.legendItem}>
    <View style={[styles.legendDot, { backgroundColor: color }]} />
    <Text style={styles.legendText}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 32,
    padding: 22,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  cardLabel: {
    color: '#42655d',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  avgRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  avgValue: {
    color: '#86d0ef',
    fontSize: 28,
    fontWeight: '800',
  },
  avgUnit: {
    color: '#6f787d',
    fontSize: 12,
    fontWeight: '600',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 100,
    marginLeft: 4,
  },
  trendText: {
    fontSize: 10,
    fontWeight: '700',
  },
  headerRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  rangeToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 3,
  },
  rangeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9,
  },
  rangeBtnActive: {
    backgroundColor: '#006782',
  },
  rangeBtnText: {
    color: '#6f787d',
    fontSize: 11,
    fontWeight: '700',
  },
  rangeBtnTextActive: {
    color: 'white',
  },

  // Área del gráfico
  chartArea: {
    height: 130,
    position: 'relative',
    marginBottom: 8,
  },
  normalZone: {
    position: 'absolute',
    left: 0,
    right: 0,
    // Zona verde aprox 70-140 = 30%-70% del gráfico
    top: '25%',
    height: '40%',
    backgroundColor: 'rgba(34,197,94,0.04)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(34,197,94,0.15)',
  },
  refLabel70: {
    position: 'absolute',
    right: 0,
    bottom: '28%',
    color: 'rgba(34,197,94,0.4)',
    fontSize: 8,
    fontWeight: '700',
  },
  refLabel140: {
    position: 'absolute',
    right: 0,
    top: '22%',
    color: 'rgba(34,197,94,0.4)',
    fontSize: 8,
    fontWeight: '700',
  },
  barsRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: '100%',
    paddingRight: 16,
  },
  barWrapper: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
    position: 'relative',
  },
  barTouchable: {
    width: '70%',
    height: '85%',
    justifyContent: 'flex-end',
  },
  barTrack: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  barFill: {
    width: '100%',
  },
  barLabel: {
    color: '#6f787d',
    fontSize: 9,
    fontWeight: '700',
    marginTop: 6,
    letterSpacing: 0.3,
  },

  // Tooltip
  tooltip: {
    position: 'absolute',
    top: -46,
    backgroundColor: '#1d2426',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
    alignItems: 'center',
    zIndex: 10,
    minWidth: 36,
  },
  tooltipValue: {
    fontSize: 12,
    fontWeight: '800',
  },
  tooltipUnit: {
    color: '#6f787d',
    fontSize: 8,
    fontWeight: '600',
  },

  // Leyenda
  legend: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 4,
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendText: {
    color: '#6f787d',
    fontSize: 10,
    fontWeight: '600',
  },
});
