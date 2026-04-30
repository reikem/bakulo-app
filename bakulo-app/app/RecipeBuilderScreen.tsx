/**
 * RecipeBuilderScreen.tsx — v2
 * Crear receta personalizada con:
 *  - Foto de la receta (galería o cámara)
 *  - Datos básicos (nombre, categoría, tiempo, porciones)
 *  - Índice glucémico y dificultad
 *  - Ingredientes dinámicos (agregar/quitar)
 *  - Pasos de preparación (agregar/quitar)
 *  - Macros nutricionales
 *  - Tags personalizados
 *
 * FIX: reemplaza useAppStore().currentUser (no existe)
 *      por db_getCurrentUser() de database.ts
 */

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, SafeAreaView, Image, Alert, Modal,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import {
  ArrowLeft, Camera, Plus, X, ChefHat, Check, Clock,
} from 'lucide-react-native';
import { useRecipes, Recipe, RecipeCategory, Ingredient, RecipeStep } from '@/store/RecipeStore';
import { db_getCurrentUser } from '@/service/database';

// ─── OPCIONES ────────────────────────────────────────────────────────────────

const CATEGORIES: RecipeCategory[] = [
  'Desayuno','Almuerzo','Cena','Merienda','Ensalada','Sopa','Bebida','Postre Diabético',
];
const GI_OPTIONS   = ['Bajo','Medio','Alto'] as const;
const DIFF_OPTIONS = ['Fácil','Medio','Difícil'] as const;

const SUGGESTED_TAGS = [
  'sin azúcar','bajo carbono','alta proteína','vegetariano','sin gluten',
  'rápido','diabetes','fibra','bajo IG','sin lactosa',
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const uid = () => `${Date.now()}_${Math.random().toString(36).slice(2,5)}`;

// ─── CHIP SELECTOR ───────────────────────────────────────────────────────────

function ChipSelector<T extends string>({
  options, value, onChange, colorFn,
}: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  colorFn?: (v: T) => string;
}) {
  return (
    <View style={cs.row}>
      {options.map(opt => {
        const active = value === opt;
        const color  = colorFn?.(opt) ?? '#006782';
        return (
          <TouchableOpacity
            key={opt}
            style={[cs.chip, active && { backgroundColor: `${color}22`, borderColor: color }]}
            onPress={() => onChange(opt)}
          >
            <Text style={[cs.text, active && { color }]}>{opt}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const cs = StyleSheet.create({
  row:  { flexDirection:'row', flexWrap:'wrap', gap:8, marginTop:8 },
  chip: { paddingHorizontal:12, paddingVertical:6, borderRadius:100, borderWidth:1, borderColor:'rgba(255,255,255,0.1)', backgroundColor:'rgba(255,255,255,0.04)' },
  text: { color:'#6f787d', fontSize:12, fontWeight:'700' },
});

// ─── LABELED INPUT ────────────────────────────────────────────────────────────

function LabeledInput({ label, value, onChange, placeholder, numeric, multiline }: {
  label:string; value:string; onChange:(v:string)=>void;
  placeholder?:string; numeric?:boolean; multiline?:boolean;
}) {
  return (
    <View style={li.group}>
      <Text style={li.label}>{label}</Text>
      <TextInput
        style={[li.input, multiline && { height:80, textAlignVertical:'top' }]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#3f484c"
        keyboardType={numeric ? 'numeric' : 'default'}
        multiline={multiline}
      />
    </View>
  );
}

const li = StyleSheet.create({
  group: { marginBottom:14 },
  label: { color:'#6f787d', fontSize:10, fontWeight:'800', letterSpacing:1, marginBottom:6 },
  input: { backgroundColor:'#252d2f', borderRadius:14, padding:14, color:'white', fontSize:14 },
});

// ─── MAIN ─────────────────────────────────────────────────────────────────────

export default function RecipeBuilderScreen() {
  const router             = useRouter();
  const { addCustomRecipe } = useRecipes();
  const currentUser        = db_getCurrentUser();

  // Básicos
  const [title,       setTitle]       = useState('');
  const [description, setDescription] = useState('');
  const [imageUri,    setImageUri]    = useState('');
  const [category,    setCategory]    = useState<RecipeCategory>('Almuerzo');
  const [prepTime,    setPrepTime]    = useState('10');
  const [cookTime,    setCookTime]    = useState('20');
  const [servings,    setServings]    = useState('2');
  const [difficulty,  setDifficulty]  = useState<'Fácil'|'Medio'|'Difícil'>('Fácil');
  const [gi,          setGi]          = useState<'Bajo'|'Medio'|'Alto'>('Bajo');

  // Nutrición
  const [calories, setCalories] = useState('');
  const [carbs,    setCarbs]    = useState('');
  const [protein,  setProtein]  = useState('');
  const [fat,      setFat]      = useState('');
  const [fiber,    setFiber]    = useState('');

  // Ingredientes
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { id: uid(), name:'', amount:'', unit:'' },
  ]);

  // Pasos
  const [steps, setSteps] = useState<RecipeStep[]>([
    { number:1, instruction:'', duration:5 },
  ]);

  // Tags
  const [tags,     setTags]     = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  // UI
  const [saving,    setSaving]    = useState(false);
  const [activeTab, setActiveTab] = useState<'basic'|'ingredients'|'steps'|'nutrition'>('basic');

  // ── Foto ──────────────────────────────────────────────────────────────────
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permiso denegado'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect:[4,3], quality:0.8,
    });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permiso denegado'); return; }
    const result = await ImagePicker.launchCameraAsync({ allowsEditing:true, aspect:[4,3], quality:0.8 });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  };

  // ── Ingredientes ──────────────────────────────────────────────────────────
  const addIngredient = () => setIngredients(prev => [...prev, { id:uid(), name:'', amount:'', unit:'' }]);
  const updateIngredient = (id:string, field:keyof Ingredient, value:string) =>
    setIngredients(prev => prev.map(i => i.id===id ? { ...i, [field]:value } : i));
  const removeIngredient = (id:string) => {
    if (ingredients.length <= 1) return;
    setIngredients(prev => prev.filter(i => i.id!==id));
  };

  // ── Pasos ─────────────────────────────────────────────────────────────────
  const addStep = () => setSteps(prev => [...prev, { number:prev.length+1, instruction:'', duration:5 }]);
  const updateStep = (idx:number, field:keyof RecipeStep, value:any) =>
    setSteps(prev => prev.map((s,i) => i===idx ? { ...s, [field]:value } : s));
  const removeStep = (idx:number) => {
    if (steps.length <= 1) return;
    setSteps(prev => prev.filter((_,i)=>i!==idx).map((s,i)=>({...s,number:i+1})));
  };

  // ── Tags ──────────────────────────────────────────────────────────────────
  const addTag = (t:string) => {
    const clean = t.replace('#','').trim().toLowerCase();
    if (clean && !tags.includes(clean)) setTags(prev=>[...prev,clean]);
    setTagInput('');
  };
  const removeTag = (t:string) => setTags(prev=>prev.filter(x=>x!==t));

  // ── Guardar ───────────────────────────────────────────────────────────────
  const handleSave = () => {
    if (!title.trim()) { Alert.alert('Título requerido','Ponle un nombre a tu receta.'); return; }
    const validIngredients = ingredients.filter(i=>i.name.trim());
    if (validIngredients.length === 0) { Alert.alert('Ingredientes requeridos'); return; }
    const validSteps = steps.filter(s=>s.instruction.trim());
    if (validSteps.length === 0) { Alert.alert('Pasos requeridos'); return; }

    setSaving(true);
    const newRecipe = addCustomRecipe({
      title:         title.trim(),
      description:   description.trim() || `Receta de ${category} para personas con diabetes.`,
      imageUri:      imageUri || 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400',
      category,
      prepTime:      parseInt(prepTime) || 10,
      cookTime:      parseInt(cookTime) || 20,
      servings:      parseInt(servings) || 2,
      difficulty,
      glycemicIndex: gi,
      tags:          [...tags, category.toLowerCase(), 'diabetes'],
      calories:      parseInt(calories) || 200,
      carbs:         parseInt(carbs)    || 20,
      protein:       parseInt(protein)  || 15,
      fat:           parseInt(fat)      || 8,
      fiber:         parseInt(fiber)    || 3,
      ingredients:   validIngredients,
      steps:         validSteps,
      authorName:    currentUser?.displayName ?? 'Usuario',
      authorId:      currentUser?.id ?? 'local',
    });

    setSaving(false);
    Alert.alert(
      '✓ Receta Guardada',
      `"${newRecipe.title}" ha sido publicada en tus recetas.`,
      [
        { text: 'Ver Recetas', onPress: () => router.back() },
        { text: 'Seguir creando', style: 'cancel' },
      ]
    );
  };

  // ─── TABS ────────────────────────────────────────────────────────────────

  const TABS = [
    { id:'basic',       label:'Básico'       },
    { id:'ingredients', label:'Ingredientes' },
    { id:'steps',       label:'Pasos'        },
    { id:'nutrition',   label:'Nutrición'    },
  ] as const;

  // ─── RENDER ───────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <ArrowLeft color="#c4ebe0" size={22} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Nueva Receta</Text>
        <TouchableOpacity style={[s.saveBtn, saving && { opacity:0.5 }]} onPress={handleSave} disabled={saving}>
          <Check color="#003746" size={18}/>
          <Text style={s.saveBtnText}>Publicar</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={s.tabBar}>
        {TABS.map(t => (
          <TouchableOpacity
            key={t.id}
            style={[s.tab, activeTab===t.id && s.tabActive]}
            onPress={() => setActiveTab(t.id)}
          >
            <Text style={[s.tabText, activeTab===t.id && s.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':'height'} style={{ flex:1 }}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

          {/* ── TAB: BÁSICO ── */}
          {activeTab === 'basic' && (
            <>
              <TouchableOpacity style={s.photoBox} onPress={pickImage}>
                {imageUri ? (
                  <Image source={{ uri:imageUri }} style={s.photoPreview}/>
                ) : (
                  <View style={s.photoPlaceholder}>
                    <Camera color="#006782" size={32}/>
                    <Text style={s.photoText}>Agregar foto</Text>
                    <Text style={s.photoSub}>Toca para seleccionar de galería</Text>
                  </View>
                )}
                {imageUri && (
                  <View style={s.photoOverlay}>
                    <Camera color="white" size={20}/>
                    <Text style={s.photoOverlayText}>Cambiar foto</Text>
                  </View>
                )}
              </TouchableOpacity>
              {imageUri && (
                <TouchableOpacity style={s.cameraBtn} onPress={takePhoto}>
                  <Camera color="#86d0ef" size={15}/>
                  <Text style={s.cameraBtnText}>Tomar foto con cámara</Text>
                </TouchableOpacity>
              )}

              <LabeledInput label="NOMBRE DE LA RECETA *" value={title} onChange={setTitle} placeholder="Ej: Ensalada mediterránea diabética"/>
              <LabeledInput label="DESCRIPCIÓN" value={description} onChange={setDescription} placeholder="Describe brevemente tu receta..." multiline/>

              <Text style={s.sectionLabel}>CATEGORÍA</Text>
              <ChipSelector options={CATEGORIES} value={category} onChange={setCategory}/>

              <View style={s.row3}>
                <View style={{ flex:1 }}><LabeledInput label="PREP (MIN)" value={prepTime} onChange={setPrepTime} numeric/></View>
                <View style={{ flex:1 }}><LabeledInput label="COCCIÓN (MIN)" value={cookTime} onChange={setCookTime} numeric/></View>
                <View style={{ flex:1 }}><LabeledInput label="PORCIONES" value={servings} onChange={setServings} numeric/></View>
              </View>

              <Text style={s.sectionLabel}>DIFICULTAD</Text>
              <ChipSelector options={DIFF_OPTIONS} value={difficulty} onChange={setDifficulty}
                colorFn={v => v==='Fácil'?'#22c55e':v==='Medio'?'#f59e0b':'#ef4444'}/>

              <Text style={[s.sectionLabel,{marginTop:16}]}>ÍNDICE GLUCÉMICO</Text>
              <ChipSelector options={GI_OPTIONS} value={gi} onChange={setGi}
                colorFn={v => v==='Bajo'?'#22c55e':v==='Medio'?'#f59e0b':'#ef4444'}/>
              <Text style={s.giHint}>
                {gi==='Bajo' ? '✓ Ideal — mantiene glucosa estable' :
                 gi==='Medio'? '⚠ Acompañar con proteína' :
                 '⚠ Limitar porciones — monitorear glucosa'}
              </Text>

              <Text style={[s.sectionLabel,{marginTop:16}]}>ETIQUETAS</Text>
              <View style={s.tagInputRow}>
                <TextInput
                  style={s.tagInput}
                  value={tagInput}
                  onChangeText={setTagInput}
                  placeholder="Agregar etiqueta..."
                  placeholderTextColor="#3f484c"
                  onSubmitEditing={() => addTag(tagInput)}
                />
                <TouchableOpacity style={s.tagAddBtn} onPress={() => addTag(tagInput)}>
                  <Plus color="white" size={16}/>
                </TouchableOpacity>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical:8 }}>
                {SUGGESTED_TAGS.map(t => (
                  <TouchableOpacity key={t} style={s.suggestedTag} onPress={() => addTag(t)}>
                    <Text style={s.suggestedTagText}>+ {t}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <View style={s.tagsRow}>
                {tags.map(t => (
                  <View key={t} style={s.tagPill}>
                    <Text style={s.tagPillText}>#{t}</Text>
                    <TouchableOpacity onPress={() => removeTag(t)}><X color="#6f787d" size={12}/></TouchableOpacity>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* ── TAB: INGREDIENTES ── */}
          {activeTab === 'ingredients' && (
            <>
              <Text style={s.tabIntro}>Agrega todos los ingredientes con sus cantidades.</Text>
              {ingredients.map((ing, idx) => (
                <View key={ing.id} style={s.ingCard}>
                  <View style={s.ingNumCircle}><Text style={s.ingNum}>{idx+1}</Text></View>
                  <View style={s.ingFields}>
                    <TextInput
                      style={s.ingNameInput}
                      value={ing.name}
                      onChangeText={v => updateIngredient(ing.id,'name',v)}
                      placeholder="Nombre del ingrediente"
                      placeholderTextColor="#3f484c"
                    />
                    <View style={s.ingAmountRow}>
                      <TextInput
                        style={[s.ingAmountInput,{flex:1}]}
                        value={ing.amount}
                        onChangeText={v => updateIngredient(ing.id,'amount',v)}
                        placeholder="Cantidad"
                        placeholderTextColor="#3f484c"
                        keyboardType="numeric"
                      />
                      <TextInput
                        style={[s.ingAmountInput,{flex:1}]}
                        value={ing.unit}
                        onChangeText={v => updateIngredient(ing.id,'unit',v)}
                        placeholder="Unidad (g, ml...)"
                        placeholderTextColor="#3f484c"
                      />
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => removeIngredient(ing.id)} style={s.removeBtn}>
                    <X color="#6f787d" size={16}/>
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity style={s.addRowBtn} onPress={addIngredient}>
                <Plus color="#86d0ef" size={18}/>
                <Text style={s.addRowText}>Agregar ingrediente</Text>
              </TouchableOpacity>
            </>
          )}

          {/* ── TAB: PASOS ── */}
          {activeTab === 'steps' && (
            <>
              <Text style={s.tabIntro}>Describe el proceso paso a paso con tiempos estimados.</Text>
              {steps.map((step, idx) => (
                <View key={idx} style={s.stepCard}>
                  <View style={s.stepHeader}>
                    <View style={s.stepNumCircle}><Text style={s.stepNumText}>{step.number}</Text></View>
                    <Text style={s.stepLabel}>Paso {step.number}</Text>
                    <View style={s.stepTimeRow}>
                      <Clock color="#6f787d" size={13}/>
                      <TextInput
                        style={s.stepTimeInput}
                        value={String(step.duration ?? '')}
                        onChangeText={v => updateStep(idx,'duration',parseInt(v)||0)}
                        placeholder="0"
                        placeholderTextColor="#3f484c"
                        keyboardType="numeric"
                      />
                      <Text style={s.stepTimeLabel}>min</Text>
                    </View>
                    <TouchableOpacity onPress={() => removeStep(idx)} style={s.removeBtn}>
                      <X color="#6f787d" size={14}/>
                    </TouchableOpacity>
                  </View>
                  <TextInput
                    style={s.stepTextInput}
                    value={step.instruction}
                    onChangeText={v => updateStep(idx,'instruction',v)}
                    placeholder="Describe este paso con detalle..."
                    placeholderTextColor="#3f484c"
                    multiline
                    numberOfLines={3}
                  />
                </View>
              ))}
              <TouchableOpacity style={s.addRowBtn} onPress={addStep}>
                <Plus color="#86d0ef" size={18}/>
                <Text style={s.addRowText}>Agregar paso</Text>
              </TouchableOpacity>
            </>
          )}

          {/* ── TAB: NUTRICIÓN ── */}
          {activeTab === 'nutrition' && (
            <>
              <Text style={s.tabIntro}>Información nutricional por porción.</Text>
              <View style={s.macroGrid}>
                {[
                  { label:'CALORÍAS',       value:calories, set:setCalories, unit:'kcal', color:'#86d0ef' },
                  { label:'CARBOHIDRATOS',  value:carbs,    set:setCarbs,    unit:'g',    color:'#f9c74f' },
                  { label:'PROTEÍNA',       value:protein,  set:setProtein,  unit:'g',    color:'#22c55e' },
                  { label:'GRASA',          value:fat,      set:setFat,      unit:'g',    color:'#f59e0b' },
                  { label:'FIBRA',          value:fiber,    set:setFiber,    unit:'g',    color:'#a4f4b7' },
                ].map(({ label, value, set, unit, color }) => (
                  <View key={label} style={[s.macroCard, { borderTopColor:color }]}>
                    <Text style={s.macroLabel}>{label}</Text>
                    <View style={s.macroInputRow}>
                      <TextInput
                        style={[s.macroInput, { color }]}
                        value={value}
                        onChangeText={set}
                        placeholder="0"
                        placeholderTextColor="#3f484c"
                        keyboardType="numeric"
                      />
                      <Text style={[s.macroUnit, { color }]}>{unit}</Text>
                    </View>
                  </View>
                ))}
              </View>
              <View style={s.giReminder}>
                <Text style={s.giReminderTitle}>
                  💡 IG seleccionado: <Text style={{ color: gi==='Bajo'?'#22c55e':gi==='Medio'?'#f59e0b':'#ef4444' }}>{gi}</Text>
                </Text>
                <Text style={s.giReminderText}>Puedes cambiarlo en la pestaña "Básico"</Text>
              </View>
            </>
          )}

          <View style={{ height:60 }}/>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container:        { flex:1, backgroundColor:'#0f1316' },
  header:           { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:20, paddingVertical:14, borderBottomWidth:StyleSheet.hairlineWidth, borderBottomColor:'rgba(255,255,255,0.07)' },
  backBtn:          { padding:10, backgroundColor:'rgba(0,103,130,0.12)', borderRadius:12 },
  headerTitle:      { color:'#ecf2f3', fontSize:17, fontWeight:'800' },
  saveBtn:          { flexDirection:'row', alignItems:'center', gap:6, backgroundColor:'#c4ebe0', paddingHorizontal:16, paddingVertical:9, borderRadius:100 },
  saveBtnText:      { color:'#003746', fontWeight:'800', fontSize:13 },
  tabBar:           { flexDirection:'row', backgroundColor:'rgba(255,255,255,0.04)', marginHorizontal:20, marginTop:12, borderRadius:14, padding:4, gap:4 },
  tab:              { flex:1, paddingVertical:8, borderRadius:10, alignItems:'center' },
  tabActive:        { backgroundColor:'#006782' },
  tabText:          { color:'#6f787d', fontSize:11, fontWeight:'700' },
  tabTextActive:    { color:'white' },
  scroll:           { paddingHorizontal:20, paddingTop:16 },
  tabIntro:         { color:'#6f787d', fontSize:12, lineHeight:18, marginBottom:16, backgroundColor:'rgba(255,255,255,0.03)', borderRadius:12, padding:12 },
  sectionLabel:     { color:'#6f787d', fontSize:10, fontWeight:'800', letterSpacing:1, marginBottom:4 },
  row3:             { flexDirection:'row', gap:10 },
  giHint:           { color:'#6f787d', fontSize:11, marginTop:8, fontStyle:'italic' },
  photoBox:         { height:200, backgroundColor:'#1a1a1a', borderRadius:20, overflow:'hidden', marginBottom:16, borderWidth:1, borderColor:'rgba(255,255,255,0.06)' },
  photoPreview:     { width:'100%', height:'100%' },
  photoPlaceholder: { flex:1, alignItems:'center', justifyContent:'center', gap:8 },
  photoText:        { color:'#ecf2f3', fontSize:15, fontWeight:'700' },
  photoSub:         { color:'#6f787d', fontSize:12 },
  photoOverlay:     { position:'absolute', bottom:0, left:0, right:0, backgroundColor:'rgba(0,0,0,0.5)', flexDirection:'row', alignItems:'center', justifyContent:'center', gap:6, padding:10 },
  photoOverlayText: { color:'white', fontSize:12, fontWeight:'700' },
  cameraBtn:        { flexDirection:'row', alignItems:'center', gap:6, paddingVertical:8, marginBottom:14 },
  cameraBtnText:    { color:'#86d0ef', fontSize:12, fontWeight:'600' },
  tagInputRow:      { flexDirection:'row', gap:8 },
  tagInput:         { flex:1, backgroundColor:'#252d2f', borderRadius:12, padding:12, color:'white', fontSize:14 },
  tagAddBtn:        { width:44, height:44, borderRadius:12, backgroundColor:'#006782', alignItems:'center', justifyContent:'center' },
  suggestedTag:     { paddingHorizontal:10, paddingVertical:5, backgroundColor:'rgba(0,103,130,0.12)', borderRadius:100, marginRight:6, borderWidth:1, borderColor:'rgba(0,103,130,0.2)' },
  suggestedTagText: { color:'#86d0ef', fontSize:11, fontWeight:'600' },
  tagsRow:          { flexDirection:'row', flexWrap:'wrap', gap:6, marginTop:4 },
  tagPill:          { flexDirection:'row', alignItems:'center', gap:5, backgroundColor:'rgba(134,208,239,0.1)', paddingHorizontal:10, paddingVertical:5, borderRadius:100 },
  tagPillText:      { color:'#86d0ef', fontSize:12, fontWeight:'600' },
  ingCard:          { flexDirection:'row', alignItems:'flex-start', gap:10, backgroundColor:'#1a1a1a', borderRadius:16, padding:14, marginBottom:10 },
  ingNumCircle:     { width:26, height:26, borderRadius:13, backgroundColor:'rgba(0,103,130,0.2)', alignItems:'center', justifyContent:'center', marginTop:2 },
  ingNum:           { color:'#86d0ef', fontSize:11, fontWeight:'800' },
  ingFields:        { flex:1, gap:8 },
  ingNameInput:     { backgroundColor:'#252d2f', borderRadius:10, padding:10, color:'white', fontSize:14 },
  ingAmountRow:     { flexDirection:'row', gap:8 },
  ingAmountInput:   { backgroundColor:'#252d2f', borderRadius:10, padding:10, color:'white', fontSize:13 },
  removeBtn:        { padding:6, marginTop:2 },
  addRowBtn:        { flexDirection:'row', alignItems:'center', justifyContent:'center', gap:8, borderWidth:1.5, borderColor:'rgba(134,208,239,0.2)', borderStyle:'dashed', borderRadius:14, paddingVertical:14, marginTop:4, marginBottom:20 },
  addRowText:       { color:'#86d0ef', fontSize:14, fontWeight:'700' },
  stepCard:         { backgroundColor:'#1a1a1a', borderRadius:18, padding:14, marginBottom:12, borderLeftWidth:3, borderLeftColor:'#006782' },
  stepHeader:       { flexDirection:'row', alignItems:'center', gap:8, marginBottom:10 },
  stepNumCircle:    { width:26, height:26, borderRadius:13, backgroundColor:'#006782', alignItems:'center', justifyContent:'center' },
  stepNumText:      { color:'white', fontSize:11, fontWeight:'800' },
  stepLabel:        { flex:1, color:'#86d0ef', fontSize:12, fontWeight:'700' },
  stepTimeRow:      { flexDirection:'row', alignItems:'center', gap:4 },
  stepTimeInput:    { backgroundColor:'#252d2f', borderRadius:8, padding:6, color:'white', fontSize:13, width:40, textAlign:'center' },
  stepTimeLabel:    { color:'#6f787d', fontSize:11 },
  stepTextInput:    { backgroundColor:'#252d2f', borderRadius:12, padding:12, color:'white', fontSize:14, textAlignVertical:'top', minHeight:72 },
  macroGrid:        { flexDirection:'row', flexWrap:'wrap', gap:10 },
  macroCard:        { width:'47%', backgroundColor:'#1a1a1a', borderRadius:16, padding:14, borderTopWidth:3 },
  macroLabel:       { color:'#6f787d', fontSize:9, fontWeight:'800', letterSpacing:0.8, marginBottom:8 },
  macroInputRow:    { flexDirection:'row', alignItems:'baseline', gap:4 },
  macroInput:       { fontSize:28, fontWeight:'800', flex:1, padding:0 },
  macroUnit:        { fontSize:13, fontWeight:'700' },
  giReminder:       { backgroundColor:'rgba(255,255,255,0.04)', borderRadius:16, padding:14, marginTop:12 },
  giReminderTitle:  { color:'#ecf2f3', fontSize:14, fontWeight:'700', marginBottom:4 },
  giReminderText:   { color:'#6f787d', fontSize:12 },
});