# Sistema de Campañas de Email

Esta documentación describe la nueva funcionalidad de campañas de email agregada al dashboard de marketing.

## Funcionalidades Implementadas

### 1. Selector de Equipos Activos
- **Componente**: `TeamSelector` (`components/marketing/team-selector.tsx`)
- **Función**: Permite seleccionar equipos que están activos (`isactive = true`)
- **Datos mostrados**: Nombre del equipo, escuela y ubicación

### 2. Selector de Padres por Equipo
- **Componente**: `ParentSelector` (`components/marketing/parent-selector.tsx`)
- **Función**: Muestra padres asociados al equipo seleccionado que tienen:
  - Estudiantes inscritos activamente (`enrollment.isactive = true`)
  - Pagos completados (`payment.status = 'completed'`)
- **Características**:
  - Selección múltiple de padres
  - Búsqueda por nombre, email o estudiante
  - Botones "Seleccionar todos" / "Deseleccionar todos"
  - Visualización de información de contacto y estudiantes

### 3. Interfaz de Campaña de Email
- **Componente**: `EmailCampaign` (`components/marketing/email-campaign.tsx`)
- **Proceso de 5 pasos**:
  1. Seleccionar equipo
  2. Seleccionar destinatarios (padres)
  3. Seleccionar plantilla de email
  4. Personalizar mensaje
  5. Revisar y enviar

### 4. Sistema de Plantillas
- Plantillas predefinidas con variables reemplazables
- Opción de mensaje personalizado
- Variables disponibles:
  - `{PARENT_NAME}`: Nombre del padre
  - `{STUDENT_NAME}`: Nombre(s) del/los estudiante(s)
  - `{TEAM_NAME}`: Nombre del equipo
  - `{SCHOOL_NAME}`: Nombre de la escuela
  - `{SCHOOL_LOCATION}`: Ubicación de la escuela
  - `{COACH_NAME}`: Nombre del entrenador

### 5. Historial de Campañas
- **Componente**: `CampaignHistory` (`components/marketing/campaign-history.tsx`)
- **Función**: Muestra campañas enviadas anteriormente con:
  - Estadísticas de éxito/fallo
  - Detalles completos de cada campaña
  - Vista previa del contenido enviado

## APIs Implementadas

### 1. Obtener Padres por Equipo
- **Endpoint**: `GET /api/teams/{teamId}/parents`
- **Archivo**: `app/api/teams/[id]/parents/route.ts`
- **Función**: Obtiene padres con pagos completados para un equipo específico

### 2. Enviar Campaña de Email
- **Endpoint**: `POST /api/marketing/send-email`
- **Archivo**: `app/api/marketing/send-email/route.ts`
- **Función**: 
  - Envía emails personalizados usando Gmail SMTP
  - Reemplaza variables en plantillas
  - Guarda registro en base de datos
  - Retorna estadísticas de envío

### 3. Historial de Campañas
- **Endpoint**: `GET /api/marketing/campaigns`
- **Archivo**: `app/api/marketing/campaigns/route.ts`
- **Función**: Obtiene historial de campañas enviadas

## Base de Datos

### Nuevas Tablas

#### email_campaigns
```sql
CREATE TABLE public.email_campaigns (
  campaign_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES team(teamid),
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  template_id INTEGER NULL,
  total_recipients INTEGER NOT NULL,
  successful_sends INTEGER NOT NULL,
  failed_sends INTEGER NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sent_by_admin TEXT NULL
);
```

#### email_campaign_recipients
```sql
CREATE TABLE public.email_campaign_recipients (
  recipient_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES email_campaigns(campaign_id),
  parent_id UUID NOT NULL REFERENCES parent(parentid),
  email_address TEXT NOT NULL,
  sent_successfully BOOLEAN NOT NULL,
  message_id TEXT NULL,
  error_message TEXT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Configuración Requerida

### Variables de Entorno
```bash
GMAIL_USER=tu-email@gmail.com
GMAIL_APP_PASSWORD=tu-app-password-de-gmail
```

### Dependencias
- `nodemailer`: Para envío de emails
- Configuración de Gmail con contraseña de aplicación

## Integración con Marketing Dashboard

La nueva funcionalidad se integró en la página de marketing existente (`app/marketing/page.tsx`) como una nueva pestaña "Campañas" sin afectar las funcionalidades existentes:

- **Automatizaciones**: Funcionalidad existente preservada
- **Campañas**: Nueva funcionalidad agregada
- **Métricas**: Funcionalidad existente preservada  
- **Plantillas**: Funcionalidad existente preservada

## Flujo de Datos

1. **Selección de Equipo**: Se obtienen equipos activos via `/api/teams`
2. **Selección de Padres**: Se obtienen padres del equipo via `/api/teams/{id}/parents`
3. **Envío de Email**: Se procesan plantillas y se envían via `/api/marketing/send-email`
4. **Registro**: Se guarda información en `email_campaigns` y `email_campaign_recipients`
5. **Historial**: Se consulta via `/api/marketing/campaigns`

## Consideraciones de Seguridad

- Todos los endpoints requieren autenticación de administrador
- Validación de datos de entrada en todos los endpoints
- Registro detallado para auditoría
- Manejo de errores sin exponer información sensible

## Mantenimiento

- Los registros de campañas se mantienen indefinidamente para auditoría
- Se puede agregar límite de rate limiting en el futuro
- Monitorear uso de cuota de Gmail
- Considerar migrar a servicio de email profesional para volúmenes altos






