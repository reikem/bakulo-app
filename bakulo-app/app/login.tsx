import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  SafeAreaView, 
  Image, 
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Mail, Lock, Eye, EyeOff, Scale, Apple } from 'lucide-react-native';

const { width } = Dimensions.get('window');

// Paleta de colores extraída de tu configuración de Tailwind
const Colors = {
  background: '#171d1e',
  primary: '#004e63',
  primaryFixed: '#baeaff',
  onPrimary: '#ffffff',
  secondaryFixedDim: '#a9cec4',
  inverseSurface: 'rgba(43, 49, 50, 0.3)',
  primaryContainer: '#006782',
  onPrimaryContainer: '#9fe2ff',
  outlineVariant: 'rgba(191, 200, 205, 0.1)',
};

export default function LoginScreen() {
  const [passwordVisible, setPasswordVisible] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      {/* Círculos de fondo con desenfoque (Simulados) */}
      <View style={[styles.blurCircle, { top: -50, left: -50, backgroundColor: Colors.primary }]} />
      <View style={[styles.blurCircle, { bottom: -50, right: -50, backgroundColor: '#005229' }]} />

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* Header / Logo */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Scale color={Colors.onPrimaryContainer} size={32} />
            </View>
            <Text style={styles.title}>Serenity</Text>
            <Text style={styles.subtitle}>Empathetic authority in health management.</Text>
          </View>

          {/* Formulario */}
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>EMAIL ADDRESS</Text>
              <View style={styles.inputWrapper}>
                <Mail color={Colors.secondaryFixedDim} size={20} style={styles.inputIcon} />
                <TextInput 
                  style={styles.input}
                  placeholder="name@example.com"
                  placeholderTextColor="rgba(169, 206, 196, 0.3)"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>PASSWORD</Text>
                <TouchableOpacity>
                  <Text style={styles.forgotText}>FORGOT PASSWORD?</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.inputWrapper}>
                <Lock color={Colors.secondaryFixedDim} size={20} style={styles.inputIcon} />
                <TextInput 
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="rgba(169, 206, 196, 0.3)"
                  secureTextEntry={!passwordVisible}
                />
                <TouchableOpacity onPress={() => setPasswordVisible(!passwordVisible)}>
                  {passwordVisible ? 
                    <EyeOff color={Colors.secondaryFixedDim} size={20} /> : 
                    <Eye color={Colors.secondaryFixedDim} size={20} />
                  }
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={styles.loginButton} activeOpacity={0.8}>
              <Text style={styles.loginButtonText}>Login</Text>
            </TouchableOpacity>

            {/* Divisor */}
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR CONTINUE WITH</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Social Logins */}
            <View style={styles.socialRow}>
              <TouchableOpacity style={styles.socialButton}>
                <Image 
                  source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.png' }} 
                  style={styles.socialIcon} 
                />
                <Text style={styles.socialButtonText}>Google</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.socialButton}>
                <Apple color="#fff" size={20} />
                <Text style={styles.socialButtonText}>Apple</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Don't have an account? 
              <Text style={styles.signUpText}> Sign up</Text>
            </Text>
          </View>

          {/* Banner Promocional */}
          <TouchableOpacity activeOpacity={0.9} style={styles.promoBanner}>
            <LinearGradient
              colors={[Colors.primary, '#00210d']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.promoGradient}
            >
              <View style={styles.promoContent}>
                <Text style={styles.promoTitle}>Join 20,000+ members managing their health.</Text>
                <View style={styles.avatarGroup}>
                  <View style={[styles.avatar, { backgroundColor: '#444' }]} />
                  <View style={[styles.avatar, { backgroundColor: '#666', marginLeft: -12 }]} />
                  <View style={[styles.avatarBadge, { marginLeft: -12 }]}>
                    <Text style={styles.avatarBadgeText}>+12k</Text>
                  </View>
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  blurCircle: {
    position: 'absolute',
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: (width * 0.8) / 2,
    opacity: 0.15,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.primaryFixed,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.secondaryFixedDim,
    textAlign: 'center',
    marginTop: 8,
    opacity: 0.8,
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.secondaryFixedDim,
    letterSpacing: 1.5,
  },
  forgotText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primaryFixed,
    letterSpacing: 1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.inverseSurface,
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
    opacity: 0.6,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
  },
  loginButton: {
    backgroundColor: Colors.primary,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  dividerText: {
    marginHorizontal: 10,
    color: Colors.secondaryFixedDim,
    fontSize: 10,
    letterSpacing: 1,
  },
  socialRow: {
    flexDirection: 'row',
    gap: 12,
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.inverseSurface,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    gap: 8,
  },
  socialIcon: {
    width: 20,
    height: 20,
  },
  socialButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  footer: {
    marginTop: 32,
    alignItems: 'center',
  },
  footerText: {
    color: Colors.secondaryFixedDim,
    opacity: 0.8,
  },
  signUpText: {
    color: Colors.primaryFixed,
    fontWeight: '700',
  },
  promoBanner: {
    marginTop: 40,
    borderRadius: 24,
    overflow: 'hidden',
    height: 100,
  },
  promoGradient: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  promoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  promoTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    maxWidth: '60%',
    lineHeight: 18,
  },
  avatarGroup: {
    flexDirection: 'row',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  avatarBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  avatarBadgeText: {
    color: Colors.onPrimaryContainer,
    fontSize: 8,
    fontWeight: 'bold',
  }
});