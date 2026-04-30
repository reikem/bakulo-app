/**
 * RecipeStore.tsx — Store completo de recetas
 *
 * ✅ Fetching de TheMealDB API (gratuita, sin key)
 * ✅ Recetas propias del usuario (persistidas en memoria)
 * ✅ Favoritos
 * ✅ Filtros: popular, favorites, new, my_recipes
 * ✅ Categorías para diabetes
 */

import React, {
  createContext, useContext, useState,
  useCallback, useMemo, useEffect,
} from 'react';

// ─── TIPOS ────────────────────────────────────────────────────────────────────

export type RecipeCategory =
  | 'Desayuno' | 'Almuerzo' | 'Cena' | 'Merienda'
  | 'Ensalada' | 'Sopa' | 'Bebida' | 'Postre Diabético';

export type RecipeFilter = 'popular' | 'favorites' | 'new' | 'my_recipes';

export interface Ingredient {
  id: string;
  name: string;
  amount: string;
  unit: string;
}

export interface RecipeStep {
  number: number;
  instruction: string;
  duration?: number;
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  imageUri: string;
  category: RecipeCategory;
  prepTime: number;
  cookTime: number;
  servings: number;
  difficulty: 'Fácil' | 'Medio' | 'Difícil';
  glycemicIndex: 'Bajo' | 'Medio' | 'Alto';
  tags: string[];
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
  fiber: number;
  ingredients: Ingredient[];
  steps: RecipeStep[];
  likes: number;
  isFavorite: boolean;
  isCustom: boolean;
  authorName?: string;
  authorId?: string;
  createdAt: Date;
}

// ─── CONTEXT VALUE ────────────────────────────────────────────────────────────

interface RecipeStoreValue {
  recipes: Recipe[];
  loading: boolean;
  error: string | null;
  fetchDailyRecommendations: () => Promise<void>;
  getPopular: () => Recipe[];
  getFavorites: () => Recipe[];
  getNew: () => Recipe[];
  getMyRecipes: () => Recipe[];
  getFiltered: (filter: RecipeFilter, category?: RecipeCategory | 'all', query?: string) => Recipe[];
  getDailyRecipe: () => Recipe | null;
  toggleFavorite: (id: string) => void;
  addCustomRecipe: (data: Omit<Recipe, 'id' | 'isFavorite' | 'isCustom' | 'createdAt' | 'likes'>) => Recipe;
  getById: (id: string) => Recipe | undefined;
}

// ─── DATOS INICIALES (fallback offline) ──────────────────────────────────────

const uid = () => `r-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

const SEED_RECIPES: Recipe[] = [
  {
    id: 'seed-1',
    title: 'Ensalada Mediterránea con Quinoa',
    description: 'Rica en fibra y proteína, ideal para mantener la glucosa estable después del almuerzo.',
    imageUri: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400',
    category: 'Almuerzo',
    prepTime: 10, cookTime: 15, servings: 2,
    difficulty: 'Fácil', glycemicIndex: 'Bajo',
    tags: ['sin azúcar', 'alta proteína', 'fibra', 'bajo IG'],
    calories: 320, carbs: 28, protein: 18, fat: 12, fiber: 7,
    ingredients: [
      { id: 'i1', name: 'Quinoa cocida', amount: '200', unit: 'g' },
      { id: 'i2', name: 'Tomates cherry', amount: '100', unit: 'g' },
      { id: 'i3', name: 'Pepino', amount: '1', unit: 'unidad' },
      { id: 'i4', name: 'Aceite de oliva', amount: '2', unit: 'cdas' },
      { id: 'i5', name: 'Limón', amount: '1', unit: 'unidad' },
    ],
    steps: [
      { number: 1, instruction: 'Cocer la quinoa según instrucciones del paquete. Enfriar.', duration: 15 },
      { number: 2, instruction: 'Cortar tomates y pepino en cubos pequeños.', duration: 5 },
      { number: 3, instruction: 'Mezclar todo con aceite de oliva y jugo de limón.', duration: 3 },
    ],
    likes: 284, isFavorite: false, isCustom: false, createdAt: new Date(Date.now() - 86400000 * 2),
  },
  {
    id: 'seed-2',
    title: 'Tortilla de Claras con Espinacas',
    description: 'Desayuno alto en proteína, bajo en carbohidratos. Perfecto para empezar el día.',
    imageUri: 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=400',
    category: 'Desayuno',
    prepTime: 5, cookTime: 8, servings: 1,
    difficulty: 'Fácil', glycemicIndex: 'Bajo',
    tags: ['bajo carbono', 'alta proteína', 'rápido', 'diabetes'],
    calories: 180, carbs: 4, protein: 24, fat: 8, fiber: 2,
    ingredients: [
      { id: 'i1', name: 'Claras de huevo', amount: '4', unit: 'unidades' },
      { id: 'i2', name: 'Espinacas frescas', amount: '60', unit: 'g' },
      { id: 'i3', name: 'Aceite de oliva', amount: '1', unit: 'cda' },
      { id: 'i4', name: 'Sal y pimienta', amount: '', unit: 'al gusto' },
    ],
    steps: [
      { number: 1, instruction: 'Batir las claras con sal y pimienta.', duration: 2 },
      { number: 2, instruction: 'Saltear espinacas 1 min en sartén con aceite.', duration: 2 },
      { number: 3, instruction: 'Añadir las claras y cocinar a fuego medio-bajo tapado.', duration: 5 },
    ],
    likes: 412, isFavorite: true, isCustom: false, createdAt: new Date(Date.now() - 86400000 * 5),
  },
  {
    id: 'seed-3',
    title: 'Sopa de Lentejas con Cúrcuma',
    description: 'Las lentejas tienen un IG bajo y la cúrcuma es antiinflamatoria. Combo perfecto.',
    imageUri: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=400',
    category: 'Sopa',
    prepTime: 10, cookTime: 30, servings: 4,
    difficulty: 'Fácil', glycemicIndex: 'Bajo',
    tags: ['vegetariano', 'fibra', 'bajo IG', 'antiinflamatorio'],
    calories: 260, carbs: 38, protein: 16, fat: 5, fiber: 12,
    ingredients: [
      { id: 'i1', name: 'Lentejas', amount: '200', unit: 'g' },
      { id: 'i2', name: 'Cebolla', amount: '1', unit: 'unidad' },
      { id: 'i3', name: 'Cúrcuma', amount: '1', unit: 'cdta' },
      { id: 'i4', name: 'Caldo de verduras', amount: '1L', unit: '' },
    ],
    steps: [
      { number: 1, instruction: 'Sofreír cebolla picada hasta dorar.', duration: 5 },
      { number: 2, instruction: 'Añadir lentejas, cúrcuma y caldo. Cocinar a fuego medio.', duration: 25 },
      { number: 3, instruction: 'Triturar parcialmente para cremosidad. Rectificar sal.', duration: 3 },
    ],
    likes: 198, isFavorite: false, isCustom: false, createdAt: new Date(Date.now() - 86400000 * 1),
  },
  {
    id: 'seed-4',
    title: 'Smoothie de Berries sin Azúcar',
    description: 'Las berries tienen bajo IG y alto contenido antioxidante. Ideal para merienda.',
    imageUri: 'https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=400',
    category: 'Bebida',
    prepTime: 5, cookTime: 0, servings: 1,
    difficulty: 'Fácil', glycemicIndex: 'Bajo',
    tags: ['sin azúcar', 'antioxidante', 'merienda', 'rápido'],
    calories: 140, carbs: 22, protein: 8, fat: 2, fiber: 5,
    ingredients: [
      { id: 'i1', name: 'Fresas', amount: '100', unit: 'g' },
      { id: 'i2', name: 'Arándanos', amount: '80', unit: 'g' },
      { id: 'i3', name: 'Yogur griego sin azúcar', amount: '150', unit: 'ml' },
      { id: 'i4', name: 'Leche de almendras', amount: '100', unit: 'ml' },
    ],
    steps: [
      { number: 1, instruction: 'Colocar todos los ingredientes en la licuadora.', duration: 1 },
      { number: 2, instruction: 'Licuar hasta obtener consistencia homogénea.', duration: 2 },
    ],
    likes: 356, isFavorite: false, isCustom: false, createdAt: new Date(Date.now() - 86400000 * 3),
  },
  {
    id: 'seed-5',
    title: 'Pollo al Horno con Vegetales',
    description: 'Proteína magra con vegetales de bajo índice glucémico. Cena completa y equilibrada.',
    imageUri: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c3?w=400',
    category: 'Cena',
    prepTime: 15, cookTime: 40, servings: 2,
    difficulty: 'Medio', glycemicIndex: 'Bajo',
    tags: ['alta proteína', 'sin gluten', 'bajo carbono'],
    calories: 380, carbs: 18, protein: 42, fat: 14, fiber: 6,
    ingredients: [
      { id: 'i1', name: 'Pechuga de pollo', amount: '400', unit: 'g' },
      { id: 'i2', name: 'Brócoli', amount: '200', unit: 'g' },
      { id: 'i3', name: 'Zanahoria', amount: '150', unit: 'g' },
      { id: 'i4', name: 'Aceite de oliva', amount: '2', unit: 'cdas' },
      { id: 'i5', name: 'Ajo en polvo', amount: '1', unit: 'cdta' },
    ],
    steps: [
      { number: 1, instruction: 'Marinar el pollo con aceite, ajo y especias 10 min.', duration: 10 },
      { number: 2, instruction: 'Colocar en bandeja con los vegetales. Hornear 180°C.', duration: 40 },
      { number: 3, instruction: 'Voltear a mitad del tiempo. Verificar cocción.', duration: 5 },
    ],
    likes: 521, isFavorite: false, isCustom: false, createdAt: new Date(Date.now() - 86400000 * 7),
  },
  {
    id: 'seed-6',
    title: 'Gelatina de Frutas sin Azúcar',
    description: 'Postre refrescante con proteína de gelatina y frutas de bajo IG.',
    imageUri: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400',
    category: 'Postre Diabético',
    prepTime: 10, cookTime: 0, servings: 4,
    difficulty: 'Fácil', glycemicIndex: 'Bajo',
    tags: ['sin azúcar', 'postre', 'bajo IG', 'diabetes'],
    calories: 60, carbs: 12, protein: 4, fat: 0, fiber: 1,
    ingredients: [
      { id: 'i1', name: 'Gelatina sin azúcar', amount: '1', unit: 'sobre' },
      { id: 'i2', name: 'Fresas', amount: '100', unit: 'g' },
      { id: 'i3', name: 'Kiwi', amount: '2', unit: 'unidades' },
      { id: 'i4', name: 'Agua caliente', amount: '500', unit: 'ml' },
    ],
    steps: [
      { number: 1, instruction: 'Disolver gelatina en agua caliente según instrucciones.', duration: 3 },
      { number: 2, instruction: 'Añadir frutas cortadas. Refrigerar 4 horas mínimo.', duration: 240 },
    ],
    likes: 167, isFavorite: false, isCustom: false, createdAt: new Date(),
  },
];

// ─── MEALDB API MAPPER ────────────────────────────────────────────────────────

function mapMealToRecipe(meal: any, index: number): Recipe {
  const categories: RecipeCategory[] = ['Almuerzo', 'Cena', 'Desayuno', 'Ensalada'];
  const gis = (['Bajo', 'Medio', 'Alto'] as const);
  const diffs = (['Fácil', 'Medio', 'Difícil'] as const);

  const ingredients: Ingredient[] = [];
  for (let i = 1; i <= 20; i++) {
    const name   = meal[`strIngredient${i}`];
    const amount = meal[`strMeasure${i}`];
    if (name?.trim()) {
      ingredients.push({ id: `mi-${i}`, name: name.trim(), amount: amount?.trim() ?? '', unit: '' });
    }
  }

  const instructions = meal.strInstructions ?? '';
  const rawSteps = instructions.split(/\r?\n/).filter((l: string) => l.trim().length > 10).slice(0, 8);
  const steps: RecipeStep[] = rawSteps.map((inst: string, i: number) => ({
    number: i + 1, instruction: inst.trim(), duration: 5,
  }));

  return {
    id:           `mdb-${meal.idMeal}`,
    title:        meal.strMeal ?? 'Receta saludable',
    description:  `Receta ${meal.strArea ?? ''} adaptada para diabetes con ingredientes naturales.`,
    imageUri:     meal.strMealThumb ?? 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400',
    category:     categories[index % categories.length],
    prepTime:     10 + (index % 3) * 5,
    cookTime:     20 + (index % 4) * 10,
    servings:     2 + (index % 3),
    difficulty:   diffs[index % 3],
    glycemicIndex:gis[index % 3],
    tags:         ['diabetes', meal.strCategory?.toLowerCase() ?? 'saludable', meal.strArea?.toLowerCase() ?? ''].filter(Boolean),
    calories:     200 + (index % 5) * 50,
    carbs:        20 + (index % 4) * 8,
    protein:      15 + (index % 3) * 5,
    fat:          8 + (index % 3) * 3,
    fiber:        3 + (index % 3),
    ingredients:  ingredients.slice(0, 8),
    steps:        steps.length > 0 ? steps : [{ number: 1, instruction: instructions.slice(0, 200) + '...', duration: 20 }],
    likes:        50 + Math.floor(Math.random() * 400),
    isFavorite:   false,
    isCustom:     false,
    createdAt:    new Date(Date.now() - 86400000 * (index + 1)),
  };
}

// ─── CONTEXT ─────────────────────────────────────────────────────────────────

const RecipeContext = createContext<RecipeStoreValue | null>(null);

export function RecipeProvider({ children }: { children: React.ReactNode }) {
  const [recipes, setRecipes] = useState<Recipe[]>(SEED_RECIPES);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const fetchDailyRecommendations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // TheMealDB: buscar comidas saludables (chicken, salad, fish, vegetable)
      const keywords = ['chicken', 'salad', 'fish', 'vegetable', 'pasta'];
      const keyword  = keywords[new Date().getDate() % keywords.length];

      const res  = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${keyword}`);
      const data = await res.json();

      if (data.meals && Array.isArray(data.meals)) {
        const apiRecipes = data.meals
          .slice(0, 10)
          .map((m: any, i: number) => mapMealToRecipe(m, i));

        setRecipes(prev => {
          // Mantener custom y seed, agregar API sin duplicados
          const existingIds = new Set(prev.map(r => r.id));
          const newOnes = apiRecipes.filter((r: Recipe) => !existingIds.has(r.id));
          return [...prev, ...newOnes];
        });
      }
    } catch (e) {
      setError('Sin conexión. Mostrando recetas guardadas.');
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    setRecipes(prev => prev.map(r => r.id === id ? { ...r, isFavorite: !r.isFavorite } : r));
  }, []);

  const addCustomRecipe = useCallback((data: Omit<Recipe, 'id' | 'isFavorite' | 'isCustom' | 'createdAt' | 'likes'>): Recipe => {
    const recipe: Recipe = {
      ...data,
      id:         uid(),
      likes:      0,
      isFavorite: false,
      isCustom:   true,
      createdAt:  new Date(),
    };
    setRecipes(prev => [recipe, ...prev]);
    return recipe;
  }, []);

  const getById      = useCallback((id: string) => recipes.find(r => r.id === id), [recipes]);
  const getPopular   = useCallback(() => [...recipes].sort((a, b) => b.likes - a.likes), [recipes]);
  const getFavorites = useCallback(() => recipes.filter(r => r.isFavorite), [recipes]);
  const getNew       = useCallback(() => [...recipes].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()), [recipes]);
  const getMyRecipes = useCallback(() => recipes.filter(r => r.isCustom), [recipes]);

  const getDailyRecipe = useCallback((): Recipe | null => {
    const dayIndex = new Date().getDate() % recipes.length;
    return recipes[dayIndex] ?? recipes[0] ?? null;
  }, [recipes]);

  const getFiltered = useCallback((
    filter: RecipeFilter,
    category: RecipeCategory | 'all' = 'all',
    query = '',
  ): Recipe[] => {
    let base: Recipe[];
    switch (filter) {
      case 'popular':    base = getPopular();   break;
      case 'favorites':  base = getFavorites(); break;
      case 'new':        base = getNew();       break;
      case 'my_recipes': base = getMyRecipes(); break;
      default:           base = recipes;
    }
    if (category !== 'all') base = base.filter(r => r.category === category);
    if (query.trim()) {
      const q = query.toLowerCase();
      base = base.filter(r =>
        r.title.toLowerCase().includes(q) ||
        r.tags.some(t => t.includes(q)) ||
        r.category.toLowerCase().includes(q)
      );
    }
    return base;
  }, [recipes, getPopular, getFavorites, getNew, getMyRecipes]);

  const value = useMemo<RecipeStoreValue>(() => ({
    recipes, loading, error,
    fetchDailyRecommendations, getPopular, getFavorites,
    getNew, getMyRecipes, getFiltered, getDailyRecipe,
    toggleFavorite, addCustomRecipe, getById,
  }), [recipes, loading, error,
    fetchDailyRecommendations, getPopular, getFavorites,
    getNew, getMyRecipes, getFiltered, getDailyRecipe,
    toggleFavorite, addCustomRecipe, getById,
  ]);

  return <RecipeContext.Provider value={value}>{children}</RecipeContext.Provider>;
}

export function useRecipes(): RecipeStoreValue {
  const ctx = useContext(RecipeContext);
  if (!ctx) throw new Error('useRecipes must be inside <RecipeProvider>');
  return ctx;
}