import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Dimensions } from 'react-native';
// Cambiamos algunos iconos para que coincidan mejor con el diseño de salud
import { LayoutGrid, RefreshCw, Utensils, Search, User, Circle, Calendar } from 'lucide-react-native';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');

export const CustomTabBar = ({ state, descriptors, navigation }: any) => {
  return (
    <View style={styles.container}>
      <BlurView intensity={90} tint="dark" style={styles.blurWrapper}>
        <View style={styles.tabList}>
          {state.routes.map((route: any, index: number) => {
            const { options } = descriptors[route.key];
            const isFocused = state.index === index;

            // Filtro de rutas
            const label = options.tabBarLabel !== undefined ? options.tabBarLabel : route.name;
            const isHidden = options.href === null || 
                             ['_sitemap', '+not-found', 'login', 'modal'].includes(route.name);

            if (isHidden) return null;

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            // MAPEADO DE ICONOS ACTUALIZADO
            const renderIcon = (color: string) => {
              const props = { color, size: 20, strokeWidth: 2.5 };
              switch (route.name) {
                case 'index': return <Calendar {...props} />;
                case 'sync': return <RefreshCw {...props} />; // Nueva ruta para sincronización
                case 'advice': return <Utensils {...props} />;
                case 'profile': return <User {...props} />;
                default: return <Circle {...props} />;
              }
            };

            return (
              <TouchableOpacity
                key={route.key}
                onPress={onPress}
                activeOpacity={0.8}
                style={styles.tabItem}
              >
                <View style={[
                  styles.iconContainer,
                  isFocused && styles.iconActiveContainer
                ]}>
                   {renderIcon(isFocused ? '#003746' : '#bfc8cd')}
                </View>
                <Text style={[
                  styles.tabLabel, 
                  { color: isFocused ? '#c4ebe0' : '#bfc8cd', opacity: isFocused ? 1 : 0.6 }
                ]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </BlurView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
  },
  blurWrapper: {
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 35 : 20,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  tabList: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end', // Alinea para que el resaltado se vea equilibrado
    paddingHorizontal: 10,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: width / 4 - 20,
  },
  iconContainer: {
    padding: 8,
    borderRadius: 20,
    marginBottom: 4,
    transition: 'all 0.3s ease',
  },
  iconActiveContainer: {
    backgroundColor: '#c4ebe0', // Color del diseño HTML para el tab activo
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    // Efecto de elevación suave
    shadowColor: '#c4ebe0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
});