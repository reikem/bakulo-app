/**
 * FoodLogScreen.tsx — v2
 * Guarda comidas en AppStore y dispara notificación interna.
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  Image, SafeAreaView, Dimensions, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, Camera, Save, ChevronDown, Bell } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useAppStore } from '@/store/AppStore';


const { width } = Dimensions.get('window');

const CATEGORIES = ['Desayuno','Almuerzo','Cena','Merienda','Snack'];

const PhotoUpload = ({ image, onPress, loading }: any) => (
  <TouchableOpacity style={ps.container} onPress={onPress} activeOpacity={0.8}>
    {image ? (
      <Image source={{ uri: image }} style={ps.image} />
    ) : (
      <LinearGradient colors={['#004e63','#006782']} style={ps.gradient}>
        <Camera color="#c4ebe0" size={32} />
        <Text style={ps.text}>Subir Foto</Text>
      </LinearGradient>
    )}
    {loading && (
      <View style={ps.loader}><ActivityIndicator color="#fff" /></View>
    )}
  </TouchableOpacity>
);

const ps = StyleSheet.create({
  container: { width: 120, height: 120, borderRadius: 32, overflow: 'hidden', backgroundColor: '#1d2426' },
  gradient:  { flex: 1, justifyContent: 'center', alignItems: 'center' },
  image:     { width: '100%', height: '100%' },
  text:      { color: '#c4ebe0', fontSize: 10, fontWeight: 'bold', marginTop: 5 },
  loader:    { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center' },
});

export default function FoodLogScreen() {
  const router = useRouter();
  const { addMealEntry } = useAppStore();

  const [image,   setImage]   = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCatPicker, setShowCatPicker] = useState(false);

  const [form, setForm] = useState({
    name: '', category: 'Desayuno', portion: '',
    carbs: '0', protein: '0', fat: '0', calories: '0',
  });

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permiso denegado'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1,1], quality: 0.7,
    });
    if (!result.canceled) {
      setImage(result.assets[0].uri);
      simulateAI();
    }
  };

  const simulateAI = () => {
    setLoading(true);
    setTimeout(() => {
      setForm(f => ({ ...f, name: 'Bowl Saludable', carbs: '45', protein: '15', fat: '8', calories: '320' }));
      setLoading(false);
    }, 1500);
  };

  const handleSave = () => {
    if (!form.name) { Alert.alert('Nombre requerido', 'Ingresa el nombre del alimento.'); return; }
    addMealEntry({
      name:      form.name,
      category:  form.category,
      calories:  parseInt(form.calories) || 0,
      carbs:     parseInt(form.carbs)    || 0,
      protein:   parseInt(form.protein)  || 0,
      fat:       parseInt(form.fat)      || 0,
      imageUri:  image || undefined,
      timestamp: new Date(),
    });
    Alert.alert('✓ Guardado', `${form.name} registrado`, [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity style={s.backButton} onPress={() => router.back()}>
          <ChevronLeft color="#c4ebe0" size={24} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Nueva Comida</Text>
        <TouchableOpacity style={s.iconBtn}>
          <Bell color="#bfc8ca" size={22} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={s.heroSection}>
          <View style={s.heroText}>
            <Text style={s.heroTitle}>Visualiza tu plato</Text>
            <Text style={s.heroSub}>Sube una foto para identificar macros automáticamente.</Text>
          </View>
          <PhotoUpload image={image} onPress={pickImage} loading={loading} />
        </View>

        {/* Formulario */}
        <View style={s.formCard}>
          <View style={s.inputGroup}>
            <Text style={s.fieldLabel}>NOMBRE DEL ALIMENTO</Text>
            <TextInput
              style={s.textInput}
              placeholder="Ej: Bowl de Avena"
              placeholderTextColor="#40484a"
              value={form.name}
              onChangeText={v => setForm(f => ({ ...f, name: v }))}
            />
          </View>

          <View style={s.row}>
            {/* Categoría */}
            <View style={[s.inputGroup, { flex: 1 }]}>
              <Text style={s.fieldLabel}>CATEGORÍA</Text>
              <TouchableOpacity style={s.pickerFake} onPress={() => setShowCatPicker(v => !v)}>
                <Text style={s.pickerText}>{form.category}</Text>
                <ChevronDown color="#40484a" size={18} />
              </TouchableOpacity>
              {showCatPicker && (
                <View style={s.dropdown}>
                  {CATEGORIES.map(cat => (
                    <TouchableOpacity
                      key={cat}
                      style={s.dropdownItem}
                      onPress={() => { setForm(f => ({ ...f, category: cat })); setShowCatPicker(false); }}
                    >
                      <Text style={[s.dropdownText, form.category === cat && { color: '#86d0ef' }]}>{cat}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
            <View style={[s.inputGroup, { flex: 1 }]}>
              <Text style={s.fieldLabel}>PORCIÓN</Text>
              <TextInput
                style={s.textInput}
                placeholder="200g"
                placeholderTextColor="#40484a"
                value={form.portion}
                onChangeText={v => setForm(f => ({ ...f, portion: v }))}
              />
            </View>
          </View>
        </View>

        {/* Macros */}
        <View style={s.grid}>
          {([
            { key: 'carbs',   label: 'CARBOHIDRATOS', unit: 'g',    color: '#006782'  },
            { key: 'protein', label: 'PROTEÍNAS',      unit: 'g',    color: '#c4ebe0'  },
            { key: 'fat',     label: 'GRASAS',          unit: 'g',    color: '#a4f4b7'  },
          ] as const).map(({ key, label, unit, color }) => (
            <View key={key} style={[s.macroBox, { borderLeftColor: color }]}>
              <Text style={s.macroLabel}>{label}</Text>
              <View style={s.macroRow}>
                <TextInput
                  style={s.macroInput}
                  keyboardType="numeric"
                  value={form[key]}
                  onChangeText={v => setForm(f => ({ ...f, [key]: v }))}
                />
                <Text style={[s.macroUnit, { color }]}>{unit}</Text>
              </View>
            </View>
          ))}

          {/* Calorías */}
          <View style={[s.macroBox, { borderLeftColor: '#f9c74f', width: '100%' }]}>
            <Text style={[s.macroLabel, { color: '#f9c74f' }]}>CALORÍAS TOTALES</Text>
            <View style={s.macroRow}>
              <TextInput
                style={s.macroInput}
                keyboardType="numeric"
                value={form.calories}
                onChangeText={v => setForm(f => ({ ...f, calories: v }))}
              />
              <Text style={[s.macroUnit, { color: '#f9c74f' }]}>kcal</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={s.saveButton} onPress={handleSave}>
          <Save color="#fff" size={20} />
          <Text style={s.saveButtonText}>Guardar Registro</Text>
        </TouchableOpacity>

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#171d1e' },
  header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#1d2426' },
  backButton:     { padding: 8, backgroundColor: '#171d1e', borderRadius: 12 },
  headerTitle:    { color: '#c4ebe0', fontSize: 16, fontWeight: '800' },
  iconBtn:        { padding: 4 },
  scroll:         { padding: 24 },
  heroSection:    { flexDirection: 'row', alignItems: 'center', gap: 15, marginBottom: 32 },
  heroText:       { flex: 1 },
  heroTitle:      { color: 'white', fontSize: 22, fontWeight: '800', marginBottom: 4 },
  heroSub:        { color: '#bfc8ca', fontSize: 13, opacity: 0.7 },
  formCard:       { backgroundColor: '#1d2426', borderRadius: 24, padding: 20, gap: 15, marginBottom: 16 },
  inputGroup:     { gap: 8 },
  fieldLabel:     { color: '#c4ebe0', fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  textInput:      { backgroundColor: '#171d1e', borderRadius: 14, padding: 14, color: 'white' },
  row:            { flexDirection: 'row', gap: 12 },
  pickerFake:     { backgroundColor: '#171d1e', borderRadius: 14, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pickerText:     { color: 'white', fontSize: 14 },
  dropdown:       { backgroundColor: '#252d2f', borderRadius: 12, marginTop: 4, overflow: 'hidden' },
  dropdownItem:   { paddingHorizontal: 16, paddingVertical: 12 },
  dropdownText:   { color: '#ecf2f3', fontSize: 14 },
  grid:           { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  macroBox:       { width: (width - 60) / 2, backgroundColor: '#1d2426', borderRadius: 20, padding: 16, borderLeftWidth: 3 },
  macroLabel:     { color: '#bfc8cd', fontSize: 9, fontWeight: '800', marginBottom: 6 },
  macroRow:       { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  macroInput:     { color: 'white', fontSize: 28, fontWeight: '800', padding: 0, minWidth: 40 },
  macroUnit:      { fontSize: 12, fontWeight: '700' },
  saveButton:     { backgroundColor: '#004e63', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 20, borderRadius: 100, marginTop: 10, gap: 12 },
  saveButtonText: { color: 'white', fontSize: 16, fontWeight: '800' },
});
