import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity, 
  TextInput, ScrollView, Alert, Platform 
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Settings, Bluetooth, Edit3, Save } from 'lucide-react-native';
import { GlucoseScanner } from '@/components/ui/GlucoseScanner';

export default function LogGlucoseScreen() {
  const router = useRouter();
  const isWeb = Platform.OS === 'web';

  // Estados
  const [isManual, setIsManual] = useState(isWeb); 
  const [isScanning, setIsScanning] = useState(false);
  const [glucoseValue, setGlucoseValue] = useState('');

  // Simulación de conexión (Aquí conectarías con BLE / NFC real)
  const startConnection = async () => {
    if (isWeb) return;

    setIsScanning(true);
    
    // Simulamos un proceso de búsqueda de 3 segundos
    setTimeout(() => {
      const success = Math.random() > 0.3; // 70% probabilidad de éxito para el ejemplo

      if (success) {
        setGlucoseValue('106'); // Valor de ejemplo del Accu-Chek
        setIsScanning(false);
        Alert.alert("Sincronizado", "Lectura obtenida correctamente del dispositivo.");
      } else {
        setIsScanning(false);
        Alert.alert(
          "Error de Conexión",
          "No se detectó ningún dispositivo Bluetooth o NFC compatible. ¿Deseas ingresar el dato manualmente?",
          [
            { text: "Reintentar", onPress: () => startConnection() },
            { text: "Modo Manual", onPress: () => setIsManual(true) }
          ]
        );
      }
    }, 3000);
  };

  const handleSave = () => {
    if (!glucoseValue) {
      Alert.alert("Error", "Por favor ingresa o escanea un valor.");
      return;
    }
    Alert.alert("Registro Guardado", `Valor: ${glucoseValue} mg/dL`);
    // Aquí iría tu lógica de guardado en base de datos
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <ArrowLeft color="#006782" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Registrar Glucosa</Text>
        <TouchableOpacity style={styles.iconBtn}>
          <Settings color="#006782" size={24} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Selector de modo (Oculto en Web) */}
        {!isWeb && (
          <View style={styles.toggleContainer}>
            <TouchableOpacity 
              style={[styles.toggleBtn, !isManual && styles.toggleActive]} 
              onPress={() => setIsManual(false)}
            >
              <Bluetooth color={!isManual ? "white" : "#6f787d"} size={20} />
              <Text style={[styles.toggleText, !isManual && styles.textWhite]}>Dispositivo</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.toggleBtn, isManual && styles.toggleActive]} 
              onPress={() => setIsManual(true)}
            >
              <Edit3 color={isManual ? "white" : "#6f787d"} size={20} />
              <Text style={[styles.toggleText, isManual && styles.textWhite]}>Manual</Text>
            </TouchableOpacity>
          </View>
        )}

        {isWeb && (
          <View style={styles.webWarning}>
            <Text style={styles.webWarningText}>Modo Web: Solo entrada manual disponible</Text>
          </View>
        )}

        {/* Área Central Dinámica */}
        <View style={styles.centralArea}>
          {!isManual ? (
            <GlucoseScanner 
              isScanning={isScanning} 
              onScanPress={startConnection} 
              glucoseValue={glucoseValue} 
            />
          ) : (
            <View style={styles.manualView}>
              <Text style={styles.inputLabel}>NIVEL MG/DL</Text>
              <TextInput
                style={styles.hugeInput}
                placeholder="000"
                placeholderTextColor="rgba(255,255,255,0.05)"
                keyboardType="numeric"
                value={glucoseValue}
                onChangeText={setGlucoseValue}
                autoFocus={isManual}
              />
            </View>
          )}
        </View>

        {/* Botón de Guardado */}
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Save color="white" size={24} />
          <Text style={styles.saveBtnText}>Guardar Registro</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121617' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  headerTitle: { color: 'white', fontSize: 20, fontWeight: '800' },
  iconBtn: { padding: 10, backgroundColor: '#1d2426', borderRadius: 14 },
  scroll: { paddingHorizontal: 24, paddingBottom: 40 },
  toggleContainer: { 
    flexDirection: 'row', backgroundColor: '#1d2426', 
    padding: 6, borderRadius: 100, marginBottom: 30, marginTop: 10 
  },
  toggleBtn: { 
    flex: 1, flexDirection: 'row', alignItems: 'center', 
    justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 100 
  },
  toggleActive: { backgroundColor: '#006782' },
  toggleText: { color: '#6f787d', fontWeight: '700' },
  textWhite: { color: 'white' },
  webWarning: { backgroundColor: 'rgba(0,103,130,0.1)', padding: 10, borderRadius: 8, marginBottom: 20 },
  webWarningText: { color: '#86d0ef', textAlign: 'center', fontSize: 12, fontWeight: '600' },
  centralArea: { minHeight: 350, justifyContent: 'center', alignItems: 'center' },
  manualView: { alignItems: 'center', width: '100%' },
  inputLabel: { color: '#006782', fontSize: 14, fontWeight: '900', letterSpacing: 3, marginBottom: 10 },
  hugeInput: { fontSize: 120, color: 'white', fontWeight: '800', textAlign: 'center' },
  saveBtn: { 
    backgroundColor: '#006782', flexDirection: 'row', alignItems: 'center', 
    justifyContent: 'center', gap: 12, padding: 22, borderRadius: 24, marginTop: 20 
  },
  saveBtnText: { color: 'white', fontSize: 18, fontWeight: '800' }
});