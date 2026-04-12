import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Platform } from 'react-native';
import { 
  BellRing, AlarmClock, Volume2, Sun, 
  CloudSun, Moon, Utensils, Pill, 
  Syringe, Edit3, Plus 
} from 'lucide-react-native';

export default function AdviceScreen() {
  const [reminders, setReminders] = useState({
    breakfast: true,
    lunch: true,
    dinner: true,
    snacks: false,
    metformin: true,
    insulin: true,
  });

  const toggleSwitch = (key: keyof typeof reminders) => {
    setReminders(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      
      {/* Header Section */}
      <View style={styles.header}>
        <Text style={styles.title}>Configuración de Alertas</Text>
        <Text style={styles.subTitle}>Manage your daily routine and clinical alerts.</Text>
      </View>

      {/* Bento Grid: Global Settings */}
      <View style={styles.bentoRow}>
        <View style={styles.notificationCard}>
          <Text style={styles.cardTitle}>Notification Style</Text>
          <Text style={styles.cardSub}>How you want to be alerted.</Text>
          <View style={styles.buttonGroup}>
            <TouchableOpacity style={[styles.miniBtn, styles.activeBtn]}>
              <BellRing color="#fff" size={18} />
              <Text style={styles.btnText}>Push</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.miniBtn}>
              <AlarmClock color="#f5f5f5" size={18} />
              <Text style={styles.btnText}>Alarm</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.toneCard}>
          <View style={styles.iconCircle}>
            <Volume2 color="#baeaff" size={24} />
          </View>
          <Text style={styles.toneText}>Alert Tone</Text>
          <Text style={styles.toneSub}>ZEN CHIME</Text>
        </View>
      </View>

      {/* Mealtime Reminders */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Meal Logs</Text>
        <Text style={styles.sectionTag}>RECURRING DAILY</Text>
      </View>

      <View style={styles.listContainer}>
        <ReminderItem 
          icon={<Sun color="#baeaff" size={22} />} 
          title="Breakfast" 
          time="Daily at 07:30 AM"
          value={reminders.breakfast}
          onToggle={() => toggleSwitch('breakfast')}
        />
        <ReminderItem 
          icon={<CloudSun color="#baeaff" size={22} />} 
          title="Lunch" 
          time="Daily at 12:45 PM"
          value={reminders.lunch}
          onToggle={() => toggleSwitch('lunch')}
        />
        <ReminderItem 
          icon={<Moon color="#baeaff" size={22} />} 
          title="Dinner" 
          time="Daily at 07:00 PM"
          value={reminders.dinner}
          onToggle={() => toggleSwitch('dinner')}
        />
      </View>

      {/* Smart Reminders Banner */}
      <View style={styles.smartBanner}>
        <View>
          <Text style={styles.smartTitle}>Smart Reminders</Text>
          <Text style={styles.smartSub}>Check blood sugar after meals.</Text>
        </View>
        <TouchableOpacity style={styles.editBadge}>
          <Text style={styles.badgeText}>2 Hours After</Text>
          <Edit3 color="#fff" size={14} />
        </TouchableOpacity>
      </View>

      {/* Medications */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Medications</Text>
        <TouchableOpacity><Text style={styles.addText}>Add New</Text></TouchableOpacity>
      </View>

      <View style={styles.medicationGrid}>
        <MedCard 
          icon={<Pill color="#baeaff" size={20} />} 
          name="Metformin" 
          desc="500mg, twice daily"
          value={reminders.metformin}
          onToggle={() => toggleSwitch('metformin')}
        />
        <MedCard 
          icon={<Syringe color="#baeaff" size={20} />} 
          name="Insulin" 
          desc="Nightly, 10 units"
          value={reminders.insulin}
          onToggle={() => toggleSwitch('insulin')}
        />
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

// Sub-componentes
const ReminderItem = ({ icon, title, time, value, onToggle }: any) => (
  <View style={styles.reminderCard}>
    <View style={styles.row}>
      <View style={styles.iconBg}>{icon}</View>
      <View>
        <Text style={styles.itemTitle}>{title}</Text>
        <Text style={styles.itemTime}>{time}</Text>
      </View>
    </View>
    <Switch 
      value={value} 
      onValueChange={onToggle}
      trackColor={{ false: '#3f484c', true: '#006782' }}
      thumbColor="#fff"
    />
  </View>
);

const MedCard = ({ icon, name, desc, value, onToggle }: any) => (
  <View style={styles.medCard}>
    <View style={styles.rowBetween}>
      <View style={styles.medIconBg}>{icon}</View>
      <Switch 
        value={value} 
        onValueChange={onToggle}
        trackColor={{ false: '#3f484c', true: '#006782' }}
        thumbColor="#fff"
      />
    </View>
    <View style={{ marginTop: 12 }}>
      <Text style={styles.itemTitle}>{name}</Text>
      <Text style={styles.itemTime}>{desc}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  scrollContent: { padding: 24 },
  header: { marginBottom: 32 },
  title: { color: '#f5f5f5', fontSize: 28, fontWeight: '800', fontFamily: 'Manrope' },
  subTitle: { color: '#b0bec5', fontSize: 14, marginTop: 4 },
  
  bentoRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  notificationCard: { flex: 2, backgroundColor: '#1a1a1a', borderRadius: 24, padding: 20 },
  toneCard: { flex: 1, backgroundColor: '#004e63', borderRadius: 24, padding: 20, alignItems: 'center', justifyContent: 'center' },
  
  cardTitle: { color: '#f5f5f5', fontSize: 16, fontWeight: '700' },
  cardSub: { color: '#b0bec5', fontSize: 12, marginTop: 2 },
  buttonGroup: { flexDirection: 'row', gap: 8, marginTop: 16 },
  miniBtn: { flex: 1, height: 44, borderRadius: 12, backgroundColor: '#242424', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  activeBtn: { backgroundColor: '#006782' },
  btnText: { color: '#fff', fontSize: 12, fontWeight: '600' },

  iconCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(186, 234, 255, 0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  toneText: { color: '#baeaff', fontSize: 14, fontWeight: '800' },
  toneSub: { color: 'rgba(186, 234, 255, 0.6)', fontSize: 9, fontWeight: '700', letterSpacing: 1 },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 24, marginBottom: 16 },
  sectionTitle: { color: '#f5f5f5', fontSize: 20, fontWeight: '800' },
  sectionTag: { color: '#b0bec5', fontSize: 10, fontWeight: '700' },
  
  listContainer: { gap: 12 },
  reminderCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#1a1a1a', padding: 16, borderRadius: 24 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  iconBg: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#242424', alignItems: 'center', justifyContent: 'center' },
  itemTitle: { color: '#f5f5f5', fontSize: 16, fontWeight: '700' },
  itemTime: { color: '#b0bec5', fontSize: 13 },

  smartBanner: { backgroundColor: '#006782', padding: 20, borderRadius: 24, marginTop: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  smartTitle: { color: '#fff', fontSize: 16, fontWeight: '800' },
  smartSub: { color: 'rgba(255,255,255,0.8)', fontSize: 12 },
  editBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14 },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  medicationGrid: { flexDirection: 'row', gap: 12 },
  medCard: { flex: 1, backgroundColor: '#1a1a1a', padding: 20, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  medIconBg: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#004e63', alignItems: 'center', justifyContent: 'center' },
  addText: { color: '#006782', fontWeight: '800', fontSize: 14 }
});