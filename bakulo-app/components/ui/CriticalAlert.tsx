import React, { useEffect, useRef } from 'react';
import { 
  View, Text, StyleSheet, Modal, TouchableOpacity, 
  Animated, Platform, Dimensions 
} from 'react-native';
import { BlurView } from 'expo-blur';
import { AlertTriangle, Phone, Droplets, Info, TrendingDown } from 'lucide-react-native';

interface CriticalAlertProps {
  visible: boolean;
  onDismiss: () => void;
  glucoseValue: number;
}

export const CriticalAlert = ({ visible, onDismiss, glucoseValue }: CriticalAlertProps) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Animación de pulso para el icono de error
  useEffect(() => {
    if (visible) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        {/* Fondo desenfocado */}
        <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
        
        <View style={styles.alertContainer}>
          {/* Header de Advertencia */}
          <View style={styles.warningHeader}>
            <Animated.View style={[styles.iconCircle, { transform: [{ scale: pulseAnim }] }]}>
              <AlertTriangle color="#ffffff" size={32} fill="#ffffff" />
            </Animated.View>
            <View style={styles.headerTextContainer}>
              <Text style={styles.alertTitle}>CRITICAL GLUCOSE LEVEL DETECTED</Text>
              <Text style={styles.alertDescription}>
                Your current reading indicates hypoglycemia. Immediate action is required.
              </Text>
            </View>
          </View>

          {/* Visualización del Valor */}
          <View style={styles.valueDisplay}>
            <View style={styles.glucoseRow}>
              <Text style={styles.bigValue}>{glucoseValue}</Text>
              <Text style={styles.unitText}>mg/dL</Text>
            </View>
            <View style={styles.badge}>
              <TrendingDown color="#ba1a1a" size={14} />
              <Text style={styles.badgeText}>CRITICAL LOW</Text>
            </View>
          </View>

          {/* Botones de Acción */}
          <View style={styles.actionPadding}>
            <TouchableOpacity style={styles.primaryBtn} activeOpacity={0.8}>
              <Phone color="#ffffff" size={20} fill="#ffffff" />
              <Text style={styles.primaryBtnText}>Call Emergency Contact</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryBtn} activeOpacity={0.8}>
              <Droplets color="#a4f4b7" size={20} />
              <Text style={styles.secondaryBtnText}>Log Sugar Intake</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={onDismiss} style={styles.dismissBtn}>
              <Text style={styles.dismissBtnText}>Dismiss</Text>
            </TouchableOpacity>
          </View>

          {/* Footer de Emergencia */}
          <View style={styles.footer}>
            <Info color="#bfc8cd" size={16} />
            <Text style={styles.footerText}>
              Emergency protocols have been activated. Your location may be shared with contacts if no action is taken.
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: 'rgba(23, 29, 30, 0.6)',
  },
  alertContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#1d2426',
    borderRadius: 32,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  warningHeader: {
    padding: 32,
    alignItems: 'center',
    backgroundColor: 'rgba(186, 26, 26, 0.1)',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ba1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTextContainer: {
    alignItems: 'center',
    gap: 8,
  },
  alertTitle: {
    color: '#ba1a1a',
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'ios' ? 'Helvetica' : 'sans-serif-condensed',
  },
  alertDescription: {
    color: '#bfc8cd',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  valueDisplay: {
    backgroundColor: '#252d2f',
    paddingVertical: 24,
    alignItems: 'center',
  },
  glucoseRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  bigValue: {
    color: '#ba1a1a',
    fontSize: 64,
    fontWeight: '900',
    letterSpacing: -2,
  },
  unitText: {
    color: '#bfc8cd',
    fontSize: 20,
    fontWeight: '600',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(186, 26, 26, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 100,
    gap: 6,
    marginTop: 8,
  },
  badgeText: {
    color: '#ba1a1a',
    fontSize: 10,
    fontWeight: '800',
  },
  actionPadding: {
    padding: 24,
    gap: 12,
  },
  primaryBtn: {
    backgroundColor: '#ba1a1a',
    flexDirection: 'row',
    padding: 18,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#ba1a1a',
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  secondaryBtn: {
    backgroundColor: '#1a6c3c',
    flexDirection: 'row',
    padding: 18,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  secondaryBtnText: {
    color: '#a4f4b7',
    fontSize: 16,
    fontWeight: '800',
  },
  dismissBtn: {
    padding: 12,
    alignItems: 'center',
  },
  dismissBtnText: {
    color: '#bfc8cd',
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    flexDirection: 'row',
    gap: 12,
    opacity: 0.6,
  },
  footerText: {
    flex: 1,
    color: '#bfc8cd',
    fontSize: 11,
    lineHeight: 16,
  },
});