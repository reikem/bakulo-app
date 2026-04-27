/**
 * log-medication.tsx — v2
 * Guarda medicación en AppStore y dispara notificación interna.
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  Platform, Alert, SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Pill, Syringe, Droplets, Thermometer, Snowflake,
  CheckCircle2, Circle, ArrowLeft, Clock,
} from 'lucide-react-native';
import Svg, { Circle as SvgCircle, Path } from 'react-native-svg';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAppStore } from '@/store/AppStore';


type MedType = 'pastillas' | 'jarabe' | 'inyectables';

export default function LogMedicationScreen() {
  const router = useRouter();
  const { addMedicationEntry } = useAppStore();

  const [medType,        setMedType]        = useState<MedType>('inyectables');
  const [medName,        setMedName]        = useState('');
  const [dosage,         setDosage]         = useState('');
  const [temp,           setTemp]           = useState('cold');
  const [zone,           setZone]           = useState('abdomen');
  const [showZone,       setShowZone]       = useState(true);
  const [injectionTime,  setInjectionTime]  = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);

  const getZoneColor = (z: string) => zone === z ? '#c4ebe0' : '#40484a';

  const handleSave = () => {
    if (!medName || !dosage) {
      Alert.alert('Campos requeridos', 'Por favor completa nombre y dosis.');
      return;
    }
    addMedicationEntry({
      medName,
      medType,
      dosage,
      zone: medType === 'inyectables' ? zone : undefined,
      timestamp: injectionTime,
    });
    Alert.alert('✓ Guardado', `${medName} ${dosage} registrado`, [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <ArrowLeft color="#c4ebe0" size={24} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Registrar Medicación</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Selector tipo */}
        <View style={s.typeSelector}>
          {([
            { id: 'pastillas',    Icon: Pill,     label: 'Pastillas'    },
            { id: 'jarabe',       Icon: Droplets, label: 'Jarabe'       },
            { id: 'inyectables',  Icon: Syringe,  label: 'Inyectables'  },
          ] as const).map(({ id, Icon, label }) => (
            <TouchableOpacity
              key={id}
              style={[s.typeTab, medType === id && s.typeTabActive]}
              onPress={() => setMedType(id)}
            >
              <Icon color={medType === id ? '#fff' : '#6f787d'} size={20} />
              <Text style={[s.typeTabText, medType === id && s.typeTabTextActive]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Nombre y dosis */}
        <View style={s.card}>
          <View style={s.inputGroup}>
            <Text style={s.label}>NOMBRE DEL MEDICAMENTO</Text>
            <TextInput
              style={s.input}
              placeholder="Ej. Insulina Glargina"
              placeholderTextColor="#6f787d"
              value={medName}
              onChangeText={setMedName}
            />
          </View>
          <View style={s.inputGroup}>
            <Text style={s.label}>{medType === 'inyectables' ? 'UNIDADES (U)' : 'DOSIS (MG/ML)'}</Text>
            <TextInput
              style={s.input}
              placeholder="0.0"
              keyboardType="numeric"
              placeholderTextColor="#6f787d"
              value={dosage}
              onChangeText={setDosage}
            />
          </View>
          <View style={s.inputGroup}>
            <Text style={s.label}>HORA DE APLICACIÓN</Text>
            <TouchableOpacity style={s.timeBtn} onPress={() => setShowTimePicker(true)}>
              <Clock color="#c4ebe0" size={18} />
              <Text style={s.timeBtnText}>
                {injectionTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Detalles inyectables */}
        {medType === 'inyectables' && (
          <View style={s.card}>
            <Text style={s.sectionTitle}>Detalles de Inyectable</Text>

            <View style={s.toggleRow}>
              {([
                { id: 'cold',    Icon: Snowflake,  label: 'Refrigerado' },
                { id: 'ambient', Icon: Thermometer, label: 'Ambiente'    },
              ] as const).map(({ id, Icon, label }) => (
                <TouchableOpacity
                  key={id}
                  style={[s.toggleBtn, temp === id && s.toggleBtnActive]}
                  onPress={() => setTemp(id)}
                >
                  <Icon color={temp === id ? '#fff' : '#bfc8ca'} size={16} />
                  <Text style={s.toggleText}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={s.zoneHeader}>
              <Text style={s.label}>ZONA DE APLICACIÓN</Text>
              <TouchableOpacity onPress={() => setShowZone(v => !v)}>
                {showZone
                  ? <CheckCircle2 color="#c4ebe0" size={24} />
                  : <Circle       color="#40484a" size={24} />}
              </TouchableOpacity>
            </View>

            {showZone && (
              <View style={s.diagramContainer}>
                <View style={s.bodyDiagram}>
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
                <View style={s.zoneButtons}>
                  {['Abdomen','Thighs','Arms'].map(item => (
                    <TouchableOpacity
                      key={item}
                      style={[s.zoneBtn, zone === item.toLowerCase() && s.zoneBtnActive]}
                      onPress={() => setZone(item.toLowerCase())}
                    >
                      <Text style={[s.zoneBtnText, zone === item.toLowerCase() && s.zoneBtnTextActive]}>
                        {item}
                      </Text>
                      <Circle color={zone === item.toLowerCase() ? '#fff' : '#6f787d'} size={14} />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}

        <TouchableOpacity style={s.saveBtn} onPress={handleSave}>
          <Text style={s.saveBtnText}>Guardar Registro</Text>
        </TouchableOpacity>

        {showTimePicker && (
          <DateTimePicker
            value={injectionTime}
            mode="time"
            onChange={(_, date) => { setShowTimePicker(false); if (date) setInjectionTime(date); }}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#171d1e' },
  header:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20 },
  backBtn:          { padding: 10, backgroundColor: '#1d2426', borderRadius: 100 },
  headerTitle:      { color: '#c4ebe0', fontSize: 18, fontWeight: '800' },
  scroll:           { paddingHorizontal: 20, paddingBottom: 40 },
  typeSelector:     { flexDirection: 'row', backgroundColor: '#1d2426', borderRadius: 100, padding: 6, marginBottom: 20 },
  typeTab:          { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 100, gap: 8 },
  typeTabActive:    { backgroundColor: '#004e63' },
  typeTabText:      { color: '#6f787d', fontSize: 13, fontWeight: '700' },
  typeTabTextActive:{ color: '#fff' },
  card:             { backgroundColor: '#1d2426', borderRadius: 24, padding: 20, marginBottom: 15 },
  inputGroup:       { marginBottom: 14 },
  label:            { color: '#bfc8ca', fontSize: 10, fontWeight: '800', marginBottom: 8, letterSpacing: 1 },
  input:            { backgroundColor: '#171d1e', borderRadius: 16, padding: 16, color: '#fff', fontSize: 16 },
  timeBtn:          { flexDirection: 'row', alignItems: 'center', backgroundColor: '#171d1e', padding: 16, borderRadius: 16, gap: 10 },
  timeBtnText:      { color: '#fff', fontSize: 16, fontWeight: '700' },
  sectionTitle:     { color: '#c4ebe0', fontSize: 16, fontWeight: '700', marginBottom: 15 },
  toggleRow:        { flexDirection: 'row', gap: 10, marginBottom: 20 },
  toggleBtn:        { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#171d1e', padding: 14, borderRadius: 16, gap: 8 },
  toggleBtnActive:  { backgroundColor: '#1a6c3c', borderColor: '#9beaae', borderWidth: 1 },
  toggleText:       { color: '#fff', fontSize: 12, fontWeight: '600' },
  zoneHeader:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  diagramContainer: { flexDirection: 'row', backgroundColor: '#171d1e', borderRadius: 20, padding: 15 },
  bodyDiagram:      { width: 100, alignItems: 'center' },
  zoneButtons:      { flex: 1, gap: 8, justifyContent: 'center' },
  zoneBtn:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderRadius: 12, backgroundColor: '#1d2426' },
  zoneBtnActive:    { backgroundColor: '#004e63' },
  zoneBtnText:      { color: '#6f787d', fontSize: 13, fontWeight: '700' },
  zoneBtnTextActive:{ color: '#fff' },
  saveBtn:          { backgroundColor: '#004e63', padding: 22, borderRadius: 100, alignItems: 'center', marginTop: 20 },
  saveBtnText:      { color: '#fff', fontSize: 18, fontWeight: '900' },
});
