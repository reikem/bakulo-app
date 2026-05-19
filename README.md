# 🩻 Serenity: Control Inteligente y Gestión Médica Móvil

[![React Native](https://img.shields.io/badge/React_Native-v0.81+-61DAFB?logo=react&logoColor=black)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-v54+-000020?logo=expo&logoColor=white)](https://expo.dev/)
[![pnpm](https://img.shields.io/badge/maintained%20with-pnpm-chmimg?logo=pnpm&color=F6D146)](https://pnpm.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Serenity** es una solución móvil de código abierto diseñada para transformar la gestión de la salud y el monitoreo crónico (como el control de la diabetes). Nuestra misión es eliminar la fricción del seguimiento diario mediante la automatización de hardware, persistencia híbrida offline-first, diagnóstico en tiempo real y seguridad proactiva ante emergencias médicas.

---

# 🎯 Características Principales e Innovaciones

## 🔌 Conectividad de Hardware e Integración de Sensores
Sincronización híbrida de datos para un monitoreo continuo sin fricciones:

- **Bluetooth Low Energy (BLE):** Conexión directa con glucómetros y dispositivos médicos compatibles.
- **Near Field Communication (NFC):** Lectura instantánea de tags y sensores de monitoreo continuo de glucosa (CGM).

## 🚨 Sistema de Emergencia SOS Automatizado (`EmergencySOSScreen`)
Diseñado para actuar de manera autónoma en situaciones críticas o de pérdida de conciencia:

- **Vibración Continua:** Patrón en código SOS (`··· --- ···`) para alertar al tacto.
- **Sirena Acústica de Alta Intensidad:** Utiliza `expo-av` para emitir alertas audibles a las personas del entorno.
- **Texto a Voz Integrado (`expo-speech`):** Alocución automática contextualizada localmente: *"Necesito ayuda, soy diabético"*.
- **Mensajería SMS de Emergencia:** Envío de alertas automatizadas sin necesidad de abrir la aplicación nativa de mensajería del sistema.
- **Prevención de Suspensión:** Mantiene la pantalla encendida de forma indefinida (`expo-keep-awake`) y reenvía coordenadas GPS exactas cada 5 minutos mediante `expo-location` hasta su desactivación manual.

## 📊 Módulo de Reportes Clínicos y Exportación (`reports`)
Previsualización gráfica de estadísticas mensuales y herramental de exportación flexible:

- **Generación Multi-formato:** Compilación dinámica de reportes físicos y digitales en formatos **PDF (HTML estructurado)** y **CSV** utilizando registros almacenados en base de datos.
- **MissingDataModal:** Detección inteligente de campos vacíos obligatorios antes de exportar, solicitando parámetros omitidos al usuario.
- **Interoperabilidad Nativa:** Compartición directa mediante correo electrónico, aplicaciones de mensajería (WhatsApp) o almacenamiento en el sistema a través de `expo-sharing`.

## 🗂️ Repositorio y Gestión Documental Híbrida (`RepositoryScreen`)
Gestor avanzado de archivos clínicos con tolerancia a fallos de red:

- **Persistencia en la Nube:** Almacenamiento seguro sincronizado con el identificador del usuario autenticado (`user_id`) en **Supabase** protegiendo los datos mediante políticas de seguridad RLS (Row Level Security).
- **Caché Local Offline:** Respaldo local inmediato en **SQLite** que opera de forma autónoma ante pérdidas de conectividad.
- **Escáner e Imágenes:** Integración nativa mediante `expo-document-picker` y `expo-image-picker` para adjuntar recetas, exámenes y documentos médicos.

## 🧠 Asistente de Inteligencia Artificial Climatizado (`aiService`)

- **Procesamiento de Contexto Local:** Extracción dinámica de las últimas lecturas clínicas locales para inyectar un prompt enriquecido y contextualizado.
- **Localización Cultural:** El motor está instruido para operar de forma empática utilizando regionalismos chilenos y asimilando las pautas del sistema de salud local (**GES / AUGE**).
- **Arquitectura de Proveedor Dual:** Soporte integrado para tokens del usuario final (Camino A) consumiendo las APIs de **Gemini (1.5 Flash)** y **Anthropic (Claude 3 Haiku)**, o pasarela BaaS segura (Camino B) mediante Supabase Edge Functions.

## 🔬 Panel de Diagnóstico de Datos (`DataVerifyScreen`)

- **Verificación Multicapa:** Pantalla técnica dedicada a auditar la integridad de la información en tiempo real, comparando consistencia de registros distribuidos en tres capas: **Memoria (AppStore) vs. Almacenamiento Local (SQLite) vs. Nube (Supabase)**.
- **Auditoría de Sincronización:** Conteo de ítems pendientes y marcas visuales que identifican discrepancias de estado antes de forzar procesos de sincronización.

---

# 📂 Arquitectura del Proyecto (Estructura de Directorios)

```text
📂 serenity-app (bakulo-app)
 ┣ 📂 assets              # Identidad visual (Iconos adaptativos, splash screens y fuentes)
 ┣ 📂 app                 # Enrutamiento basado en archivos (Expo Router)
 ┃ ┣ 📂 (auth)            # Flujo de autenticación: Login, registro y activación por token
 ┃ ┣ 📂 (tabs)            # Módulos core integrados en la navegación por pestañas
 ┃ ┣ 📜 ForgotPassword.tsx# Gestión y reseteo de credenciales de usuario
 ┃ ┣ 📜 reports.tsx       # Lógica visual y compilador de documentos PDF/CSV
 ┃ ┗ 📜 notifications.tsx # Historial de alertas clínicas de alta prioridad
 ┣ 📂 components          # Componentes modulares reutilizables y UI atómica
 ┣ 📂 service             # Capa de servicios e infraestructura de datos
 ┃ ┣ 📜 database.ts       # Singleton SQLite, generador nativo de UUIDs v4 y queries SQL
 ┃ ┣ 📜 authService.ts    # Lógica de comunicación con el proveedor de identidad
 ┃ ┣ 📜 aiService.ts      # Conector e inyector de contexto para LLMs (Gemini/Claude)
 ┃ ┗ 📜 supabaseClient.ts # Inicialización del cliente de la nube de Supabase
 ┣ 📂 store               # Gestión de estado global reactivo (AppStore)
 ┣ 📜 app.json            # Configuración de propiedades nativas Expo (minSdkVersion, permisos)
 ┗ 📜 eas.json            # Perfiles de compilación e instrucciones DevOps (Generación de APKs)
```

---

# 🚀 Instalación y Configuración del Entorno Local

## Requisitos Mínimos

- **Node.js:** v22 LTS o superior (Probado en v25)
- **Gestor de Paquetes:** pnpm (v11+)
- **Entorno Móvil:** Android SDK instalado con variables de entorno (`ANDROID_HOME`), Java JDK 17 y Xcode (opcional para simulación en macOS).

## Configuración del Proyecto

### 1️⃣ Clona el repositorio

```bash
git clone https://github.com/reikem/bakulo-app.git
cd bakulo-app
```

### 2️⃣ Instala las dependencias del proyecto

```bash
pnpm install
```

### 3️⃣ Variables de Entorno
Crea un archivo `.env` en la raíz basándote en `.env.example`. Nunca subas claves reales a producción.

```env
EXPO_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anonima-de-supabase
EXPO_SECRECT_KEY=tu-clave-secreta-local
EXPO_PUBLIC_APP_NAME=Serenity
EXPO_PUBLIC_APP_VERSION=1.0.0
```

### 4️⃣ Levanta el entorno de desarrollo nativo
Para compilar módulos nativos como Bluetooth, NFC y almacenamiento local:

```bash
# Android
pnpm exec expo run:android

# iOS (solo macOS)
pnpm exec expo run:ios
```

---

# 🛠️ Ciclo DevOps y Compilación de Entregables (APKs)

## Compilación Local en Modo Debug

```bash
echo "sdk.dir=$ANDROID_HOME" > android/local.properties
cd android && ./gradlew assembleDebug
```

**Ubicación del APK generado:**

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

## Compilación en la Nube con EAS (Recomendado)

### Instala el CLI e inicia sesión

```bash
pnpm add -g eas-cli
eas login
```

### Genera la APK

```bash
eas build --platform android --profile preview
```

---

# 📈 Reglas de Versionado Semántico (SemVer)

El proyecto utiliza la estructura estricta **MAJOR.MINOR.PATCH** coordinada con Android:

- **PATCH (Z):** Correcciones menores o bugs (`1.0.1`)
- **MINOR (Y):** Nuevas funcionalidades retrocompatibles (`1.1.0`)
- **MAJOR (X):** Cambios estructurales incompatibles (`2.0.0`)

## Recomendación de liberación

Al generar una nueva versión:

- Incrementa manualmente `version`
- Incrementa `android.versionCode` en `app.json`

---

# ⚖️ Aviso Clínico y Legal

**Serenity** es una herramienta tecnológica orientada al soporte de almacenamiento de datos clínicos y monitoreo complementario. No constituye un recurso definitivo para diagnóstico, prescripción médica ni tratamiento autónomo de patologías complejas como la diabetes.

**Toda modificación en medicación, dosis de insulina o pautas dietéticas debe ser validada previamente por un profesional de la salud calificado.**

