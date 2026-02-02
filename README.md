# Real Acade - Gestión de Club

¡Bienvenido a la plataforma oficial de Real Acade! Esta aplicación está diseñada para gestionar las estadísticas de tus partidos de Fútbol 7 de forma profesional y gratuita.

## 🚀 Guía para Despliegue GRATUITO

Para que tu aplicación esté activa sin costes, sigue estos pasos:

1.  **Consola de Firebase**: Ve a [Firebase Console](https://console.firebase.google.com/).
2.  **Plan de Precios**: Cambia al **Plan Blaze**. *Nota: Seguirá siendo $0 mientras no superes los 2 millones de visitas/mes, pero es necesario para ejecutar Next.js.*
3.  **Habilitar Servicios**:
    *   **Authentication**: Activa "Correo electrónico/contraseña".
    *   **Firestore Database**: Crea la base de datos en "Modo producción" y elige una ubicación cercana (ej. `southamerica-east1` o `us-central`).
4.  **IA Gratis (Opcional para Crónicas)**:
    *   Obtén una clave gratuita en [Google AI Studio](https://aistudio.google.com/).
    *   En la configuración de tu app en Firebase, añade esa clave como una variable de entorno llamada `GOOGLE_GENAI_API_KEY`.
5.  **Despliegue con App Hosting**:
    *   Conecta tu repositorio de GitHub a **Firebase App Hosting**.
    *   Firebase detectará automáticamente que es una app de Next.js y te dará tu URL pública (ej. `https://real-acade.web.app`).

## 🛠️ Roles
- **Admin**: El primer usuario que pulse "Activar Modo Administrador" en el Dashboard.
- **Jugadores**: Pueden ver estadísticas, historial y votar por el mejor gol.

¡Disfruta gestionando Real Acade!