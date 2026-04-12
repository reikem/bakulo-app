import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Alert } from 'react-native';

export const imageService = {
  /**
   * Abre la galería, permite editar y retorna la imagen procesada en Base64
   * optimizada para almacenamiento en SQLite.
   */
  pickAndProcessImage: async () => {
    // 1. Solicitar permisos
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert(
        "Permisos requeridos", 
        "Necesitamos acceso a tu galería para adjuntar fotos a tus registros."
      );
      return null;
    }

    // 2. Seleccionar la imagen
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1, 
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      try {
        // 3. Procesar: Redimensionar y comprimir a calidad media (60%)
        // Esto evita que el string Base64 sea demasiado pesado para la DB
        const manipulatedImage = await ImageManipulator.manipulateAsync(
          result.assets[0].uri,
          [{ resize: { width: 800 } }], 
          { 
            compress: 0.6, 
            format: ImageManipulator.SaveFormat.JPEG, 
            base64: true 
          }
        );

        return {
          base64: manipulatedImage.base64, // Ideal para guardar en SQLite
          uri: manipulatedImage.uri,        // Útil para previsualización inmediata
          fileName: result.assets[0].fileName || `photo_${Date.now()}.jpg`
        };
      } catch (error) {
        console.error("Error al procesar la imagen:", error);
        Alert.alert("Error", "No se pudo procesar la imagen seleccionada.");
        return null;
      }
    }
    
    return null;
  }
};