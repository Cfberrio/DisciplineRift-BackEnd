# 📱 Configuración de Twilio SMS

## ✅ Sistema ya implementado

El sistema de envío de SMS ya está completamente implementado. Solo necesitas configurar Twilio.

## 🔧 Configuraciones requeridas en Twilio

### 1. **Verificar tu número de teléfono Twilio**
- Ve a **Phone Numbers** → **Manage** → **Active numbers**
- Asegúrate de tener al menos un número activo
- **Importante**: Tu número debe estar en formato E.164 (`+1234567890`)

### 2. **Configurar capacidades del número**
- Haz clic en tu número de teléfono
- En **Capabilities**, asegúrate de que esté habilitado:
  - ✅ **SMS** (obligatorio)
  - ✅ **MMS** (opcional pero recomendado)

### 3. **Configurar Messaging Service (Recomendado)**
- Ve a **Messaging** → **Services**
- Crea un nuevo servicio o usa uno existente
- Agrega tu número de teléfono al servicio
- **Beneficios**: Mejor entregabilidad y funciones avanzadas

### 4. **Verificar límites de cuenta**
- Ve a **Console** → **Account** → **Usage**
- **Cuenta Trial**: Limitada a números verificados
- **Cuenta Paid**: Puede enviar a cualquier número

### 5. **Configurar Webhook (Opcional)**
- Ve a **Messaging** → **Settings**
- Configura webhook para recibir actualizaciones de estado
- URL sugerida: `https://tu-dominio.com/api/webhooks/sms-status`

## 🚀 Variables de entorno necesarias

Ya debes tener estas en tu `.env.local`:

```env
# Twilio SMS Configuration
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
```

## 🧪 Probar la configuración

1. **Usar el botón de test** en la interfaz:
   - Ve a Marketing → Email Campaign
   - Selecciona "SMS Campaign"
   - Haz clic en "Test SMS Config"

2. **Verificar en consola**:
   - Abre las herramientas de desarrollador (F12)
   - Ve a la pestaña Console
   - Revisa los logs para ver el resultado del test

## 📋 Checklist de configuración

- [ ] Cuenta de Twilio creada y verificada
- [ ] Número de teléfono adquirido en Twilio
- [ ] Capacidades SMS habilitadas en el número
- [ ] Variables de entorno configuradas en `.env.local`
- [ ] Paquete `twilio` instalado (`npm install twilio`)
- [ ] Test de configuración exitoso
- [ ] (Si es trial) Números de destino verificados en Twilio

## ⚠️ Consideraciones importantes

### **Cuenta Trial vs Paid**
- **Trial**: Solo puede enviar SMS a números que hayas verificado manualmente en Twilio
- **Paid**: Puede enviar a cualquier número válido

### **Límites y costos**
- **SMS domésticos**: ~$0.0075 por mensaje
- **SMS internacionales**: Varían por país
- **Límites de velocidad**: Aplicables según tu plan

### **Formato de números**
- Los números deben estar en formato E.164: `+1234567890`
- El sistema maneja automáticamente la formatación
- Asegúrate de que los números en tu BD estén correctos

## 🔍 Solución de problemas

### Error: "Twilio credentials not configured"
- Verifica que las variables estén en `.env.local`
- Reinicia el servidor: `npm run dev`

### Error: "From number not verified"
- Tu número Twilio no está verificado o activo
- Ve a Phone Numbers en Twilio Console

### Error: "To number not verified" (Solo Trial)
- El número de destino debe estar verificado en tu cuenta trial
- Upgradeando a cuenta paid se resuelve

### SMS no llegan
- Verifica que el número de destino sea válido
- Revisa los logs en Twilio Console → Monitor → Logs
- Confirma que tu cuenta tenga saldo suficiente

## 📞 Funcionalidades implementadas

✅ **Envío masivo de SMS**
✅ **Variables dinámicas**: `{PARENT_NAME}`, `{STUDENT_NAME}`, etc.
✅ **Selección de padres específicos**
✅ **Contador de caracteres/segmentos**
✅ **Test de configuración**
✅ **Logs detallados**
✅ **Manejo de errores**
✅ **Reporte de estadísticas**

¡El sistema está listo para usar! Solo configura Twilio y comienza a enviar SMS.
