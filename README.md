# 🩸 Bakulo: Control Inteligente y Constante de la Glucosa

[![React Native](https://img.shields.io/badge/React_Native-v0.74+-61DAFB?logo=react&logoColor=black)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-v50+-000020?logo=expo&logoColor=white)](https://expo.dev/)
[![Open Source](https://img.shields.io/badge/Open%20Source-%E2%9D%A4-red)](#)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Bakulo** es una solución de código abierto diseñada para transformar la gestión de la diabetes. Nuestra misión es eliminar la fricción del monitoreo diario mediante la automatización y la inteligencia de datos, ayudando a los usuarios a mantener la constancia necesaria para una vida saludable.

---

## 🎯 ¿Por qué Bakulo?

El control de la diabetes requiere una disciplina férrea. Muchas personas abandonan el seguimiento debido a lo tedioso que es el registro manual. **Bakulo** soluciona esto mediante:

- **Reducción de la carga cognitiva:** Sincronización automática con dispositivos médicos.
- **Alertas Proactivas:** No solo guarda datos, te avisa antes de que un nivel se vuelva peligroso.
- **Motivación mediante visualización:** Gráficos claros que muestran el progreso real y no solo números aislados.

## ✨ Características Principales

### 🔌 Conectividad de Hardware
Sincronización híbrida para máxima compatibilidad:
- **Bluetooth (BLE):** Conexión directa con glucómetros inteligentes (como Accu-Chek).
- **NFC:** Lectura de sensores de monitoreo continuo (CGM) como FreeStyle Libre.
- **Modo Manual:** Interfaz optimizada con inputs gigantes para facilitar el ingreso cuando no hay dispositivos cerca.

### 🍽️ Inteligencia Nutricional (IA)
- Identificación de macronutrientes mediante fotografía del plato.
- Cálculo automático de carbohidratos, proteínas y grasas para ajustar las dosis de insulina.

### 📊 Dashboard y Analíticas
- Seguimiento de tendencias semanales y mensuales.
- Clasificación automática por rangos (Hipoglucemia, Normal, Prediabetes e Hiperglucemia).
- Exportación de informes para compartir con profesionales de la salud.

### 🔔 Sistema de Notificaciones
- Alertas críticas en tiempo real basadas en umbrales personalizados.
- Recordatorios de medicación y comidas.

## 🛠️ Stack Tecnológico

| Tecnología | Propósito |
| :--- | :--- |
| **React Native** | Desarrollo móvil multiplataforma. |
| **Expo (Router)** | Navegación basada en archivos y entorno de desarrollo. |
| **TypeScript** | Código robusto y tipado para seguridad de datos médicos. |
| **Context API** | Gestión de estado global unificado (AppStore). |
| **BLE Plx** | Comunicación con hardware Bluetooth Low Energy. |
| **NFC Manager** | Lectura de tags y sensores mediante NFC. |
| **Reanimated** | Animaciones fluidas para la interfaz de escaneo. |

## 🚀 Instalación y Configuración

### Requisitos
- Node.js 18+
- Expo Go o un entorno de **Development Build** configurado (necesario para Bluetooth/NFC).

### Pasos
1. Clona este repositorio:
   ```bash
   git clone [https://github.com/tu-usuario/bakulo-app.git](https://github.com/tu-usuario/bakulo-app.git)

2. Instala las dependencias:
   ```bash
   cd bakulo-app
   npm install
3. Inicia el entorno de desarrollo:
   ```bash
   npx expo start
  

# Para iOS (requiere macOS y Xcode)
   npx expo run:ios

# Para Android
npx expo run:android


## 🤝 Cómo contribuir
¡Bakulo es un proyecto de la comunidad! Necesitamos desarrolladores, diseñadores y personas con experiencia en salud para mejorar esta herramienta.

Haz un Fork del proyecto.

Crea una rama para tu característica: git checkout -b feature/NuevaFuncionalidad.

Envía tus cambios: git commit -m 'Añadir nueva funcionalidad'.

Haz un Push a la rama: git push origin feature/NuevaFuncionalidad.

Abre un Pull Request.

## ⚖️ Aviso Médico
Bakulo es una herramienta de apoyo para el seguimiento de datos y no debe utilizarse como único recurso para el diagnóstico o tratamiento de la diabetes. Consulta siempre con un profesional de la salud antes de realizar ajustes en tu medicación o dieta.

Desarrollado con ❤️ para mejorar la vida de las personas con diabetes.
Si este proyecto te parece útil, por favor danos una ⭐.
