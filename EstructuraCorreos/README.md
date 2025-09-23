# Estructura de Correos - Discipline Rift

Esta carpeta contiene todos los archivos relacionados con el sistema de correos electrónicos del proyecto Discipline Rift.

## 📁 Estructura de Carpetas

### `/api/` - Rutas de API para envío de correos
- `contact-route.ts` - Formulario de contacto
- `send-confirmation-email-route.ts` - Confirmaciones de aplicación
- `send-labor-day-email-route.ts` - Campaña Labor Day
- `send-labor-day-campaign-route.ts` - Campaña masiva Labor Day
- `send-labor-day-single-route.ts` - Envío individual Labor Day
- `send-fall-season-email-route.ts` - Campaña temporada otoño
- `send-cancellation-emails-route.ts` - Emails de cancelación
- `send-parent-guide-route.ts` - Guía para padres
- `send-emails-now-route.ts` - Envío inmediato de emails
- `send-incomplete-payment-reminder-route.ts` - Recordatorios de pago
- `sessions-send-reminder-route.ts` - Recordatorios de sesiones
- `september-17-reminders-route.ts` - Recordatorios específicos
- `get-newsletter-emails-route.ts` - Obtener emails de newsletter
- `auth-send-login-otp-route.ts` - OTP para login
- `auth-forgot-password-route.ts` - Recuperación de contraseña

### `/components/` - Componentes de UI relacionados con correos
- `email-signup-modal.tsx` - Modal de registro de email
- `email-signup-manager.tsx` - Gestor de registros de email
- `email-test-panel.tsx` - Panel de pruebas de email
- `cancellation-manager.tsx` - Gestor de cancelaciones

### `/scripts/` - Scripts de automatización
- `send-labor-day-campaign.ts` - Script de campaña Labor Day
- `manual-labor-day-campaign.ts` - Campaña manual Labor Day
- `simple-email-test.ts` - Pruebas simples de email
- `test-payment-email.ts` - Pruebas de email de pago
- `run-season-reminders.ts` - Recordatorios de temporada
- `debug-email-dates.ts` - Debug de fechas de email

### `/jobs/` - Tareas programadas
- `sendSeasonReminders.ts` - Recordatorios de temporada

### `/sql/` - Esquemas de base de datos
- `create-session-reminders-table.sql` - Tabla de recordatorios
- `create-reminder-function.sql` - Función de recordatorios
- `create-reminder-attempts-table.sql` - Tabla de intentos

## 📧 Servicios Principales

### `email-service.ts`
Servicio principal que contiene:
- Configuración de transporte SMTP (Gmail)
- Templates de email para diferentes tipos de notificaciones
- Funciones de envío de emails
- Templates para recordatorios de sesión
- Templates para confirmaciones de pago

### `cancellation-email-service.ts`
Servicio especializado para:
- Emails de cancelación de sesiones
- Notificaciones de cambios de horario
- Confirmaciones de cancelación

### `cancellation-email-template.ts`
Templates HTML para emails de cancelación

### `cancellation-query.ts`
Consultas a la base de datos para cancelaciones

### `retry-scheduler.ts`
Sistema de reintentos para envíos fallidos

## 🔧 Dependencias Principales

- `nodemailer` - Cliente SMTP para Node.js
- `@types/nodemailer` - Tipos TypeScript para nodemailer

## 📋 Variables de Entorno Requeridas

```env
GMAIL_USER=tu-email@gmail.com
GMAIL_APP_PASSWORD=tu-app-password
```

## 🚀 Uso

1. Configurar las variables de entorno
2. Importar los servicios necesarios
3. Usar las funciones de envío correspondientes
4. Los templates se generan automáticamente con los datos proporcionados

## 📝 Notas

- Todos los archivos son clones de los originales
- La estructura mantiene la organización del proyecto original
- Los nombres de archivo incluyen sufijos para evitar conflictos
