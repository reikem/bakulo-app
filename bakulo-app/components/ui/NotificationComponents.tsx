import React from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity } from 'react-native';
import { Volume2, Vibrate } from 'lucide-react-native';

// Tarjeta de Alerta (High/Low Glucose)
export const AlertCard = ({ icon, title, desc, threshold, unit, isEnabled, onToggle, iconBg }: any) => (
  <View style={styles.alertCard}>
    <View style={styles.cardTop}>
      <View style={styles.cardHeaderInfo}>
        <View style={[styles.alertIconBox, { backgroundColor: iconBg }]}>
          {icon}
        </View>
        <View>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardDesc}>{desc}</Text>
        </View>
      </View>
      <Switch 
        value={isEnabled} 
        onValueChange={onToggle}
        trackColor={{ false: "#3f484c", true: "#006782" }}
        thumbColor="white"
      />
    </View>
    
    <View style={styles.thresholdBox}>
      <View>
        <Text style={styles.thresholdLabel}>THRESHOLD</Text>
        <View style={styles.thresholdValueRow}>
          <Text style={styles.thresholdNumber}>{threshold}</Text>
          <Text style={styles.thresholdUnit}>{unit}</Text>
        </View>
      </View>
      <View style={styles.controlIcons}>
        <TouchableOpacity style={styles.controlBtn}>
          <Volume2 color="#6f787d" size={20} />
          <Text style={styles.controlBtnText}>SOUND</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlBtn}>
          <Vibrate color="#86d0ef" size={20} />
          <Text style={styles.controlBtnTextPrimary}>VIBRATE</Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
);

// Ítem de Recordatorio (Meals, Meds)
export const ReminderItem = ({ icon, title, tags, subText, isEnabled, onToggle, iconBg }: any) => (
  <View style={styles.reminderCard}>
    <View style={styles.reminderLeft}>
      <View style={[styles.reminderIconBox, { backgroundColor: iconBg }]}>
        {icon}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.reminderTitle}>{title}</Text>
        {tags && (
          <View style={styles.tagRow}>
            {tags.map((tag: string) => (
              <View key={tag} style={styles.tag}><Text style={styles.tagText}>{tag}</Text></View>
            ))}
          </View>
        )}
        {subText && <Text style={styles.reminderSubText}>{subText}</Text>}
      </View>
    </View>
    <Switch 
      value={isEnabled} 
      onValueChange={onToggle}
      trackColor={{ false: "#3f484c", true: "#006782" }}
      thumbColor="white"
    />
  </View>
);

const styles = StyleSheet.create({
  alertCard: { backgroundColor: '#1d2426', borderRadius: 28, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  cardHeaderInfo: { flexDirection: 'row', gap: 16, flex: 1 },
  alertIconBox: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { color: '#f5fafb', fontSize: 20, fontWeight: '700' },
  cardDesc: { color: '#6f787d', fontSize: 14, marginTop: 2 },
  thresholdBox: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 20, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  thresholdLabel: { color: '#6f787d', fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 4 },
  thresholdValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  thresholdNumber: { color: '#f5fafb', fontSize: 32, fontWeight: '800' },
  thresholdUnit: { color: '#6f787d', fontSize: 14, fontWeight: '600' },
  controlIcons: { flexDirection: 'row', gap: 16 },
  controlBtn: { alignItems: 'center', gap: 4 },
  controlBtnText: { color: '#6f787d', fontSize: 9, fontWeight: '800' },
  controlBtnTextPrimary: { color: '#86d0ef', fontSize: 9, fontWeight: '800' },
  reminderCard: { backgroundColor: 'rgba(46, 53, 55, 0.3)', borderRadius: 24, padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  reminderLeft: { flexDirection: 'row', alignItems: 'center', gap: 16, flex: 1 },
  reminderIconBox: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  reminderTitle: { color: '#f5fafb', fontSize: 18, fontWeight: '700' },
  reminderSubText: { color: '#86d0ef', fontSize: 12, fontWeight: '700', marginTop: 2 },
  tagRow: { flexDirection: 'row', gap: 6, marginTop: 6 },
  tag: { backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  tagText: { color: '#6f787d', fontSize: 10, fontWeight: '600' },
});