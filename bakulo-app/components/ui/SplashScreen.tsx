/**
 * SplashScreen.tsx — Pantalla de carga animada
 *
 * Uso en app/_layout.tsx:
 *   1. Importa: import { AppSplashScreen } from '@/components/ui/SplashScreen';
 *   2. En RootLayout, muestra AppSplashScreen mientras isReady === false
 *
 * La pantalla se oculta automáticamente tras ~2.8s con fade-out.
 */

import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated, Dimensions, Easing,
} from 'react-native';
import Svg, {
  Circle, Defs, RadialGradient, Stop, Path, G,
} from 'react-native-svg';

const { width, height } = Dimensions.get('window');

// ─── ANIMATED LOGO ────────────────────────────────────────────────────────────

function AnimatedLogo({ scale, opacity }: { scale: Animated.Value; opacity: Animated.Value }) {
  const ringRotate = useRef(new Animated.Value(0)).current;
  const dropOpacity = useRef(new Animated.Value(0)).current;
  const dropY = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    // Ring slow spin
    Animated.loop(
      Animated.timing(ringRotate, {
        toValue: 1,
        duration: 6000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Drop reveal
    Animated.sequence([
      Animated.delay(400),
      Animated.parallel([
        Animated.spring(dropY, { toValue: 0, tension: 80, friction: 8, useNativeDriver: true }),
        Animated.timing(dropOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  const spin = ringRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View style={{ transform: [{ scale }], opacity }}>
      {/* Outer glow ring — rotates */}
      <Animated.View style={{ transform: [{ rotate: spin }] }}>
        <Svg width={120} height={120} viewBox="0 0 120 120">
          <Defs>
            <RadialGradient id="glow" cx="50%" cy="50%" r="50%">
              <Stop offset="0%"   stopColor="#c4ebe0" stopOpacity="0.3" />
              <Stop offset="100%" stopColor="#004e63" stopOpacity="0"   />
            </RadialGradient>
          </Defs>
          {/* Background glow */}
          <Circle cx="60" cy="60" r="58" fill="url(#glow)" />
          {/* Dashed orbit ring */}
          <Circle
            cx="60" cy="60" r="52"
            stroke="rgba(196,235,224,0.15)"
            strokeWidth="1"
            strokeDasharray="6 4"
            fill="none"
          />
          {/* Arc highlight */}
          <Path
            d="M 60 8 A 52 52 0 0 1 112 60"
            stroke="#c4ebe0"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
            opacity="0.6"
          />
          {/* Small orbit dot */}
          <Circle cx="112" cy="60" r="3.5" fill="#c4ebe0" opacity="0.8" />
        </Svg>
      </Animated.View>

      {/* Center icon — fixed */}
      <Animated.View style={[logo.center, { opacity: dropOpacity, transform: [{ translateY: dropY }] }]}>
        <Svg width={52} height={52} viewBox="0 0 52 52">
          <Defs>
            <RadialGradient id="dropGrad" cx="50%" cy="30%" r="70%">
              <Stop offset="0%"   stopColor="#c4ebe0" />
              <Stop offset="100%" stopColor="#006782" />
            </RadialGradient>
          </Defs>
          {/* Drop shape */}
          <Path
            d="M26 6 C26 6 10 22 10 32 C10 41 17.2 48 26 48 C34.8 48 42 41 42 32 C42 22 26 6 26 6Z"
            fill="url(#dropGrad)"
          />
          {/* Inner shine */}
          <Path
            d="M20 28 C20 24 22 20 26 16"
            stroke="rgba(255,255,255,0.4)"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />
        </Svg>
      </Animated.View>
    </Animated.View>
  );
}

const logo = StyleSheet.create({
  center: {
    position: 'absolute',
    top: (120 - 52) / 2,
    left: (120 - 52) / 2,
  },
});

// ─── PULSE RINGS ─────────────────────────────────────────────────────────────

function PulseRing({ delay }: { delay: number }) {
  const scale   = useRef(new Animated.Value(0.4)).current;
  const opacity = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(scale,   { toValue: 2.2, duration: 2000, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0,   duration: 2000, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(scale,   { toValue: 0.4, duration: 0, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.6, duration: 0, useNativeDriver: true }),
        ]),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={[
        pulse.ring,
        { transform: [{ scale }], opacity },
      ]}
    />
  );
}

const pulse = StyleSheet.create({
  ring: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1.5,
    borderColor: 'rgba(196,235,224,0.3)',
  },
});

// ─── LOADING DOTS ─────────────────────────────────────────────────────────────

function LoadingDots() {
  const dots = [0, 1, 2].map(() => useRef(new Animated.Value(0.3)).current);

  useEffect(() => {
    const anims = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 180),
          Animated.timing(dot, { toValue: 1,   duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0.3, duration: 300, useNativeDriver: true }),
          Animated.delay((2 - i) * 180 + 200),
        ])
      )
    );
    anims.forEach(a => a.start());
    return () => anims.forEach(a => a.stop());
  }, []);

  return (
    <View style={ld.row}>
      {dots.map((dot, i) => (
        <Animated.View key={i} style={[ld.dot, { opacity: dot }]} />
      ))}
    </View>
  );
}

const ld = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  dot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#c4ebe0' },
});

// ─── MAIN SPLASH ─────────────────────────────────────────────────────────────

interface AppSplashScreenProps {
  onFinish: () => void;
}

export function AppSplashScreen({ onFinish }: AppSplashScreenProps) {
  const logoScale   = useRef(new Animated.Value(0.5)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textY       = useRef(new Animated.Value(16)).current;
  const screenOpacity = useRef(new Animated.Value(1)).current;

  // Background particles
  const p1x = useRef(new Animated.Value(0)).current;
  const p1y = useRef(new Animated.Value(0)).current;
  const p2x = useRef(new Animated.Value(0)).current;
  const p2y = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Particles drift
    const driftAnim = (x: Animated.Value, y: Animated.Value, tx: number, ty: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(x, { toValue: tx,  duration: 4000, easing: Easing.inOut(Easing.sine), useNativeDriver: true }),
            Animated.timing(y, { toValue: ty,  duration: 4000, easing: Easing.inOut(Easing.sine), useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.timing(x, { toValue: 0,   duration: 4000, easing: Easing.inOut(Easing.sine), useNativeDriver: true }),
            Animated.timing(y, { toValue: 0,   duration: 4000, easing: Easing.inOut(Easing.sine), useNativeDriver: true }),
          ]),
        ])
      );
    driftAnim(p1x, p1y, 18, -12).start();
    driftAnim(p2x, p2y, -14, 20).start();

    // Main entrance sequence
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]),
      Animated.delay(300),
      Animated.parallel([
        Animated.timing(textOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.spring(textY, { toValue: 0, tension: 70, friction: 10, useNativeDriver: true }),
      ]),
      Animated.delay(1400),
      // Fade out
      Animated.timing(screenOpacity, { toValue: 0, duration: 500, easing: Easing.in(Easing.quad), useNativeDriver: true }),
    ]).start(() => onFinish());
  }, []);

  return (
    <Animated.View style={[s.container, { opacity: screenOpacity }]}>
      {/* Background gradient layers */}
      <View style={s.bgTop} />
      <View style={s.bgBottom} />

      {/* Floating particles */}
      <Animated.View style={[s.particle, s.p1, { transform: [{ translateX: p1x }, { translateY: p1y }] }]} />
      <Animated.View style={[s.particle, s.p2, { transform: [{ translateX: p2x }, { translateY: p2y }] }]} />
      <View style={[s.particle, s.p3]} />
      <View style={[s.particle, s.p4]} />

      {/* Center content */}
      <View style={s.center}>
        {/* Pulse rings behind logo */}
        <View style={s.pulseWrap}>
          <PulseRing delay={0}    />
          <PulseRing delay={700}  />
          <PulseRing delay={1400} />
        </View>

        {/* Logo */}
        <AnimatedLogo scale={logoScale} opacity={logoOpacity} />

        {/* App name + tagline */}
        <Animated.View style={[s.textBlock, { opacity: textOpacity, transform: [{ translateY: textY }] }]}>
          <Text style={s.appName}>Serenity</Text>
          <Text style={s.tagline}>Control. Calma. Bienestar.</Text>
        </Animated.View>

        {/* Loading dots */}
        <Animated.View style={[s.dotsWrap, { opacity: textOpacity }]}>
          <LoadingDots />
        </Animated.View>
      </View>

      {/* Bottom version */}
      <Animated.View style={[s.bottom, { opacity: textOpacity }]}>
        <Text style={s.version}>versión 1.0.0</Text>
      </Animated.View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#080e10',
    zIndex: 9999,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Background layers
  bgTop: {
    position: 'absolute',
    top: -100,
    left: -100,
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: 'rgba(0,78,99,0.18)',
  },
  bgBottom: {
    position: 'absolute',
    bottom: -80,
    right: -80,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(0,82,41,0.12)',
  },

  // Floating particles
  particle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(196,235,224,0.06)',
  },
  p1: { width: 180, height: 180, top: height * 0.1,  left: -40  },
  p2: { width: 120, height: 120, bottom: height * 0.15, right: -20 },
  p3: { width: 60,  height: 60,  top: height * 0.25, right: 40, backgroundColor: 'rgba(134,208,239,0.05)' },
  p4: { width: 40,  height: 40,  bottom: height * 0.3, left: 30, backgroundColor: 'rgba(134,208,239,0.04)' },

  // Center
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 0,
  },
  pulseWrap: {
    position: 'absolute',
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Text
  textBlock: {
    alignItems: 'center',
    marginTop: 32,
    gap: 6,
  },
  appName: {
    color: '#c4ebe0',
    fontSize: 38,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  tagline: {
    color: 'rgba(196,235,224,0.45)',
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },

  dotsWrap: {
    marginTop: 40,
  },

  bottom: {
    position: 'absolute',
    bottom: 48,
  },
  version: {
    color: 'rgba(111,120,125,0.5)',
    fontSize: 11,
    letterSpacing: 1,
  },
});