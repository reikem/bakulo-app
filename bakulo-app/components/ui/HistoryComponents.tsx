import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronRight as ArrowIcon, LucideIcon, CheckCircle2, Circle } from 'lucide-react-native';

// --- SECCIÓN 1: CALENDARIO Y LISTA (HISTORY) ---

export const CalendarDay = ({ day, active, dot, border, isPrevMonth, onPress }: any) => (
  <TouchableOpacity style={styles.dayCell} onPress={onPress} disabled={isPrevMonth}>
    {active ? (
      <View style={styles.activeDayBox}><Text style={styles.dayTextActive}>{day}</Text></View>
    ) : (
      <View style={[styles.dayInner, border && styles.dayBorder]}>
        <Text style={[styles.dayText, isPrevMonth && styles.dayEmpty]}>{day}</Text>
        {dot && <View style={styles.dot} />}
      </View>
    )}
  </TouchableOpacity>
);

export const LogCard = ({ icon, title, time, value, unit, desc, subDesc, color, onPress }: any) => (
  <TouchableOpacity style={styles.card} activeOpacity={0.7} onPress={onPress}>
    <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>{icon}</View>
    <View style={styles.cardContent}>
      <View style={styles.cardRow}>
        <Text style={[styles.cardTitle, { color }]}>{title}</Text>
        <Text style={styles.timeText}>{time}</Text>
      </View>
      {value ? (
        <View style={styles.valueRow}>
          <Text style={styles.valueText}>{value}</Text>
          <Text style={styles.unitText}>{unit}</Text>
        </View>
      ) : (
        <View>
          <Text style={styles.descText}>{desc}</Text>
          <Text style={styles.subDescText}>{subDesc}</Text>
        </View>
      )}
    </View>
    <ArrowIcon color="#6f787d" size={18} />
  </TouchableOpacity>
);

// --- SECCIÓN 2: COMPONENTES TIPO BENTO Y GRÁFICOS (DETALLES) ---

interface BentoStatProps {
  label: string;
  value: string | number;
  subValue?: string;
  icon?: LucideIcon;
  color: string;
}

export const BentoStatCard = ({ label, value, subValue, icon: Icon, color }: BentoStatProps) => (
  <View style={styles.miniCard}>
    <View style={styles.miniHeader}>
      {Icon && <Icon color={color} size={18} />}
      <Text style={styles.miniLabel}>{label}</Text>
    </View>
    <View style={styles.valueContainer}>
      <Text style={styles.miniValue}>{value}</Text>
      {subValue && <Text style={styles.subValueText}>{subValue}</Text>}
    </View>
  </View>
);

export const WeeklyChart = ({ data, title }: { data: any[], title: string }) => (
  <View style={styles.chartCard}>
    <Text style={styles.chartTitle}>{title}</Text>
    <View style={styles.barContainer}>
      {data.map((item, index) => (
        <View key={index} style={styles.barWrapper}>
          <View style={styles.barBackground}>
            <View 
              style={[
                styles.barFill, 
                { height: `${item.val}%`, backgroundColor: item.val > 70 ? '#c4ebe0' : '#42655d' }
              ]} 
            />
          </View>
          <Text style={styles.barLabel}>{item.day}</Text>
        </View>
      ))}
    </View>
  </View>
);

// --- SECCIÓN 3: ESTADOS DE ACTIVIDAD ---

export const ActivityStatusSelector = ({ isDone, isFuture, isToday, onPress }: any) => {
  if (isFuture) {
    return (
      <View style={styles.disabledBanner}>
        <Text style={styles.disabledText}>No disponible para fechas futuras</Text>
      </View>
    );
  }

  return (
    <TouchableOpacity 
      style={[styles.checkCard, isDone && styles.checkCardActive]} 
      onPress={onPress}
      disabled={!isToday && !isDone} // Evita marcar como hecho registros muy viejos si lo deseas
    >
      {isDone ? <CheckCircle2 color="#c4ebe0" size={28} /> : <Circle color="#6f787d" size={28} />}
      <View style={{ marginLeft: 12 }}>
        <Text style={styles.checkTitle}>{isDone ? "Completado" : "Marcar como realizado"}</Text>
        <Text style={styles.checkSub}>{isToday ? "Actividad para hoy" : "Registro de ayer"}</Text>
      </View>
    </TouchableOpacity>
  );
};

// --- ESTILOS COMPARTIDOS ---

const styles = StyleSheet.create({
  // Calendario
  dayCell: { width: '14.28%', height: 48, alignItems: 'center', justifyContent: 'center' },
  dayInner: { alignItems: 'center', justifyContent: 'center', width: 32, height: 32 },
  dayText: { color: '#ecf2f3', fontSize: 14, fontWeight: '500' },
  dayEmpty: { color: 'rgba(111, 120, 125, 0.3)' },
  dayBorder: { borderWidth: 1, borderColor: '#006782', borderRadius: 10 },
  activeDayBox: { backgroundColor: '#006782', width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  dayTextActive: { color: '#ffffff', fontWeight: 'bold' },
  dot: { width: 4, height: 4, backgroundColor: '#89d89d', borderRadius: 2, position: 'absolute', bottom: -2 },
  
  // LogCard
  card: { flexDirection: 'row', backgroundColor: '#1d2426', padding: 16, borderRadius: 24, alignItems: 'center', gap: 12, marginBottom: 12 },
  iconContainer: { width: 50, height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  cardContent: { flex: 1 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  cardTitle: { fontSize: 15, fontWeight: '700' },
  timeText: { color: '#6f787d', fontSize: 10 },
  valueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  valueText: { color: '#f5f5f5', fontSize: 24, fontWeight: '800' },
  unitText: { color: '#6f787d', fontSize: 12 },
  descText: { color: '#f5f5f5', fontSize: 14, fontWeight: '600' },
  subDescText: { color: '#6f787d', fontSize: 11 },

  // Bento Card
  miniCard: { flex: 1, backgroundColor: '#1d2426', borderRadius: 24, padding: 15, minHeight: 110, justifyContent: 'space-between' },
  miniHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  miniLabel: { color: '#6f787d', fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  valueContainer: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  miniValue: { color: '#c4ebe0', fontSize: 22, fontWeight: '800' },
  subValueText: { color: '#bfc8ca', fontSize: 12, fontWeight: '600' },

  // Gráfico Semanal
  chartCard: { backgroundColor: '#1d2426', borderRadius: 24, padding: 20, marginTop: 16, marginBottom: 12 },
  chartTitle: { color: '#6f787d', fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 15, textTransform: 'uppercase' },
  barContainer: { flexDirection: 'row', justifyContent: 'space-between', height: 80, alignItems: 'flex-end' },
  barWrapper: { alignItems: 'center', width: '10%' },
  barBackground: { width: 6, height: '100%', backgroundColor: '#171d1e', borderRadius: 10, justifyContent: 'flex-end' },
  barFill: { width: '100%', borderRadius: 10 },
  barLabel: { color: '#6f787d', fontSize: 9, marginTop: 6, fontWeight: '700' },

  // Activity Status Selector
  checkCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1d2426', padding: 20, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', marginTop: 12 },
  checkCardActive: { borderColor: '#c4ebe0', backgroundColor: 'rgba(196, 235, 224, 0.05)' },
  checkTitle: { color: 'white', fontSize: 16, fontWeight: '700' },
  checkSub: { color: '#6f787d', fontSize: 12 },
  disabledBanner: { backgroundColor: 'rgba(255,255,255,0.05)', padding: 15, borderRadius: 16, alignItems: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: '#3a4445', marginTop: 12 },
  disabledText: { color: '#6f787d', fontSize: 13, fontWeight: '600' },
});