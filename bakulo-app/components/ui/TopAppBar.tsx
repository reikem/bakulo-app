import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Bell } from 'lucide-react-native';
import { useRouter } from 'expo-router'; // 1. Importamos el router

export const TopAppBar = () => {
  const router = useRouter(); // 2. Inicializamos el router

  return (
    <View style={styles.header}>
      <View style={styles.leftSection}>
        <View style={styles.profileBorder}>
          <Image 
            source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuARpCXgNC1GEVUPWmywNs9NmqrmOX5rzqvsVu2wGQLUfawGbY_s1EoUCMqvZbSg3HJWY6jk2ZL-PWXaXl6uMzlFxcEwHsxKrbbiQR2l-pQM0AozyZ1AVYZh82QxLJ9yADhJ1YYllOXlN2StaBsiiRLtsaExiWMq-1ytXsh-e4ZroeOMazJHwmGJxuFg53rZAFd0O6AbyWyJZcpU54Bg0zz9JlY2gzaeBw6yt-OBEfGn97IqkSzy2JVpDsi21-e-nhfv0qbX-CFD50vr' }} 
            style={styles.avatar} 
          />
        </View>
        <Text style={styles.brandText}>Serenity</Text>
      </View>
      
      {/* 3. Agregamos la navegación al presionar la campana */}
      <TouchableOpacity 
      style={styles.iconButton} 
      onPress={() => {
        console.log("Presionado"); // Agrega esto para depurar en la consola
        router.push('/notifications');
      }}
    >
      <Bell color="#86d0ef" size={24} />
    </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#121212',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profileBorder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#1a6c3c',
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  brandText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#86d0ef',
    fontFamily: 'Manrope',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative', // Para posicionar el punto rojo
  },
  notificationDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ba1a1a', // Color de alerta/error
    borderWidth: 1.5,
    borderColor: '#1a1a1a',
  },
});