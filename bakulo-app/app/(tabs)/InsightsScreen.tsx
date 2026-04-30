/**
 * InsightsScreen.tsx — v3 completo
 * Conectado a:
 *  - RecipeStore (TheMealDB API gratuita) para recetas del día
 *  - AppStore para consejos personalizados según glucosa actual
 *  - Artículos de salud con detalle expandible
 */

import React, { useState, useEffect } from 'react';
import {
  View, ScrollView, Text, StyleSheet, SafeAreaView,
  TouchableOpacity, Image, ActivityIndicator, RefreshControl,
  Modal, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ArrowLeft, Wind, Zap, Lightbulb, User, ChevronRight,
  Heart, Clock, Flame, BookOpen, TrendingUp, RefreshCw,
  X, CheckCircle2,
} from 'lucide-react-native';
import { useRecipes, Recipe } from '@/store/RecipeStore';
import { useAppStore, getGlucoseRange } from '@/store/AppStore';

// ─── ARTÍCULOS ────────────────────────────────────────────────────────────────

const ARTICLES = [
  {
    id: 'a1',
    title: 'Índice Glucémico: Guía Completa',
    tag: 'NUTRICIÓN',
    readTime: '5 min',
    imageUri: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400',
    color: '#004e63',
    content: [
      'El Índice Glucémico (IG) mide la velocidad con que los alimentos elevan el azúcar en sangre en una escala del 0 al 100.',
      'Alimentos con IG bajo (≤55): legumbres, verduras, la mayoría de frutas, lácteos y cereales integrales. Son ideales para personas con diabetes porque generan subidas lentas y sostenidas.',
      'Alimentos con IG medio (56–69): arroz integral, plátano maduro, pan de trigo integral. Se pueden consumir con moderación combinados con proteína o grasa saludable.',
      'Alimentos con IG alto (≥70): pan blanco, arroz blanco, patatas, azúcar. Elevan la glucosa rápidamente y deben limitarse o acompañarse siempre de fibra y proteína.',
      'Truco práctico: combinar un alimento de IG alto con uno de IG bajo (ej. arroz blanco + lentejas) reduce el IG global de la comida en un 20–30%.',
    ],
    tips: ['Elige pasta al dente en lugar de muy cocida', 'Refrigera y recalienta el arroz reduce su IG', 'Come las frutas enteras, no en jugo'],
  },
  {
    id: 'a2',
    title: 'Ejercicio y Diabetes Tipo 2',
    tag: 'ACTIVIDAD FÍSICA',
    readTime: '4 min',
    imageUri: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400',
    color: '#1a6c3c',
    content: [
      'El ejercicio regular es uno de los pilares más importantes del manejo de la diabetes tipo 2. Mejora la sensibilidad a la insulina y reduce la hemoglobina glicosilada (HbA1c).',
      'Ejercicio aeróbico (caminar, ciclismo, natación): reduce la glucosa en sangre durante e inmediatamente después. Se recomiendan al menos 150 minutos por semana.',
      'Ejercicio de fuerza (pesas, resistencia): aumenta la masa muscular, que actúa como depósito de glucosa. 2–3 sesiones por semana son ideales.',
      'El mejor momento para ejercitarse es 1–2 horas después de comer, cuando la glucosa postprandial está elevada. Una caminata de 10 minutos reduce los picos glucémicos hasta un 20%.',
      'Precaución: el ejercicio intenso puede elevar temporalmente la glucosa por liberación de cortisol. Monitorea antes, durante y después si practicas deportes de alta intensidad.',
    ],
    tips: ['Lleva siempre algo dulce por si hay hipoglucemia', 'Hidratarse bien mejora el rendimiento glucémico', 'Registra cómo cambia tu glucosa con cada tipo de ejercicio'],
  },
  {
    id: 'a3',
    title: 'Medicamentos para Diabetes: Lo que debes saber',
    tag: 'MEDICACIÓN',
    readTime: '6 min',
    imageUri: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400',
    color: '#7c3aed',
    content: [
      'Los medicamentos para la diabetes actúan mediante distintos mecanismos. Conocerlos te ayuda a entender tu tratamiento y a adherirte mejor.',
      'Metformina: es el medicamento de primera línea. Reduce la producción de glucosa en el hígado y mejora la sensibilidad a la insulina. Debe tomarse con comida para minimizar molestias gastrointestinales.',
      'Inhibidores SGLT-2 (ej. empagliflozina): hacen que el riñón elimine glucosa por la orina. También tienen beneficios cardiovasculares y renales.',
      'Insulina: puede ser de acción larga (basal) o rápida (prandial). La rotación de sitios de inyección es clave para una absorción correcta.',
      'Importante: nunca modifiques la dosis de tu medicación sin consultar a tu médico. Los ajustes deben hacerse según tus registros de glucosa y la evaluación clínica.',
    ],
    tips: ['Guarda la insulina abierta a temperatura ambiente (no en nevera)', 'Anota la hora de tus dosis para detectar patrones', 'Informa siempre a cualquier médico que tratarte que tienes diabetes'],
  },
  {
    id: 'a4',
    title: 'Cómo leer etiquetas: Carbohidratos ocultos',
    tag: 'ALIMENTACIÓN',
    readTime: '3 min',
    imageUri: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400',
    color: '#b45309',
    content: [
      'Las etiquetas nutricionales son tu mejor herramienta para controlar la glucosa. Aprende a leerlas en 30 segundos.',
      'Lo más importante: mira los "Hidratos de carbono totales" por porción, NO por 100g. Calcula cuántas porciones vas a consumir realmente.',
      'Azúcares ocultos: busca en la lista de ingredientes palabras como dextrosa, fructosa, jarabe de maíz, maltosa, sacarosa, concentrado de jugo de fruta. Todos elevan la glucosa.',
      'Fibra dietética: réstala de los carbohidratos totales para obtener los "carbohidratos netos". La fibra no eleva la glucosa.',
      'Truco práctico: si el primer o segundo ingrediente es algún tipo de azúcar, ese producto tiene un alto contenido glucémico. El orden de la lista indica la cantidad.',
    ],
    tips: ['Una ración estándar de carbohidratos = 15g', 'Busca productos con al menos 3g de fibra por porción', '"Sin azúcar añadida" no significa sin carbohidratos'],
  },
];

// ─── ARTICLE CARD ─────────────────────────────────────────────────────────────

function ArticleCard({ article, onPress }: { article: typeof ARTICLES[0]; onPress: () => void }) {
  return (
    <TouchableOpacity style={ac.card} onPress={onPress} activeOpacity={0.88}>
      <Image source={{ uri: article.imageUri }} style={ac.img}/>
      <View style={ac.overlay}/>
      <View style={ac.content}>
        <View style={[ac.tagBadge, { backgroundColor: `${article.color}cc` }]}>
          <Text style={ac.tagText}>{article.tag}</Text>
        </View>
        <Text style={ac.title} numberOfLines={2}>{article.title}</Text>
        <View style={ac.meta}>
          <Clock color="rgba(255,255,255,0.6)" size={11}/>
          <Text style={ac.metaText}>{article.readTime} lectura</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const ac = StyleSheet.create({
  card:    { width: 180, height: 200, borderRadius: 20, overflow: 'hidden', marginRight: 12 },
  img:     { ...StyleSheet.absoluteFillObject },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10,14,15,0.55)' },
  content: { flex: 1, padding: 14, justifyContent: 'flex-end' },
  tagBadge:{ alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 100, marginBottom: 6 },
  tagText: { color: 'white', fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },
  title:   { color: 'white', fontSize: 13, fontWeight: '700', lineHeight: 18, marginBottom: 6 },
  meta:    { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText:{ color: 'rgba(255,255,255,0.55)', fontSize: 10 },
});

// ─── ARTICLE DETAIL MODAL ────────────────────────────────────────────────────

function ArticleDetailModal({
  article, onClose,
}: { article: typeof ARTICLES[0] | null; onClose: () => void }) {
  if (!article) return null;
  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={adm.container}>
        {/* Hero */}
        <View style={adm.hero}>
          <Image source={{ uri: article.imageUri }} style={adm.heroImg} />
          <View style={adm.heroOverlay} />
          <View style={adm.heroContent}>
            <TouchableOpacity onPress={onClose} style={adm.closeBtn}>
              <ArrowLeft color="white" size={20} />
            </TouchableOpacity>
            <View style={{ flex: 1 }} />
          </View>
          <View style={adm.heroBadgeRow}>
            <View style={[adm.tagBadge, { backgroundColor: `${article.color}cc` }]}>
              <Text style={adm.tagText}>{article.tag}</Text>
            </View>
            <View style={adm.timeBadge}>
              <Clock color="white" size={11} />
              <Text style={adm.timeText}>{article.readTime} lectura</Text>
            </View>
          </View>
          <Text style={adm.heroTitle}>{article.title}</Text>
        </View>

        <ScrollView contentContainerStyle={adm.scroll} showsVerticalScrollIndicator={false}>
          {/* Content paragraphs */}
          {article.content.map((para, i) => (
            <Text key={i} style={adm.para}>{para}</Text>
          ))}

          {/* Tips */}
          <View style={adm.tipsCard}>
            <View style={adm.tipsHeader}>
              <Lightbulb color="#004e63" size={18} />
              <Text style={adm.tipsTitle}>Consejos prácticos</Text>
            </View>
            {article.tips.map((tip, i) => (
              <View key={i} style={adm.tipRow}>
                <CheckCircle2 color="#22c55e" size={14} />
                <Text style={adm.tipText}>{tip}</Text>
              </View>
            ))}
          </View>

          {/* Disclaimer */}
          <View style={adm.disclaimer}>
            <Text style={adm.disclaimerText}>
              ⚕️ Esta información es educativa y no reemplaza el consejo de tu médico o nutricionista.
            </Text>
          </View>
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

const adm = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#171d1e' },
  hero:         { height: 240, position: 'relative' },
  heroImg:      { width: '100%', height: '100%' },
  heroOverlay:  { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10,14,15,0.55)' },
  heroContent:  { ...StyleSheet.absoluteFillObject, flexDirection: 'row', padding: 16, paddingTop: Platform.OS === 'ios' ? 52 : 20 },
  closeBtn:     { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },
  heroBadgeRow: { position: 'absolute', bottom: 48, left: 20, flexDirection: 'row', gap: 8 },
  tagBadge:     { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100 },
  tagText:      { color: 'white', fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },
  timeBadge:    { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.4)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100 },
  timeText:     { color: 'white', fontSize: 10 },
  heroTitle:    { position: 'absolute', bottom: 16, left: 20, right: 20, color: 'white', fontSize: 20, fontWeight: '800', lineHeight: 26 },
  scroll:       { padding: 22 },
  para:         { color: '#bfc8cd', fontSize: 14, lineHeight: 23, marginBottom: 16 },
  tipsCard:     { backgroundColor: '#c4ebe0', borderRadius: 20, padding: 18, marginBottom: 16 },
  tipsHeader:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  tipsTitle:    { color: '#003746', fontSize: 15, fontWeight: '800' },
  tipRow:       { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
  tipText:      { color: '#004e63', fontSize: 13, lineHeight: 19, flex: 1 },
  disclaimer:   { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: 14 },
  disclaimerText:{ color: '#6f787d', fontSize: 11, lineHeight: 17 },
});

// ─── RECIPE MINI CARD ─────────────────────────────────────────────────────────

function RecipeMiniCard({ recipe, onPress, onFavorite }: {
  recipe: Recipe; onPress: () => void; onFavorite: () => void;
}) {
  const giColor = recipe.glycemicIndex === 'Bajo' ? '#22c55e' : recipe.glycemicIndex === 'Medio' ? '#f59e0b' : '#ef4444';
  return (
    <TouchableOpacity style={rm.card} onPress={onPress} activeOpacity={0.88}>
      <Image source={{ uri: recipe.imageUri }} style={rm.img}/>
      <View style={rm.overlay}/>
      <TouchableOpacity style={rm.favBtn} onPress={onFavorite}>
        <Heart color={recipe.isFavorite ? '#ef4444' : 'white'} fill={recipe.isFavorite ? '#ef4444' : 'transparent'} size={14}/>
      </TouchableOpacity>
      <View style={rm.bottom}>
        <View style={[rm.giBadge, { backgroundColor: `${giColor}cc` }]}>
          <Text style={rm.giText}>IG {recipe.glycemicIndex}</Text>
        </View>
        <Text style={rm.title} numberOfLines={2}>{recipe.title}</Text>
        <View style={rm.meta}>
          <Clock color="rgba(255,255,255,0.6)" size={11}/>
          <Text style={rm.metaText}>{recipe.prepTime + recipe.cookTime} min</Text>
          <Flame color="#f9c74f" size={11}/>
          <Text style={rm.metaText}>{recipe.calories} kcal</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const rm = StyleSheet.create({
  card:    { width: 170, height: 210, borderRadius: 20, overflow: 'hidden', marginRight: 12 },
  img:     { ...StyleSheet.absoluteFillObject },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10,14,15,0.5)' },
  favBtn:  { position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  bottom:  { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 12 },
  giBadge: { alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 100, marginBottom: 5 },
  giText:  { color: 'white', fontSize: 9, fontWeight: '800' },
  title:   { color: 'white', fontSize: 12, fontWeight: '700', lineHeight: 17, marginBottom: 5 },
  meta:    { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText:{ color: 'rgba(255,255,255,0.55)', fontSize: 10 },
});

// ─── MAIN ─────────────────────────────────────────────────────────────────────

export default function InsightsScreen() {
  const router = useRouter();
  const { latestGlucose } = useAppStore();
  const {
    getPopular, getFavorites, getNew, loading,
    fetchDailyRecommendations, toggleFavorite,
  } = useRecipes();

  const [refreshing,     setRefreshing]     = useState(false);
  const [selectedArticle,setSelectedArticle]= useState<typeof ARTICLES[0] | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  useEffect(() => {
    fetchDailyRecommendations();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDailyRecommendations();
    setRefreshing(false);
  };

  const popular   = getPopular().slice(0, 6);
  const favorites = getFavorites().slice(0, 5);
  const newest    = getNew().slice(0, 5);

  // Consejo personalizado según glucosa
  const glucoseRange = latestGlucose ? getGlucoseRange(latestGlucose.value) : null;
  const personalTip  = latestGlucose
    ? latestGlucose.value < 70
      ? '🍬 Glucosa baja: Consume 15g de carbohidratos de rápida absorción (jugo, glucosa). Repite en 15 min si no mejora.'
      : latestGlucose.value > 180
      ? '💧 Glucosa alta: Hidrátate bien y evita carbohidratos simples. Una caminata corta puede ayudar.'
      : '✅ Tus niveles están en rango. Mantén tu rutina de alimentación y ejercicio.'
    : '📊 Registra tu glucosa para recibir consejos personalizados.';

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <ArrowLeft color="#c4ebe0" size={24}/>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Insights</Text>
        <View style={s.avatarMini}>
          <User color="#c4ebe0" size={18}/>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#86d0ef"/>}
      >
        {/* Hero title */}
        <Text style={s.heroTitle}>Tu guía{'\n'}de salud personalizada</Text>
        <Text style={s.heroSub}>Basada en tus registros y las últimas evidencias clínicas.</Text>

        {/* Tip personalizado según glucosa */}
        <View style={[s.personalTipCard, { borderLeftColor: glucoseRange?.color ?? '#006782' }]}>
          <Text style={[s.personalTipValue, { color: glucoseRange?.color ?? '#86d0ef' }]}>
            {latestGlucose ? `${latestGlucose.value} mg/dL` : 'Sin datos aún'}
          </Text>
          <Text style={s.personalTipText}>{personalTip}</Text>
        </View>

        {/* Recetas populares */}
        <View style={s.sectionHeader}>
          <View style={s.sectionLeft}>
            <Flame color="#f9c74f" size={18}/>
            <Text style={s.sectionTitle}>Recetas Populares</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/RecipesScreen' as any)} style={s.seeAll}>
            <Text style={s.seeAllText}>Ver todas</Text>
            <ChevronRight color="#86d0ef" size={14}/>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={s.loadingRow}>
            <ActivityIndicator color="#86d0ef" size="small"/>
            <Text style={s.loadingText}>Cargando recetas saludables...</Text>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.horizontalList}>
            {popular.map(r => (
              <RecipeMiniCard
                key={r.id}
                recipe={r}
                onPress={() => setSelectedRecipe(r)}
                onFavorite={() => toggleFavorite(r.id)}
              />
            ))}
          </ScrollView>
        )}

        {/* Artículos */}
        <View style={s.sectionHeader}>
          <View style={s.sectionLeft}>
            <BookOpen color="#86d0ef" size={18}/>
            <Text style={s.sectionTitle}>Artículos de Salud</Text>
          </View>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.horizontalList}>
          {ARTICLES.map(article => (
            <ArticleCard
              key={article.id}
              article={article}
              onPress={() => setSelectedArticle(article)}
            />
          ))}
        </ScrollView>

        {/* Favoritas */}
        {favorites.length > 0 && (
          <>
            <View style={s.sectionHeader}>
              <View style={s.sectionLeft}>
                <Heart color="#ef4444" size={18} fill="#ef4444"/>
                <Text style={s.sectionTitle}>Tus Favoritas</Text>
              </View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.horizontalList}>
              {favorites.map(r => (
                <RecipeMiniCard
                  key={r.id}
                  recipe={r}
                  onPress={() => setSelectedRecipe(r)}
                  onFavorite={() => toggleFavorite(r.id)}
                />
              ))}
            </ScrollView>
          </>
        )}

        {/* Tips de estilo de vida */}
        <Text style={[s.sectionTitle, { marginBottom: 12, marginTop: 24 }]}>Consejos de Salud</Text>
        {[
          { title: 'Manejo del estrés',     desc: 'El cortisol eleva los niveles de azúcar en sangre. Prueba respiración profunda 5 min al día.',         icon: Wind,       color: '#c4ebe0' },
          { title: 'Momento del ejercicio', desc: 'Caminar 15 min después de comer reduce picos glucémicos hasta en un 20%.',                              icon: Zap,        color: '#a4f4b7' },
          { title: 'Hidratación',           desc: 'Beber 2L de agua diarios ayuda a los riñones a filtrar el exceso de glucosa.',                         icon: TrendingUp, color: '#86d0ef' },
        ].map(({ title, desc, icon: Icon, color }) => (
          <View key={title} style={s.lifestyleCard}>
            <View style={[s.lifestyleIcon, { backgroundColor: `${color}20` }]}>
              <Icon color={color} size={24}/>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.lifestyleTitle}>{title}</Text>
              <Text style={s.lifestyleDesc}>{desc}</Text>
            </View>
          </View>
        ))}

        {/* Recientes */}
        {newest.length > 0 && (
          <>
            <View style={s.sectionHeader}>
              <View style={s.sectionLeft}>
                <RefreshCw color="#f9c74f" size={16}/>
                <Text style={s.sectionTitle}>Recién Agregadas</Text>
              </View>
              <TouchableOpacity onPress={() => router.push('/RecipesScreen' as any)} style={s.seeAll}>
                <Text style={s.seeAllText}>Ver todas</Text>
                <ChevronRight color="#86d0ef" size={14}/>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.horizontalList}>
              {newest.map(r => (
                <RecipeMiniCard
                  key={r.id}
                  recipe={r}
                  onPress={() => setSelectedRecipe(r)}
                  onFavorite={() => toggleFavorite(r.id)}
                />
              ))}
            </ScrollView>
          </>
        )}

        {/* Tip del día */}
        <View style={s.tipBox}>
          <View style={s.tipIcon}><Lightbulb color="#004e63" size={28}/></View>
          <View style={{ flex: 1 }}>
            <Text style={s.tipTitle}>Tip del día</Text>
            <Text style={s.tipText}>
              "Caminar 10 minutos después de comer puede reducir los picos de glucosa hasta en un 20%."
            </Text>
          </View>
        </View>

        <View style={{ height: 60 }}/>
      </ScrollView>

      {/* Modals */}
      <ArticleDetailModal
        article={selectedArticle}
        onClose={() => setSelectedArticle(null)}
      />

      {selectedRecipe && (
        <RecipeMiniDetailModal
          recipe={selectedRecipe}
          onClose={() => setSelectedRecipe(null)}
          onFavorite={() => toggleFavorite(selectedRecipe.id)}
        />
      )}
    </SafeAreaView>
  );
}

// ─── RECIPE MINI DETAIL ───────────────────────────────────────────────────────

function RecipeMiniDetailModal({ recipe, onClose, onFavorite }: {
  recipe: Recipe; onClose: () => void; onFavorite: () => void;
}) {
  const giColor = recipe.glycemicIndex === 'Bajo' ? '#22c55e' : recipe.glycemicIndex === 'Medio' ? '#f59e0b' : '#ef4444';
  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={mrd.container}>
        <View style={mrd.hero}>
          <Image source={{ uri: recipe.imageUri }} style={mrd.img} />
          <View style={mrd.overlay} />
          <View style={mrd.topBar}>
            <TouchableOpacity onPress={onClose} style={mrd.closeBtn}>
              <ArrowLeft color="white" size={20} />
            </TouchableOpacity>
            <TouchableOpacity onPress={onFavorite} style={mrd.favBtn}>
              <Heart color={recipe.isFavorite ? '#ef4444' : 'white'} fill={recipe.isFavorite ? '#ef4444' : 'transparent'} size={20} />
            </TouchableOpacity>
          </View>
          <View style={mrd.heroBottom}>
            <View style={[mrd.giBadge, { backgroundColor: `${giColor}cc` }]}>
              <Text style={mrd.giText}>IG {recipe.glycemicIndex}</Text>
            </View>
            <Text style={mrd.title}>{recipe.title}</Text>
            <Text style={mrd.category}>{recipe.category}</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={mrd.scroll} showsVerticalScrollIndicator={false}>
          {/* Stats */}
          <View style={mrd.statsRow}>
            <View style={mrd.stat}><Text style={mrd.statVal}>{recipe.prepTime + recipe.cookTime} min</Text><Text style={mrd.statLbl}>Tiempo</Text></View>
            <View style={mrd.stat}><Text style={mrd.statVal}>{recipe.calories} kcal</Text><Text style={mrd.statLbl}>Calorías</Text></View>
            <View style={mrd.stat}><Text style={mrd.statVal}>{recipe.carbs}g</Text><Text style={mrd.statLbl}>Carbos</Text></View>
            <View style={mrd.stat}><Text style={mrd.statVal}>{recipe.servings}</Text><Text style={mrd.statLbl}>Porciones</Text></View>
          </View>

          <Text style={mrd.desc}>{recipe.description}</Text>

          {recipe.ingredients.length > 0 && (
            <>
              <Text style={mrd.sectionTitle}>Ingredientes principales</Text>
              {recipe.ingredients.slice(0, 6).map((ing, i) => (
                <View key={ing.id ?? i} style={mrd.ingRow}>
                  <View style={mrd.ingDot} />
                  <Text style={mrd.ingName}>{ing.name}</Text>
                  <Text style={mrd.ingAmt}>{ing.amount} {ing.unit}</Text>
                </View>
              ))}
            </>
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

const mrd = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#171d1e' },
  hero:      { height: 240, position: 'relative' },
  img:       { width: '100%', height: '100%' },
  overlay:   { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10,14,15,0.5)' },
  topBar:    { ...StyleSheet.absoluteFillObject, flexDirection: 'row', justifyContent: 'space-between', padding: 16, paddingTop: Platform.OS === 'ios' ? 52 : 20, alignItems: 'flex-start' },
  closeBtn:  { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },
  favBtn:    { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },
  heroBottom:{ position: 'absolute', bottom: 16, left: 16, right: 16 },
  giBadge:   { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 100, marginBottom: 6 },
  giText:    { color: 'white', fontSize: 10, fontWeight: '800' },
  title:     { color: 'white', fontSize: 20, fontWeight: '800', marginBottom: 2 },
  category:  { color: 'rgba(255,255,255,0.6)', fontSize: 12 },
  scroll:    { padding: 20 },
  statsRow:  { flexDirection: 'row', backgroundColor: '#1d2426', borderRadius: 16, padding: 14, marginBottom: 16 },
  stat:      { flex: 1, alignItems: 'center' },
  statVal:   { color: '#ecf2f3', fontSize: 14, fontWeight: '800' },
  statLbl:   { color: '#6f787d', fontSize: 10, marginTop: 2 },
  desc:      { color: '#bfc8cd', fontSize: 14, lineHeight: 22, marginBottom: 16 },
  sectionTitle:{ color: '#ecf2f3', fontSize: 15, fontWeight: '700', marginBottom: 12 },
  ingRow:    { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.05)' },
  ingDot:    { width: 6, height: 6, borderRadius: 3, backgroundColor: '#006782' },
  ingName:   { flex: 1, color: '#ecf2f3', fontSize: 13 },
  ingAmt:    { color: '#86d0ef', fontSize: 12, fontWeight: '700' },
});

const s = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#171d1e' },
  header:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 14 },
  headerTitle:     { color: '#c4ebe0', fontSize: 17, fontWeight: '700' },
  backBtn:         { padding: 8, backgroundColor: '#1d2426', borderRadius: 12 },
  avatarMini:      { width: 36, height: 36, borderRadius: 18, backgroundColor: '#004e63', alignItems: 'center', justifyContent: 'center' },
  scroll:          { paddingHorizontal: 24, paddingBottom: 40 },
  heroTitle:       { color: '#c4ebe0', fontSize: 32, fontWeight: '800', lineHeight: 40, marginBottom: 6 },
  heroSub:         { color: '#6f787d', fontSize: 14, lineHeight: 20, marginBottom: 20 },
  personalTipCard: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 18, padding: 16, marginBottom: 24, borderLeftWidth: 3 },
  personalTipValue:{ fontSize: 14, fontWeight: '800', marginBottom: 4 },
  personalTipText: { color: '#bfc8ca', fontSize: 13, lineHeight: 19 },
  sectionHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, marginTop: 24 },
  sectionLeft:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle:    { color: '#fff', fontSize: 18, fontWeight: '800' },
  seeAll:          { flexDirection: 'row', alignItems: 'center', gap: 2 },
  seeAllText:      { color: '#86d0ef', fontSize: 13, fontWeight: '600' },
  horizontalList:  { marginBottom: 4 },
  loadingRow:      { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 24 },
  loadingText:     { color: '#6f787d', fontSize: 13 },
  lifestyleCard:   { flexDirection: 'row', gap: 14, backgroundColor: '#1d2425', borderRadius: 20, padding: 18, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)' },
  lifestyleIcon:   { padding: 12, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  lifestyleTitle:  { color: '#f5fafb', fontSize: 15, fontWeight: '700', marginBottom: 3 },
  lifestyleDesc:   { color: '#6f787d', fontSize: 12, lineHeight: 18 },
  tipBox:          { backgroundColor: 'rgba(0,103,130,0.12)', borderRadius: 28, padding: 20, flexDirection: 'row', gap: 14, alignItems: 'center', marginTop: 24 },
  tipIcon:         { width: 52, height: 52, borderRadius: 26, backgroundColor: '#c4ebe0', alignItems: 'center', justifyContent: 'center' },
  tipTitle:        { color: '#c4ebe0', fontSize: 16, fontWeight: '800', marginBottom: 4 },
  tipText:         { color: '#bfc8cd', fontSize: 13, fontStyle: 'italic', lineHeight: 19 },
});