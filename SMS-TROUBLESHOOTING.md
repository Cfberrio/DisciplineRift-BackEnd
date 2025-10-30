# 🔧 Troubleshooting SMS - Guía de Solución de Problemas

## ✅ Cambios Implementados

He mejorado el servicio SMS para resolver el Error 30034 y problemas de deliverability:

### 1. **Limpieza Automática de Mensajes**
- ✅ Elimina emojis automáticamente (causa principal de undelivered)
- ✅ Normaliza espacios en blanco
- ✅ Limpia caracteres especiales problemáticos

### 2. **Configuraciones A2P 10DLC**
- ✅ `maxPrice: 0.10` - Límite de precio más alto para A2P
- ✅ `provideFeedback: true` - Solicita feedback de entrega del carrier
- ✅ `validityPeriod: 14400` - 4 horas de validez para el mensaje

### 3. **Mejor Logging**
- ✅ Logs detallados del proceso de limpieza
- ✅ Información completa del estado del mensaje

---

## 🔍 Problemas Comunes y Soluciones

### **Problema 1: Error 30034 - Message blocked**

**Causa:** Número NO registrado para A2P 10DLC

**Solución:**
1. Ve a: https://console.twilio.com/us1/develop/sms/try-it-out/a2p-registration
2. Registra tu negocio
3. Crea una campaña A2P
4. Asocia tu número `+14079747579` con la campaña
5. Espera aprobación (1-7 días)

**Costo:** ~$4/mes por campaña

---

### **Problema 2: Status "undelivered" sin código de error**

**Causa:** Emojis o caracteres especiales en el mensaje

**Solución:** ✅ Ya implementada - El sistema ahora limpia automáticamente

**Ejemplo:**
- ❌ Original: `"Hello! 🏐 Welcome to volleyball!"`
- ✅ Limpiado: `"Hello! Welcome to volleyball!"`

---

### **Problema 3: Números no se formatean correctamente**

**Causa:** Números con formato incorrecto en la base de datos

**Solución:** ✅ Ya implementada - Limpieza automática de formato

**Ejemplos soportados:**
- `(407) 614-7454` → `+14076147454`
- `407-614-7454` → `+14076147454`
- `4076147454` → `+14076147454`
- `+14076147454` → `+14076147454`

---

### **Problema 4: SMS no llega pero el status es "sent"**

**Causa:** Problema del carrier o número inválido

**Solución:**
1. Verifica que el número de destino sea válido y activo
2. Revisa en Twilio Console → Monitor → Logs → Messages
3. Busca el Message SID y revisa el estado detallado
4. Si el carrier bloqueó el mensaje, considera:
   - Cambiar el contenido del mensaje
   - Verificar si el número está en lista negra
   - Contactar al carrier

---

### **Problema 5: Variables no se reemplazan**

**Causa:** Variables mal escritas o datos faltantes

**Variables disponibles:**
- `{PARENT_NAME}` - Nombre del padre
- `{STUDENT_NAME}` - Nombre del estudiante
- `{TEAM_NAME}` - Nombre del equipo
- `{SCHOOL_NAME}` - Nombre de la escuela
- `{SCHOOL_LOCATION}` - Ubicación de la escuela
- `{COACH_NAME}` - Nombre del entrenador
- `{PARENT_EMAIL}` - Email del padre
- `{PARENT_PHONE}` - Teléfono del padre
- `{STUDENT_GRADE}` - Grado del estudiante
- `{TEAM_PRICE}` - Precio del equipo
- `{TEAM_DESCRIPTION}` - Descripción del equipo

**Solución:**
- Usa las variables exactamente como están escritas (con llaves `{}`)
- Verifica que los datos existan en la base de datos

---

## 🧪 Cómo Probar

### **1. Prueba desde Marketing:**
1. Ve a **Marketing** en el dashboard
2. Selecciona **SMS Campaign**
3. Elige un equipo
4. Selecciona padres
5. Escribe un mensaje (sin emojis para primera prueba)
6. Envía el SMS
7. Revisa los logs en la consola del navegador (F12)

### **2. Prueba desde Debug:**
1. Ve a `/debug-sms`
2. Ingresa tu número de prueba: `+14076147454`
3. Escribe un mensaje simple: `"Hello! This is a test message."`
4. Haz clic en "Send Optimized SMS"
5. Verifica el resultado

### **3. Verificar Estado del Mensaje:**
1. Copia el Message ID (SID) de los logs
2. En `/debug-sms`, sección "Check Message Status"
3. Pega el Message ID
4. Haz clic en "Check Status"
5. Revisa el estado detallado

---

## 📊 Estados de Mensaje Twilio

| Estado | Significado | Acción |
|--------|-------------|--------|
| `queued` | En cola para envío | Esperar |
| `sending` | Enviando al carrier | Esperar |
| `sent` | Enviado al carrier | Esperar 1-2 min |
| `delivered` | ✅ Entregado exitosamente | Todo OK |
| `undelivered` | ❌ No entregado | Ver código de error |
| `failed` | ❌ Fallo en envío | Ver código de error |

---

## 🔑 Códigos de Error Comunes

| Código | Significado | Solución |
|--------|-------------|----------|
| `30034` | No registrado A2P 10DLC | Registrar campaña A2P |
| `21211` | Número no verificado (Trial) | Verificar o upgrade cuenta |
| `21408` | SMS no habilitado | Habilitar SMS en número |
| `21614` | Número inválido | Verificar formato |
| `30007` | Filtrado por carrier | Cambiar contenido |
| `30005` | Número desconocido | Verificar número existe |

---

## ✅ Checklist de Diagnóstico

Antes de reportar un problema, verifica:

- [ ] A2P 10DLC está registrado y aprobado
- [ ] Variables de entorno configuradas correctamente
- [ ] Número de Twilio tiene capacidades SMS habilitadas
- [ ] Mensaje no contiene emojis o caracteres especiales
- [ ] Números de destino están en formato válido
- [ ] Cuenta Twilio tiene saldo suficiente
- [ ] Revisaste los logs en Twilio Console
- [ ] Probaste con el endpoint `/debug-sms`

---

## 🆘 Soporte

Si el problema persiste después de:
1. Registrar A2P 10DLC
2. Probar sin emojis
3. Verificar números válidos
4. Revisar logs de Twilio

**Contacta a Twilio Support:**
- https://support.twilio.com/
- Proporciona el Message SID del SMS fallido
- Describe el error específico que recibes

---

## 📝 Logs Importantes

Cuando reportes un problema, incluye:
```
[SMS] Original number: (407) 614-7454
[SMS] Cleaned number: +14076147454
[SMS] Original message length: 50
[SMS] Cleaned message length: 45
[SMS] Message was cleaned (emojis/special chars removed)
[SMS] SMS sent successfully: {
  sid: 'SM...',
  status: 'queued',
  to: '+14076147454',
  from: '+14079747579'
}
```

Estos logs ayudan a identificar el problema exacto.

