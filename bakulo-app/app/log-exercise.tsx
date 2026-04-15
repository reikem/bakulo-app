import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, SafeAreaView, StatusBar
} from 'react-native';
import { useRouter } from 'expo-router';
import { 
  ArrowLeft, Footprints, Activity, Bike, Waves, Flower, 
  Dumbbell, Minus, Plus, Search, Clock, Home, FileEdit,
  Trophy // Usaremos este para artes marciales si no hay iconos específicos
} from 'lucide-react-native';

export default function LogExerciseScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [activity, setActivity] = useState('Gym');
  const [duration, setDuration] = useState(30);
  const [notes, setNotes] = useState('');
  const [time, setTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

  const allActivities = [
    { id: 'Gym', icon: Dumbbell, label: 'Gym / Machine' },
    { id: 'Home', icon: Home, label: 'At Home' },
    { id: 'Walking', icon: Footprints, label: 'Walking' },
    { id: 'Running', icon: Activity, label: 'Running' },
    { id: 'Cycling', icon: Bike, label: 'Cycling' },
    { id: 'Yoga', icon: Flower, label: 'Yoga' },
    { id: 'Swimming', icon: Waves, label: 'Swimming' },
    { id: 'Futbol', icon: Activity, label: 'Futbol' },
    { id: 'Basquet', icon: Activity, label: 'Basketball' },
    { id: 'Beisbol', icon: Activity, label: 'Baseball' },
    { id: 'Karate', icon: Trophy, label: 'Karate' },
    { id: 'Judo', icon: Trophy, label: 'Judo' },
  ];

  const filteredActivities = allActivities.filter(a => 
    a.label.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = () => {
    const newLog = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'exercise',
      title: activity, // El nombre del deporte aparecerá como título
      desc: notes || 'No extra notes', // Las notas aparecen como descripción secundaria
      value: duration.toString(),
      unit: 'min',
      time: time,
      color: '#a4f4b7'
    };
  
    router.push({
      pathname: '/history',
      params: { newLog: JSON.stringify(newLog) }
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <ArrowLeft color="#baeaff" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Log Exercise</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Buscador */}
        <View style={styles.searchBar}>
          <Search color="#6f787d" size={20} />
          <TextInput 
            placeholder="Search sports or exercises..." 
            placeholderTextColor="#6f787d" 
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Rejilla de Actividades */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SELECT ACTIVITY</Text>
          <View style={styles.activityGrid}>
            {filteredActivities.map((item) => (
              <TouchableOpacity
                key={item.id}
                onPress={() => setActivity(item.label)}
                style={[styles.activityCard, activity === item.label && styles.activityCardActive]}
              >
                <item.icon size={26} color={activity === item.label ? "#baeaff" : "#40494a"} />
                <Text style={[styles.activityLabel, activity === item.label && styles.activityLabelActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Duración y Hora */}
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>DURATION</Text>
            <View style={styles.counterCard}>
              <TouchableOpacity onPress={() => setDuration(Math.max(5, duration - 5))} style={styles.roundBtn}>
                <Minus color="#baeaff" size={18}/>
              </TouchableOpacity>
              <Text style={styles.counterText}>{duration}</Text>
              <TouchableOpacity onPress={() => setDuration(duration + 5)} style={styles.roundBtn}>
                <Plus color="#baeaff" size={18}/>
              </TouchableOpacity>
            </View>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>TIME</Text>
            <View style={styles.timeCard}>
              <Clock color="#baeaff" size={18} />
              <TextInput 
                style={styles.timeInput}
                value={time}
                onChangeText={setTime}
                placeholder="00:00"
                placeholderTextColor="#40494a"
              />
            </View>
          </View>
        </View>

        {/* Campo de Notas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>EXERCISE NOTES</Text>
          <View style={styles.textAreaContainer}>
            <TextInput 
              multiline 
              placeholder="How did you feel? (e.g. High intensity, tired...)" 
              placeholderTextColor="#40494a" 
              style={styles.textArea}
              value={notes}
              onChangeText={setNotes}
            />
            <FileEdit color="#40494a" size={18} style={styles.textAreaIcon} />
          </View>
        </View>

        <TouchableOpacity style={styles.primaryBtn} onPress={handleSave}>
          <Text style={styles.primaryBtnText}>Save Activity</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#baeaff' },
  iconBtn: { padding: 10, backgroundColor: '#1a1a1a', borderRadius: 12 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 40 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a1a', paddingHorizontal: 15, borderRadius: 15, marginBottom: 20, height: 50 },
  searchInput: { flex: 1, color: '#ecf2f3', marginLeft: 10 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 10, fontWeight: '800', color: '#6f787d', letterSpacing: 1.5, marginBottom: 12 },
  activityGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  activityCard: { width: '31%', backgroundColor: '#1a1a1a', borderRadius: 20, paddingVertical: 15, alignItems: 'center', borderWidth: 1, borderColor: 'transparent' },
  activityCardActive: { borderColor: '#baeaff', backgroundColor: 'rgba(186, 234, 255, 0.05)' },
  activityLabel: { fontSize: 9, fontWeight: '600', color: '#40494a', marginTop: 8, textAlign: 'center' },
  activityLabelActive: { color: '#ecf2f3' },
  row: { flexDirection: 'row', gap: 15, marginBottom: 20 },
  counterCard: { backgroundColor: '#1a1a1a', borderRadius: 20, padding: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  roundBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#252525', justifyContent: 'center', alignItems: 'center' },
  counterText: { fontSize: 20, fontWeight: '800', color: '#baeaff' },
  timeCard: { backgroundColor: '#1a1a1a', borderRadius: 20, paddingHorizontal: 15, height: 50, flexDirection: 'row', alignItems: 'center', gap: 10 },
  timeInput: { color: '#ecf2f3', fontWeight: '700', fontSize: 16, flex: 1 },
  textAreaContainer: { position: 'relative' },
  textArea: { backgroundColor: '#1a1a1a', borderRadius: 20, padding: 15, color: '#ecf2f3', minHeight: 100, textAlignVertical: 'top' },
  textAreaIcon: { position: 'absolute', bottom: 15, right: 15 },
  primaryBtn: { backgroundColor: '#baeaff', paddingVertical: 18, borderRadius: 100, alignItems: 'center', marginTop: 10 },
  primaryBtnText: { color: '#121212', fontSize: 16, fontWeight: '800' },
});