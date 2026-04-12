import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Pill, Syringe, Thermometer, Snowflake, CheckCircle2, Circle, ArrowLeft } from 'lucide-react-native';
import Svg, { Circle as SvgCircle, Path } from 'react-native-svg';

export default function LogMedicationScreen() {
  const router = useRouter();
  const [temp, setTemp] = useState('cold');
  const [zone, setZone] = useState('abdomen');

  // Función para determinar el color de la zona en el SVG
  const getZoneColor = (targetZone: string) => {
    return zone === targetZone ? '#c4ebe0' : '#40484a';
  };

  return (
    <View style={styles.container}>
      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft color="#c4ebe0" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Daily Intake Log</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.subTitle}>Precisely document your medication and insulin delivery.</Text>

        {/* Oral Medication Section */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconCircle, { backgroundColor: '#004d62' }]}>
              <Pill color="#9fe2ff" size={18} />
            </View>
            <Text style={styles.cardTitle}>Oral Medication</Text>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>MEDICATION NAME</Text>
            <TextInput 
              style={styles.input} 
              placeholder="e.g. Metformin" 
              placeholderTextColor="#6f787d"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>DOSAGE (MG)</Text>
            <TextInput 
              style={styles.input} 
              placeholder="500" 
              keyboardType="numeric"
              placeholderTextColor="#6f787d"
            />
          </View>
        </View>

        {/* Insulin Section */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconCircle, { backgroundColor: '#1a6c3c' }]}>
              <Syringe color="#9beaae" size={18} />
            </View>
            <Text style={styles.cardTitle}>Insulin Administration</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>INSULIN UNITS</Text>
            <View style={styles.unitInputWrapper}>
              <TextInput 
                style={styles.unitInput} 
                placeholder="0.0" 
                keyboardType="decimal-pad"
                placeholderTextColor="#6f787d"
              />
              <Text style={styles.unitLabel}>units</Text>
            </View>
          </View>

          <Text style={styles.label}>TEMPERATURE</Text>
          <View style={styles.toggleRow}>
            <TouchableOpacity 
              style={[styles.toggleBtn, temp === 'cold' && styles.toggleBtnActive]} 
              onPress={() => setTemp('cold')}
            >
              <Snowflake color={temp === 'cold' ? '#fff' : '#bfc8ca'} size={16} />
              <Text style={[styles.toggleText, temp === 'cold' && styles.toggleTextActive]}>Cold</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.toggleBtn, temp === 'ambient' && styles.toggleBtnActive]} 
              onPress={() => setTemp('ambient')}
            >
              <Thermometer color={temp === 'ambient' ? '#fff' : '#bfc8ca'} size={16} />
              <Text style={[styles.toggleText, temp === 'ambient' && styles.toggleTextActive]}>Ambient</Text>
            </TouchableOpacity>
          </View>

          {/* Injection Zone Visual con CUERPO DINÁMICO */}
          <View style={styles.zoneContainer}>
            <Text style={styles.label}>INJECTION ZONE</Text>
            <View style={styles.diagramRow}>
              <View style={styles.bodyDiagram}>
                <Svg height="200" width="100" viewBox="0 0 100 200">
                  {/* Cabeza */}
                  <SvgCircle cx="50" cy="15" r="12" fill="#40484a" />
                  
                  {/* Torso Superior */}
                  <Path d="M30 30 H70 L75 70 H25 Z" fill="#40484a" />
                  
                  {/* Abdomen (Zona Dinámica) */}
                  <Path 
                    d="M25 70 H75 L70 110 H30 Z" 
                    fill={getZoneColor('abdomen')} 
                  />

                  {/* Brazos (Zonas Dinámicas) */}
                  <Path 
                    d="M15 35 Q20 30 25 35 L30 80 L20 80 Z" 
                    fill={getZoneColor('arms')} 
                  />
                  <Path 
                    d="M85 35 Q80 30 75 35 L70 80 L80 80 Z" 
                    fill={getZoneColor('arms')} 
                  />

                  {/* Piernas / Muslos (Zonas Dinámicas) */}
                  <Path 
                    d="M30 110 H48 V180 Q40 185 32 180 Z" 
                    fill={getZoneColor('thighs')} 
                  />
                  <Path 
                    d="M52 110 H70 V180 Q60 185 68 180 Z" 
                    fill={getZoneColor('thighs')} 
                  />
                  
                  {/* Indicador de Punto Activo */}
                  {zone === 'abdomen' && <SvgCircle cx="50" cy="90" r="5" fill="#171d1e" />}
                </Svg>
              </View>

              <View style={styles.zoneButtons}>
                {['Abdomen', 'Thighs', 'Arms'].map((z) => {
                  const key = z.toLowerCase();
                  return (
                    <TouchableOpacity 
                      key={z}
                      style={[styles.zoneBtn, zone === key && styles.zoneBtnActive]}
                      onPress={() => setZone(key)}
                    >
                      <Text style={[styles.zoneBtnText, zone === key && styles.zoneBtnTextActive]}>{z}</Text>
                      {zone === key ? <CheckCircle2 color="#fff" size={14} /> : <Circle color="#6f787d" size={14} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
            <Text style={styles.helperText}>Rotating sites helps prevent lipohypertrophy.</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.saveBtn} activeOpacity={0.8}>
          <Text style={styles.saveBtnText}>Save Med Log</Text>
        </TouchableOpacity>

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#171d1e' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingTop: Platform.OS === 'ios' ? 60 : 20, 
    paddingHorizontal: 24, 
    paddingBottom: 20 
  },
  backBtn: { marginRight: 16 },
  headerTitle: { color: '#c4ebe0', fontSize: 24, fontWeight: '800' },
  scrollContent: { paddingHorizontal: 24 },
  subTitle: { color: '#bfc8ca', fontSize: 14, marginBottom: 24, opacity: 0.8 },
  card: { backgroundColor: '#1d2426', borderRadius: 24, padding: 20, marginBottom: 20 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  iconCircle: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  cardTitle: { color: '#c4ebe0', fontSize: 17, fontWeight: '700' },
  inputGroup: { marginBottom: 16 },
  label: { color: '#bfc8ca', fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 8 },
  input: { backgroundColor: '#171d1e', borderRadius: 12, padding: 14, color: '#fff', fontSize: 16 },
  unitInputWrapper: { position: 'relative' },
  unitInput: { backgroundColor: '#171d1e', borderRadius: 12, padding: 18, color: '#fff', fontSize: 32, fontWeight: '800' },
  unitLabel: { position: 'absolute', right: 16, top: 26, color: '#bfc8ca', fontSize: 14 },
  toggleRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  toggleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#171d1e', padding: 14, borderRadius: 14 },
  toggleBtnActive: { backgroundColor: '#006782' },
  toggleText: { color: '#bfc8ca', fontSize: 13, fontWeight: '600' },
  toggleTextActive: { color: '#fff' },
  zoneContainer: { marginTop: 10 },
  diagramRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    backgroundColor: '#171d1e', 
    borderRadius: 24, 
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)'
  },
  bodyDiagram: { width: 100, height: 200, alignItems: 'center', justifyContent: 'center' },
  zoneButtons: { gap: 10, flex: 1, marginLeft: 20 },
  zoneBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderRadius: 14, backgroundColor: '#1d2426' },
  zoneBtnActive: { backgroundColor: '#004e63' },
  zoneBtnText: { color: '#bfc8ca', fontSize: 13, fontWeight: '600' },
  zoneBtnTextActive: { color: '#fff' },
  helperText: { color: '#6f787d', fontSize: 10, textAlign: 'center', marginTop: 12, fontStyle: 'italic' },
  saveBtn: { backgroundColor: '#004e63', padding: 22, borderRadius: 100, alignItems: 'center', marginTop: 10, shadowColor: '#004e63', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20 },
  saveBtnText: { color: '#fff', fontSize: 18, fontWeight: '800' }
});