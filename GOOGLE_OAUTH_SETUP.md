# Configuración de Google OAuth para Fudi

## 📋 Pasos para obtener tu CLIENT_ID de Google

### 1. Ir a Google Cloud Console
Visita: https://console.cloud.google.com/

### 2. Crear o seleccionar un proyecto
- Haz clic en el selector de proyectos en la parte superior
- Crea un nuevo proyecto o selecciona uno existente

### 3. Habilitar Google+ API
- Ve al menú ≡ → APIs & Services → Library
- Busca "Google+ API"
- Haz clic en "ENABLE"

### 4. Crear credenciales OAuth 2.0
- Ve a APIs & Services → Credentials
- Haz clic en "+ CREATE CREDENTIALS"
- Selecciona "OAuth client ID"

### 5. Configurar pantalla de consentimiento
Si es la primera vez:
- Haz clic en "CONFIGURE CONSENT SCREEN"
- Selecciona "External" (para permitir cualquier usuario de Google)
- Completa la información requerida:
  - App name: **Fudi**
  - User support email: tu email
  - Developer contact: tu email
- Guarda y continúa

### 6. Crear el OAuth Client ID
- Application type: **Web application**
- Name: **Fudi Web Client**
- Authorized JavaScript origins:
  ```
  http://localhost:4200
  https://tu-dominio.com
  ```
- Authorized redirect URIs: (dejar vacío para Google Sign-In button)

### 7. Obtener el CLIENT_ID
- Después de crear, verás tu CLIENT_ID
- Copia el CLIENT_ID (algo como: `123456789-abc...apps.googleusercontent.com`)

## 🔧 Configurar en la aplicación

### Opción 1: Variable de entorno (Recomendado para producción)
1. Crear archivo `environment.ts`:
```typescript
export const environment = {
  production: false,
  googleClientId: 'TU_CLIENT_ID_AQUI'
};
```

2. Actualizar los archivos TypeScript:
```typescript
// login-main.component.ts y user-form.component.ts
import { environment } from '../../environments/environment';

// En ngAfterViewInit(), reemplazar:
client_id: environment.googleClientId
```

### Opción 2: Directamente en el código (Solo para desarrollo)
Reemplazar en estos archivos:
- `src/app/login-main/login-main.component.ts` (línea ~78)
- `src/app/user-form/user-form.component.ts` (línea ~67)
- `src/app/services/google-auth.service.ts` (línea ~17)

```typescript
client_id: 'TU_CLIENT_ID_AQUI'
```

## 🧪 Probar la integración

1. Iniciar el servidor: `ng serve`
2. Ir a `http://localhost:4200/login`
3. Deberías ver el botón "Continuar con Google"
4. Hacer clic y autenticarte
5. Si todo está correcto, serás redirigido a `/home`

## 🔐 Seguridad

**IMPORTANTE:**
- ⚠️ NO subas tu CLIENT_ID al repositorio público
- ⚠️ Usa variables de entorno en producción
- ⚠️ Agrega `environment.ts` al `.gitignore`

## 📝 Notas

- El token de Google (idToken) solo se usa UNA vez
- El backend devuelve un JWT que expira en 7 días
- El JWT se guarda en localStorage
- El JWT se envía en cada petición autenticada:
  ```
  Authorization: Bearer {token}
  ```

## 🐛 Solución de problemas

### Error: "Invalid client_id"
- Verifica que copiaste correctamente el CLIENT_ID
- Asegúrate de usar el Client ID (no el Client Secret)

### Error: "redirect_uri_mismatch"
- Añade `http://localhost:4200` a los Authorized JavaScript origins
- NO es necesario configurar redirect URIs para Google Sign-In button

### El botón no aparece
- Verifica que el script de Google se cargó en `index.html`
- Abre la consola del navegador y busca errores
- Verifica que `ngAfterViewInit` se está ejecutando

## 📞 Soporte

Si tienes problemas, revisa:
- Console del navegador (F12)
- Network tab para ver las peticiones HTTP
- Logs del backend
