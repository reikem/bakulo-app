/**
 * advice.tsx — Consejos Médicos & Noticias
 *
 * Conecta con la API de Claude para generar:
 * • Consejos médicos personalizados por categoría
 * • Noticias y avances sobre diabetes
 * • Tips del día a día con IA
 * • Preguntas rápidas al asistente médico
 *
 * La API key se inyecta via process.env o constante — ajusta según tu config.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, TextInput, Animated, Dimensions,
  ActivityIndicator, RefreshControl, KeyboardAvoidingView,
  Platform, Image,
} from 'react-native';
import {
  Sparkles, RefreshCw, Send, ChevronRight,
  BookOpen, Heart, Utensils, Zap, Shield,
  TrendingUp, MessageCircle, X, Newspaper,
  Droplets, Moon, Sun, Clock,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAppStore } from '@/store/AppStore';
import { getGlucoseRange } from '@/store/AppStore';

const { width } = Dimensions.get('window');

// ─── CONFIG ───────────────────────────────────────────────────────────────────
// Cambia por tu variable de entorno real:
// import Constants from 'expo-constants';
// const API_KEY = Constants.expoConfig?.extra?.claudeApiKey ?? '';
const CLAUDE_MODEL = 'claude-sonnet-4-20250514';

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface AdviceCard {
  id: string;
  category: string;
  title: string;
  body: string;
  icon: string;
  color: string;
  readTime: string;
  saved: boolean;
}

interface NewsItem {
  id: string;
  headline: string;
  summary: string;
  source: string;
  tag: string;
  color: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// ─── CATEGORIES ──────────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: 'all',        label: 'Todo',        Icon: Sparkles,    color: '#86d0ef' },
  { id: 'nutrition',  label: 'Nutrición',   Icon: Utensils,    color: '#a4f4b7' },
  { id: 'exercise',   label: 'Ejercicio',   Icon: Zap,         color: '#f9c74f' },
  { id: 'mental',     label: 'Bienestar',   Icon: Heart,       color: '#f4a2c0' },
  { id: 'medication', label: 'Medicación',  Icon: Shield,      color: '#c4b5fd' },
  { id: 'glucose',    label: 'Glucosa',     Icon: Droplets,    color: '#86d0ef' },
  { id: 'sleep',      label: 'Sueño',       Icon: Moon,        color: '#94a3b8' },
  { id: 'daily',      label: 'Día a día',   Icon: Sun,         color: '#fbbf24' },
] as const;

type CategoryId = typeof CATEGORIES[number]['id'];

// ─── CLAUDE API CALL ─────────────────────────────────────────────────────────

async function callClaude(messages: { role: 'user' | 'assistant'; content: string }[], system: string): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // La API key se agrega automáticamente en el entorno Claude.ai
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 1000,
      system,
      messages,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  return data.content?.map((b: any) => b.type === 'text' ? b.text : '').join('') ?? '';
}

// ─── GENERATE ADVICE CARDS ────────────────────────────────────────────────────

async function generateAdviceCards(
  category: CategoryId,
  glucoseAvg: number,
  recentValues: number[]
): Promise<AdviceCard[]> {
  const categoryLabel = CATEGORIES.find(c => c.id === category)?.label ?? 'General';
  const contextStr = `El paciente tiene una glucosa promedio de ${glucoseAvg} mg/dL. Valores recientes: ${recentValues.slice(0, 5).join(', ')} mg/dL.`;

  const system = `Eres un asistente médico especializado en diabetes. Generas consejos médicos prácticos, empáticos y basados en evidencia científica actual. 
Siempre en español latinoamericano. Tono cercano, no alarmista. 
IMPORTANTE: Responde SOLO con JSON válido, sin texto adicional, sin markdown, sin backticks.`;

  const userMsg = `Genera 4 tarjetas de consejo médico sobre "${categoryLabel}" para una persona con diabetes. ${contextStr}

Responde con este JSON exacto (array de 4 objetos):
[
  {
    "id": "c1",
    "category": "${categoryLabel}",
    "title": "Título corto y accionable (máx 8 palabras)",
    "body": "Explicación práctica de 2-3 oraciones. Específico y útil para la vida diaria con diabetes.",
    "icon": "emoji relevante",
    "color": "uno de: #86d0ef #a4f4b7 #f9c74f #f4a2c0 #c4b5fd #fbbf24",
    "readTime": "X min lectura",
    "saved": false
  }
]`;

  const raw = await callClaude([{ role: 'user', content: userMsg }], system);
  const clean = raw.replace(/```json|```/g, '').trim();
  const parsed: AdviceCard[] = JSON.parse(clean);
  return parsed.map((c, i) => ({ ...c, id: `card_${Date.now()}_${i}` }));
}

// ─── GENERATE NEWS ────────────────────────────────────────────────────────────

async function generateNews(): Promise<NewsItem[]> {
  const system = `Eres un editor médico especializado en diabetes. Resumes noticias y avances científicos recientes de forma clara y accesible para pacientes.
Responde SOLO con JSON válido. Sin texto adicional ni markdown.`;

  const userMsg = `Genera 5 noticias o avances recientes sobre diabetes (tratamientos, investigación, tecnología, nutrición, calidad de vida).
Deben ser informativos, esperanzadores y basados en tendencias reales de 2024-2025.

JSON exacto (array de 5):
[
  {
    "id": "n1",
    "headline": "Titular impactante (máx 12 palabras)",
    "summary": "Resumen de 2 oraciones. Qué significa esto para pacientes con diabetes.",
    "source": "Nombre de fuente o institución médica plausible",
    "tag": "Investigación|Tecnología|Nutrición|Tratamiento|Estilo de vida",
    "color": "uno de: #86d0ef #a4f4b7 #f9c74f #c4b5fd #f4a2c0"
  }
]`;

  const raw = await callClaude([{ role: 'user', content: userMsg }], system);
  const clean = raw.replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
}

// ─── CHAT SYSTEM PROMPT ───────────────────────────────────────────────────────

const CHAT_SYSTEM = `Eres MediBot, un asistente médico amigable y empático especializado en diabetes tipo 1 y tipo 2.
Tu rol es proporcionar información educativa, consejos prácticos y apoyo emocional a personas que viven con diabetes.

Reglas:
1. Siempre en español latinoamericano, tono cálido y cercano
2. Respuestas concisas (máx 4 párrafos) pero completas
3. Cuando corresponda, sugiere consultar al médico tratante
4. No diagnosticas ni recetas medicamentos específicos
5. Contextualizas la información al día a día real de un paciente
6. Usas emojis moderadamente para hacer la lectura más amigable
7. Si preguntan algo peligroso o de urgencia médica, indica que llamen a su médico inmediatamente`;

// ─── SHIMMER SKELETON ─────────────────────────────────────────────────────────

function Skeleton({ width: w, height: h, style }: { width: number | string; height: number; style?: any }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.7] });

  return (
    <Animated.View
      style={[{ width: w, height: h, borderRadius: 10, backgroundColor: '#1d2426' }, { opacity }, style]}
    />
  );
}

function CardSkeleton() {
  return (
    <View style={sk.card}>
      <View style={sk.header}>
        <Skeleton width={36} height={36} style={{ borderRadius: 12 }} />
        <View style={{ gap: 6 }}>
          <Skeleton width={80}  height={10} />
          <Skeleton width={140} height={14} />
        </View>
      </View>
      <Skeleton width="100%" height={12} style={{ marginTop: 12 }} />
      <Skeleton width="80%"  height={12} style={{ marginTop: 6 }} />
      <Skeleton width="60%"  height={12} style={{ marginTop: 6 }} />
    </View>
  );
}

const sk = StyleSheet.create({
  card:   { backgroundColor: '#1a1a1a', borderRadius: 24, padding: 18, marginBottom: 12 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
});

// ─── ADVICE CARD COMPONENT ────────────────────────────────────────────────────

function AdviceCardView({ card, onToggleSave }: { card: AdviceCard; onToggleSave: (id: string) => void }) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 50 }),
      Animated.spring(scale, { toValue: 1,    useNativeDriver: true, speed: 30 }),
    ]).start();
  };

  return (
    <Animated.View style={[av.card, { transform: [{ scale }], borderLeftColor: card.color }]}>
      <TouchableOpacity onPress={handlePress} activeOpacity={0.95}>
        <View style={av.header}>
          <View style={[av.iconBox, { backgroundColor: `${card.color}18` }]}>
            <Text style={av.emoji}>{card.icon}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={av.metaRow}>
              <View style={[av.catBadge, { backgroundColor: `${card.color}18` }]}>
                <Text style={[av.catTxt, { color: card.color }]}>{card.category.toUpperCase()}</Text>
              </View>
              <View style={av.timeRow}>
                <Clock color="#4a5153" size={10} />
                <Text style={av.timeTxt}>{card.readTime}</Text>
              </View>
            </View>
            <Text style={av.title}>{card.title}</Text>
          </View>
          <TouchableOpacity onPress={() => onToggleSave(card.id)} style={av.saveBtn}>
            <BookOpen color={card.saved ? card.color : '#3f484c'} size={18} fill={card.saved ? `${card.color}30` : 'transparent'} />
          </TouchableOpacity>
        </View>
        <Text style={av.body}>{card.body}</Text>
        <View style={av.footer}>
          <Text style={[av.footerTxt, { color: card.color }]}>Leer más →</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const av = StyleSheet.create({
  card:    { backgroundColor: '#1a1a1a', borderRadius: 24, padding: 18, marginBottom: 12, borderLeftWidth: 3, borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)' },
  header:  { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 10 },
  iconBox: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  emoji:   { fontSize: 22 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  catBadge:{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  catTxt:  { fontSize: 8, fontWeight: '800', letterSpacing: 0.8 },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  timeTxt: { color: '#4a5153', fontSize: 9 },
  title:   { color: '#ecf2f3', fontSize: 15, fontWeight: '800', lineHeight: 20 },
  body:    { color: '#6f787d', fontSize: 13, lineHeight: 20 },
  footer:  { marginTop: 10 },
  footerTxt:{ fontSize: 12, fontWeight: '700' },
  saveBtn: { padding: 4 },
});

// ─── NEWS CARD COMPONENT ──────────────────────────────────────────────────────

function NewsCard({ item }: { item: NewsItem }) {
  return (
    <View style={[nw.card, { borderLeftColor: item.color }]}>
      <View style={nw.tagRow}>
        <View style={[nw.tag, { backgroundColor: `${item.color}15` }]}>
          <Text style={[nw.tagTxt, { color: item.color }]}>{item.tag.toUpperCase()}</Text>
        </View>
        <Text style={nw.source}>{item.source}</Text>
      </View>
      <Text style={nw.headline}>{item.headline}</Text>
      <Text style={nw.summary}>{item.summary}</Text>
    </View>
  );
}

const nw = StyleSheet.create({
  card:     { backgroundColor: '#1a1a1a', borderRadius: 20, padding: 16, marginBottom: 10, borderLeftWidth: 3, borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)' },
  tagRow:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  tag:      { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  tagTxt:   { fontSize: 8, fontWeight: '800', letterSpacing: 1 },
  source:   { color: '#4a5153', fontSize: 10 },
  headline: { color: '#ecf2f3', fontSize: 14, fontWeight: '800', lineHeight: 20, marginBottom: 6 },
  summary:  { color: '#6f787d', fontSize: 12, lineHeight: 18 },
});

// ─── CHAT BUBBLE ─────────────────────────────────────────────────────────────

function ChatBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === 'user';
  return (
    <View style={[cb.wrap, isUser && cb.wrapUser]}>
      {!isUser && (
        <View style={cb.botAvatar}>
          <Text style={{ fontSize: 14 }}>🤖</Text>
        </View>
      )}
      <View style={[cb.bubble, isUser ? cb.bubbleUser : cb.bubbleBot]}>
        <Text style={[cb.text, isUser && cb.textUser]}>{msg.content}</Text>
      </View>
    </View>
  );
}

const cb = StyleSheet.create({
  wrap:       { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 12 },
  wrapUser:   { justifyContent: 'flex-end' },
  botAvatar:  { width: 32, height: 32, borderRadius: 16, backgroundColor: '#1d2426', alignItems: 'center', justifyContent: 'center' },
  bubble:     { maxWidth: width * 0.72, borderRadius: 18, padding: 12 },
  bubbleBot:  { backgroundColor: '#1d2426', borderBottomLeftRadius: 4 },
  bubbleUser: { backgroundColor: '#006782', borderBottomRightRadius: 4 },
  text:       { color: '#bfc8ca', fontSize: 13, lineHeight: 19 },
  textUser:   { color: '#fff' },
});

// ─── MAIN SCREEN ─────────────────────────────────────────────────────────────

type MainTab = 'consejos' | 'noticias' | 'chat';

export default function AdviceScreen() {
  const router = useRouter();
  const { glucoseEntries, streakData } = useAppStore();

  const [mainTab,      setMainTab]      = useState<MainTab>('consejos');
  const [activeCategory, setActiveCategory] = useState<CategoryId>('all');
  const [cards,        setCards]        = useState<AdviceCard[]>([]);
  const [news,         setNews]         = useState<NewsItem[]>([]);
  const [loadingCards, setLoadingCards] = useState(false);
  const [loadingNews,  setLoadingNews]  = useState(false);
  const [chatMsgs,     setChatMsgs]     = useState<ChatMessage[]>([
    { role: 'assistant', content: '¡Hola! 👋 Soy MediBot, tu asistente médico sobre diabetes. Puedes preguntarme sobre nutrición, ejercicio, glucosa, medicación, o cualquier duda del día a día. ¿En qué te puedo ayudar hoy?' },
  ]);
  const [chatInput,    setChatInput]    = useState('');
  const [chatLoading,  setChatLoading]  = useState(false);
  const [refreshing,   setRefreshing]   = useState(false);

  const scrollRef  = useRef<ScrollView>(null);
  const headerAnim = useRef(new Animated.Value(0)).current;

  // Derived glucose stats for context
  const last7 = glucoseEntries.slice(0, 7);
  const avgGlucose = last7.length
    ? Math.round(last7.reduce((s, e) => s + e.value, 0) / last7.length)
    : 110;
  const recentValues = last7.map(e => e.value);

  // Load advice cards
  const loadCards = useCallback(async () => {
    setLoadingCards(true);
    try {
      const newCards = await generateAdviceCards(activeCategory, avgGlucose, recentValues);
      setCards(newCards);
    } catch (e) {
      console.warn('Error loading advice:', e);
      setCards(FALLBACK_CARDS);
    } finally {
      setLoadingCards(false);
    }
  }, [activeCategory, avgGlucose]);

  // Load news
  const loadNews = useCallback(async () => {
    setLoadingNews(true);
    try {
      const newNews = await generateNews();
      setNews(newNews);
    } catch (e) {
      console.warn('Error loading news:', e);
      setNews(FALLBACK_NEWS);
    } finally {
      setLoadingNews(false);
    }
  }, []);

  useEffect(() => {
    if (mainTab === 'consejos') loadCards();
    if (mainTab === 'noticias' && news.length === 0) loadNews();
  }, [mainTab, activeCategory]);

  const handleRefresh = async () => {
    setRefreshing(true);
    if (mainTab === 'consejos') await loadCards();
    if (mainTab === 'noticias') await loadNews();
    setRefreshing(false);
  };

  const handleToggleSave = (id: string) => {
    setCards(prev => prev.map(c => c.id === id ? { ...c, saved: !c.saved } : c));
  };

  // Chat
  const handleSendChat = async () => {
    const text = chatInput.trim();
    if (!text || chatLoading) return;

    const userMsg: ChatMessage = { role: 'user', content: text };
    setChatMsgs(prev => [...prev, userMsg]);
    setChatInput('');
    setChatLoading(true);

    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const history = [...chatMsgs, userMsg].map(m => ({ role: m.role, content: m.content }));
      const reply = await callClaude(history, CHAT_SYSTEM);
      setChatMsgs(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (e) {
      setChatMsgs(prev => [...prev, {
        role: 'assistant',
        content: 'Lo siento, hubo un problema de conexión. Por favor intenta de nuevo en un momento.',
      }]);
    } finally {
      setChatLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  // Quick prompts
  const QUICK_PROMPTS = [
    '¿Qué debo comer si tengo glucosa alta?',
    '¿El estrés afecta mi glucosa?',
    '¿Cómo mejorar el tiempo en rango?',
    '¿Qué ejercicios son mejores para diabéticos?',
  ];

  const glucoseRange = getGlucoseRange(avgGlucose);

  return (
    <SafeAreaView style={s.container}>
      {/* ── HEADER ── */}
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>Serenity IA</Text>
          <Text style={s.headerSub}>Tu guía médica personalizada</Text>
        </View>
        {/* Glucose context badge */}
        <View style={[s.glucoseBadge, { backgroundColor: `${glucoseRange.color}15`, borderColor: `${glucoseRange.color}30` }]}>
          <Droplets color={glucoseRange.color} size={13} />
          <Text style={[s.glucoseBadgeTxt, { color: glucoseRange.color }]}>{avgGlucose} mg/dL</Text>
        </View>
      </View>

      {/* ── MAIN TABS ── */}
      <View style={s.mainTabRow}>
        {([
          { id: 'consejos', label: 'Consejos', Icon: Sparkles },
          { id: 'noticias', label: 'Noticias',  Icon: Newspaper },
          { id: 'chat',     label: 'MediBot',   Icon: MessageCircle },
        ] as const).map(({ id, label, Icon }) => (
          <TouchableOpacity
            key={id}
            style={[s.mainTab, mainTab === id && s.mainTabActive]}
            onPress={() => setMainTab(id)}
          >
            <Icon color={mainTab === id ? '#fff' : '#4a5153'} size={14} />
            <Text style={[s.mainTabTxt, mainTab === id && s.mainTabTxtActive]}>{label}</Text>
            {id === 'chat' && (
              <View style={s.aiBadge}><Text style={s.aiBadgeTxt}>IA</Text></View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* ════════════════ TAB: CONSEJOS ════════════════ */}
      {mainTab === 'consejos' && (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#86d0ef" />}
        >
          {/* Personalized hero */}
          <View style={s.heroCard}>
            <View style={s.heroTop}>
              <Text style={s.heroEmoji}>💡</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.heroLabel}>CONSEJO PERSONALIZADO</Text>
                <Text style={s.heroTitle}>
                  Basado en tu glucosa promedio de {avgGlucose} mg/dL
                </Text>
              </View>
            </View>
            <Text style={s.heroBody}>
              {avgGlucose < 90
                ? 'Tu glucosa tiende a estar baja. Considera revisar tus porciones y el timing de tus comidas. Una merienda con proteína puede ayudar.'
                : avgGlucose > 160
                ? 'Tu promedio está algo elevado. El ejercicio suave después de comer y reducir carbohidratos refinados puede marcar una gran diferencia.'
                : '¡Tu promedio está en buen rango! Mantener la consistencia en horarios de comida y actividad física es clave para sostenerte.'}
            </Text>
            <TouchableOpacity style={s.refreshBtn} onPress={loadCards} disabled={loadingCards}>
              <RefreshCw color="#86d0ef" size={14} />
              <Text style={s.refreshTxt}>Regenerar consejos</Text>
            </TouchableOpacity>
          </View>

          {/* Category filter */}
          <ScrollView
            horizontal showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.catRow}
          >
            {CATEGORIES.map(({ id, label, Icon, color }) => (
              <TouchableOpacity
                key={id}
                style={[s.catChip, activeCategory === id && { backgroundColor: `${color}18`, borderColor: color, borderWidth: 1 }]}
                onPress={() => setActiveCategory(id)}
              >
                <Icon color={activeCategory === id ? color : '#4a5153'} size={13} />
                <Text style={[s.catTxt, activeCategory === id && { color }]}>{label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Cards */}
          <View style={s.cardsSection}>
            {loadingCards ? (
              [1, 2, 3].map(i => <CardSkeleton key={i} />)
            ) : (
              cards.map(card => (
                <AdviceCardView key={card.id} card={card} onToggleSave={handleToggleSave} />
              ))
            )}
          </View>

          {/* Saved section */}
          {cards.filter(c => c.saved).length > 0 && (
            <View style={s.savedSection}>
              <Text style={s.savedTitle}>📌 Guardados</Text>
              {cards.filter(c => c.saved).map(card => (
                <AdviceCardView key={card.id} card={card} onToggleSave={handleToggleSave} />
              ))}
            </View>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>
      )}

      {/* ════════════════ TAB: NOTICIAS ════════════════ */}
      {mainTab === 'noticias' && (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#86d0ef" />}
        >
          <View style={s.newsHero}>
            <View style={s.newsHeroTop}>
              <Newspaper color="#86d0ef" size={20} />
              <Text style={s.newsHeroLabel}>NOTICIAS Y AVANCES</Text>
            </View>
            <Text style={s.newsHeroTitle}>Lo último en diabetes</Text>
            <Text style={s.newsHeroSub}>Generado con IA · Actualizado ahora</Text>
          </View>

          <View style={s.newsSection}>
            {loadingNews ? (
              [1, 2, 3, 4].map(i => (
                <View key={i} style={sk.card}>
                  <Skeleton width={80} height={10} />
                  <Skeleton width="90%" height={16} style={{ marginTop: 8 }} />
                  <Skeleton width="100%" height={12} style={{ marginTop: 8 }} />
                  <Skeleton width="70%" height={12} style={{ marginTop: 5 }} />
                </View>
              ))
            ) : (
              news.map(item => <NewsCard key={item.id} item={item} />)
            )}
          </View>

          {/* Disclaimer */}
          <View style={s.disclaimer}>
            <Text style={s.disclaimerTxt}>
              ⚠️ Este contenido es generado por IA con fines informativos. No reemplaza la consulta médica profesional. Siempre consulta a tu médico tratante.
            </Text>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      )}

      {/* ════════════════ TAB: CHAT ════════════════ */}
      {mainTab === 'chat' && (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          {/* Chat header */}
          <View style={s.chatHeader}>
            <View style={s.botInfo}>
              <View style={s.botAvatar}>
                <Text style={{ fontSize: 20 }}>🤖</Text>
              </View>
              <View>
                <Text style={s.botName}>MediBot</Text>
                <View style={s.onlineRow}>
                  <View style={s.onlineDot} />
                  <Text style={s.onlineTxt}>Asistente IA · disponible</Text>
                </View>
              </View>
            </View>
            <View style={s.aiBadgeLarge}>
              <Sparkles color="#86d0ef" size={12} />
              <Text style={s.aiBadgeLargeTxt}>Claude AI</Text>
            </View>
          </View>

          {/* Quick prompts (shown before first user message) */}
          {chatMsgs.length <= 1 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.quickRow}
            >
              {QUICK_PROMPTS.map((p, i) => (
                <TouchableOpacity
                  key={i}
                  style={s.quickChip}
                  onPress={() => { setChatInput(p); }}
                >
                  <Text style={s.quickTxt}>{p}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* Messages */}
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={s.chatMessages}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
          >
            {chatMsgs.map((msg, i) => <ChatBubble key={i} msg={msg} />)}
            {chatLoading && (
              <View style={[cb.wrap, { paddingLeft: 40 }]}>
                <View style={cb.bubble}>
                  <View style={s.typingDots}>
                    {[0, 1, 2].map(i => <TypingDot key={i} delay={i * 200} />)}
                  </View>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Input */}
          <View style={s.inputRow}>
            <TextInput
              style={s.chatInput}
              value={chatInput}
              onChangeText={setChatInput}
              placeholder="Pregunta sobre tu diabetes..."
              placeholderTextColor="#3f484c"
              multiline
              maxLength={500}
              onSubmitEditing={handleSendChat}
            />
            <TouchableOpacity
              style={[s.sendBtn, (!chatInput.trim() || chatLoading) && s.sendBtnDisabled]}
              onPress={handleSendChat}
              disabled={!chatInput.trim() || chatLoading}
            >
              {chatLoading
                ? <ActivityIndicator color="#fff" size="small" />
                : <Send color="#fff" size={18} />}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

// ─── TYPING DOT ───────────────────────────────────────────────────────────────

function TypingDot({ delay }: { delay: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.delay(600 - delay),
      ])
    ).start();
  }, []);
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -5] });
  return (
    <Animated.View
      style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#6f787d', transform: [{ translateY }] }}
    />
  );
}

// ─── FALLBACK DATA (cuando la API falla) ────────────────────────────────────

const FALLBACK_CARDS: AdviceCard[] = [
  { id: 'f1', category: 'Nutrición', title: 'El plato del método de la mano', body: 'Usa tu mano como guía: el puño = carbohidratos, la palma = proteína, los dedos extendidos = vegetales. Simple y siempre disponible.', icon: '🥗', color: '#a4f4b7', readTime: '2 min lectura', saved: false },
  { id: 'f2', category: 'Glucosa', title: 'Regla de los 15 para hipoglucemia', body: 'Si tu glucosa baja de 70 mg/dL: come 15g de carbohidratos rápidos, espera 15 minutos y vuelve a medir. Repite si es necesario.', icon: '🩸', color: '#86d0ef', readTime: '1 min lectura', saved: false },
  { id: 'f3', category: 'Ejercicio', title: 'Caminar 10 min después de comer', body: 'Una caminata suave de 10-15 minutos después de cada comida puede reducir el pico de glucosa posprandial hasta un 30%. Fácil y efectivo.', icon: '🚶', color: '#f9c74f', readTime: '2 min lectura', saved: false },
  { id: 'f4', category: 'Bienestar', title: 'El cortisol sube la glucosa', body: 'El estrés libera cortisol, que eleva la glucosa. Técnicas como respiración profunda o 5 minutos de meditación pueden ayudar a controlarlo.', icon: '🧘', color: '#f4a2c0', readTime: '3 min lectura', saved: false },
];

const FALLBACK_NEWS: NewsItem[] = [
  { id: 'fn1', headline: 'Nuevo sensor CGM detecta glucosa sin calibración diaria', summary: 'Investigadores desarrollan sensor de glucosa continuo que funciona por 30 días sin calibración, mejorando la calidad de vida de pacientes con T1D.', source: 'Diabetes Technology Society', tag: 'Tecnología', color: '#86d0ef' },
  { id: 'fn2', headline: 'Dieta mediterránea reduce HbA1c en pacientes T2D', summary: 'Estudio de 12 meses confirma que seguir una dieta mediterránea reduce la hemoglobina glicosilada en 0.8% en personas con diabetes tipo 2.', source: 'European Diabetes Journal', tag: 'Nutrición', color: '#a4f4b7' },
  { id: 'fn3', headline: 'IA predice hipoglucemias nocturnas con 2 horas de anticipación', summary: 'Algoritmo de aprendizaje automático puede predecir episodios de hipoglucemia nocturna con una precisión del 87%, permitiendo alertas preventivas.', source: 'Journal of Diabetes Science', tag: 'Investigación', color: '#c4b5fd' },
];

// ─── STYLES ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#121212' },

  header:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  headerTitle:     { color: '#c4ebe0', fontSize: 24, fontWeight: '800' },
  headerSub:       { color: '#4a5153', fontSize: 11, marginTop: 1 },
  glucoseBadge:    { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 100, borderWidth: 1 },
  glucoseBadgeTxt: { fontSize: 12, fontWeight: '800' },

  mainTabRow:      { flexDirection: 'row', marginHorizontal: 20, marginBottom: 8, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: 3, gap: 3 },
  mainTab:         { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 9, borderRadius: 12 },
  mainTabActive:   { backgroundColor: '#006782' },
  mainTabTxt:      { color: '#4a5153', fontSize: 12, fontWeight: '700' },
  mainTabTxtActive:{ color: '#fff' },
  aiBadge:         { backgroundColor: 'rgba(134,208,239,0.2)', paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4 },
  aiBadgeTxt:      { color: '#86d0ef', fontSize: 7, fontWeight: '800', letterSpacing: 0.5 },

  // Consejos
  heroCard:        { marginHorizontal: 20, backgroundColor: 'rgba(0,103,130,0.12)', borderRadius: 24, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(0,103,130,0.2)' },
  heroTop:         { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 10 },
  heroEmoji:       { fontSize: 28, marginTop: 2 },
  heroLabel:       { color: '#4a5153', fontSize: 9, fontWeight: '800', letterSpacing: 1.5, marginBottom: 4 },
  heroTitle:       { color: '#c4ebe0', fontSize: 14, fontWeight: '700', lineHeight: 20 },
  heroBody:        { color: '#6f787d', fontSize: 13, lineHeight: 20 },
  refreshBtn:      { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, alignSelf: 'flex-start' },
  refreshTxt:      { color: '#86d0ef', fontSize: 12, fontWeight: '700' },

  catRow:          { paddingHorizontal: 20, paddingBottom: 12, gap: 8 },
  catChip:         { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'transparent' },
  catTxt:          { color: '#4a5153', fontSize: 12, fontWeight: '700' },

  cardsSection:    { paddingHorizontal: 16 },
  savedSection:    { paddingHorizontal: 16, marginTop: 8 },
  savedTitle:      { color: '#86d0ef', fontSize: 16, fontWeight: '800', marginBottom: 12 },

  // Noticias
  newsHero:        { margin: 20, backgroundColor: 'rgba(134,208,239,0.06)', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: 'rgba(134,208,239,0.1)' },
  newsHeroTop:     { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  newsHeroLabel:   { color: '#86d0ef', fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  newsHeroTitle:   { color: '#ecf2f3', fontSize: 22, fontWeight: '800', marginBottom: 4 },
  newsHeroSub:     { color: '#4a5153', fontSize: 11 },
  newsSection:     { paddingHorizontal: 16 },
  disclaimer:      { marginHorizontal: 16, marginTop: 16, backgroundColor: 'rgba(245,158,11,0.06)', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: 'rgba(245,158,11,0.15)' },
  disclaimerTxt:   { color: '#6f787d', fontSize: 11, lineHeight: 16 },

  // Chat
  chatHeader:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.06)' },
  botInfo:         { flexDirection: 'row', alignItems: 'center', gap: 12 },
  botAvatar:       { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1d2426', alignItems: 'center', justifyContent: 'center' },
  botName:         { color: '#ecf2f3', fontSize: 15, fontWeight: '800' },
  onlineRow:       { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  onlineDot:       { width: 6, height: 6, borderRadius: 3, backgroundColor: '#22c55e' },
  onlineTxt:       { color: '#4a5153', fontSize: 10 },
  aiBadgeLarge:    { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(134,208,239,0.1)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 100, borderWidth: 1, borderColor: 'rgba(134,208,239,0.2)' },
  aiBadgeLargeTxt: { color: '#86d0ef', fontSize: 11, fontWeight: '800' },
  quickRow:        { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  quickChip:       { backgroundColor: '#1d2426', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 100, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  quickTxt:        { color: '#86d0ef', fontSize: 12, fontWeight: '600' },
  chatMessages:    { padding: 16, paddingBottom: 20 },
  typingDots:      { flexDirection: 'row', gap: 4, paddingHorizontal: 4 },
  inputRow:        { flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,0.06)' },
  chatInput:       { flex: 1, backgroundColor: '#1d2426', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, color: '#ecf2f3', fontSize: 14, maxHeight: 100 },
  sendBtn:         { width: 42, height: 42, borderRadius: 21, backgroundColor: '#006782', alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { opacity: 0.4 },
});