# Instrucciones para Verificar y Corregir los Datos del Roster

## 🔍 Problema Identificado

Las columnas `StudentDismisall`, `teacher` y `medcondition` no estaban mostrando datos reales en los rosters. Esto podía deberse a:

1. **Nombre incorrecto de columna**: El código usaba `StudentDismissal` (una L) pero la columna real es `StudentDismisall` (dos L)
2. **Las columnas no existen en la base de datos**
3. **Las columnas existen pero están vacías**
4. **Problema con mayúsculas/minúsculas en PostgreSQL**

## ✅ Cambios Realizados

### 1. Corrección del Nombre de Columna
- ✅ Actualizado de `StudentDismissal` → `StudentDismisall` en todos los archivos
- ✅ Mejorado el operador de coalescencia (`||` → `??`) para preservar valores vacíos
- ✅ Agregados logs de diagnóstico para rastrear los datos

### 2. Archivos Modificados
- `supabase/migrations/003_add_student_roster_fields.sql`
- `lib/db/student-service.ts`
- `features/services/service-detail.tsx`
- `app/api/debug/check-roster-columns/route.ts`

## 🧪 Pasos para Verificar

### Paso 1: Ejecutar Diagnóstico
1. Inicia el servidor de desarrollo: `npm run dev`
2. Abre tu navegador y ve a: http://localhost:3000/api/debug/check-roster-columns
3. Verifica la respuesta JSON:
   - `columnsExist`: debe ser `true`
   - `statistics`: muestra cuántos estudiantes tienen datos en cada columna
   - `sampleData`: muestra ejemplos de registros

### Paso 2: Verificar en Supabase

Ejecuta este query en el SQL Editor de Supabase:

```sql
-- Verificar que las columnas existen (PostgreSQL convierte nombres sin comillas a minúsculas)
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'student' 
  AND column_name IN ('studentdismisall', 'teacher', 'medcondition');
```

**IMPORTANTE**: En PostgreSQL, los nombres de columnas sin comillas se almacenan en minúsculas.
- Si creaste la columna como `StudentDismisall` (sin comillas), PostgreSQL la guardó como `studentdismisall`
- Si creaste la columna como `"StudentDismisall"` (con comillas), mantuvo las mayúsculas

### Paso 3: Verificar Datos Existentes

```sql
-- Ver cuántos estudiantes tienen datos en estas columnas
SELECT 
    COUNT(*) as total_estudiantes,
    COUNT(studentdismisall) as con_dismissal,
    COUNT(teacher) as con_teacher,
    COUNT(medcondition) as con_medcondition
FROM student;

-- Ver ejemplos de datos
SELECT 
    firstname,
    lastname,
    studentdismisall,
    teacher,
    medcondition
FROM student
WHERE studentdismisall IS NOT NULL 
   OR teacher IS NOT NULL 
   OR medcondition IS NOT NULL
LIMIT 10;
```

## 🔧 Soluciones Según el Caso

### Caso 1: Las columnas NO existen
Ejecuta la migración en Supabase SQL Editor (IMPORTANTE: usa minúsculas):

```sql
-- PostgreSQL convierte nombres sin comillas a minúsculas
ALTER TABLE student ADD COLUMN IF NOT EXISTS studentdismisall VARCHAR(255);
ALTER TABLE student ADD COLUMN IF NOT EXISTS teacher VARCHAR(255);
ALTER TABLE student ADD COLUMN IF NOT EXISTS medcondition TEXT;

-- Verificar que se crearon correctamente
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'student' 
  AND column_name IN ('studentdismisall', 'teacher', 'medcondition');
```

### Caso 2: Las columnas existen con mayúsculas (caso sensible)
Si el query anterior no muestra las columnas, intenta con mayúsculas:

```sql
SELECT 
    column_name, 
    data_type 
FROM information_schema.columns 
WHERE table_name = 'student' 
  AND column_name LIKE '%dismiss%';
```

Si aparece como `"StudentDismisall"`, necesitamos modificar el código para usar comillas:

```typescript
// En las queries de Supabase, usar comillas dobles
.select(`
  studentid,
  firstname,
  lastname,
  "StudentDismisall",
  teacher,
  medcondition
`)
```

### Caso 3: Las columnas existen pero están vacías
Actualiza los datos de ejemplo:

```sql
-- Actualizar algunos registros de prueba
UPDATE student 
SET 
    studentdismisall = 'Bus Rider',
    teacher = 'Mrs. Johnson',
    medcondition = 'None'
WHERE studentid IN (
    SELECT studentid FROM student LIMIT 5
);
```

## 📝 Verificar en la Aplicación

### 1. Ver los Logs de la Consola
Abre las DevTools (F12) y ve a la pestaña Console. Busca estos logs:

```
ServiceDetail - Raw student data: {
  studentid: "xxx",
  firstname: "John",
  StudentDismisall: "Bus Rider",  // ← Debe mostrar el valor real
  teacher: "Mrs. Smith",           // ← Debe mostrar el valor real
  medcondition: "None"             // ← Debe mostrar el valor real
}
```

### 2. Ver el Roster Preview
1. Ve a la página de Servicios
2. Selecciona un servicio con estudiantes matriculados
3. En la tabla de preview, verifica que las columnas `StudentDismisall`, `teacher` y `medcondition` muestren los datos reales

### 3. Generar el PDF
1. Haz clic en "Download Roster PDF"
2. Abre el PDF y verifica que muestre los datos reales en las columnas

## 🐛 Problemas Comunes

### Problema: Aparece "N/A" en todas las columnas
**Causa**: Las columnas están vacías en la base de datos
**Solución**: Ejecuta el Caso 3 anterior para añadir datos de prueba

### Problema: Error "column does not exist"
**Causa**: La columna no existe o tiene un nombre diferente
**Solución**: Ejecuta la migración (Caso 1) o verifica el nombre exacto (Caso 2)

### Problema: Los datos no se actualizan en la UI
**Causa**: Cache del navegador o estado antiguo
**Solución**: 
1. Recarga la página (F5 o Ctrl+R)
2. Limpia la caché del navegador
3. Cierra y reabre el servicio en la UI

## 📞 Soporte

Si los problemas persisten:
1. Captura los logs de la consola del navegador
2. Captura el resultado del endpoint de diagnóstico
3. Captura el resultado de los queries SQL
4. Comparte toda esta información para análisis adicional

