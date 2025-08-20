# Dashboard Calendar - Sistema de Gestión de Prácticas

## Funcionalidades Implementadas

### 🗓️ Vista de Calendario Semanal
- **Ubicación**: `/calendario`
- **Componente principal**: `CalendarWeek.tsx`
- **Tecnología**: FullCalendar con plugins timeGrid, interaction y luxon
- **Zona horaria**: America/New_York
- **Características**:
  - Vista semanal (timeGridWeek) y diaria (timeGridDay) en móvil
  - Filtros por equipo y coach
  - Eventos con colores únicos por equipo
  - Responsive design
  - Navegación con teclado

### 📝 Gestión de Eventos
- **Componente**: `EventDrawer.tsx`
- **Funcionalidades**:
  - Ver detalles del equipo, coach, horario
  - Editar serie completa de prácticas (días, horas, fechas, coach)
  - Lista de próximas ocurrencias
  - Validaciones de formulario

### 📧 Comunicación con Padres
- **Envío de emails**: API endpoint `/api/calendar/send-email`
- **Características**:
  - Obtiene automáticamente emails de padres del equipo
  - Template HTML responsivo para emails
  - Deduplicación de destinatarios
  - Manejo de errores y reportes de envío
  - Soporte para texto plano y HTML

### 🔧 Arquitectura Técnica

#### Estructura de Archivos
```
utils/
  schedule.ts              # Utilidades para parsear días y expandir ocurrencias

lib/calendar/
  supabase-client.ts       # Cliente para operaciones de calendario en Supabase

components/calendar/
  CalendarWeek.tsx         # Componente principal de FullCalendar
  EventDrawer.tsx          # Panel lateral para gestión de eventos

lib/
  mailer.ts               # Servicio de envío de emails con nodemailer

app/api/calendar/
  send-email/route.ts     # API endpoint para envío de emails
```

#### Flujo de Datos
1. **Sesiones** → `expandOccurrences()` → **Eventos de calendario**
2. **Click en evento** → `EventDrawer` → **Edición/Email/SMS**
3. **Guardado** → `updateSession()` → **Recarga automática del calendario**

## Variables de Entorno Requeridas

```env
# Configuración SMTP para emails
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-app-password
SMTP_FROM_NAME="Sistema de Prácticas"

# URL de la aplicación para links en emails
NEXT_PUBLIC_APP_URL=https://tu-dominio.com

# Configuración opcional para SMS (futuro)
TWILIO_ACCOUNT_SID=tu-account-sid
TWILIO_AUTH_TOKEN=tu-auth-token
TWILIO_PHONE_NUMBER=+1234567890
```

## Estructura de Base de Datos

### Tablas Utilizadas
- **session**: Configuración de series de prácticas
- **team**: Información de equipos
- **enrollment**: Relación estudiante-equipo (isactive=true)
- **student**: Información de estudiantes
- **parent**: Información de contacto de padres
- **staff**: Información de coaches/personal

### Campos Importantes
```sql
session(
  sessionid uuid,
  teamid uuid,
  startdate date,
  enddate date,
  starttime time,
  endtime time,
  daysofweek varchar,  -- "monday,wednesday,friday" o "lunes,miércoles,viernes"
  repeat varchar,
  coachid uuid
)
```

## Uso y Navegación

### Para Usuarios
1. **Acceder al calendario**: Click en "Agenda" → "Ver calendario" o navegar a `/calendario`
2. **Ver práctica**: Click en cualquier evento del calendario
3. **Editar práctica**: En el panel lateral → Tab "Editar" → Modificar campos → "Guardar cambios"
4. **Enviar recordatorios**: En el panel lateral → "Enviar Email" o "Enviar SMS"

### Filtros Disponibles
- **Por equipo**: Dropdown "Todos los equipos"
- **Por coach**: Dropdown "Todos los coaches"
- **Vista móvil**: Toggle entre vista semanal y diaria

## Funciones de Utilidad

### `utils/schedule.ts`
- `parseDaysOfWeek(str)`: Convierte string de días a números ISO
- `expandOccurrences(session)`: Genera todas las fechas de una serie
- `formatDaysOfWeek(str)`: Formatea días para mostrar
- `validateDaysOfWeek(str)`: Valida formato de días

### Ejemplos de Días de la Semana
```javascript
// Formatos válidos:
"monday,wednesday,friday"
"lunes,miércoles,viernes"  
"mon,wed,fri"
"1,3,5"  // ISO: 1=Lunes, 7=Domingo
```

## Testing Manual

### Casos de Prueba
1. **Crear sesión de prueba**:
   ```sql
   INSERT INTO session (teamid, startdate, enddate, starttime, endtime, daysofweek, repeat)
   VALUES ('team-id', '2024-01-15', '2024-01-29', '15:00', '16:30', 'monday,wednesday', 'weekly');
   ```

2. **Verificar eventos**: Deben aparecer 6 eventos (3 lunes + 3 miércoles)

3. **Editar serie**: Cambiar hora y verificar que se actualiza todo

4. **Enviar email**: Verificar que llega a padres del equipo

### Breakpoints a Probar
- **Mobile**: 360px - Vista día automática
- **Tablet**: 768px - Filtros apilados
- **Desktop**: 1024px+ - Vista completa

## Troubleshooting

### Errores Comunes
1. **"Email not configured"**: Verificar variables SMTP_*
2. **"No recipients found"**: Verificar enrollment.isactive=true y parent.email
3. **Eventos no aparecen**: Verificar formato de daysofweek y fechas

### Logs Útiles
- Console del navegador para errores de cliente
- Logs del servidor para errores de API
- Verificar network tab para llamadas a Supabase

## Próximas Mejoras
- [ ] Integración completa de SMS con Twilio
- [ ] Notificaciones push
- [ ] Exportar calendario a ICS
- [ ] Drag & drop para mover eventos
- [ ] Vista mensual
- [ ] Recordatorios automáticos

---
**Fecha de implementación**: Enero 2024  
**Stack**: Next.js, FullCalendar, Luxon, Supabase, Nodemailer
