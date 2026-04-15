import React, { useState } from 'react';
import { View, ScrollView, SafeAreaView, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Share2 } from 'lucide-react-native';
import { HeroDetailCard, NoteSection } from '@/components/ui/DetailComponents';
import { WeeklyChart, ActivityStatusSelector } from '@/components/ui/HistoryComponents';

export default function ExerciseDetails() {
  const router = useRouter();
  const { title, dateParam } = useLocalSearchParams();
  const [isDone, setIsDone] = useState(false);

  // Lógica de fechas
  const recordDate = dateParam ? new Date(dateParam as string) : new Date();
  const today = new Date();
  today.setHours(0,0,0,0);
  const isFuture = recordDate > today;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft color="#c4ebe0" size={24} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Actividad</Text>
        <Share2 color="#c4ebe0" size={22} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <HeroDetailCard 
          value="25" unit="min" 
          label={title || "Morning Walk"} 
          color="#42655d" icon="run" 
        />

        <ActivityStatusSelector 
          isDone={isDone} 
          isFuture={isFuture} 
          isToday={!isFuture} 
          onPress={() => setIsDone(!isDone)} 
        />

        <WeeklyChart 
          title="Esfuerzo Semanal"
          data={[
            { day: 'L', val: 40 }, { day: 'M', val: 70 }, { day: 'M', val: 50 },
            { day: 'J', val: 90 }, { day: 'V', val: 30 }, { day: 'S', val: 80 }, { day: 'D', val: 20 }
          ]} 
        />

        <NoteSection note="Caminata tranquila para mantener glucosa estable." />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#171d1e' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  backBtn: { padding: 8, backgroundColor: '#1d2426', borderRadius: 100 },
  navTitle: { color: '#c4ebe0', fontSize: 18, fontWeight: '700' },
});