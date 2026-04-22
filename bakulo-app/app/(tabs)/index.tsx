import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { 
  PlusCircle, ShieldCheck, Target, Utensils, 
  Droplets, ChevronRight, History, FileText, 
  Settings, Syringe, Lightbulb 
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { BloodSugarChart } from '../../components/ui/BloodSugarChart';
import { CriticalAlert } from '../../components/ui/CriticalAlert';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const [showAlert, setShowAlert] = useState(false);
  const router = useRouter();

  return (
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false} 
      contentContainerStyle={styles.scrollContent}
    >
      
      {/* Hero Section: Current Status */}
      <View style={styles.heroLayout}>
        <View style={styles.mainGlucoseCard}>
          <View>
            <Text style={styles.label}>CURRENT GLUCOSE</Text>
            <View style={styles.glucoseRow}>
              <Text style={styles.glucoseValue}>108</Text>
              <Text style={styles.glucoseUnit}>mg/dL</Text>
            </View>
            <View style={styles.statusBadge}>
              <Droplets color="#89d89d" size={16} fill="#89d89d" />
              <Text style={styles.statusText}>Stable Range</Text>
            </View>
          </View>
          
          <View style={styles.logButtonsContainer}>
            <TouchableOpacity style={styles.logButton} activeOpacity={0.8}>
              <PlusCircle color="#fff" size={18} />
              <Text style={styles.logButtonText}>Log Glucose</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.logButton, styles.medicationBtn]} 
              activeOpacity={0.8}
              onPress={() => router.push('/log-medication')}
            >
              <Syringe color="#9beaae" size={18} />
              <Text style={[styles.logButtonText, { color: '#9beaae' }]}>Log Meds</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.statsColumn}>
          <View style={[styles.miniCard, { backgroundColor: '#c4ebe0' }]}>
            <View style={styles.miniCardHeader}>
              <Text style={styles.miniCardTitle}>Time in Range</Text>
              <ShieldCheck color="#2a4d46" size={16} />
            </View>
            <Text style={styles.miniCardValue}>92%</Text>
            <Text style={styles.miniCardSub}>Last 24h</Text>
          </View>

          <View style={styles.miniCardDark}>
            <View style={styles.miniCardHeader}>
              <Text style={[styles.miniCardTitle, { color: '#86d0ef' }]}>Daily Goal</Text>
              <Target color="#86d0ef" size={16} />
            </View>
            <View style={styles.progressContainer}>
              <View style={[styles.progressFill, { width: '75%' }]} />
            </View>
            <Text style={styles.miniCardSub}>6/8 checks</Text>
          </View>
        </View>
      </View>

      <CriticalAlert 
        visible={showAlert} 
        onDismiss={() => setShowAlert(false)} 
        glucoseValue={55} 
      />

      {/* --- NUEVA SECCIÓN: INSIGHTS HIGHLIGHT --- */}
      <TouchableOpacity 
        style={styles.insightHighlightCard}
        onPress={() => router.push('/InsightsScreen')}
        activeOpacity={0.9}
      >
        <View style={styles.insightContent}>
          <View style={styles.insightIconWrapper}>
            <Lightbulb color="#004e63" size={24} fill="#004e63" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.insightTag}>NEW ADVICE</Text>
            <Text style={styles.insightTitle}>Daily Recommendation</Text>
            <Text style={styles.insightDesc}>Discover how a 10-min walk can improve your stability.</Text>
          </View>
          <ChevronRight color="#c4ebe0" size={20} />
        </View>
      </TouchableOpacity>

      {/* Graph Section */}
      <BloodSugarChart />

      {/* Quick Access Section */}
    {/* Quick Access Section */}
    <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Quick Access</Text>
      </View>
      
      <View style={styles.quickGrid}>
        <QuickAction 
          icon={<History color="#86d0ef" size={24} />} 
          label="History" 
        />
        <QuickAction 
          icon={<FileText color="#86d0ef" size={24} />} 
          label="Reports" 
          onPress={() => router.push('/reports')} 
        />
        
        {/* MODIFICADO: Ahora navega a la pantalla de Food Log */}
        <QuickAction 
          icon={<Utensils color="#86d0ef" size={24} />} 
          label="Food Log" 
          onPress={() => router.push('/FoodLogScreen')} 
        />

        <QuickAction 
          icon={<Settings color="#86d0ef" size={24} />} 
          label="Adjust" 
        />
      </View>
      
    </ScrollView>
  );
}

const QuickAction = ({ icon, label, onPress }: any) => (
  <TouchableOpacity style={styles.quickItem} activeOpacity={0.7} onPress={onPress}>
    <View style={styles.quickIconWrapper}>{icon}</View>
    <Text style={styles.quickLabel}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  scrollContent: { padding: 20 },
  heroLayout: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  mainGlucoseCard: { 
    flex: 1.2, 
    backgroundColor: '#1a1a1a', 
    borderRadius: 32, 
    padding: 20, 
    minHeight: 240,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)'
  },
  statsColumn: { flex: 0.8, gap: 12 },
  label: { color: '#42655d', fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 4 },
  glucoseRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  glucoseValue: { color: '#86d0ef', fontSize: 44, fontWeight: '800' },
  glucoseUnit: { color: '#6f787d', fontSize: 14, fontWeight: '600' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  statusText: { color: '#89d89d', fontSize: 12, fontWeight: '700' },
  
  // Botones
  logButtonsContainer: { gap: 8, marginTop: 16 },
  logButton: { 
    backgroundColor: '#004e63', 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 10, 
    borderRadius: 100, 
    gap: 8 
  },
  medicationBtn: {
    backgroundColor: 'rgba(26, 108, 60, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(155, 234, 174, 0.2)'
  },
  logButtonText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  // Mini Cards
  miniCard: { flex: 1, borderRadius: 24, padding: 16, justifyContent: 'space-between' },
  miniCardDark: { 
    flex: 1, 
    backgroundColor: '#1a1a1a', 
    borderRadius: 24, 
    padding: 16, 
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)' 
  },
  miniCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  miniCardTitle: { color: '#2a4d46', fontSize: 11, fontWeight: '700' },
  miniCardValue: { color: '#00201b', fontSize: 24, fontWeight: '800' },
  miniCardSub: { color: '#6f787d', fontSize: 10, fontWeight: '500' },
  progressContainer: { height: 6, backgroundColor: '#333b3d', borderRadius: 10, marginTop: 12 },
  progressFill: { height: '100%', backgroundColor: '#005229', borderRadius: 10 },

  // Estilos de la Nueva Tarjeta Insight
  insightHighlightCard: {
    backgroundColor: 'rgba(0, 78, 99, 0.2)',
    borderRadius: 24,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(196, 235, 224, 0.1)'
  },
  insightContent: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  insightIconWrapper: { 
    width: 48, 
    height: 48, 
    backgroundColor: '#c4ebe0', 
    borderRadius: 16, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  insightTag: { color: '#89d89d', fontSize: 9, fontWeight: '800', letterSpacing: 1, marginBottom: 2 },
  insightTitle: { color: '#c4ebe0', fontSize: 15, fontWeight: '700' },
  insightDesc: { color: '#6f787d', fontSize: 12, marginTop: 2 },

  sectionHeader: { marginTop: 8, marginBottom: 16 },
  sectionTitle: { color: '#86d0ef', fontSize: 20, fontWeight: '800' },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  quickItem: { 
    width: (width - 52) / 2, 
    aspectRatio: 1.1,
    backgroundColor: '#1a1a1a', 
    borderRadius: 28, 
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)'
  },
  quickIconWrapper: { 
    width: 50, 
    height: 50, 
    backgroundColor: 'rgba(134, 208, 239, 0.05)', 
    borderRadius: 18, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  quickLabel: { color: '#ecf2f3', fontSize: 13, fontWeight: '600' },
});