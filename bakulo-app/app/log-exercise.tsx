import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
// Importación con nombres verificados de Lucide
import { 
  ArrowLeft, 
  MoreVertical, 
  Footprints, 
  Activity,    // Usaremos Activity para Running si no tienes el zapato
  Bike, 
  Waves, 
  Flower, 
  Dumbbell,
  Minus,
  Plus,
  TrendingDown,
  FileEdit
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function LogExerciseScreen() {
  const router = useRouter();
  const [activity, setActivity] = useState('Walking');
  const [duration, setDuration] = useState(30);
  const [intensity, setIntensity] = useState('medium');

  // Mapeo SEGURO de iconos
  const activities = [
    { id: 'Walking', icon: Footprints, label: 'Walking' },
    { id: 'Running', icon: Activity, label: 'Running' }, // Cambiado a Activity por seguridad
    { id: 'Cycling', icon: Bike, label: 'Cycling' },
    { id: 'Swimming', icon: Waves, label: 'Swimming' },
    { id: 'Yoga', icon: Flower, label: 'Yoga' },
    { id: 'Strength', icon: Dumbbell, label: 'Strength' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
            <ArrowLeft color="#006782" size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Log Exercise</Text>
        </View>
        <TouchableOpacity style={styles.iconBtn}>
          <MoreVertical color="#bfc8ca" size={24} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Activity Type Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ACTIVITY TYPE</Text>
          <View style={styles.activityGrid}>
            {activities.map((item) => {
              const IconComponent = item.icon; 
              return (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => setActivity(item.id)}
                  style={[
                    styles.activityCard,
                    activity === item.id && styles.activityCardActive
                  ]}
                >
                  {/* Renderizado seguro del componente de icono */}
                  {IconComponent ? (
                    <IconComponent 
                      size={32} 
                      color={activity === item.id ? "#006782" : "#40494a"} 
                    />
                  ) : null}
                  <Text style={[
                    styles.activityLabel,
                    activity === item.id && styles.activityLabelActive
                  ]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Duration & Intensity */}
        <View style={styles.row}>
          <View style={[styles.section, { flex: 1 }]}>
            <Text style={styles.sectionTitle}>DURATION (MIN)</Text>
            <View style={styles.counterCard}>
              <TouchableOpacity onPress={() => setDuration(Math.max(0, duration - 5))} style={styles.roundBtn}>
                <Minus color="#006782" size={20} />
              </TouchableOpacity>
              <Text style={styles.counterText}>{duration}</Text>
              <TouchableOpacity onPress={() => setDuration(duration + 5)} style={styles.roundBtn}>
                <Plus color="#006782" size={20} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.section, { flex: 1 }]}>
            <Text style={styles.sectionTitle}>INTENSITY</Text>
            <View style={styles.intensityContainer}>
              {['Low', 'medium', 'High'].map((lvl) => (
                <TouchableOpacity
                  key={lvl}
                  onPress={() => setIntensity(lvl)}
                  style={[styles.intensityBtn, intensity === lvl && styles.intensityBtnActive]}
                >
                  <Text style={[styles.intensityBtnText, intensity === lvl && styles.intensityBtnTextActive]}>
                    {lvl}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Impact Card */}
        <LinearGradient colors={['#1c2425', '#252f31']} style={styles.impactCard}>
          <View style={styles.impactIconBg}>
            <TrendingDown color="#89d89d" size={24} />
          </View>
          <View style={styles.impactContent}>
            <Text style={styles.impactTitle}>Estimated Glucose Impact</Text>
            <Text style={styles.impactDesc}>
              This activity may lower your blood glucose by <Text style={styles.boldText}>15-20 mg/dL</Text>.
            </Text>
          </View>
        </LinearGradient>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>EXERCISE NOTES</Text>
          <View style={styles.textAreaContainer}>
            <TextInput multiline placeholder="E.g., Felt great..." placeholderTextColor="#40494a" style={styles.textArea} />
            <FileEdit color="#40494a" size={20} style={styles.textAreaIcon} />
          </View>
        </View>

        <TouchableOpacity style={styles.primaryBtn} onPress={() => router.back()}>
          <Text style={styles.primaryBtnText}>Save Activity</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#171d1e' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: Platform.OS === 'android' ? 45 : 20, paddingBottom: 15 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#006782' },
  iconBtn: { padding: 8 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 40 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 11, fontWeight: '800', color: '#006782', opacity: 0.8, letterSpacing: 1.2, marginBottom: 12 },
  activityGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10 },
  activityCard: { width: '31%', backgroundColor: '#1c2425', borderRadius: 24, paddingVertical: 20, alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
  activityCardActive: { borderColor: '#006782' },
  activityLabel: { fontSize: 11, fontWeight: '600', color: '#40494a', marginTop: 8 },
  activityLabelActive: { color: '#bfc8ca' },
  row: { flexDirection: 'row', gap: 15 },
  counterCard: { backgroundColor: '#1c2425', borderRadius: 24, padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  roundBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#2e3536', justifyContent: 'center', alignItems: 'center' },
  counterText: { fontSize: 28, fontWeight: '800', color: '#006782' },
  intensityContainer: { backgroundColor: '#1c2425', borderRadius: 24, padding: 5, flexDirection: 'row', flex: 1 },
  intensityBtn: { flex: 1, paddingVertical: 12, justifyContent: 'center', alignItems: 'center', borderRadius: 18 },
  intensityBtnActive: { backgroundColor: '#006782' },
  intensityBtnText: { fontSize: 11, fontWeight: '700', color: '#40494a' },
  intensityBtnTextActive: { color: '#fff' },
  impactCard: { flexDirection: 'row', padding: 20, borderRadius: 24, borderLeftWidth: 4, borderLeftColor: '#005229', marginBottom: 24 },
  impactIconBg: { padding: 10, backgroundColor: 'rgba(0, 82, 41, 0.2)', borderRadius: 15, marginRight: 15 },
  impactContent: { flex: 1 },
  impactTitle: { color: '#89d89d', fontWeight: 'bold', fontSize: 15 },
  impactDesc: { color: '#bfc8ca', fontSize: 12 },
  boldText: { fontWeight: 'bold', color: '#fff' },
  textAreaContainer: { position: 'relative' },
  textArea: { backgroundColor: '#1c2425', borderRadius: 24, padding: 15, color: '#bfc8ca', minHeight: 100, textAlignVertical: 'top' },
  textAreaIcon: { position: 'absolute', bottom: 15, right: 15 },
  primaryBtn: { backgroundColor: '#006782', paddingVertical: 16, borderRadius: 100, alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});