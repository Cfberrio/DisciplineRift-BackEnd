# 🏐 DisciplineRift - Sistema de Gestión Deportiva

## 📋 Descripción

**DisciplineRift** es una aplicación web moderna para la gestión integral de programas deportivos y actividades educativas. Diseñada específicamente para organizaciones deportivas, escuelas y centros de entrenamiento que necesitan administrar equipos, estudiantes, sesiones de entrenamiento y métricas de rendimiento.

## ✨ Características Principales

### 🏫 Gestión de Escuelas
- Registro y administración de instituciones educativas
- Información de contacto y ubicación
- Vinculación con equipos y servicios

### 🏃‍♂️ Gestión de Servicios Deportivos
- Creación y administración de programas deportivos
- Gestión de horarios y sesiones de entrenamiento
- Control de participantes y inscripciones
- Generación de reportes en PDF

### 👥 Gestión de Personal
- Registro de entrenadores y staff
- Asignación de roles y permisos
- Información de contacto y disponibilidad

### 📅 Sistema de Calendarios
- Programación de sesiones y entrenamientos
- Vista semanal y mensual
- Gestión de horarios recurrentes

### 📊 Analytics y Métricas
- Seguimiento de participación
- Métricas de rendimiento
- Reportes automatizados

### 🔐 Sistema de Autenticación
- Login seguro con Supabase Auth
- Control de acceso por roles
- Protección de rutas administrativas

## 🛠️ Tecnologías Utilizadas

### Frontend
- **Next.js 15** - Framework de React con App Router
- **TypeScript** - Tipado estático
- **Tailwind CSS** - Framework de estilos utilitarios
- **Radix UI** - Componentes de interfaz accesibles
- **Lucide React** - Iconos modernos

### Backend
- **Next.js API Routes** - API endpoints serverless
- **Supabase** - Base de datos PostgreSQL en la nube
- **Supabase Auth** - Sistema de autenticación

### Herramientas de Desarrollo
- **ESLint** - Linter de código
- **PostCSS** - Procesador de CSS
- **jsPDF** - Generación de documentos PDF

## 🚀 Instalación y Configuración

### Prerrequisitos
- Node.js 18+ 
- npm o pnpm
- Cuenta de Supabase

### 1. Clona el repositorio
```bash
git clone https://github.com/Cfberrio/DisciplineRift-BackEnd.git
cd DisciplineRift-BackEnd
```

### 2. Instala las dependencias
```bash
npm install
# o
pnpm install
```

### 3. Configura las variables de entorno
Crea un archivo `.env.local` en la raíz del proyecto:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key
```

### 4. Configura la base de datos
Ejecuta las siguientes consultas en tu proyecto de Supabase:

```sql
-- Crear tabla admin
CREATE TABLE IF NOT EXISTS admin (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE admin ENABLE ROW LEVEL SECURITY;

-- Crear políticas de seguridad
CREATE POLICY "Allow authenticated users to read admin" ON admin
    FOR SELECT USING (auth.role() = 'authenticated');
```

### 5. Ejecuta el proyecto
```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

## 📁 Estructura del Proyecto

```
DisciplineRift-BackEnd/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── schools/             # Endpoints de escuelas
│   │   ├── services/            # Endpoints de servicios
│   │   ├── sessions/            # Endpoints de sesiones
│   │   └── staff/               # Endpoints de personal
│   ├── login/                   # Página de login
│   ├── servicios/               # Página de servicios
│   ├── escuelas/                # Página de escuelas
│   └── staff/                   # Página de personal
├── components/                   # Componentes reutilizables
│   ├── auth/                    # Componentes de autenticación
│   ├── ui/                      # Componentes de interfaz
│   └── navigation/              # Componentes de navegación
├── contexts/                     # Context Providers
│   ├── services-context.tsx    # Estado global de servicios
│   ├── schools-context.tsx     # Estado global de escuelas
│   └── staff-context.tsx       # Estado global de personal
├── features/                     # Características específicas
│   ├── services/                # Funcionalidades de servicios
│   ├── schools/                 # Funcionalidades de escuelas
│   └── staff/                   # Funcionalidades de personal
├── lib/                         # Utilidades y servicios
│   ├── api/                     # Servicios de API
│   ├── auth/                    # Servicios de autenticación
│   ├── db/                      # Servicios de base de datos
│   └── supabase/                # Configuración de Supabase
├── public/                      # Assets estáticos
└── styles/                      # Estilos globales
```

## 📜 Scripts Disponibles

```bash
# Desarrollo
npm run dev          # Inicia el servidor de desarrollo

# Producción
npm run build        # Construye la aplicación para producción
npm run start        # Inicia el servidor de producción

# Calidad de código
npm run lint         # Ejecuta ESLint
```

## 🔧 Variables de Entorno

| Variable | Descripción | Requerido |
|----------|-------------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave anónima de Supabase | ✅ |

## 🌐 API Routes

### Escuelas
- `GET /api/schools` - Obtener todas las escuelas
- `POST /api/schools` - Crear nueva escuela
- `PUT /api/schools/[id]` - Actualizar escuela
- `DELETE /api/schools/[id]` - Eliminar escuela

### Servicios
- `GET /api/services` - Obtener todos los servicios
- `POST /api/services` - Crear nuevo servicio
- `PUT /api/services/[id]` - Actualizar servicio
- `DELETE /api/services/[id]` - Eliminar servicio

### Sesiones
- `GET /api/sessions` - Obtener sesiones
- `POST /api/sessions` - Crear nueva sesión
- `PUT /api/sessions/[id]` - Actualizar sesión
- `DELETE /api/sessions/[id]` - Eliminar sesión

### Personal
- `GET /api/staff` - Obtener personal
- `POST /api/staff` - Crear nuevo miembro
- `PUT /api/staff/[id]` - Actualizar miembro
- `DELETE /api/staff/[id]` - Eliminar miembro

## 🎨 Características de la Interfaz

### Componentes Principales
- **Dashboard** - Vista general del sistema
- **Tabla de Servicios** - Gestión completa de programas deportivos
- **Calendario** - Programación visual de sesiones
- **Formularios Dinámicos** - Creación y edición de datos
- **Diálogos de Confirmación** - Acciones seguras
- **Generación de PDF** - Reportes descargables

### Responsive Design
- Diseño adaptativo para móviles y tablets
- Navegación optimizada para todos los dispositivos
- Componentes accesibles siguiendo estándares WCAG

## 🔒 Seguridad

- **Autenticación** con Supabase Auth
- **Autorización** basada en roles
- **Row Level Security (RLS)** en Supabase
- **Validación** de datos en frontend y backend
- **Protección CSRF** automática con Next.js

## 🚀 Despliegue

### Vercel (Recomendado)
1. Conecta tu repositorio de GitHub con Vercel
2. Configura las variables de entorno
3. Despliega automáticamente

### Netlify
1. Conecta tu repositorio
2. Configura el comando de build: `npm run build`
3. Configura las variables de entorno

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 👨‍💻 Autor

**Carlos Berrio** - [Cfberrio](https://github.com/Cfberrio)

## 🆘 Soporte

Si tienes alguna pregunta o necesitas ayuda:

1. Abre un [Issue](https://github.com/Cfberrio/DisciplineRift-BackEnd/issues)
2. Contacta al desarrollador
3. Revisa la documentación

---

⭐ **¡No olvides dar una estrella al proyecto si te fue útil!**