# Email Template Guidelines for Newsletter

## CAN-SPAM Compliance Requirements

Para evitar que los emails sean catalogados como spam y cumplir con la ley CAN-SPAM Act, cada email de newsletter **DEBE incluir**:

### 1. Dirección Física del Remitente (OBLIGATORIO)

Todos los emails comerciales deben incluir una dirección física válida. Agrega esto en el footer de tu HTML:

```html
<div class="font" style="font-size:11px;color:#64748b;margin-top:12px;text-align:center;">
  Discipline Rift<br>
  [Tu Dirección Física Completa]<br>
  [Ciudad, Estado, ZIP]<br>
  United States
</div>
```

**Ejemplo:**
```html
<div class="font" style="font-size:11px;color:#64748b;margin-top:12px;text-align:center;">
  Discipline Rift<br>
  123 Main Street, Suite 100<br>
  Orlando, FL 32801<br>
  United States
</div>
```

### 2. Enlace de Unsubscribe (YA IMPLEMENTADO)

✅ El sistema automáticamente:
- Reemplaza `{UNSUBSCRIBE_URL}` con el enlace único de cada usuario
- Agrega headers `List-Unsubscribe` y `List-Unsubscribe-Post`
- Elimina el registro de la tabla Newsletter al hacer clic

### 3. Headers Anti-Spam (YA IMPLEMENTADO)

✅ El sistema automáticamente incluye:
- `List-Unsubscribe` - Botón de unsubscribe en Gmail/Outlook
- `List-Unsubscribe-Post` - One-click unsubscribe (RFC 8058)
- `List-ID` - Identificador del newsletter
- `Reply-To` - Email de respuesta
- `X-Mailer` - Identificación del sistema
- `Organization` - Nombre de la organización
- `Precedence: bulk` - Marca como email masivo

### 4. Versión Plain Text (YA IMPLEMENTADO)

✅ El sistema automáticamente convierte HTML a texto plano usando `html-to-text`

## Recomendaciones Adicionales

### Estructura HTML
- ✅ **Usa tablas** para layout (mejor compatibilidad)
- ✅ **Estilos inline** (no CSS externo)
- ✅ **Responsive design** con media queries
- ✅ **Alt text** en todas las imágenes

### Contenido
- ✅ **Asunto claro** y relevante
- ✅ **Ratio texto/HTML balanceado** (no solo imágenes)
- ✅ **Enlaces válidos** que funcionan
- ✅ **Sin palabras spam** ("FREE", "WINNER", "CLICK HERE")

### Autenticación de Dominio (CRÍTICO)

Asegúrate que `disciplinerift.com` tenga configurado:

#### SPF Record
```
v=spf1 include:_spf.google.com ~all
```

#### DKIM Record
Generado desde Google Workspace Admin Console

#### DMARC Record
```
v=DMARC1; p=quarantine; rua=mailto:dmarc@disciplinerift.com
```

Puedes verificar en: https://mxtoolbox.com/dmarc.aspx

## Template Actualizado con Dirección Física

Agrega este bloque ANTES del enlace de unsubscribe en el footer:

```html
<!-- Footer -->
<tr>
  <td style="background:#0a7db3;border-top-left-radius:56px;border-top-right-radius:56px;padding:16px 22px;">
    <table role="presentation" width="100%">
      <tr>
        <td class="font" align="center" style="font-size:12px;line-height:18px;color:#e6f4fb;">
          © Discipline Rift
        </td>
      </tr>
      <!-- AGREGA ESTE BLOQUE -->
      <tr>
        <td class="font" align="center" style="font-size:11px;line-height:16px;color:#b8dce8;padding-top:8px;">
          Discipline Rift<br>
          [Tu Dirección Completa]<br>
          [Ciudad, Estado, ZIP]
        </td>
      </tr>
      <!-- FIN DEL BLOQUE -->
      <tr>
        <td class="font" align="center" style="padding-top:10px;">
          <!-- Unsubscribe button -->
          <a href="{UNSUBSCRIBE_URL}" target="_blank"
             class="subcta"
             style="display:inline-block;padding:12px 18px;font-size:13px;font-weight:600;color:#0a7db3;text-decoration:none;border-radius:10px;background:#ffffff;border:1px solid #e6f4fb;">
            Unsubscribe from newsletter
          </a>
        </td>
      </tr>
    </table>
  </td>
</tr>
```

## Testing del Email

Antes de enviar 1500+ emails:

1. **Enviar test emails** usando el botón "Send Test" en `/email-marketing/compose`
2. **Verificar en múltiples clientes:**
   - Gmail (desktop y móvil)
   - Outlook
   - Apple Mail
   - Yahoo Mail
3. **Revisar carpeta spam** - ¿llegó a inbox o spam?
4. **Usar herramientas de testing:**
   - https://www.mail-tester.com/ (score 10/10 ideal)
   - https://mxtoolbox.com/emailhealth.aspx

## Estrategia de Warm-up (Recomendado)

Si es la primera vez que envías desde `luis@disciplinerift.com`:

- **Día 1:** 200 emails
- **Día 2:** 500 emails
- **Día 3:** 1000 emails
- **Día 4+:** Sin límite

Esto construye reputación del dominio gradualmente.

## Validar Configuración

Visita: `http://localhost:3000/api/email-marketing/validate-config?provider=relay`

Esto verifica:
- ✅ Variables de entorno presentes
- ✅ Conexión SMTP funciona
- ✅ Credenciales válidas

## Variables de Entorno Requeridas

```env
# Workspace SMTP Relay
RELAY_HOST=smtp-relay.gmail.com
RELAY_PORT=587
RELAY_REQUIRE_TLS=true
RELAY_USER=luis@disciplinerift.com
RELAY_PASS=[tu-app-password]

# URLs
UNSUBSCRIBE_URL_BASE=https://disciplinerift.com
UNSUBSCRIBE_SECRET=[secret-key-seguro]

# Configuración de Batching
BATCH_SIZE=100
CONCURRENCY=5
DELAY_BETWEEN_BATCH_MS=3000
```

## Resumen de Implementación

✅ **Completado:**
1. Headers anti-spam (Reply-To, X-Mailer, Organization, Precedence)
2. Conversión HTML a plain text automática
3. Batching optimizado (100/batch, concurrency 5)
4. Logging mejorado con progreso cada 100 emails
5. Provider default = 'relay' (Workspace SMTP Relay)
6. Endpoint de validación `/api/email-marketing/validate-config`

⚠️ **PENDIENTE - ACCIÓN REQUERIDA:**
- **Agregar dirección física** al HTML template (ver ejemplo arriba)
- **Verificar DNS records** (SPF, DKIM, DMARC) están configurados
- **Hacer test send** antes del envío masivo mañana

## Contacto y Soporte

Para problemas o preguntas:
- Revisa logs en terminal con prefijo `[NEWSLETTER]` y `[API]`
- Verifica endpoint: `/api/email-marketing/validate-config`
- Usa test emails para validar antes de enviar masivamente











