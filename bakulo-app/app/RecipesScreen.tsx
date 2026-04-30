/**
 * RecipesScreen.tsx — completo
 * - Recetas diarias desde TheMealDB API (gratuita)
 * - Tabs: Popular · Favoritas · Nuevas · Mis Recetas
 * - Buscador por nombre/etiqueta
 * - Filtro por categoría
 * - Cards con info nutricional e índice glucémico
 * - FAB para crear receta propia
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, SafeAreaView, Image, ActivityIndicator,
  RefreshControl, Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Search, Heart, Plus, ChefHat, Clock, Users, Flame,
  Star, X, BookOpen, TrendingUp, Sparkles, Filter,
} from 'lucide-react-native';
import { useRecipes, Recipe, RecipeFilter, RecipeCategory } from '@/store/RecipeStore';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 52) / 2;

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function giColor(gi: string): string {
  if (gi === 'Bajo')  return '#22c55e';
  if (gi === 'Medio') return '#f59e0b';
  return '#ef4444';
}

// ─── RECIPE CARD ─────────────────────────────────────────────────────────────

function RecipeCard({ recipe, onPress, onFavorite }: {
  recipe: Recipe; onPress: () => void; onFavorite: () => void;
}) {
  const giCol = giColor(recipe.glycemicIndex);
  return (
    <TouchableOpacity style={rc.card} onPress={onPress} activeOpacity={0.88}>
      <View style={rc.imgContainer}>
        <Image source={{ uri: recipe.imageUri }} style={rc.img} />
        <View style={[rc.giBadge, { backgroundColor: `${giCol}dd` }]}>
          <Text style={rc.giBadgeText}>IG {recipe.glycemicIndex}</Text>
        </View>
        <TouchableOpacity style={rc.favBtn} onPress={onFavorite} hitSlop={{ top:8, bottom:8, left:8, right:8 }}>
          <Heart color={recipe.isFavorite ? '#ef4444' : 'white'} fill={recipe.isFavorite ? '#ef4444' : 'transparent'} size={16} />
        </TouchableOpacity>
      </View>
      <View style={rc.content}>
        <Text style={rc.category}>{recipe.category}</Text>
        <Text style={rc.title} numberOfLines={2}>{recipe.title}</Text>
        <View style={rc.metaRow}>
          <View style={rc.metaItem}><Clock color="#6f787d" size={11} /><Text style={rc.metaText}>{recipe.prepTime + recipe.cookTime} min</Text></View>
          <View style={rc.metaItem}><Users color="#6f787d" size={11} /><Text style={rc.metaText}>{recipe.servings} pers.</Text></View>
        </View>
        <View style={rc.macroRow}>
          <Text style={rc.calText}>{recipe.calories} kcal</Text>
          <Text style={rc.carbText}>{recipe.carbs}g carbs</Text>
        </View>
        <View style={rc.likesRow}>
          <Heart color="#6f787d" size={12} />
          <Text style={rc.likesText}>{recipe.likes}</Text>
          {recipe.isCustom && <View style={rc.customBadge}><Text style={rc.customBadgeText}>Propia</Text></View>}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const rc = StyleSheet.create({
  card:           { width: CARD_WIDTH, backgroundColor: '#1a1a1a', borderRadius: 20, overflow: 'hidden', marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  imgContainer:   { height: 130, position: 'relative' },
  img:            { width: '100%', height: '100%' },
  giBadge:        { position: 'absolute', bottom: 8, left: 8, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 100 },
  giBadgeText:    { color: 'white', fontSize: 9, fontWeight: '800' },
  favBtn:         { position: 'absolute', top: 8, right: 8, width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },
  content:        { padding: 12 },
  category:       { color: '#42655d', fontSize: 9, fontWeight: '800', letterSpacing: 0.8, marginBottom: 3 },
  title:          { color: '#ecf2f3', fontSize: 13, fontWeight: '700', lineHeight: 18, marginBottom: 6 },
  metaRow:        { flexDirection: 'row', gap: 10, marginBottom: 6 },
  metaItem:       { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText:       { color: '#6f787d', fontSize: 10 },
  macroRow:       { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  calText:        { color: '#86d0ef', fontSize: 11, fontWeight: '700' },
  carbText:       { color: '#f9c74f', fontSize: 11, fontWeight: '700' },
  likesRow:       { flexDirection: 'row', alignItems: 'center', gap: 4 },
  likesText:      { color: '#6f787d', fontSize: 10 },
  customBadge:    { marginLeft: 'auto', backgroundColor: 'rgba(196,181,253,0.15)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 100 },
  customBadgeText:{ color: '#c4b5fd', fontSize: 9, fontWeight: '700' },
});

// ─── DAILY HERO CARD ─────────────────────────────────────────────────────────

function DailyHeroCard({ recipe, onPress, onFavorite }: { recipe: Recipe; onPress: () => void; onFavorite: () => void }) {
  const giCol = giColor(recipe.glycemicIndex);
  return (
    <TouchableOpacity style={dhc.card} onPress={onPress} activeOpacity={0.9}>
      <Image source={{ uri: recipe.imageUri }} style={dhc.img} />
      <View style={dhc.overlay}>
        <View style={dhc.topRow}>
          <View style={dhc.dailyBadge}>
            <Sparkles color="#004e63" size={12} />
            <Text style={dhc.dailyText}>RECETA DEL DÍA</Text>
          </View>
          <TouchableOpacity style={dhc.favBtn} onPress={onFavorite}>
            <Heart color={recipe.isFavorite ? '#ef4444' : 'white'} fill={recipe.isFavorite ? '#ef4444' : 'transparent'} size={18} />
          </TouchableOpacity>
        </View>
        <View>
          <View style={[dhc.giBadge, { backgroundColor: `${giCol}cc` }]}>
            <Text style={dhc.giText}>IG {recipe.glycemicIndex}</Text>
          </View>
          <Text style={dhc.title}>{recipe.title}</Text>
          <Text style={dhc.desc} numberOfLines={2}>{recipe.description}</Text>
          <View style={dhc.stats}>
            {[
              { icon: <Clock color="#c4ebe0" size={13}/>, val: `${recipe.prepTime + recipe.cookTime} min` },
              { icon: <Flame color="#f9c74f" size={13}/>,  val: `${recipe.calories} kcal` },
              { icon: <Users color="#c4ebe0" size={13}/>,  val: `${recipe.servings} pers.` },
            ].map(({ icon, val }) => (
              <View key={val} style={dhc.statItem}>{icon}<Text style={dhc.statText}>{val}</Text></View>
            ))}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const dhc = StyleSheet.create({
  card:       { height: 280, borderRadius: 28, overflow: 'hidden', marginBottom: 24 },
  img:        { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  overlay:    { flex: 1, backgroundColor: 'rgba(12,16,17,0.6)', padding: 18, justifyContent: 'space-between' },
  topRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  dailyBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#c4ebe0', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 100 },
  dailyText:  { color: '#004e63', fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },
  favBtn:     { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  giBadge:    { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 100, marginBottom: 8 },
  giText:     { color: 'white', fontSize: 10, fontWeight: '800' },
  title:      { color: 'white', fontSize: 22, fontWeight: '800', marginBottom: 6 },
  desc:       { color: 'rgba(255,255,255,0.7)', fontSize: 12, lineHeight: 17, marginBottom: 12 },
  stats:      { flexDirection: 'row', gap: 16 },
  statItem:   { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText:   { color: '#c4ebe0', fontSize: 12, fontWeight: '600' },
});

// ─── FILTER TABS ─────────────────────────────────────────────────────────────

const FILTER_TABS: { id: RecipeFilter; label: string }[] = [
  { id: 'popular',    label: '🔥 Popular'     },
  { id: 'favorites',  label: '❤️ Favoritas'   },
  { id: 'new',        label: '✨ Nuevas'       },
  { id: 'my_recipes', label: '📖 Mis Recetas' },
];

const CATEGORIES: (RecipeCategory | 'all')[] = [
  'all', 'Desayuno', 'Almuerzo', 'Cena', 'Merienda',
  'Ensalada', 'Bebida', 'Sopa', 'Postre Diabético',
];

// ─── RECIPE DETAIL MODAL ─────────────────────────────────────────────────────

import { Modal, Platform } from 'react-native';
import { ArrowLeft, CheckCircle2 } from 'lucide-react-native';

function RecipeDetailModal({ recipe, onClose, onFavorite }: {
  recipe: Recipe; onClose: () => void; onFavorite: () => void;
}) {
  const [tab, setTab] = useState<'info' | 'ingredients' | 'steps'>('info');
  const giCol = giColor(recipe.glycemicIndex);

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={dm.container}>
        {/* Hero image */}
        <View style={dm.hero}>
          <Image source={{ uri: recipe.imageUri }} style={dm.heroImg} />
          <View style={dm.heroOverlay}>
            <TouchableOpacity onPress={onClose} style={dm.backBtn}>
              <ArrowLeft color="white" size={20} />
            </TouchableOpacity>
            <TouchableOpacity onPress={onFavorite} style={dm.favBtn}>
              <Heart color={recipe.isFavorite ? '#ef4444' : 'white'} fill={recipe.isFavorite ? '#ef4444' : 'transparent'} size={20} />
            </TouchableOpacity>
          </View>
          <View style={dm.heroBottom}>
            <View style={[dm.giBadge, { backgroundColor: `${giCol}cc` }]}>
              <Text style={dm.giText}>IG {recipe.glycemicIndex}</Text>
            </View>
            <Text style={dm.heroTitle}>{recipe.title}</Text>
            <Text style={dm.heroCategory}>{recipe.category}</Text>
          </View>
        </View>

        {/* Stats row */}
        <View style={dm.statsRow}>
          {[
            { label: 'Tiempo',    value: `${recipe.prepTime + recipe.cookTime} min` },
            { label: 'Porciones', value: `${recipe.servings}`                       },
            { label: 'Calorías',  value: `${recipe.calories} kcal`                  },
            { label: 'Dificultad',value: recipe.difficulty                           },
          ].map(({ label, value }) => (
            <View key={label} style={dm.statItem}>
              <Text style={dm.statValue}>{value}</Text>
              <Text style={dm.statLabel}>{label}</Text>
            </View>
          ))}
        </View>

        {/* Tabs */}
        <View style={dm.tabRow}>
          {(['info', 'ingredients', 'steps'] as const).map(t => (
            <TouchableOpacity
              key={t}
              style={[dm.tab, tab === t && dm.tabActive]}
              onPress={() => setTab(t)}
            >
              <Text style={[dm.tabText, tab === t && dm.tabTextActive]}>
                {t === 'info' ? 'Info' : t === 'ingredients' ? 'Ingredientes' : 'Pasos'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView contentContainerStyle={dm.scroll} showsVerticalScrollIndicator={false}>
          {tab === 'info' && (
            <>
              <Text style={dm.desc}>{recipe.description}</Text>
              <Text style={dm.sectionTitle}>Macronutrientes</Text>
              <View style={dm.macroGrid}>
                {[
                  { label: 'Carbos',   value: `${recipe.carbs}g`,   color: '#f9c74f' },
                  { label: 'Proteína', value: `${recipe.protein}g`, color: '#22c55e' },
                  { label: 'Grasa',    value: `${recipe.fat}g`,     color: '#f59e0b' },
                  { label: 'Fibra',    value: `${recipe.fiber}g`,   color: '#86d0ef' },
                ].map(({ label, value, color }) => (
                  <View key={label} style={[dm.macroCard, { borderTopColor: color }]}>
                    <Text style={[dm.macroValue, { color }]}>{value}</Text>
                    <Text style={dm.macroLabel}>{label}</Text>
                  </View>
                ))}
              </View>
              <View style={dm.tagRow}>
                {recipe.tags.map(tag => (
                  <View key={tag} style={dm.tag}>
                    <Text style={dm.tagText}>#{tag}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {tab === 'ingredients' && (
            <View style={dm.ingList}>
              {recipe.ingredients.map((ing, i) => (
                <View key={ing.id ?? i} style={dm.ingRow}>
                  <View style={dm.ingDot} />
                  <Text style={dm.ingName}>{ing.name}</Text>
                  <Text style={dm.ingAmount}>{ing.amount} {ing.unit}</Text>
                </View>
              ))}
            </View>
          )}

          {tab === 'steps' && (
            <View style={dm.stepsList}>
              {recipe.steps.map((step, i) => (
                <View key={i} style={dm.stepCard}>
                  <View style={dm.stepNumCircle}>
                    <Text style={dm.stepNum}>{step.number}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={dm.stepInst}>{step.instruction}</Text>
                    {step.duration ? (
                      <View style={dm.stepTime}>
                        <Clock color="#6f787d" size={11} />
                        <Text style={dm.stepTimeText}>{step.duration} min</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              ))}
            </View>
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

const dm = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#0f1316' },
  hero:        { height: 260, position: 'relative' },
  heroImg:     { width: '100%', height: '100%' },
  heroOverlay: { ...StyleSheet.absoluteFillObject, flexDirection: 'row', justifyContent: 'space-between', padding: 16, paddingTop: Platform.OS === 'ios' ? 52 : 20, backgroundColor: 'rgba(0,0,0,0.25)' },
  backBtn:     { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },
  favBtn:      { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },
  heroBottom:  { position: 'absolute', bottom: 16, left: 16, right: 16 },
  giBadge:     { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 100, marginBottom: 6 },
  giText:      { color: 'white', fontSize: 10, fontWeight: '800' },
  heroTitle:   { color: 'white', fontSize: 22, fontWeight: '800', marginBottom: 2 },
  heroCategory:{ color: 'rgba(255,255,255,0.6)', fontSize: 12 },
  statsRow:    { flexDirection: 'row', backgroundColor: '#1a1a1a', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  statItem:    { flex: 1, alignItems: 'center' },
  statValue:   { color: '#ecf2f3', fontSize: 14, fontWeight: '800' },
  statLabel:   { color: '#6f787d', fontSize: 10, marginTop: 2 },
  tabRow:      { flexDirection: 'row', backgroundColor: '#1a1a1a', padding: 4, gap: 4 },
  tab:         { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 10 },
  tabActive:   { backgroundColor: '#006782' },
  tabText:     { color: '#6f787d', fontSize: 12, fontWeight: '700' },
  tabTextActive:{ color: 'white' },
  scroll:      { padding: 20 },
  desc:        { color: '#bfc8cd', fontSize: 14, lineHeight: 22, marginBottom: 20 },
  sectionTitle:{ color: '#ecf2f3', fontSize: 15, fontWeight: '700', marginBottom: 12 },
  macroGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  macroCard:   { width: '47%', backgroundColor: '#1d2426', borderRadius: 14, padding: 12, borderTopWidth: 3 },
  macroValue:  { fontSize: 22, fontWeight: '800' },
  macroLabel:  { color: '#6f787d', fontSize: 10, marginTop: 2 },
  tagRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag:         { backgroundColor: 'rgba(134,208,239,0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100 },
  tagText:     { color: '#86d0ef', fontSize: 11, fontWeight: '600' },
  ingList:     { gap: 10 },
  ingRow:      { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#1a1a1a', borderRadius: 12, padding: 12 },
  ingDot:      { width: 8, height: 8, borderRadius: 4, backgroundColor: '#006782' },
  ingName:     { flex: 1, color: '#ecf2f3', fontSize: 14 },
  ingAmount:   { color: '#86d0ef', fontSize: 13, fontWeight: '700' },
  stepsList:   { gap: 12 },
  stepCard:    { flexDirection: 'row', gap: 12, backgroundColor: '#1a1a1a', borderRadius: 16, padding: 14, borderLeftWidth: 3, borderLeftColor: '#006782' },
  stepNumCircle:{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#006782', alignItems: 'center', justifyContent: 'center' },
  stepNum:     { color: 'white', fontSize: 12, fontWeight: '800' },
  stepInst:    { color: '#ecf2f3', fontSize: 13, lineHeight: 20, marginBottom: 4 },
  stepTime:    { flexDirection: 'row', alignItems: 'center', gap: 4 },
  stepTimeText:{ color: '#6f787d', fontSize: 11 },
});

// ─── MAIN SCREEN ─────────────────────────────────────────────────────────────

export default function RecipesScreen() {
  const router = useRouter();
  const { getFiltered, getDailyRecipe, toggleFavorite, loading, error, fetchDailyRecommendations } = useRecipes();

  const [activeFilter,   setActiveFilter]   = useState<RecipeFilter>('popular');
  const [activeCategory, setActiveCategory] = useState<RecipeCategory | 'all'>('all');
  const [searchQuery,    setSearchQuery]    = useState('');
  const [showSearch,     setShowSearch]     = useState(false);
  const [refreshing,     setRefreshing]     = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  useEffect(() => { fetchDailyRecommendations(); }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDailyRecommendations();
    setRefreshing(false);
  }, [fetchDailyRecommendations]);

  const dailyRecipe = getDailyRecipe();
  const filtered    = getFiltered(activeFilter, activeCategory, searchQuery);

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        {showSearch ? (
          <View style={s.searchBarInline}>
            <Search color="#6f787d" size={18} />
            <TextInput
              style={s.searchInputInline}
              placeholder="Buscar recetas..."
              placeholderTextColor="#6f787d"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            <TouchableOpacity onPress={() => { setShowSearch(false); setSearchQuery(''); }}>
              <X color="#6f787d" size={18} />
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View>
              <Text style={s.headerTitle}>Recetas</Text>
              <Text style={s.headerSub}>Para personas con diabetes</Text>
            </View>
            <View style={s.headerActions}>
              <TouchableOpacity style={s.iconBtn} onPress={() => setShowSearch(true)}>
                <Search color="#86d0ef" size={20} />
              </TouchableOpacity>
              <TouchableOpacity style={s.addBtn} onPress={() => router.push('/RecipeBuilderScreen' as any)}>
                <Plus color="#003746" size={18} />
                <Text style={s.addBtnText}>Crear</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#86d0ef" />}
      >
        {/* Receta del día */}
        {dailyRecipe && !searchQuery && activeFilter === 'popular' && (
          <DailyHeroCard
            recipe={dailyRecipe}
            onPress={() => setSelectedRecipe(dailyRecipe)}
            onFavorite={() => toggleFavorite(dailyRecipe.id)}
          />
        )}

        {/* Filtros de tipo */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterRow}>
          {FILTER_TABS.map(f => (
            <TouchableOpacity
              key={f.id}
              style={[s.filterBtn, activeFilter === f.id && s.filterBtnActive]}
              onPress={() => setActiveFilter(f.id)}
            >
              <Text style={[s.filterText, activeFilter === f.id && s.filterTextActive]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Filtros de categoría */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.catRow}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[s.catBtn, activeCategory === cat && s.catBtnActive]}
              onPress={() => setActiveCategory(cat)}
            >
              <Text style={[s.catText, activeCategory === cat && s.catTextActive]}>
                {cat === 'all' ? 'Todas' : cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {loading && (
          <View style={s.loadingBox}>
            <ActivityIndicator color="#86d0ef" size="large" />
            <Text style={s.loadingText}>Cargando recetas saludables...</Text>
          </View>
        )}

        {error && !loading && (
          <View style={s.errorBox}>
            <Text style={s.errorText}>{error}</Text>
            <TouchableOpacity style={s.retryBtn} onPress={fetchDailyRecommendations}>
              <Text style={s.retryText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        )}

        {!loading && filtered.length > 0 && (
          <>
            <View style={s.gridHeader}>
              <Text style={s.gridTitle}>
                {activeFilter === 'popular'    ? '🔥 Más Populares' :
                 activeFilter === 'favorites'  ? '❤️ Tus Favoritas' :
                 activeFilter === 'new'        ? '✨ Más Recientes' : '📖 Mis Recetas'}
              </Text>
              <Text style={s.gridCount}>{filtered.length} recetas</Text>
            </View>
            <View style={s.grid}>
              {filtered.map(recipe => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  onPress={() => setSelectedRecipe(recipe)}
                  onFavorite={() => toggleFavorite(recipe.id)}
                />
              ))}
            </View>
          </>
        )}

        {!loading && filtered.length === 0 && !error && (
          <View style={s.emptyBox}>
            <ChefHat color="#333b3d" size={40} />
            <Text style={s.emptyTitle}>
              {activeFilter === 'favorites'  ? 'Sin favoritas aún' :
               activeFilter === 'my_recipes' ? 'Aún no tienes recetas propias' : 'Sin resultados'}
            </Text>
            <Text style={s.emptySub}>
              {activeFilter === 'favorites'  ? 'Toca ❤️ en cualquier receta para guardarla' :
               activeFilter === 'my_recipes' ? 'Toca "Crear" para agregar tu primera receta' :
               'Intenta con otro término de búsqueda'}
            </Text>
            {activeFilter === 'my_recipes' && (
              <TouchableOpacity style={s.emptyCreateBtn} onPress={() => router.push('/RecipeBuilderScreen' as any)}>
                <Plus color="#003746" size={16} />
                <Text style={s.emptyCreateText}>Crear Receta</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={s.noteBox}>
          <Text style={s.noteText}>
            💡 Las recetas con Índice Glucémico <Text style={{ color: '#22c55e' }}>Bajo</Text> son las más
            recomendadas para mantener niveles estables de glucosa. Siempre consulta con tu médico.
          </Text>
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>

      {selectedRecipe && (
        <RecipeDetailModal
          recipe={selectedRecipe}
          onClose={() => setSelectedRecipe(null)}
          onFavorite={() => toggleFavorite(selectedRecipe.id)}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#121212' },
  header:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  headerTitle:      { color: '#baeaff', fontSize: 26, fontWeight: '800' },
  headerSub:        { color: '#6f787d', fontSize: 12, marginTop: 1 },
  headerActions:    { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBtn:          { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1a1a1a', alignItems: 'center', justifyContent: 'center' },
  addBtn:           { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#c4ebe0', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 100 },
  addBtnText:       { color: '#003746', fontSize: 13, fontWeight: '800' },
  searchBarInline:  { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a1a', borderRadius: 14, paddingHorizontal: 14, gap: 8, height: 46 },
  searchInputInline:{ flex: 1, color: '#ecf2f3', fontSize: 14 },
  scroll:           { paddingHorizontal: 20 },
  filterRow:        { flexDirection: 'row', gap: 8, marginBottom: 12 },
  filterBtn:        { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.05)' },
  filterBtnActive:  { backgroundColor: '#006782' },
  filterText:       { color: '#6f787d', fontSize: 12, fontWeight: '700' },
  filterTextActive: { color: 'white' },
  catRow:           { flexDirection: 'row', gap: 8, marginBottom: 20 },
  catBtn:           { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  catBtnActive:     { backgroundColor: 'rgba(196,235,224,0.15)', borderColor: '#c4ebe0' },
  catText:          { color: '#6f787d', fontSize: 11, fontWeight: '600' },
  catTextActive:    { color: '#c4ebe0' },
  loadingBox:       { alignItems: 'center', paddingVertical: 48, gap: 12 },
  loadingText:      { color: '#6f787d', fontSize: 13 },
  errorBox:         { alignItems: 'center', paddingVertical: 32, gap: 12 },
  errorText:        { color: '#ef4444', fontSize: 14, textAlign: 'center' },
  retryBtn:         { backgroundColor: '#006782', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 100 },
  retryText:        { color: 'white', fontWeight: '700' },
  gridHeader:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  gridTitle:        { color: '#ecf2f3', fontSize: 18, fontWeight: '800' },
  gridCount:        { color: '#6f787d', fontSize: 12 },
  grid:             { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  emptyBox:         { alignItems: 'center', paddingVertical: 48, gap: 10 },
  emptyTitle:       { color: '#ecf2f3', fontSize: 16, fontWeight: '700' },
  emptySub:         { color: '#6f787d', fontSize: 13, textAlign: 'center', paddingHorizontal: 24 },
  emptyCreateBtn:   { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#c4ebe0', paddingHorizontal: 18, paddingVertical: 11, borderRadius: 100, marginTop: 8 },
  emptyCreateText:  { color: '#003746', fontWeight: '800', fontSize: 13 },
  noteBox:          { backgroundColor: 'rgba(0,103,130,0.08)', borderRadius: 16, padding: 14, marginTop: 8, borderWidth: 1, borderColor: 'rgba(0,103,130,0.15)' },
  noteText:         { color: '#6f787d', fontSize: 12, lineHeight: 18 },
});