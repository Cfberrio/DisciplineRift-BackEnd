# Archivos Clonados - Sistema de Correos

## 📊 Resumen Total
- **Total de archivos clonados**: 32 archivos
- **Carpetas creadas**: 5 carpetas
- **Archivos de documentación**: 2 archivos

## 📁 Estructura Detallada

### 🗂️ Archivos Raíz (7 archivos)
```
EstructuraCorreos/
├── README.md                                    [NUEVO - Documentación]
├── ARCHIVOS_CLONADOS.md                         [NUEVO - Este archivo]
├── email-service.ts                             [CLONADO de lib/email-service.ts]
├── cancellation-email-service.ts                [CLONADO de lib/cancellation-email-service.ts]
├── cancellation-email-template.ts               [CLONADO de lib/cancellation-email-template.ts]
├── cancellation-query.ts                        [CLONADO de lib/cancellation-query.ts]
├── retry-scheduler.ts                           [CLONADO de lib/retry-scheduler.ts]
└── package-email-dependencies.json              [CLONADO de package.json]
```

### 🌐 API Routes (15 archivos)
```
EstructuraCorreos/api/
├── contact-route.ts                             [CLONADO de app/api/contact/route.ts]
├── send-confirmation-email-route.ts             [CLONADO de app/api/send-confirmation-email/route.ts]
├── send-labor-day-email-route.ts                [CLONADO de app/api/send-labor-day-email/route.ts]
├── send-labor-day-campaign-route.ts             [CLONADO de app/api/send-labor-day-campaign/route.ts]
├── send-labor-day-single-route.ts               [CLONADO de app/api/send-labor-day-single/route.ts]
├── send-fall-season-email-route.ts              [CLONADO de app/api/send-fall-season-email/route.ts]
├── send-cancellation-emails-route.ts            [CLONADO de app/api/send-cancellation-emails/route.ts]
├── send-parent-guide-route.ts                   [CLONADO de app/api/send-parent-guide/route.ts]
├── send-emails-now-route.ts                     [CLONADO de app/api/send-emails-now/route.ts]
├── send-incomplete-payment-reminder-route.ts    [CLONADO de app/api/send-incomplete-payment-reminder/route.ts]
├── sessions-send-reminder-route.ts              [CLONADO de app/api/sessions/send-reminder/route.ts]
├── september-17-reminders-route.ts              [CLONADO de app/api/september-17-reminders/route.ts]
├── get-newsletter-emails-route.ts               [CLONADO de app/api/get-newsletter-emails/route.ts]
├── auth-send-login-otp-route.ts                 [CLONADO de app/api/auth/send-login-otp/route.ts]
└── auth-forgot-password-route.ts                [CLONADO de app/api/auth/forgot-password/route.ts]
```

### 🎨 Componentes (4 archivos)
```
EstructuraCorreos/components/
├── email-signup-modal.tsx                       [CLONADO de components/email-signup-modal.tsx]
├── email-signup-manager.tsx                     [CLONADO de components/email-signup-manager.tsx]
├── email-test-panel.tsx                         [CLONADO de components/email-test-panel.tsx]
└── cancellation-manager.tsx                     [CLONADO de components/cancellation-manager.tsx]
```

### 📜 Scripts (6 archivos)
```
EstructuraCorreos/scripts/
├── send-labor-day-campaign.ts                   [CLONADO de scripts/send-labor-day-campaign.ts]
├── manual-labor-day-campaign.ts                 [CLONADO de scripts/manual-labor-day-campaign.ts]
├── simple-email-test.ts                         [CLONADO de scripts/simple-email-test.ts]
├── test-payment-email.ts                        [CLONADO de scripts/test-payment-email.ts]
├── run-season-reminders.ts                      [CLONADO de scripts/run-season-reminders.ts]
└── debug-email-dates.ts                         [CLONADO de scripts/debug-email-dates.ts]
```

### ⚙️ Jobs (1 archivo)
```
EstructuraCorreos/jobs/
└── sendSeasonReminders.ts                       [CLONADO de jobs/sendSeasonReminders.ts]
```

### 🗄️ SQL (3 archivos)
```
EstructuraCorreos/sql/
├── create-session-reminders-table.sql           [CLONADO de lib/create-session-reminders-table.sql]
├── create-reminder-function.sql                 [CLONADO de lib/create-reminder-function.sql]
└── create-reminder-attempts-table.sql           [CLONADO de lib/create-reminder-attempts-table.sql]
```

## 🎯 Funcionalidades Principales Clonadas

### 📧 Tipos de Emails
- ✅ Formularios de contacto
- ✅ Confirmaciones de aplicación
- ✅ Campañas de marketing (Labor Day, Fall Season)
- ✅ Recordatorios de sesiones
- ✅ Notificaciones de cancelación
- ✅ Recordatorios de pago
- ✅ Guías para padres
- ✅ Autenticación (OTP, recuperación de contraseña)

### 🔧 Servicios
- ✅ Configuración SMTP (Gmail)
- ✅ Templates de email HTML
- ✅ Sistema de reintentos
- ✅ Gestión de cancelaciones
- ✅ Programación de recordatorios

### 🎨 Componentes UI
- ✅ Modales de registro de email
- ✅ Paneles de prueba de email
- ✅ Gestores de cancelación
- ✅ Gestores de registro de email

## 📋 Notas Importantes

1. **Todos los archivos son clones** - No se movieron archivos originales
2. **Nombres modificados** - Se agregaron sufijos para evitar conflictos
3. **Estructura preservada** - Se mantiene la organización del proyecto
4. **Documentación incluida** - README.md con instrucciones de uso
5. **Dependencias listadas** - package-email-dependencies.json para referencia

## 🚀 Uso

Esta estructura puede ser utilizada como:
- 📚 Documentación del sistema de correos
- 🔄 Base para migración a otro proyecto
- 🧪 Entorno de pruebas independiente
- 📖 Referencia de arquitectura de emails
