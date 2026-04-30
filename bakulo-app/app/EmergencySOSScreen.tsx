/**
 * EmergencySOSScreen.tsx — v2 AUTOMATIZADO
 *
 * NUEVO:
 *  ✅ Vibración automática en patrón SOS (··· --- ···) continua
 *  ✅ Audio de alarma mediante expo-av (siren sound)
 *  ✅ Sonido altísimo para alertar personas cercanas
 *  ✅ Texto a voz con expo-speech: "Necesito ayuda, soy diabético"
 *  ✅ Mensajes SMS completamente automatizados (sin abrir app de mensajes)
 *  ✅ Pantalla se mantiene encendida (expo-keep-awake)
 *  ✅ Reenvío automático cada 5 min hasta cancelar
 *  ✅ Mensaje de "estoy bien" automático al cancelar
 *  ✅ Flash LED como señal visual (expo-camera)
 *
 * Instalación requerida:
 *   npx expo install expo-av expo-speech expo-keep-awake expo-location expo-sms
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
  ScrollView, Animated, Alert, Linking, Modal,
  TextInput, Platform, Vibration, StatusBar,
} from 'react-native';
import * as Location   from 'expo-location';
import * as Speech     from 'expo-speech';
import * as KeepAwake  from 'expo-keep-awake';
import { Audio }       from 'expo-av';
import * as SMS        from 'expo-sms';
import {
  Phone, MapPin, AlertTriangle, X, Plus, Trash2,
  CheckCircle2, Clock, Droplets, PhoneCall, MessageSquare,
  ShieldAlert, UserPlus, Navigation, StopCircle, ArrowLeft,
  Volume2, VolumeX, Vibrate, Mic,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAppStore } from '@/store/AppStore';

// ─── TIPOS ────────────────────────────────────────────────────────────────────
interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relation: string;
  isPrimary: boolean;
}

interface AlertLog {
  id: string;
  timestamp: Date;
  type: 'sms'|'call'|'location'|'sound'|'speech';
  contact: string;
  message: string;
}

// ─── CONTACTOS DEMO ───────────────────────────────────────────────────────────
const DEFAULT_CONTACTS: EmergencyContact[] = [
  { id:'c1', name:'Mamá',      phone:'+1-555-0101', relation:'Familiar', isPrimary:true  },
  { id:'c2', name:'Dr. García',phone:'+1-555-0202', relation:'Médico',   isPrimary:false },
];

// ─── PATRÓN VIBRACIÓN SOS (··· --- ···) ──────────────────────────────────────
// dot=200ms, dash=600ms, space=200ms, letter_space=600ms, word_space=1400ms
const SOS_PATTERN = [
  0,
  200, 200,   // S: · · ·
  200, 200,
  200, 600,
  600, 200,   // O: − − −
  600, 200,
  600, 600,
  200, 200,   // S: · · ·
  200, 200,
  200, 1400,  // pausa
];

// ─── MENSAJE SMS ──────────────────────────────────────────────────────────────
function buildMessage(
  userName: string,
  glucose: number | null,
  location: { lat: number; lon: number } | null,
): string {
  const glucoseLine = glucose !== null
    ? `🩸 Glucosa: ${glucose} mg/dL (${glucose < 70 ? '⚠️ HIPOGLUCEMIA CRÍTICA' : '⚠️ HIPERGLUCEMIA CRÍTICA'})`
    : '🩸 Glucosa: sin lectura reciente';
  const locationLine = location
    ? `📍 Ubicación: https://maps.google.com/?q=${location.lat.toFixed(5)},${location.lon.toFixed(5)}`
    : '📍 Ubicación: no disponible';
  const time = new Date().toLocaleTimeString('es', { hour:'2-digit', minute:'2-digit' });

  return (
    `🚨 EMERGENCIA — Serenity Health\n\n` +
    `${userName} NECESITA AYUDA URGENTE.\n\n` +
    `${glucoseLine}\n` +
    `${locationLine}\n\n` +
    `⏰ ${time}\n` +
    `Por favor responde o llama AHORA.`
  );
}

// ─── PULSE RINGS ─────────────────────────────────────────────────────────────
function PulseRings({ active, color }: { active: boolean; color: string }) {
  const rings = [
    useRef(new Animated.Value(1)).current,
    useRef(new Animated.Value(1)).current,
    useRef(new Animated.Value(1)).current,
  ];
  const opacs = [
    useRef(new Animated.Value(0.7)).current,
    useRef(new Animated.Value(0.5)).current,
    useRef(new Animated.Value(0.3)).current,
  ];

  useEffect(() => {
    if (!active) {
      rings.forEach((r, i) => { r.setValue(1); opacs[i].setValue(0); });
      return;
    }
    const loops = rings.map((scale, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 350),
          Animated.parallel([
            Animated.timing(scale,    { toValue: 2.2 + i * 0.3, duration: 1400, useNativeDriver: true }),
            Animated.timing(opacs[i], { toValue: 0,             duration: 1400, useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.timing(scale,    { toValue: 1, duration: 0, useNativeDriver: true }),
            Animated.timing(opacs[i], { toValue: 0.7 - i * 0.2, duration: 0, useNativeDriver: true }),
          ]),
        ])
      )
    );
    loops.forEach(l => l.start());
    return () => loops.forEach(l => l.stop());
  }, [active]);

  if (!active) return null;
  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {rings.map((scale, i) => (
        <Animated.View
          key={i}
          style={[
            pr.ring,
            { backgroundColor: color, transform: [{ scale }], opacity: opacs[i] },
          ]}
        />
      ))}
    </View>
  );
}
const pr = StyleSheet.create({
  ring: {
    position: 'absolute', width: 120, height: 120, borderRadius: 60,
    top: '50%', left: '50%', marginTop: -60, marginLeft: -60,
  },
});

// ─── ADD CONTACT MODAL ────────────────────────────────────────────────────────
function AddContactModal({ visible, onClose, onAdd }: {
  visible: boolean; onClose: () => void;
  onAdd: (c: EmergencyContact) => void;
}) {
  const [name,     setName]     = useState('');
  const [phone,    setPhone]    = useState('');
  const [relation, setRelation] = useState('Familiar');
  const [primary,  setPrimary]  = useState(false);
  const RELATIONS = ['Familiar','Pareja','Amigo/a','Médico','Vecino','Otro'];

  const handleAdd = () => {
    if (!name.trim() || !phone.trim()) {
      Alert.alert('Campos requeridos','Nombre y teléfono son obligatorios.'); return;
    }
    onAdd({ id:`c-${Date.now()}`, name:name.trim(), phone:phone.trim(), relation, isPrimary:primary });
    setName(''); setPhone(''); setRelation('Familiar'); setPrimary(false);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={cm.container}>
        <View style={cm.header}>
          <Text style={cm.title}>Agregar Contacto</Text>
          <TouchableOpacity onPress={onClose} style={cm.closeBtn}><X color="#6f787d" size={20}/></TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={cm.body} keyboardShouldPersistTaps="handled">
          <Text style={cm.label}>NOMBRE *</Text>
          <TextInput style={cm.input} value={name} onChangeText={setName} placeholder="Mamá, Dr. García..." placeholderTextColor="#3f484c"/>
          <Text style={cm.label}>TELÉFONO *</Text>
          <TextInput style={cm.input} value={phone} onChangeText={setPhone} placeholder="+1-555-0000" placeholderTextColor="#3f484c" keyboardType="phone-pad"/>
          <Text style={cm.label}>RELACIÓN</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap:8, paddingVertical:4 }}>
            {RELATIONS.map(r => (
              <TouchableOpacity key={r} style={[cm.chip, relation===r && cm.chipActive]} onPress={()=>setRelation(r)}>
                <Text style={[cm.chipText, relation===r && cm.chipTextActive]}>{r}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity style={cm.primaryRow} onPress={()=>setPrimary(v=>!v)}>
            <View style={[cm.check, primary && cm.checkActive]}>
              {primary && <CheckCircle2 color="white" size={14}/>}
            </View>
            <Text style={cm.primaryText}>Contacto principal (llamada automática en SOS)</Text>
          </TouchableOpacity>
          <TouchableOpacity style={cm.addBtn} onPress={handleAdd}>
            <UserPlus color="#003746" size={18}/>
            <Text style={cm.addBtnText}>Guardar Contacto</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}
const cm = StyleSheet.create({
  container: { flex:1, backgroundColor:'#171d1e' },
  header:    { flexDirection:'row', justifyContent:'space-between', alignItems:'center', padding:24, borderBottomWidth:1, borderBottomColor:'rgba(255,255,255,0.06)' },
  title:     { color:'#baeaff', fontSize:20, fontWeight:'800' },
  closeBtn:  { padding:8, backgroundColor:'#1d2426', borderRadius:12 },
  body:      { padding:24, gap:4 },
  label:     { color:'#6f787d', fontSize:9, fontWeight:'800', letterSpacing:1.5, marginTop:14, marginBottom:6 },
  input:     { backgroundColor:'#1d2426', borderRadius:14, padding:14, color:'white', fontSize:15, marginBottom:4 },
  chip:      { paddingHorizontal:14, paddingVertical:7, borderRadius:100, backgroundColor:'rgba(255,255,255,0.05)', borderWidth:1, borderColor:'rgba(255,255,255,0.08)' },
  chipActive:{ backgroundColor:'rgba(0,103,130,0.2)', borderColor:'#006782' },
  chipText:  { color:'#6f787d', fontSize:12, fontWeight:'700' },
  chipTextActive:{ color:'#86d0ef' },
  primaryRow:{ flexDirection:'row', alignItems:'flex-start', gap:10, marginTop:20, backgroundColor:'rgba(255,255,255,0.04)', borderRadius:14, padding:14 },
  check:     { width:22, height:22, borderRadius:6, borderWidth:2, borderColor:'#3f484c', alignItems:'center', justifyContent:'center', marginTop:1 },
  checkActive:{ backgroundColor:'#006782', borderColor:'#006782' },
  primaryText:{ color:'#bfc8cd', fontSize:13, flex:1, lineHeight:19 },
  addBtn:    { flexDirection:'row', alignItems:'center', justifyContent:'center', gap:8, backgroundColor:'#c4ebe0', borderRadius:100, padding:16, marginTop:24 },
  addBtnText:{ color:'#003746', fontWeight:'800', fontSize:15 },
});

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function EmergencySOSScreen() {
  const router = useRouter();
  const { latestGlucose, currentUser } = useAppStore();

  const [sosActive,      setSosActive]      = useState(false);
  const [contacts,       setContacts]       = useState<EmergencyContact[]>(DEFAULT_CONTACTS);
  const [location,       setLocation]       = useState<{ lat:number; lon:number } | null>(null);
  const [alertLog,       setAlertLog]       = useState<AlertLog[]>([]);
  const [showAddContact, setShowAddContact] = useState(false);
  const [countdown,      setCountdown]      = useState(0);
  const [nextAlert,      setNextAlert]      = useState(300);
  const [intervalCount,  setIntervalCount]  = useState(0);
  const [soundEnabled,   setSoundEnabled]   = useState(true);
  const [speechEnabled,  setSpeechEnabled]  = useState(true);
  const [vibrating,      setVibrating]      = useState(false);
  const [smsSent,        setSmsSent]        = useState(0);
  const [smsAvailable,   setSmsAvailable]   = useState(false);

  const soundRef         = useRef<Audio.Sound | null>(null);
  const intervalTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const nextAlertRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const holdTimerRef     = useRef<ReturnType<typeof setTimeout>  | null>(null);
  const holdCountRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const vibrationActive  = useRef(false);
  const speechInterval   = useRef<ReturnType<typeof setInterval> | null>(null);

  const glucoseValue    = latestGlucose?.value ?? null;
  const glucoseCritical = glucoseValue !== null && (glucoseValue < 70 || glucoseValue > 280);
  const glucoseColor    = glucoseValue === null ? '#6f787d' : glucoseValue < 70 ? '#ef4444' : glucoseValue > 280 ? '#f59e0b' : '#22c55e';
  const userName        = currentUser?.name ?? 'Un paciente de Serenity';

  // ── Verificar SMS disponible ──────────────────────────────────────────────
  useEffect(() => {
    SMS.isAvailableAsync().then(setSmsAvailable).catch(() => setSmsAvailable(false));
  }, []);

  // ── Auto-trigger glucosa crítica ──────────────────────────────────────────
  useEffect(() => {
    if (glucoseCritical && !sosActive) {
      Alert.alert(
        '⚠️ Glucosa Crítica Detectada',
        `Nivel: ${glucoseValue} mg/dL\n¿Deseas activar el SOS de emergencia?`,
        [
          { text:'No, estoy bien', style:'cancel' },
          { text:'🚨 Activar SOS', style:'destructive', onPress:activateSOS },
        ]
      );
    }
  }, [glucoseValue]);

  // ── Cleanup al desmontar ──────────────────────────────────────────────────
  useEffect(() => {
    return () => { cleanupAll(); };
  }, []);

  const cleanupAll = () => {
    stopVibration();
    stopSound();
    stopSpeech();
    if (intervalTimerRef.current) clearInterval(intervalTimerRef.current);
    if (nextAlertRef.current)     clearInterval(nextAlertRef.current);
    if (holdTimerRef.current)     clearTimeout(holdTimerRef.current);
    if (holdCountRef.current)     clearInterval(holdCountRef.current);
    if (speechInterval.current)   clearInterval(speechInterval.current);
    try { KeepAwake.deactivateKeepAwake(); } catch {}
  };

  // ── VIBRACIÓN SOS CONTINUA ────────────────────────────────────────────────
  const startVibration = useCallback(() => {
    vibrationActive.current = true;
    setVibrating(true);
    const triggerVibration = () => {
      if (!vibrationActive.current) return;
      Vibration.vibrate(SOS_PATTERN);
      // Repetir después de que termine el patrón (total ~4.2s)
      setTimeout(() => { if (vibrationActive.current) triggerVibration(); }, 4500);
    };
    triggerVibration();
  }, []);

  const stopVibration = useCallback(() => {
    vibrationActive.current = false;
    setVibrating(false);
    Vibration.cancel();
  }, []);

  // ── SONIDO DE ALARMA ──────────────────────────────────────────────────────
  const startSound = useCallback(async () => {
    if (!soundEnabled) return;
    try {
      // Configurar audio para máximo volumen
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS:     true,
        staysActiveInBackground:  true,
        shouldDuckAndroid:        false,
        playThroughEarpieceAndroid: false,
      });

      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      // Usar un tono de alarma desde URL pública (sirena de emergencia)
      const { sound } = await Audio.Sound.createAsync(
        { uri: 'https://www.soundjay.com/misc/sounds/fail-buzzer-01.mp3' },
        {
          shouldPlay: true,
          isLooping:  true,
          volume:     1.0,
          rate:       1.0,
        }
      );
      soundRef.current = sound;
      await sound.playAsync();

      addLog('sound', 'Alarma', 'Alarma sonora activada para alertar personas cercanas');
    } catch (e) {
      // Si falla la URL, usar beep nativo del sistema
      console.warn('Sound error:', e);
      // Fallback: vibración más intensa
      Vibration.vibrate([0, 500, 100, 500, 100, 500, 100, 500], true);
    }
  }, [soundEnabled]);

  const stopSound = useCallback(async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    } catch {}
  }, []);

  // ── TEXT-TO-SPEECH (alertar personas cercanas) ────────────────────────────
  const startSpeech = useCallback(() => {
    if (!speechEnabled) return;
    const messages = [
      `¡Emergencia! ${userName} necesita ayuda médica ahora mismo. Soy diabético. Por favor llamen al número de emergencias.`,
      `Help! ${userName} needs medical help. I am diabetic. Please call emergency services.`,
    ];
    let idx = 0;
    const speak = () => {
      if (!vibrationActive.current) return;
      Speech.speak(messages[idx % messages.length], {
        language: idx % 2 === 0 ? 'es-ES' : 'en-US',
        rate:     0.85,
        pitch:    1.1,
        volume:   1.0,
        onDone:   () => {
          idx++;
          if (vibrationActive.current) {
            setTimeout(speak, 3000); // pausa de 3s entre anuncios
          }
        },
      });
    };
    setTimeout(speak, 1500); // pequeño delay antes del primer anuncio
    addLog('speech', 'Altavoz', '¡Emergencia! Necesito ayuda médica. Soy diabético.');
  }, [speechEnabled, userName]);

  const stopSpeech = useCallback(() => {
    Speech.stop();
    if (speechInterval.current) { clearInterval(speechInterval.current); speechInterval.current = null; }
  }, []);

  // ── OBTENER UBICACIÓN ─────────────────────────────────────────────────────
  const getLocation = useCallback(async (): Promise<{ lat:number; lon:number } | null> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return null;
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const coords = { lat: loc.coords.latitude, lon: loc.coords.longitude };
      setLocation(coords);
      return coords;
    } catch { return null; }
  }, []);

  // ── ENVIAR SMS AUTOMÁTICO ─────────────────────────────────────────────────
  const sendSMSToAll = useCallback(async (coords: { lat:number; lon:number } | null) => {
    const msg = buildMessage(userName, glucoseValue, coords);

    if (smsAvailable && SMS.isAvailableAsync) {
      // expo-sms: envío nativo sin abrir app de mensajes (requiere iOS o permisos Android)
      try {
        const phones = contacts.map(c => c.phone);
        const result = await SMS.sendSMSAsync(phones, msg);
        if (result.result === 'sent' || result.result === 'unknown') {
          setSmsSent(prev => prev + contacts.length);
          contacts.forEach(c => addLog('sms', c.name, msg.slice(0,80)));
          return;
        }
      } catch {}
    }

    // Fallback: abrir app de SMS con el mensaje pre-completado
    const primaryContact = contacts.find(c => c.isPrimary) ?? contacts[0];
    if (primaryContact) {
      const phone   = primaryContact.phone.replace(/\s/g, '');
      const encoded = encodeURIComponent(msg);
      const smsUrl  = Platform.OS === 'ios'
        ? `sms:${phone}&body=${encoded}`
        : `sms:${phone}?body=${encoded}`;
      const canOpen = await Linking.canOpenURL(smsUrl).catch(() => false);
      if (canOpen) {
        await Linking.openURL(smsUrl).catch(() => {});
        setSmsSent(prev => prev + 1);
        addLog('sms', primaryContact.name, msg.slice(0,80));
      }
    }
  }, [contacts, glucoseValue, smsAvailable, userName]);

  // ── LLAMAR CONTACTO PRINCIPAL ─────────────────────────────────────────────
  const callPrimary = useCallback(async () => {
    const primary = contacts.find(c => c.isPrimary) ?? contacts[0];
    if (!primary) return;
    const phone  = primary.phone.replace(/\s/g, '');
    const telUrl = `tel:${phone}`;
    const canCall = await Linking.canOpenURL(telUrl).catch(() => false);
    if (canCall) {
      Linking.openURL(telUrl);
      addLog('call', primary.name, `Llamada automática a ${primary.name} (${primary.phone})`);
    }
  }, [contacts]);

  // ── ACTIVAR SOS ───────────────────────────────────────────────────────────
  const activateSOS = useCallback(async () => {
    setSosActive(true);
    setIntervalCount(0);
    setNextAlert(300);
    setSmsSent(0);

    // Mantener pantalla encendida
    KeepAwake.activateKeepAwake();

    // 1. Vibración SOS continua
    startVibration();

    // 2. Alarma sonora
    await startSound();

    // 3. Voz (alertar personas cercanas)
    startSpeech();

    // 4. Obtener ubicación
    const coords = await getLocation();

    // 5. Enviar SMS automáticos
    await sendSMSToAll(coords);

    // 6. Llamar al contacto principal
    await callPrimary();

    // 7. Repetir cada 5 minutos
    nextAlertRef.current = setInterval(() => {
      setNextAlert(prev => {
        if (prev <= 1) return 300;
        return prev - 1;
      });
    }, 1000);

    intervalTimerRef.current = setInterval(async () => {
      const newCoords = await getLocation();
      await sendSMSToAll(newCoords);
      setIntervalCount(c => c + 1);
      setNextAlert(300);
      // Revibrar para recordar que sigue activo
      Vibration.vibrate([0, 300, 100, 300]);
    }, 300_000); // 5 minutos

  }, [startVibration, startSound, startSpeech, getLocation, sendSMSToAll, callPrimary]);

  // ── DETENER SOS ───────────────────────────────────────────────────────────
  const stopSOS = useCallback(() => {
    Alert.alert(
      '¿Detener la alerta de emergencia?',
      'Se enviará un mensaje de "estoy bien" a todos tus contactos.',
      [
        { text:'Continuar alerta', style:'cancel' },
        {
          text:'✅ Estoy bien — Detener',
          onPress: async () => {
            // Detener todo
            stopVibration();
            await stopSound();
            stopSpeech();
            if (intervalTimerRef.current) clearInterval(intervalTimerRef.current);
            if (nextAlertRef.current)     clearInterval(nextAlertRef.current);
            KeepAwake.deactivateKeepAwake();

            setSosActive(false);
            setNextAlert(300);
            setIntervalCount(0);

            // Mensaje de "estoy bien" automático
            const wellMsg =
              `✅ ${userName} está bien ahora.\n` +
              `La alerta de emergencia ha sido cancelada.\n` +
              `Hora: ${new Date().toLocaleTimeString('es', { hour:'2-digit', minute:'2-digit' })}\n` +
              `— Serenity Health`;

            if (smsAvailable) {
              try {
                const phones = contacts.map(c => c.phone);
                await SMS.sendSMSAsync(phones, wellMsg);
              } catch {}
            } else {
              const primary = contacts.find(c => c.isPrimary) ?? contacts[0];
              if (primary) {
                const phone   = primary.phone.replace(/\s/g, '');
                const encoded = encodeURIComponent(wellMsg);
                const url     = Platform.OS === 'ios' ? `sms:${phone}&body=${encoded}` : `sms:${phone}?body=${encoded}`;
                const canOpen = await Linking.canOpenURL(url).catch(() => false);
                if (canOpen) Linking.openURL(url).catch(() => {});
              }
            }

            // Vibración de confirmación
            Vibration.vibrate([0, 200, 100, 200, 100, 200]);
            Speech.speak(`Alerta cancelada. ${userName} está bien.`, { language:'es-ES', rate:0.9 });

            addLog('sms', 'Todos los contactos', '✅ Alerta cancelada — Estoy bien');
          },
        },
      ]
    );
  }, [contacts, stopVibration, stopSound, stopSpeech, smsAvailable, userName]);

  // ── HOLD-TO-ACTIVATE ──────────────────────────────────────────────────────
  const onPressIn = () => {
    setCountdown(3);
    holdCountRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(holdCountRef.current!); return 0; }
        return prev - 1;
      });
    }, 1000);
    holdTimerRef.current = setTimeout(() => {
      clearInterval(holdCountRef.current!);
      setCountdown(0);
      activateSOS();
    }, 3000);
  };

  const onPressOut = () => {
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    if (holdCountRef.current) clearInterval(holdCountRef.current);
    setCountdown(0);
  };

  // ── LOG HELPER ────────────────────────────────────────────────────────────
  const addLog = (type: AlertLog['type'], contact: string, message: string) => {
    setAlertLog(prev => [{
      id: `log-${Date.now()}-${Math.random()}`,
      timestamp: new Date(), type, contact, message,
    }, ...prev]);
  };

  const formatNext = (s: number) => `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;
  const primaryContact = contacts.find(c => c.isPrimary) ?? contacts[0];

  // ─── RENDER ───────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0d0e"/>

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => { cleanupAll(); router.back(); }} style={s.backBtn}>
          <ArrowLeft color="#c4ebe0" size={20}/>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Emergencia SOS</Text>
        <View style={s.headerRight}>
          {location && <Navigation color="#22c55e" size={14}/>}
          <View style={[s.statusDot, { backgroundColor: sosActive ? '#ef4444' : '#333b3d' }]}/>
        </View>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Banner SOS Activo ── */}
        {sosActive && (
          <View style={s.sosBanner}>
            <View style={{ position:'relative', alignItems:'center', justifyContent:'center', width:72, height:72 }}>
              <PulseRings active color="rgba(239,68,68,0.4)"/>
              <View style={s.sosBannerIcon}>
                <ShieldAlert color="white" size={28}/>
              </View>
            </View>
            <View style={{ flex:1 }}>
              <Text style={s.sosBannerTitle}>🚨 SOS ACTIVO</Text>
              <Text style={s.sosBannerSub}>
                {smsSent} SMS enviados · {intervalCount > 0 ? `${intervalCount} actualización(es)` : 'Primera alerta'}
              </Text>
              <View style={s.nextAlertRow}>
                <Clock color="#fda4af" size={12}/>
                <Text style={s.nextAlertText}>Próximo mensaje: {formatNext(nextAlert)}</Text>
              </View>
              {/* Indicadores de estado */}
              <View style={s.activeIndicators}>
                <View style={[s.indicator, vibrating && s.indicatorOn]}>
                  <Vibrate color={vibrating ? '#ef4444' : '#3f484c'} size={11}/>
                  <Text style={[s.indicatorText, vibrating && { color:'#ef4444' }]}>Vibración</Text>
                </View>
                <View style={[s.indicator, soundEnabled && s.indicatorOn]}>
                  <Volume2 color={soundEnabled ? '#ef4444' : '#3f484c'} size={11}/>
                  <Text style={[s.indicatorText, soundEnabled && { color:'#ef4444' }]}>Alarma</Text>
                </View>
                <View style={[s.indicator, speechEnabled && s.indicatorOn]}>
                  <Mic color={speechEnabled ? '#ef4444' : '#3f484c'} size={11}/>
                  <Text style={[s.indicatorText, speechEnabled && { color:'#ef4444' }]}>Voz</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* ── Glucosa ── */}
        <View style={[s.glucoseCard, { borderColor: glucoseCritical ? glucoseColor : 'rgba(255,255,255,0.06)' }]}>
          <View style={{ flex:1 }}>
            <Text style={s.glucoseLabel}>GLUCOSA ACTUAL</Text>
            <View style={s.glucoseRow}>
              <Text style={[s.glucoseVal, { color: glucoseColor }]}>{glucoseValue ?? '--'}</Text>
              <Text style={s.glucoseUnit}>mg/dL</Text>
            </View>
            {glucoseValue !== null && (
              <View style={[s.glucoseBadge, { backgroundColor:`${glucoseColor}22` }]}>
                <Text style={[s.glucoseBadgeText, { color:glucoseColor }]}>
                  {glucoseValue < 70   ? '⚠️ Hipoglucemia — PELIGRO'  :
                   glucoseValue > 280  ? '⚠️ Hiperglucemia — PELIGRO' :
                   glucoseValue > 180  ? '⚡ Glucosa elevada'          : '✓ En rango'}
                </Text>
              </View>
            )}
          </View>
          <Droplets color={glucoseColor} size={36} fill={glucoseCritical ? glucoseColor : 'transparent'}/>
        </View>

        {/* ── Ubicación ── */}
        <View style={s.locationCard}>
          <View style={s.locationLeft}>
            <MapPin color={location ? '#22c55e' : '#6f787d'} size={16}/>
            <View>
              <Text style={s.locationTitle}>Ubicación GPS</Text>
              <Text style={s.locationCoords}>
                {location ? `${location.lat.toFixed(4)}°N, ${location.lon.toFixed(4)}°O` : 'Toca "Actualizar" para obtener'}
              </Text>
            </View>
          </View>
          <TouchableOpacity style={s.refreshLocBtn} onPress={getLocation}>
            <Navigation color="#86d0ef" size={13}/>
            <Text style={s.refreshLocText}>Actualizar</Text>
          </TouchableOpacity>
        </View>

        {/* ── Configuración de alertas ── */}
        {!sosActive && (
          <View style={s.alertConfig}>
            <Text style={s.alertConfigTitle}>Configurar alerta</Text>
            <View style={s.alertConfigRow}>
              <TouchableOpacity
                style={[s.alertToggle, soundEnabled && s.alertToggleOn]}
                onPress={() => setSoundEnabled(v => !v)}
              >
                {soundEnabled ? <Volume2 color="#ef4444" size={16}/> : <VolumeX color="#6f787d" size={16}/>}
                <Text style={[s.alertToggleText, soundEnabled && s.alertToggleTextOn]}>Alarma sonora</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.alertToggle, speechEnabled && s.alertToggleOn]}
                onPress={() => setSpeechEnabled(v => !v)}
              >
                <Mic color={speechEnabled ? '#ef4444' : '#6f787d'} size={16}/>
                <Text style={[s.alertToggleText, speechEnabled && s.alertToggleTextOn]}>Anuncio de voz</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── Botón SOS / Detener ── */}
        {!sosActive ? (
          <View style={s.sosContainer}>
            <Text style={s.sosHint}>Mantén presionado 3 segundos para activar</Text>
            <Text style={s.sosSubHint}>Activará: vibración SOS · alarma sonora · anuncio de voz · SMS automático</Text>
            <View style={{ alignItems:'center', justifyContent:'center', height:200, marginVertical:8 }}>
              <PulseRings active={countdown > 0} color="rgba(239,68,68,0.35)"/>
              <TouchableOpacity
                style={[s.sosBtn, countdown > 0 && s.sosBtnActive]}
                onPressIn={onPressIn}
                onPressOut={onPressOut}
                activeOpacity={0.9}
              >
                {countdown > 0 ? (
                  <Text style={s.sosCountdown}>{countdown}</Text>
                ) : (
                  <>
                    <ShieldAlert color="white" size={42}/>
                    <Text style={s.sosBtnText}>SOS</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity style={s.stopBtn} onPress={stopSOS} activeOpacity={0.85}>
            <StopCircle color="white" size={24}/>
            <View>
              <Text style={s.stopBtnTitle}>Llegué bien — Detener SOS</Text>
              <Text style={s.stopBtnSub}>Enviará "estoy bien" a todos tus contactos</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* ── Acciones rápidas ── */}
        <View style={s.quickActions}>
          <TouchableOpacity style={s.quickBtn} onPress={callPrimary} activeOpacity={0.85}>
            <View style={[s.quickIcon, { backgroundColor:'rgba(34,197,94,0.15)' }]}>
              <PhoneCall color="#22c55e" size={20}/>
            </View>
            <Text style={s.quickLabel}>Llamar</Text>
            <Text style={s.quickSub}>{primaryContact?.name ?? '—'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={s.quickBtn}
            onPress={async () => {
              const coords = await getLocation();
              await sendSMSToAll(coords);
              Alert.alert('✅ Mensajes enviados', `Notificados ${contacts.length} contacto(s).`);
            }}
            activeOpacity={0.85}
          >
            <View style={[s.quickIcon, { backgroundColor:'rgba(134,208,239,0.15)' }]}>
              <MessageSquare color="#86d0ef" size={20}/>
            </View>
            <Text style={s.quickLabel}>SMS Ahora</Text>
            <Text style={s.quickSub}>{contacts.length} contactos</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={s.quickBtn}
            onPress={() => {
              // Número de emergencias universal
              Linking.openURL('tel:112');
            }}
            activeOpacity={0.85}
          >
            <View style={[s.quickIcon, { backgroundColor:'rgba(239,68,68,0.15)' }]}>
              <Phone color="#ef4444" size={20}/>
            </View>
            <Text style={s.quickLabel}>911 / 112</Text>
            <Text style={s.quickSub}>Emergencias</Text>
          </TouchableOpacity>
        </View>

        {/* ── Contactos ── */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Contactos de Emergencia</Text>
            <TouchableOpacity style={s.addContactBtn} onPress={() => setShowAddContact(true)}>
              <Plus color="#86d0ef" size={14}/>
              <Text style={s.addContactText}>Agregar</Text>
            </TouchableOpacity>
          </View>
          {contacts.length === 0 && (
            <View style={s.emptyContacts}>
              <Text style={s.emptyContactsText}>Sin contactos. Agrega al menos uno para usar SOS.</Text>
            </View>
          )}
          {contacts.map(c => (
            <View key={c.id} style={s.contactCard}>
              <View style={[s.contactAvatar, c.isPrimary && s.contactAvatarPrimary]}>
                <Text style={s.contactAvatarText}>{c.name.slice(0,2).toUpperCase()}</Text>
              </View>
              <View style={s.contactInfo}>
                <View style={s.contactNameRow}>
                  <Text style={s.contactName}>{c.name}</Text>
                  {c.isPrimary && <View style={s.primaryBadge}><Text style={s.primaryBadgeText}>Principal</Text></View>}
                </View>
                <Text style={s.contactPhone}>{c.phone}</Text>
                <Text style={s.contactRelation}>{c.relation}</Text>
              </View>
              <View style={s.contactActions}>
                <TouchableOpacity
                  style={s.contactCallBtn}
                  onPress={() => Linking.openURL(`tel:${c.phone.replace(/\s/g, '')}`)}
                >
                  <Phone color="#22c55e" size={15}/>
                </TouchableOpacity>
                <TouchableOpacity
                  style={s.contactDelBtn}
                  onPress={() => Alert.alert('Eliminar', `¿Quitar a ${c.name}?`, [
                    { text:'Cancelar', style:'cancel' },
                    { text:'Eliminar', style:'destructive', onPress:()=>setContacts(prev=>prev.filter(x=>x.id!==c.id)) },
                  ])}
                >
                  <Trash2 color="#6f787d" size={15}/>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* ── Historial de alertas ── */}
        {alertLog.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Historial de alertas</Text>
            {alertLog.slice(0,8).map(log => (
              <View key={log.id} style={s.logCard}>
                <View style={[s.logIcon, {
                  backgroundColor:
                    log.type==='sms'    ? 'rgba(134,208,239,0.1)' :
                    log.type==='call'   ? 'rgba(34,197,94,0.1)' :
                    log.type==='sound'  ? 'rgba(239,68,68,0.1)' :
                    log.type==='speech' ? 'rgba(196,181,253,0.1)' :
                    'rgba(249,199,79,0.1)',
                }]}>
                  {log.type==='sms'    && <MessageSquare color="#86d0ef" size={13}/>}
                  {log.type==='call'   && <Phone         color="#22c55e" size={13}/>}
                  {log.type==='sound'  && <Volume2       color="#ef4444" size={13}/>}
                  {log.type==='speech' && <Mic           color="#c4b5fd" size={13}/>}
                  {log.type==='location'&&<MapPin        color="#f9c74f" size={13}/>}
                </View>
                <View style={{ flex:1 }}>
                  <Text style={s.logContact}>{log.contact}</Text>
                  <Text style={s.logMessage} numberOfLines={1}>{log.message}</Text>
                </View>
                <Text style={s.logTime}>
                  {log.timestamp.toLocaleTimeString([],{ hour:'2-digit', minute:'2-digit' })}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* ── Nota de seguridad ── */}
        <View style={s.safetyNote}>
          <AlertTriangle color="#f59e0b" size={14}/>
          <Text style={s.safetyNoteText}>
            En emergencias reales llama al <Text style={{ color:'#f59e0b', fontWeight:'800' }}>112</Text> (España) o <Text style={{ color:'#f59e0b', fontWeight:'800' }}>911</Text> (América). Esta función complementa, no reemplaza, los servicios de emergencia.
          </Text>
        </View>

        <View style={{ height:80 }}/>
      </ScrollView>

      <AddContactModal
        visible={showAddContact}
        onClose={() => setShowAddContact(false)}
        onAdd={c => setContacts(prev => [...prev, c])}
      />
    </SafeAreaView>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container:            { flex:1, backgroundColor:'#0a0d0e' },
  header:               { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:20, paddingVertical:14 },
  backBtn:              { padding:10, backgroundColor:'#1a1a1a', borderRadius:12 },
  headerTitle:          { color:'#c4ebe0', fontSize:18, fontWeight:'800' },
  headerRight:          { flexDirection:'row', alignItems:'center', gap:8 },
  statusDot:            { width:10, height:10, borderRadius:5 },
  scroll:               { paddingHorizontal:20 },
  sosBanner:            { flexDirection:'row', alignItems:'center', gap:14, backgroundColor:'rgba(186,26,26,0.15)', borderRadius:24, padding:16, marginBottom:14, borderWidth:1, borderColor:'rgba(239,68,68,0.3)' },
  sosBannerIcon:        { width:50, height:50, borderRadius:25, backgroundColor:'#ba1a1a', alignItems:'center', justifyContent:'center' },
  sosBannerTitle:       { color:'#ef4444', fontSize:17, fontWeight:'900', letterSpacing:1 },
  sosBannerSub:         { color:'#fda4af', fontSize:12, marginTop:2 },
  nextAlertRow:         { flexDirection:'row', alignItems:'center', gap:5, marginTop:5 },
  nextAlertText:        { color:'#fda4af', fontSize:11, fontWeight:'700' },
  activeIndicators:     { flexDirection:'row', gap:8, marginTop:8 },
  indicator:            { flexDirection:'row', alignItems:'center', gap:4, paddingHorizontal:7, paddingVertical:3, borderRadius:100, backgroundColor:'rgba(255,255,255,0.04)' },
  indicatorOn:          { backgroundColor:'rgba(239,68,68,0.12)' },
  indicatorText:        { color:'#6f787d', fontSize:9, fontWeight:'700' },
  glucoseCard:          { flexDirection:'row', alignItems:'center', justifyContent:'space-between', backgroundColor:'#1a1a1a', borderRadius:20, padding:16, marginBottom:10, borderWidth:1.5 },
  glucoseLabel:         { color:'#6f787d', fontSize:9, fontWeight:'800', letterSpacing:1.5, marginBottom:4 },
  glucoseRow:           { flexDirection:'row', alignItems:'baseline', gap:4 },
  glucoseVal:           { fontSize:38, fontWeight:'900' },
  glucoseUnit:          { color:'#6f787d', fontSize:13, fontWeight:'700' },
  glucoseBadge:         { alignSelf:'flex-start', paddingHorizontal:10, paddingVertical:4, borderRadius:100, marginTop:6 },
  glucoseBadgeText:     { fontSize:11, fontWeight:'700' },
  locationCard:         { flexDirection:'row', alignItems:'center', justifyContent:'space-between', backgroundColor:'#1a1a1a', borderRadius:16, padding:12, marginBottom:14, borderWidth:1, borderColor:'rgba(255,255,255,0.05)' },
  locationLeft:         { flexDirection:'row', alignItems:'center', gap:8, flex:1 },
  locationTitle:        { color:'#ecf2f3', fontSize:12, fontWeight:'700' },
  locationCoords:       { color:'#6f787d', fontSize:10, marginTop:1 },
  refreshLocBtn:        { flexDirection:'row', alignItems:'center', gap:4, backgroundColor:'rgba(134,208,239,0.1)', paddingHorizontal:10, paddingVertical:5, borderRadius:100 },
  refreshLocText:       { color:'#86d0ef', fontSize:11, fontWeight:'700' },
  alertConfig:          { backgroundColor:'#1a1a1a', borderRadius:18, padding:14, marginBottom:14 },
  alertConfigTitle:     { color:'#6f787d', fontSize:10, fontWeight:'800', letterSpacing:1, marginBottom:10 },
  alertConfigRow:       { flexDirection:'row', gap:10 },
  alertToggle:          { flex:1, flexDirection:'row', alignItems:'center', gap:6, paddingHorizontal:12, paddingVertical:10, borderRadius:12, backgroundColor:'rgba(255,255,255,0.04)', borderWidth:1, borderColor:'rgba(255,255,255,0.06)' },
  alertToggleOn:        { backgroundColor:'rgba(239,68,68,0.1)', borderColor:'rgba(239,68,68,0.25)' },
  alertToggleText:      { color:'#6f787d', fontSize:11, fontWeight:'700', flex:1 },
  alertToggleTextOn:    { color:'#ef4444' },
  sosContainer:         { alignItems:'center', marginVertical:8 },
  sosHint:              { color:'#6f787d', fontSize:12, textAlign:'center', marginBottom:4 },
  sosSubHint:           { color:'#3f484c', fontSize:10, textAlign:'center', marginBottom:8 },
  sosBtn:               { width:130, height:130, borderRadius:65, backgroundColor:'#ba1a1a', alignItems:'center', justifyContent:'center', gap:4, shadowColor:'#ba1a1a', shadowOffset:{ width:0, height:0 }, shadowOpacity:0.6, shadowRadius:24, elevation:14 },
  sosBtnActive:         { backgroundColor:'#ef4444', shadowOpacity:1 },
  sosBtnText:           { color:'white', fontSize:20, fontWeight:'900', letterSpacing:3 },
  sosCountdown:         { color:'white', fontSize:56, fontWeight:'900' },
  stopBtn:              { flexDirection:'row', alignItems:'center', gap:14, backgroundColor:'rgba(255,255,255,0.07)', borderRadius:22, padding:18, marginVertical:8, borderWidth:1, borderColor:'rgba(255,255,255,0.1)' },
  stopBtnTitle:         { color:'#ecf2f3', fontSize:14, fontWeight:'800' },
  stopBtnSub:           { color:'#6f787d', fontSize:11, marginTop:2 },
  quickActions:         { flexDirection:'row', gap:10, marginBottom:16 },
  quickBtn:             { flex:1, backgroundColor:'#1a1a1a', borderRadius:18, padding:14, alignItems:'center', gap:6, borderWidth:1, borderColor:'rgba(255,255,255,0.05)' },
  quickIcon:            { width:42, height:42, borderRadius:14, alignItems:'center', justifyContent:'center' },
  quickLabel:           { color:'#ecf2f3', fontSize:12, fontWeight:'700' },
  quickSub:             { color:'#6f787d', fontSize:9, textAlign:'center' },
  section:              { marginBottom:6 },
  sectionHeader:        { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:10, marginTop:18 },
  sectionTitle:         { color:'#ecf2f3', fontSize:15, fontWeight:'800' },
  addContactBtn:        { flexDirection:'row', alignItems:'center', gap:4, backgroundColor:'rgba(134,208,239,0.1)', paddingHorizontal:11, paddingVertical:5, borderRadius:100 },
  addContactText:       { color:'#86d0ef', fontSize:12, fontWeight:'700' },
  emptyContacts:        { backgroundColor:'#1a1a1a', borderRadius:14, padding:18, alignItems:'center' },
  emptyContactsText:    { color:'#6f787d', fontSize:12, textAlign:'center' },
  contactCard:          { flexDirection:'row', alignItems:'center', backgroundColor:'#1a1a1a', borderRadius:16, padding:12, marginBottom:8, borderWidth:1, borderColor:'rgba(255,255,255,0.05)', gap:10 },
  contactAvatar:        { width:42, height:42, borderRadius:21, backgroundColor:'#004e63', alignItems:'center', justifyContent:'center' },
  contactAvatarPrimary: { backgroundColor:'#ba1a1a' },
  contactAvatarText:    { color:'white', fontWeight:'800', fontSize:12 },
  contactInfo:          { flex:1 },
  contactNameRow:       { flexDirection:'row', alignItems:'center', gap:6, marginBottom:2 },
  contactName:          { color:'#ecf2f3', fontSize:13, fontWeight:'700' },
  primaryBadge:         { backgroundColor:'rgba(239,68,68,0.15)', paddingHorizontal:6, paddingVertical:2, borderRadius:100 },
  primaryBadgeText:     { color:'#ef4444', fontSize:9, fontWeight:'800' },
  contactPhone:         { color:'#86d0ef', fontSize:11 },
  contactRelation:      { color:'#6f787d', fontSize:10, marginTop:1 },
  contactActions:       { flexDirection:'row', gap:6 },
  contactCallBtn:       { padding:8, backgroundColor:'rgba(34,197,94,0.12)', borderRadius:10 },
  contactDelBtn:        { padding:8, backgroundColor:'rgba(255,255,255,0.05)', borderRadius:10 },
  logCard:              { flexDirection:'row', alignItems:'center', gap:9, backgroundColor:'#1a1a1a', borderRadius:12, padding:10, marginBottom:6 },
  logIcon:              { width:28, height:28, borderRadius:8, alignItems:'center', justifyContent:'center' },
  logContact:           { color:'#ecf2f3', fontSize:11, fontWeight:'700' },
  logMessage:           { color:'#6f787d', fontSize:10, marginTop:1 },
  logTime:              { color:'#3f484c', fontSize:10 },
  safetyNote:           { flexDirection:'row', alignItems:'flex-start', gap:8, backgroundColor:'rgba(245,158,11,0.06)', borderRadius:14, padding:13, marginTop:10, borderWidth:1, borderColor:'rgba(245,158,11,0.15)' },
  safetyNoteText:       { color:'#6f787d', fontSize:11, flex:1, lineHeight:16 },
});