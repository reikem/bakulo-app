import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Platform, Alert, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Pill, Syringe, Droplets, Thermometer, Snowflake, CheckCircle2, Circle, ArrowLeft, Clock } from 'lucide-react-native';
import Svg, { Circle as SvgCircle, Path } from 'react-native-svg';
import DateTimePicker from '@react-native-community/datetimepicker';

type MedType = 'pastillas' | 'jarabe' | 'inyectables';

export default function LogMedicationScreen() {
  const router = useRouter();
  
  // Estados de Selección de Tipo
  const [medType, setMedType] = useState<MedType>('inyectables');
  
  // Estados del Formulario
  const [medName, setMedName] = useState('');
  const [dosage, setDosage] = useState('');
  const [temp, setTemp] = useState('cold');
  const [zone, setZone] = useState('abdomen');
  const [showZoneDiagram, setShowZoneDiagram] = useState(true);
  
  // Estados para la Hora
  const [injectionTime, setInjectionTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);

  const getZoneColor = (targetZone: string) => {
    return zone === targetZone ? '#c4ebe0' : '#40484a';
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Estilizado */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft color="#c4ebe0" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Daily Intake Log</Text>
        <View style={{ width: 40 }} /> 
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Selector de Tipo (Tabs con Iconos) */}
        <View style={styles.typeSelectorContainer}>
          <TouchableOpacity 
            style={[styles.typeTab, medType === 'pastillas' && styles.typeTabActive]} 
            onPress={() => setMedType('pastillas')}
          >
            <Pill color={medType === 'pastillas' ? '#fff' : '#6f787d'} size={20} />
            <Text style={[styles.typeTabText, medType === 'pastillas' && styles.typeTabTextActive]}>Pastillas</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.typeTab, medType === 'jarabe' && styles.typeTabActive]} 
            onPress={() => setMedType('jarabe')}
          >
            <Droplets color={medType === 'jarabe' ? '#fff' : '#6f787d'} size={20} />
            <Text style={[styles.typeTabText, medType === 'jarabe' && styles.typeTabTextActive]}>Jarabe</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.typeTab, medType === 'inyectables' && styles.typeTabActive]} 
            onPress={() => setMedType('inyectables')}
          >
            <Syringe color={medType === 'inyectables' ? '#fff' : '#6f787d'} size={20} />
            <Text style={[styles.typeTabText, medType === 'inyectables' && styles.typeTabTextActive]}>Inyectables</Text>
          </TouchableOpacity>
        </View>

        {/* Sección de Nombre y Dosis */}
        <View style={styles.card}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>NOMBRE DEL MEDICAMENTO</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Ej. Insulina Glargina" 
              placeholderTextColor="#6f787d"
              value={medName}
              onChangeText={setMedName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{medType === 'inyectables' ? 'UNIDADES (U)' : 'DOSIS (MG/ML)'}</Text>
            <TextInput 
              style={styles.input} 
              placeholder="0.0" 
              keyboardType="numeric"
              placeholderTextColor="#6f787d"
              value={dosage}
              onChangeText={setDosage}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>HORA DE APLICACIÓN</Text>
            <TouchableOpacity style={styles.timeBtn} onPress={() => setShowTimePicker(true)}>
              <Clock color="#c4ebe0" size={18} />
              <Text style={styles.timeBtnText}>
                {injectionTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Detalles Específicos para Inyectables */}
        {medType === 'inyectables' && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Detalles de Inyectable</Text>
            
            <View style={styles.toggleRow}>
              <TouchableOpacity 
                style={[styles.toggleBtn, temp === 'cold' && styles.toggleBtnActive]} 
                onPress={() => setTemp('cold')}
              >
                <Snowflake color={temp === 'cold' ? '#fff' : '#bfc8ca'} size={16} />
                <Text style={styles.toggleText}>Refrigerado</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.toggleBtn, temp === 'ambient' && styles.toggleBtnActive]} 
                onPress={() => setTemp('ambient')}
              >
                <Thermometer color={temp === 'ambient' ? '#fff' : '#bfc8ca'} size={16} />
                <Text style={styles.toggleText}>Ambiente</Text>
              </TouchableOpacity>
            </View>

            {/* Diagrama Humano Dinámico */}
            <View style={styles.zoneHeader}>
               <Text style={styles.label}>REGISTRO DE ZONA</Text>
               <TouchableOpacity onPress={() => setShowZoneDiagram(!showZoneDiagram)}>
                 <CheckCircle2 color={showZoneDiagram ? "#c4ebe0" : "#40484a"} size={24} />
               </TouchableOpacity>
            </View>

            {showZoneDiagram && (
              <View style={styles.diagramContainer}>
                <View style={styles.bodyDiagram}>
                  <Svg height="200" width="100" viewBox="0 0 100 200">
                    <SvgCircle cx="50" cy="15" r="12" fill="#40484a" />
                    <Path d="M30 30 H70 L75 70 H25 Z" fill="#40484a" />
                    <Path d="M25 70 H75 L70 110 H30 Z" fill={getZoneColor('abdomen')} />
                    <Path d="M15 35 Q20 30 25 35 L30 80 L20 80 Z" fill={getZoneColor('arms')} />
                    <Path d="M85 35 Q80 30 75 35 L70 80 L80 80 Z" fill={getZoneColor('arms')} />
                    <Path d="M30 110 H48 V180 Q40 185 32 180 Z" fill={getZoneColor('thighs')} />
                    <Path d="M52 110 H70 V180 Q60 185 68 180 Z" fill={getZoneColor('thighs')} />
                    {zone === 'abdomen' && <SvgCircle cx="50" cy="90" r="5" fill="#1d2426" />}
                  </Svg>
                </View>

                <View style={styles.zoneButtons}>
                  {['Abdomen', 'Thighs', 'Arms'].map((item) => (
                    <TouchableOpacity 
                      key={item} 
                      style={[styles.zoneBtn, zone === item.toLowerCase() && styles.zoneBtnActive]}
                      onPress={() => setZone(item.toLowerCase())}
                    >
                      <Text style={[styles.zoneBtnText, zone === item.toLowerCase() && styles.zoneBtnTextActive]}>{item}</Text>
                      <Circle color={zone === item.toLowerCase() ? "#fff" : "#6f787d"} size={14} />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}

        <TouchableOpacity style={styles.saveBtn} onPress={() => Alert.alert("Guardado", "Registro exitoso")}>
          <Text style={styles.saveBtnText}>Guardar Registro</Text>
        </TouchableOpacity>

        {showTimePicker && (
          <DateTimePicker 
            value={injectionTime} 
            mode="time" 
            onChange={(e, date) => { setShowTimePicker(false); if(date) setInjectionTime(date); }} 
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#171d1e' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20 },
  backBtn: { padding: 10, backgroundColor: '#1d2426', borderRadius: 100 },
  headerTitle: { color: '#c4ebe0', fontSize: 18, fontWeight: '800' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  typeSelectorContainer: { flexDirection: 'row', backgroundColor: '#1d2426', borderRadius: 100, padding: 6, marginBottom: 20 },
  typeTab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 100, gap: 8 },
  typeTabActive: { backgroundColor: '#004e63' },
  typeTabText: { color: '#6f787d', fontSize: 13, fontWeight: '700' },
  typeTabTextActive: { color: '#fff' },
  card: { backgroundColor: '#1d2426', borderRadius: 24, padding: 20, marginBottom: 15 },
  label: { color: '#bfc8ca', fontSize: 10, fontWeight: '800', marginBottom: 10, letterSpacing: 1 },
  input: { backgroundColor: '#171d1e', borderRadius: 16, padding: 16, color: '#fff', fontSize: 16 },
  timeBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#171d1e', padding: 16, borderRadius: 16, gap: 10 },
  timeBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  sectionTitle: { color: '#c4ebe0', fontSize: 16, fontWeight: '700', marginBottom: 15 },
  toggleRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  toggleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#171d1e', padding: 14, borderRadius: 16, gap: 8 },
  toggleBtnActive: { backgroundColor: '#1a6c3c', borderColor: '#9beaae', borderWidth: 1 },
  toggleText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  zoneHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  diagramContainer: { flexDirection: 'row', backgroundColor: '#171d1e', borderRadius: 20, padding: 15 },
  bodyDiagram: { width: 100, alignItems: 'center' },
  zoneButtons: { flex: 1, gap: 8, justifyContent: 'center' },
  zoneBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderRadius: 12, backgroundColor: '#1d2426' },
  zoneBtnActive: { backgroundColor: '#004e63' },
  zoneBtnText: { color: '#6f787d', fontSize: 13, fontWeight: '700' },
  zoneBtnTextActive: { color: '#fff' },
  saveBtn: { backgroundColor: '#004e63', padding: 22, borderRadius: 100, alignItems: 'center', marginTop: 20 },
  saveBtnText: { color: '#fff', fontSize: 18, fontWeight: '900' }
});