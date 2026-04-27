/**
 * log-exercise.tsx — v2
 * Guarda ejercicio en AppStore y dispara notificación interna.
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, SafeAreaView, StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ArrowLeft, Footprints, Activity, Bike, Waves, Flower,
  Dumbbell, Minus, Plus, Search, Clock, Home, FileEdit, Trophy,
} from 'lucide-react-native';
import { useAppStore } from '@/store/AppStore';


const ACTIVITIES = [
  { id: 'Gym',       Icon: Dumbbell,  label: 'Gym / Máquinas' },
  { id: 'Home',      Icon: Home,      label: 'En Casa'        },
  { id: 'Walking',   Icon: Footprints,label: 'Caminar'        },
  { id: 'Running',   Icon: Activity,  label: 'Correr'         },
  { id: 'Cycling',   Icon: Bike,      label: 'Ciclismo'       },
  { id: 'Yoga',      Icon: Flower,    label: 'Yoga'           },
  { id: 'Swimming',  Icon: Waves,     label: 'Natación'       },
  { id: 'Football',  Icon: Activity,  label: 'Fútbol'         },
  { id: 'Basketball',Icon: Activity,  label: 'Básquetbol'     },
  { id: 'Baseball',  Icon: Activity,  label: 'Béisbol'        },
  { id: 'Karate',    Icon: Trophy,    label: 'Karate'         },
  { id: 'Judo',      Icon: Trophy,    label: 'Judo'           },
];

export default function LogExerciseScreen() {
  const router = useRouter();
  const { addExerciseEntry } = useAppStore();

  const [search,   setSearch]   = useState('');
  const [activity, setActivity] = useState('Gym');
  const [duration, setDuration] = useState(30);
  const [notes,    setNotes]    = useState('');
  const [time,     setTime]     = useState(
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  );

  const filtered = ACTIVITIES.filter(a =>
    a.label.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = () => {
    const now = new Date();
    // Parsear hora manual si fue editada
    const [h, m] = time.split(':').map(Number);
    const ts = new Date(now.getFullYear(), now.getMonth(), now.getDate(),
      isNaN(h) ? now.getHours() : h,
      isNaN(m) ? now.getMinutes() : m
    );
    addExerciseEntry({ activity, durationMinutes: duration, timestamp: ts, note: notes || undefined });
    router.back();
  };

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content" />
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.iconBtn}>
          <ArrowLeft color="#baeaff" size={24} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Registrar Ejercicio</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        {/* Buscador */}
        <View style={s.searchBar}>
          <Search color="#6f787d" size={20} />
          <TextInput
            placeholder="Buscar actividad..."
            placeholderTextColor="#6f787d"
            style={s.searchInput}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Actividades */}
        <Text style={s.sectionTitle}>SELECCIONA ACTIVIDAD</Text>
        <View style={s.activityGrid}>
          {filtered.map(({ id, Icon, label }) => (
            <TouchableOpacity
              key={id}
              onPress={() => setActivity(id)}
              style={[s.activityCard, activity === id && s.activityCardActive]}
            >
              <Icon size={26} color={activity === id ? '#baeaff' : '#40494a'} />
              <Text style={[s.activityLabel, activity === id && s.activityLabelActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Duración y hora */}
        <View style={s.row}>
          <View style={{ flex: 1 }}>
            <Text style={s.sectionTitle}>DURACIÓN</Text>
            <View style={s.counterCard}>
              <TouchableOpacity onPress={() => setDuration(d => Math.max(5, d-5))} style={s.roundBtn}>
                <Minus color="#baeaff" size={18} />
              </TouchableOpacity>
              <Text style={s.counterText}>{duration} min</Text>
              <TouchableOpacity onPress={() => setDuration(d => d+5)} style={s.roundBtn}>
                <Plus color="#baeaff" size={18} />
              </TouchableOpacity>
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.sectionTitle}>HORA</Text>
            <View style={s.timeCard}>
              <Clock color="#baeaff" size={18} />
              <TextInput
                style={s.timeInput}
                value={time}
                onChangeText={setTime}
                placeholder="00:00"
                placeholderTextColor="#40494a"
              />
            </View>
          </View>
        </View>

        {/* Notas */}
        <Text style={s.sectionTitle}>NOTAS</Text>
        <View style={s.textAreaContainer}>
          <TextInput
            multiline
            placeholder="¿Cómo te sentiste? (intensidad, estado...)"
            placeholderTextColor="#40494a"
            style={s.textArea}
            value={notes}
            onChangeText={setNotes}
          />
          <FileEdit color="#40494a" size={18} style={s.textAreaIcon} />
        </View>

        <TouchableOpacity style={s.saveBtn} onPress={handleSave}>
          <Text style={s.saveBtnText}>Guardar Actividad</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container:          { flex: 1, backgroundColor: '#121212' },
  header:             { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  headerTitle:        { fontSize: 20, fontWeight: '800', color: '#baeaff' },
  iconBtn:            { padding: 10, backgroundColor: '#1a1a1a', borderRadius: 12 },
  scroll:             { paddingHorizontal: 24, paddingBottom: 40 },
  searchBar:          { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a1a', paddingHorizontal: 15, borderRadius: 15, marginBottom: 20, height: 50 },
  searchInput:        { flex: 1, color: '#ecf2f3', marginLeft: 10 },
  sectionTitle:       { fontSize: 10, fontWeight: '800', color: '#6f787d', letterSpacing: 1.5, marginBottom: 12, marginTop: 4 },
  activityGrid:       { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  activityCard:       { width: '31%', backgroundColor: '#1a1a1a', borderRadius: 20, paddingVertical: 15, alignItems: 'center', borderWidth: 1, borderColor: 'transparent' },
  activityCardActive: { borderColor: '#baeaff', backgroundColor: 'rgba(186,234,255,0.05)' },
  activityLabel:      { fontSize: 9, fontWeight: '600', color: '#40494a', marginTop: 8, textAlign: 'center' },
  activityLabelActive:{ color: '#ecf2f3' },
  row:                { flexDirection: 'row', gap: 15, marginBottom: 20 },
  counterCard:        { backgroundColor: '#1a1a1a', borderRadius: 20, padding: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  roundBtn:           { width: 30, height: 30, borderRadius: 15, backgroundColor: '#252525', justifyContent: 'center', alignItems: 'center' },
  counterText:        { fontSize: 14, fontWeight: '800', color: '#baeaff' },
  timeCard:           { backgroundColor: '#1a1a1a', borderRadius: 20, paddingHorizontal: 15, height: 50, flexDirection: 'row', alignItems: 'center', gap: 10 },
  timeInput:          { color: '#ecf2f3', fontWeight: '700', fontSize: 16, flex: 1 },
  textAreaContainer:  { position: 'relative', marginBottom: 24 },
  textArea:           { backgroundColor: '#1a1a1a', borderRadius: 20, padding: 15, color: '#ecf2f3', minHeight: 100, textAlignVertical: 'top' },
  textAreaIcon:       { position: 'absolute', bottom: 15, right: 15 },
  saveBtn:            { backgroundColor: '#baeaff', paddingVertical: 18, borderRadius: 100, alignItems: 'center' },
  saveBtnText:        { color: '#121212', fontSize: 16, fontWeight: '800' },
});
