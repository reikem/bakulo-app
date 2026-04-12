import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, Modal, TextInput, Dimensions, Alert } from 'react-native';
import { Pill, Syringe, X } from 'lucide-react-native';
import { NotificationService } from '@/service/notificationService';

const { width } = Dimensions.get('window');

export const MedicationManager = () => {
  const [meds, setMeds] = useState([
    { id: 1, name: 'Metformina', hour: '12', active: true, type: 'Pill' }
  ]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'Pill', hour: '' });

  const saveMedication = async () => {
    if (!form.name || !form.hour) return Alert.alert("Faltan datos", "Por favor completa el nombre y las horas.");

    const newMed = { ...form, id: Date.now(), active: true };
    setMeds([...meds, newMed]);
    setModal(false);

    // Programar notificación (convertimos horas a segundos para la prueba)
    const intervalSeconds = parseInt(form.hour) * 3600;
    await NotificationService.schedule(
      `Hora de ${form.name}`,
      `Es momento de tu dosis programada.`,
      10 // 10 segundos para probar que llega
    );
  };

  return (
    <View>
      <View style={styles.header}>
        <Text style={styles.title}>Medicamentos</Text>
        <TouchableOpacity onPress={() => setModal(true)}><Text style={styles.addText}>+ Añadir</Text></TouchableOpacity>
      </View>

      <View style={styles.grid}>
        {meds.map((m) => (
          <View key={m.id} style={styles.card}>
            <View style={styles.rowBetween}>
              <View style={styles.iconBg}>{m.type === 'Pill' ? <Pill color="#baeaff" size={18}/> : <Syringe color="#baeaff" size={18}/>}</View>
              <Switch value={m.active} onValueChange={() => {}} trackColor={{ true: '#006782' }} />
            </View>
            <Text style={styles.name}>{m.name}</Text>
            <Text style={styles.desc}>Cada {m.hour}h</Text>
          </View>
        ))}
      </View>

      <Modal visible={modal} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={styles.content}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nuevo Medicamento</Text>
              <TouchableOpacity onPress={() => setModal(false)}><X color="#fff" /></TouchableOpacity>
            </View>
            <TextInput placeholder="Nombre" placeholderTextColor="#666" style={styles.input} onChangeText={t => setForm({...form, name: t})} />
            <TextInput placeholder="Frecuencia (Horas)" keyboardType="numeric" placeholderTextColor="#666" style={styles.input} onChangeText={t => setForm({...form, hour: t})} />
            
            <View style={styles.typeSelector}>
              <TouchableOpacity onPress={() => setForm({...form, type: 'Pill'})} style={[styles.typeBtn, form.type === 'Pill' && styles.activeType]}><Text style={styles.typeText}>Pastilla</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => setForm({...form, type: 'Injection'})} style={[styles.typeBtn, form.type === 'Injection' && styles.activeType]}><Text style={styles.typeText}>Inyección</Text></TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={saveMedication}>
              <Text style={styles.saveText}>Guardar y Activar Alerta</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, alignItems: 'center' },
  title: { color: '#fff', fontSize: 20, fontWeight: '800' },
  addText: { color: '#baeaff', fontWeight: '800' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: { width: (width - 60) / 2, backgroundColor: '#1a1a1a', padding: 18, borderRadius: 24 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  iconBg: { width: 36, height: 36, backgroundColor: '#004e63', borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  name: { color: '#fff', fontWeight: '700', fontSize: 15 },
  desc: { color: '#6f787d', fontSize: 11, marginTop: 2 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  content: { backgroundColor: '#1a1a1a', padding: 26, borderTopLeftRadius: 32, borderTopRightRadius: 32 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: '800' },
  input: { backgroundColor: '#242424', padding: 16, borderRadius: 12, color: '#fff', marginBottom: 12 },
  typeSelector: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  typeBtn: { flex: 1, padding: 12, borderRadius: 10, backgroundColor: '#242424', alignItems: 'center' },
  activeType: { backgroundColor: '#006782' },
  typeText: { color: '#fff', fontSize: 12 },
  saveBtn: { backgroundColor: '#baeaff', padding: 18, borderRadius: 14, alignItems: 'center' },
  saveText: { color: '#004e63', fontWeight: '800' }
});