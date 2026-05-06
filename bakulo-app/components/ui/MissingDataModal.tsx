/**
 * components/ui/MissingDataModal.tsx
 * Aparece cuando el reporte detecta campos vacíos.
 * Permite registrar datos rápidamente sin salir de la pantalla de reportes.
 */

import React, { useState } from 'react';
import {
  Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { X, Droplets, Dumbbell, Utensils, Pill, CheckCircle2, ChevronRight } from 'lucide-react-native';
import { useAppStore } from '@/store/AppStore';

interface MissingDataModalProps {
  visible:       boolean;
  missingFields: string[];   // e.g. ['Lecturas de glucosa', 'Registro de ejercicio']
  onClose:       () => void;
  onDone:        () => void; // después de registrar → generar reporte
  month:         number;
  year:          number;
}

const C = {
  bg:     '#121a1c',
  card:   '#1d2527',
  border: '#2a3335',
  text:   '#ecf2f3',
  sub:    '#6f787d',
  accent: '#86d0ef',
  green:  '#22c55e',
  amber:  '#f59e0b',
};

// ─── QUICK GLUCOSE ────────────────────────────────────────────────────────────
function QuickGlucose({ onAdded }: { onAdded: () => void }) {
  const { addGlucoseEntry } = useAppStore();
  const [val, setVal] = useState('');
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    const n = parseInt(val);
    if (isNaN(n) || n < 30 || n > 600) { Alert.alert('Valor inválido', 'Ingresa un valor entre 30 y 600 mg/dL'); return; }
    await addGlucoseEntry({ value: n, timestamp: new Date(), source: 'manual' });
    setSaved(true);
    setTimeout(onAdded, 600);
  };

  if (saved) return (
    <View style={qi.doneRow}>
      <CheckCircle2 color={C.green} size={18}/>
      <Text style={[qi.doneText, {color:C.green}]}>Glucosa guardada ✓</Text>
    </View>
  );

  return (
    <View style={qi.row}>
      <View style={qi.inputWrap}>
        <TextInput
          style={qi.input}
          value={val}
          onChangeText={setVal}
          placeholder="mg/dL"
          placeholderTextColor="#3f484c"
          keyboardType="numeric"
          maxLength={3}
        />
      </View>
      <TouchableOpacity style={qi.saveBtn} onPress={handleSave}>
        <Text style={qi.saveBtnText}>Guardar</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── QUICK EXERCISE ───────────────────────────────────────────────────────────
function QuickExercise({ onAdded }: { onAdded: () => void }) {
  const { addExerciseEntry } = useAppStore();
  const [activity, setActivity] = useState('Caminata');
  const [mins, setMins] = useState('30');
  const [saved, setSaved] = useState(false);
  const ACTIVITIES = ['Caminata','Trote','Bicicleta','Natación','Gym','Yoga','Otro'];

  const handleSave = () => {
    const m = parseInt(mins);
    if (!activity || isNaN(m) || m < 1) { Alert.alert('Datos incompletos'); return; }
    addExerciseEntry({ activity, durationMinutes: m, timestamp: new Date() });
    setSaved(true);
    setTimeout(onAdded, 600);
  };

  if (saved) return (
    <View style={qi.doneRow}>
      <CheckCircle2 color={C.green} size={18}/>
      <Text style={[qi.doneText,{color:C.green}]}>Ejercicio guardado ✓</Text>
    </View>
  );

  return (
    <View style={qi.col}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={qi.chips}>
        {ACTIVITIES.map(a => (
          <TouchableOpacity key={a} style={[qi.chip, activity===a && qi.chipActive]} onPress={()=>setActivity(a)}>
            <Text style={[qi.chipText, activity===a && qi.chipTextActive]}>{a}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <View style={qi.row}>
        <View style={qi.inputWrap}>
          <TextInput style={qi.input} value={mins} onChangeText={setMins} placeholder="min" placeholderTextColor="#3f484c" keyboardType="numeric" maxLength={3}/>
        </View>
        <TouchableOpacity style={qi.saveBtn} onPress={handleSave}>
          <Text style={qi.saveBtnText}>Guardar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── QUICK MEAL ───────────────────────────────────────────────────────────────
function QuickMeal({ onAdded }: { onAdded: () => void }) {
  const { addMealEntry } = useAppStore();
  const [name, setName] = useState('');
  const [cat, setCat]   = useState('Desayuno');
  const [kcal, setKcal] = useState('');
  const [saved, setSaved] = useState(false);
  const CATS = ['Desayuno','Almuerzo','Cena','Merienda'];

  const handleSave = () => {
    if (!name.trim()) { Alert.alert('Ingresa el nombre del alimento'); return; }
    addMealEntry({ name:name.trim(), category:cat, calories:parseInt(kcal)||0, carbs:0, protein:0, fat:0, timestamp:new Date() });
    setSaved(true);
    setTimeout(onAdded, 600);
  };

  if (saved) return (
    <View style={qi.doneRow}>
      <CheckCircle2 color={C.green} size={18}/>
      <Text style={[qi.doneText,{color:C.green}]}>Comida guardada ✓</Text>
    </View>
  );

  return (
    <View style={qi.col}>
      <View style={qi.row}>
        {CATS.map(c => (
          <TouchableOpacity key={c} style={[qi.chip, cat===c && qi.chipActive]} onPress={()=>setCat(c)}>
            <Text style={[qi.chipText, cat===c && qi.chipTextActive]}>{c}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TextInput style={[qi.input,{flex:0,paddingHorizontal:12,marginBottom:8}]} value={name} onChangeText={setName} placeholder="Nombre del alimento" placeholderTextColor="#3f484c"/>
      <View style={qi.row}>
        <View style={qi.inputWrap}>
          <TextInput style={qi.input} value={kcal} onChangeText={setKcal} placeholder="kcal" placeholderTextColor="#3f484c" keyboardType="numeric" maxLength={4}/>
        </View>
        <TouchableOpacity style={qi.saveBtn} onPress={handleSave}>
          <Text style={qi.saveBtnText}>Guardar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── QUICK MED ────────────────────────────────────────────────────────────────
function QuickMedication({ onAdded }: { onAdded: () => void }) {
  const { addMedicationEntry } = useAppStore();
  const [name,   setName]   = useState('Metformina');
  const [dosage, setDosage] = useState('500mg');
  const [type,   setType]   = useState<'pastillas'|'jarabe'|'inyectables'>('pastillas');
  const [saved,  setSaved]  = useState(false);

  const handleSave = () => {
    if (!name.trim()) { Alert.alert('Ingresa el nombre del medicamento'); return; }
    addMedicationEntry({ medName:name.trim(), medType:type, dosage:dosage.trim()||'1 dosis', timestamp:new Date() });
    setSaved(true);
    setTimeout(onAdded, 600);
  };

  if (saved) return (
    <View style={qi.doneRow}>
      <CheckCircle2 color={C.green} size={18}/>
      <Text style={[qi.doneText,{color:C.green}]}>Medicación guardada ✓</Text>
    </View>
  );

  return (
    <View style={qi.col}>
      <View style={qi.row}>
        {(['pastillas','jarabe','inyectables'] as const).map(t => (
          <TouchableOpacity key={t} style={[qi.chip, type===t && qi.chipActive]} onPress={()=>setType(t)}>
            <Text style={[qi.chipText, type===t && qi.chipTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TextInput style={[qi.input,{flex:0,paddingHorizontal:12,marginBottom:8}]} value={name} onChangeText={setName} placeholder="Nombre del medicamento" placeholderTextColor="#3f484c"/>
      <View style={qi.row}>
        <View style={qi.inputWrap}>
          <TextInput style={qi.input} value={dosage} onChangeText={setDosage} placeholder="Dosis" placeholderTextColor="#3f484c"/>
        </View>
        <TouchableOpacity style={qi.saveBtn} onPress={handleSave}>
          <Text style={qi.saveBtnText}>Guardar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const qi = StyleSheet.create({
  col:          { gap:8 },
  row:          { flexDirection:'row', alignItems:'center', gap:8, flexWrap:'wrap' },
  chips:        { flexDirection:'row', gap:6, paddingBottom:6 },
  chip:         { paddingHorizontal:10, paddingVertical:5, borderRadius:100, backgroundColor:'rgba(255,255,255,0.05)', borderWidth:1, borderColor:'rgba(255,255,255,0.08)' },
  chipActive:   { backgroundColor:'rgba(0,103,130,0.2)', borderColor:'#006782' },
  chipText:     { color:'#6f787d', fontSize:11, fontWeight:'600' },
  chipTextActive:{ color:'#86d0ef' },
  inputWrap:    { flex:1, backgroundColor:'#252d2f', borderRadius:12, overflow:'hidden' },
  input:        { color:'#ecf2f3', fontSize:15, padding:10 },
  saveBtn:      { backgroundColor:'#006782', paddingHorizontal:16, paddingVertical:11, borderRadius:12 },
  saveBtnText:  { color:'white', fontWeight:'700', fontSize:13 },
  doneRow:      { flexDirection:'row', alignItems:'center', gap:8 },
  doneText:     { fontWeight:'700', fontSize:13 },
});

// ─── MAIN MODAL ───────────────────────────────────────────────────────────────
const FIELD_CONFIG: Record<string, {
  label: string; icon: React.ReactNode; color: string;
  component: (props: { onAdded: ()=>void }) => React.ReactElement;
}> = {
  'Lecturas de glucosa':   { label:'Glucosa',    color:'#86d0ef', icon:<Droplets color="#86d0ef" size={18}/>, component:QuickGlucose },
  'Registro de ejercicio': { label:'Ejercicio',  color:'#a4f4b7', icon:<Dumbbell color="#a4f4b7" size={18}/>, component:QuickExercise },
  'Registro de comidas':   { label:'Comida',     color:'#f9c74f', icon:<Utensils color="#f9c74f" size={18}/>, component:QuickMeal },
  'Registro de medicación':{ label:'Medicación', color:'#c4b5fd', icon:<Pill      color="#c4b5fd" size={18}/>, component:QuickMedication },
};

export function MissingDataModal({ visible, missingFields, onClose, onDone, month, year }: MissingDataModalProps) {
  const [expanded, setExpanded]  = useState<string|null>(missingFields[0] ?? null);
  const [completed, setCompleted] = useState<Set<string>>(new Set());

  const handleAdded = (field: string) => {
    setCompleted(prev => new Set([...prev, field]));
    const next = missingFields.find(f => !completed.has(f) && f !== field);
    setExpanded(next ?? null);
  };

  const allDone = missingFields.every(f => completed.has(f));

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':'height'} style={{flex:1}}>
        <View style={s.container}>
          {/* Header */}
          <View style={s.header}>
            <View>
              <Text style={s.title}>Datos Faltantes</Text>
              <Text style={s.sub}>Completa para generar el reporte</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={s.closeBtn}>
              <X color={C.sub} size={20}/>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
            <View style={s.progressBar}>
              <View style={[s.progressFill, {width:`${Math.round(completed.size/Math.max(1,missingFields.length)*100)}%`}]}/>
            </View>
            <Text style={s.progressText}>{completed.size}/{missingFields.length} completados</Text>

            {missingFields.map(field => {
              const cfg     = FIELD_CONFIG[field];
              const isDone  = completed.has(field);
              const isOpen  = expanded === field;
              if (!cfg) return null;

              return (
                <View key={field} style={[s.card, isDone && s.cardDone]}>
                  <TouchableOpacity
                    style={s.cardHeader}
                    onPress={() => setExpanded(isOpen ? null : field)}
                  >
                    <View style={[s.iconBox, {backgroundColor:`${cfg.color}18`}]}>
                      {isDone ? <CheckCircle2 color={C.green} size={18}/> : cfg.icon}
                    </View>
                    <View style={{flex:1}}>
                      <Text style={[s.cardLabel, isDone && {color:C.green}]}>{cfg.label}</Text>
                      <Text style={s.cardSub}>{isDone ? 'Registrado ✓' : 'Sin datos este mes'}</Text>
                    </View>
                    {!isDone && (
                      <View style={[s.expandIcon, isOpen && {transform:[{rotate:'90deg'}]}]}>
                        <ChevronRight color={C.sub} size={16}/>
                      </View>
                    )}
                  </TouchableOpacity>

                  {isOpen && !isDone && (
                    <View style={s.cardBody}>
                      <cfg.component onAdded={() => handleAdded(field)}/>
                    </View>
                  )}
                </View>
              );
            })}

            {/* Saltar */}
            <TouchableOpacity style={s.skipBtn} onPress={onDone}>
              <Text style={s.skipBtnText}>
                {allDone ? '✅ Generar Reporte Ahora' : 'Generar igual (con datos disponibles)'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet.create({
  container:    { flex:1, backgroundColor:C.bg },
  header:       { flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start', padding:24, borderBottomWidth:StyleSheet.hairlineWidth, borderBottomColor:C.border },
  title:        { color:C.text, fontSize:22, fontWeight:'800', marginBottom:3 },
  sub:          { color:C.sub, fontSize:13 },
  closeBtn:     { padding:8, backgroundColor:'rgba(255,255,255,0.05)', borderRadius:12 },
  scroll:       { padding:20, gap:12 },
  progressBar:  { height:6, backgroundColor:'rgba(255,255,255,0.06)', borderRadius:10, overflow:'hidden', marginBottom:6 },
  progressFill: { height:'100%', backgroundColor:'#22c55e', borderRadius:10 },
  progressText: { color:C.sub, fontSize:11, fontWeight:'700', marginBottom:16 },
  card:         { backgroundColor:C.card, borderRadius:20, overflow:'hidden', borderWidth:1, borderColor:C.border },
  cardDone:     { borderColor:'rgba(34,197,94,0.3)' },
  cardHeader:   { flexDirection:'row', alignItems:'center', gap:12, padding:16 },
  iconBox:      { width:40, height:40, borderRadius:14, alignItems:'center', justifyContent:'center' },
  cardLabel:    { color:C.text, fontSize:14, fontWeight:'700' },
  cardSub:      { color:C.sub, fontSize:11, marginTop:2 },
  expandIcon:   { padding:4 },
  cardBody:     { padding:14, paddingTop:0, borderTopWidth:StyleSheet.hairlineWidth, borderTopColor:C.border },
  skipBtn:      { backgroundColor:'#006782', padding:16, borderRadius:100, alignItems:'center', marginTop:8, marginBottom:20 },
  skipBtnText:  { color:'white', fontWeight:'800', fontSize:14 },
});