import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  Image, SafeAreaView, Dimensions, ActivityIndicator, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { 
  ChevronLeft, Camera, Save, Utensils, 
  ChevronDown, Bell, User 
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';

const { width } = Dimensions.get('window');

// --- COMPONENTES FUNCIONALES INTERNOS ---

const PhotoUpload = ({ image, onPress, loading }: any) => (
  <TouchableOpacity style={photoStyles.container} onPress={onPress} activeOpacity={0.8}>
    {image ? (
      <Image source={{ uri: image }} style={photoStyles.image} />
    ) : (
      <LinearGradient colors={['#004e63', '#006782']} style={photoStyles.gradient}>
        <Camera color="#c4ebe0" size={32} />
        <Text style={photoStyles.text}>Subir Foto</Text>
      </LinearGradient>
    )}
    {loading && (
      <View style={photoStyles.loader}><ActivityIndicator color="#fff" /></View>
    )}
  </TouchableOpacity>
);

const MacroCard = ({ label, value, unit, color, onChange }: any) => (
  <View style={[styles.macroBox, { borderLeftColor: color }]}>
    <Text style={styles.macroLabelSmall}>{label}</Text>
    <View style={styles.macroValueRow}>
      <TextInput 
        style={styles.macroInput}
        keyboardType="numeric"
        value={value}
        onChangeText={onChange}
      />
      <Text style={[styles.macroUnit, { color }]}>{unit}</Text>
    </View>
  </View>
);

// --- PANTALLA PRINCIPAL ---

export default function FoodLogScreen() {
  const router = useRouter();
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: '',
    category: 'Desayuno',
    portion: '',
    carbs: '0',
    protein: '0',
    fat: '0',
    calories: '0'
  });

  // Lógica para abrir Cámara o Galería
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso denegado', 'Necesitamos acceso a tus fotos para esto.');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      simulateAIAnalysis(); // Dispara la simulación de carga
    }
  };

  const simulateAIAnalysis = () => {
    setLoading(true);
    setTimeout(() => {
      setForm({
        ...form,
        name: 'Bowl Saludable',
        carbs: '45',
        protein: '15',
        fat: '8',
        calories: '320'
      });
      setLoading(false);
    }, 1500);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* TopAppBar con Botón de BACK funcional */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <ChevronLeft color="#c4ebe0" size={24} />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Nueva Comida</Text>
        
        <TouchableOpacity style={styles.iconBtn}>
          <Bell color="#bfc8ca" size={22} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        {/* Photo Section usando tu componente PhotoUpload */}
        <View style={styles.heroSection}>
          <View style={styles.heroTextContainer}>
            <Text style={styles.heroTitle}>Visualiza tu plato</Text>
            <Text style={styles.heroSub}>
              Sube una foto para que nuestro algoritmo identifique los macros automáticamente.
            </Text>
          </View>
          
          <PhotoUpload 
            image={image} 
            onPress={pickImage} 
            loading={loading} 
          />
        </View>

        {/* Info Card */}
        <View style={styles.formCard}>
          <View style={styles.inputGroup}>
            <Text style={styles.fieldLabel}>NOMBRE DEL ALIMENTO</Text>
            <TextInput 
              style={styles.textInput}
              placeholder="Ej: Bowl de Avena"
              placeholderTextColor="#40484a"
              value={form.name}
              onChangeText={(v) => setForm({...form, name: v})}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.fieldLabel}>CATEGORÍA</Text>
              <View style={styles.pickerFake}>
                <Text style={styles.pickerText}>{form.category}</Text>
                <ChevronDown color="#40484a" size={18} />
              </View>
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.fieldLabel}>PORCIÓN</Text>
              <TextInput 
                style={styles.textInput}
                placeholder="200g"
                placeholderTextColor="#40484a"
                value={form.portion}
                onChangeText={(v) => setForm({...form, portion: v})}
              />
            </View>
          </View>
        </View>

        {/* Macros Grid */}
        <View style={styles.grid}>
          <MacroCard 
            label="CARBOHIDRATOS" 
            value={form.carbs} 
            unit="g" 
            color="#006782" 
            onChange={(v: string) => setForm({...form, carbs: v})} 
          />
          <MacroCard 
            label="PROTEÍNAS" 
            value={form.protein} 
            unit="g" 
            color="#c4ebe0" 
            onChange={(v: string) => setForm({...form, protein: v})} 
          />
          <MacroCard 
            label="GRASAS" 
            value={form.fat} 
            unit="g" 
            color="#a4f4b7" 
            onChange={(v: string) => setForm({...form, fat: v})} 
          />
          <View style={styles.caloriesCard}>
            <LinearGradient colors={['#004e63', '#006782']} style={styles.caloriesGradient}>
              <Text style={styles.caloriesLabel}>CALORÍAS</Text>
              <View style={styles.macroValueRow}>
                <TextInput 
                  style={styles.caloriesInput}
                  keyboardType="numeric"
                  value={form.calories}
                  onChangeText={(v) => setForm({...form, calories: v})}
                />
                <Text style={styles.caloriesUnit}>kcal</Text>
              </View>
            </LinearGradient>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.saveButton} 
          onPress={() => {
            Alert.alert("Éxito", "Comida guardada correctamente");
            router.back();
          }}
        >
          <Save color="#fff" size={20} fill="#fff" />
          <Text style={styles.saveButtonText}>Guardar Registro</Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// --- ESTILOS ---

const photoStyles = StyleSheet.create({
  container: { width: 120, height: 120, borderRadius: 32, overflow: 'hidden', backgroundColor: '#1d2426' },
  gradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  image: { width: '100%', height: '100%' },
  text: { color: '#c4ebe0', fontSize: 10, fontWeight: 'bold', marginTop: 5 },
  loader: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center' }
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#171d1e' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
    paddingVertical: 16,
    backgroundColor: '#1d2426'
  },
  backButton: { padding: 8, backgroundColor: '#171d1e', borderRadius: 12 },
  headerTitle: { color: '#c4ebe0', fontSize: 16, fontWeight: '800', fontFamily: 'Manrope' },
  iconBtn: { padding: 4 },
  scroll: { padding: 24 },
  heroSection: { flexDirection: 'row', alignItems: 'center', gap: 15, marginBottom: 32 },
  heroTextContainer: { flex: 1 },
  heroTitle: { color: 'white', fontSize: 22, fontWeight: '800', marginBottom: 4 },
  heroSub: { color: '#bfc8ca', fontSize: 13, opacity: 0.7 },
  formCard: { backgroundColor: '#1d2426', borderRadius: 24, padding: 20, gap: 15, marginBottom: 16 },
  inputGroup: { gap: 8 },
  fieldLabel: { color: '#c4ebe0', fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  textInput: { backgroundColor: '#171d1e', borderRadius: 14, padding: 14, color: 'white' },
  row: { flexDirection: 'row', gap: 12 },
  pickerFake: { backgroundColor: '#171d1e', borderRadius: 14, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pickerText: { color: 'white', fontSize: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  macroBox: { width: (width - 60) / 2, backgroundColor: '#1d2426', borderRadius: 24, padding: 18, borderLeftWidth: 4 },
  macroLabelSmall: { color: '#bfc8cd', fontSize: 9, fontWeight: '800', marginBottom: 6 },
  macroValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  macroInput: { color: 'white', fontSize: 28, fontWeight: '800', padding: 0, minWidth: 40 },
  macroUnit: { fontSize: 12, fontWeight: '700' },
  caloriesCard: { width: (width - 60) / 2, borderRadius: 24, overflow: 'hidden' },
  caloriesGradient: { flex: 1, padding: 18 },
  caloriesLabel: { color: '#c4ebe0', fontSize: 9, fontWeight: '800', marginBottom: 6 },
  caloriesInput: { color: 'white', fontSize: 28, fontWeight: '800', padding: 0, minWidth: 40 },
  caloriesUnit: { color: '#c4ebe0', fontSize: 12, fontWeight: '700' },
  saveButton: { 
    backgroundColor: '#004e63', flexDirection: 'row', alignItems: 'center', 
    justifyContent: 'center', padding: 20, borderRadius: 100, marginTop: 30, gap: 12 
  },
  saveButtonText: { color: 'white', fontSize: 16, fontWeight: '800' }
});