import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, MoreVertical, Edit2, Trash2 } from 'lucide-react-native';
import { HeroDetailCard, BentoStat, NoteSection } from '@/components/ui/DetailComponents';

export default function GlucoseDetail() {
  const router = useRouter();
  const { value, time } = useLocalSearchParams();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft color="#c4ebe0" size={24} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Detalle de Glucosa</Text>
        <TouchableOpacity style={styles.iconBtn}><MoreVertical color="#c4ebe0" size={24} /></TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <HeroDetailCard 
          value={value || "114"} 
          unit="mg/dL" 
          label="Glucosa Actual" 
          subtitle="Rango óptimo (70-140)"
          color="#004e63"
          icon="water"
        />

        <View style={styles.grid}>
          <BentoStat label="Fecha" value="4 de Oct." subValue="2023" icon="calendar" color="#c4ebe0" />
          <BentoStat label="Hora" value={time || "08:30 AM"} subValue="Ayunas" icon="clock-outline" color="#86d0ef" />
        </View>

        <NoteSection note="Ayunas, me siento estable" />

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.editBtn}>
            <Edit2 color="white" size={20} style={{marginRight: 8}}/>
            <Text style={styles.btnText}>Editar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteBtn}>
            <Trash2 color="#ff9e9e" size={20} style={{marginRight: 8}}/>
            <Text style={[styles.btnText, {color: '#ff9e9e'}]}>Eliminar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#171d1e' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  backBtn: { padding: 8, backgroundColor: '#1d2426', borderRadius: 100 },
  iconBtn: { padding: 8 },
  navTitle: { color: '#c4ebe0', fontSize: 18, fontWeight: '700' },
  scroll: { padding: 20 },
  grid: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 30 },
  editBtn: { flex: 1, backgroundColor: '#004e63', flexDirection: 'row', padding: 18, borderRadius: 100, justifyContent: 'center', alignItems: 'center' },
  deleteBtn: { flex: 1, borderWidth: 1, borderColor: 'rgba(255, 158, 158, 0.3)', flexDirection: 'row', padding: 18, borderRadius: 100, justifyContent: 'center', alignItems: 'center' },
  btnText: { color: 'white', fontWeight: '800' }
});