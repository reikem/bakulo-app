import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { useRouter } from 'expo-router'; // 1. Importar el router
import { 
  ChevronLeft, ChevronRight, Droplets, Utensils, 
  Syringe, Dumbbell, ChevronRight as ArrowIcon 
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function HistoryScreen() {
  const router = useRouter(); // 2. Inicializar el router

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      
      {/* Editorial Header */}
      <View style={styles.headerSection}>
        <Text style={styles.mainTitle}>History</Text>
        <Text style={styles.subTitle}>REVIEW YOUR JOURNEY AND PROGRESS.</Text>
      </View>

      {/* Monthly Calendar View (Bento Style) */}
      <View style={styles.calendarCard}>
        <View style={styles.calendarHeader}>
          <Text style={styles.monthText}>October 2023</Text>
          <View style={styles.navButtons}>
            <TouchableOpacity style={styles.navBtn}><ChevronLeft color="#bfc8cd" size={20} /></TouchableOpacity>
            <TouchableOpacity style={styles.navBtn}><ChevronRight color="#bfc8cd" size={20} /></TouchableOpacity>
          </View>
        </View>

        <View style={styles.daysHeader}>
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
            <Text key={day} style={styles.dayLabel}>{day}</Text>
          ))}
        </View>

        <View style={styles.calendarGrid}>
          {[25, 26, 27, 28, 29, 30].map(d => (
            <View key={`prev-${d}`} style={styles.dayCell}>
              <Text style={styles.dayEmpty}>{d}</Text>
            </View>
          ))}
          <CalendarDay day={1} border />
          <CalendarDay day={2} dot />
          <CalendarDay day={3} />
          <CalendarDay day={4} active />
          <CalendarDay day={5} />
          <CalendarDay day={6} dot />
          {[7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => (
            <CalendarDay key={`curr-${d}`} day={d} dot={d % 3 === 0} />
          ))}
        </View>
      </View>

      {/* Selected Day Logs */}
      <View style={styles.logsHeader}>
        <Text style={styles.logsTitle}>Logs for Oct 4</Text>
        <View style={styles.rangeBadge}>
          <Text style={styles.rangeText}>IN RANGE</Text>
        </View>
      </View>

      <View style={styles.logsList}>
        <LogCard 
          icon={<Droplets color="#86d0ef" size={24} />} 
          title="Blood Glucose" 
          time="08:30 AM" 
          value="114" 
          unit="mg/dL" 
          color="#86d0ef"
        />
        <LogCard 
          icon={<Utensils color="#a9cec4" size={24} />} 
          title="Breakfast" 
          time="09:15 AM" 
          desc="Avocado Toast with Egg" 
          subDesc="42g Carbs • 12g Protein"
          color="#a9cec4"
        />
        <LogCard 
          icon={<Syringe color="#89d89d" size={24} />} 
          title="Bolus Dose" 
          time="09:20 AM" 
          value="6.5" 
          unit="Units" 
          color="#89d89d"
        />

        {/* Empty State / Add Action - VINCULADO A LOG EXERCISE */}
        <View style={styles.emptyCard}>
          <Dumbbell color="rgba(191, 200, 205, 0.4)" size={32} />
          <Text style={styles.emptyText}>No activity logged for this morning</Text>
          <TouchableOpacity 
            style={styles.addBtn}
            onPress={() => router.push('/log-exercise')} // 3. Navegación al archivo creado
          >
            <Text style={styles.addBtnText}>ADD EXERCISE</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

// Sub-componentes
const CalendarDay = ({ day, active, dot, border }: any) => (
  <View style={styles.dayCell}>
    {active ? (
      <View style={styles.activeDayBox}>
        <Text style={styles.dayTextActive}>{day}</Text>
      </View>
    ) : (
      <View style={[styles.dayInner, border && styles.dayBorder]}>
        <Text style={styles.dayText}>{day}</Text>
        {dot && <View style={styles.dot} />}
      </View>
    )}
  </View>
);

const LogCard = ({ icon, title, time, value, unit, desc, subDesc, color }: any) => {
  const router = useRouter();
  return (
    <TouchableOpacity 
      style={styles.card} 
      activeOpacity={0.7}
      onPress={() => title === "Exercise" && router.push('/log-exercise')}
    >
      <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
        {icon}
      </View>
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
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  scrollContent: { padding: 24 },
  headerSection: { marginBottom: 32, marginTop: 10 },
  mainTitle: { color: '#baeaff', fontSize: 32, fontWeight: '800' },
  subTitle: { color: '#6f787d', fontSize: 10, fontWeight: '700', letterSpacing: 1, marginTop: 4 },
  calendarCard: { backgroundColor: '#1a1a1a', borderRadius: 32, padding: 20, marginBottom: 32 },
  calendarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  monthText: { color: '#f5f5f5', fontSize: 18, fontWeight: '700' },
  navButtons: { flexDirection: 'row', gap: 4 },
  navBtn: { padding: 4 },
  daysHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, paddingHorizontal: 10 },
  dayLabel: { color: '#6f787d', fontSize: 10, fontWeight: '800', width: (width - 100) / 7, textAlign: 'center' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start' },
  dayCell: { width: (width - 88) / 7, height: 48, alignItems: 'center', justifyContent: 'center' },
  dayInner: { alignItems: 'center', justifyContent: 'center', width: 32, height: 32 },
  dayEmpty: { color: 'rgba(111, 120, 125, 0.3)', fontSize: 13 },
  dayText: { color: '#ecf2f3', fontSize: 14, fontWeight: '500' },
  dayBorder: { borderWidth: 1, borderColor: '#006782', borderRadius: 10 },
  activeDayBox: { backgroundColor: '#006782', width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  dayTextActive: { color: '#ffffff', fontWeight: 'bold', fontSize: 14 },
  dot: { width: 4, height: 4, backgroundColor: '#89d89d', borderRadius: 2, position: 'absolute', bottom: -2 },
  logsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  logsTitle: { color: '#f5f5f5', fontSize: 20, fontWeight: '800' },
  rangeBadge: { backgroundColor: 'rgba(137, 216, 157, 0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100 },
  rangeText: { color: '#89d89d', fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  logsList: { gap: 12 },
  card: { flexDirection: 'row', backgroundColor: '#1d2426', padding: 16, borderRadius: 24, alignItems: 'center', gap: 12 },
  iconContainer: { width: 50, height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  cardContent: { flex: 1 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  cardTitle: { fontSize: 15, fontWeight: '700' },
  timeText: { color: '#6f787d', fontSize: 10, fontWeight: '600' },
  valueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  valueText: { color: '#f5f5f5', fontSize: 24, fontWeight: '800' },
  unitText: { color: '#6f787d', fontSize: 12, fontWeight: '600' },
  descText: { color: '#f5f5f5', fontSize: 14, fontWeight: '600' },
  subDescText: { color: '#6f787d', fontSize: 11 },
  emptyCard: { padding: 24, borderWidth: 1, borderColor: 'rgba(111, 120, 125, 0.2)', borderStyle: 'dashed', borderRadius: 24, alignItems: 'center', gap: 8, marginTop: 8 },
  emptyText: { color: '#6f787d', fontSize: 13, textAlign: 'center' },
  addBtn: { marginTop: 4, borderWidth: 1, borderColor: '#006782', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 100 },
  addBtnText: { color: '#baeaff', fontSize: 9, fontWeight: '800' },
});