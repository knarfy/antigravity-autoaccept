# Antigravity AutoAccept

Auto-acepta pasos del agente Antigravity: ediciones de archivos, comandos de terminal y permisos. Sin interrupciones.

## Características

- ⚡ **Auto-acepta** botones de confirmación del agente (Run, Accept, Allow, Continue…)
- 🛡️ **Webview Guard**: sólo actúa en el panel del agente, no interfiere con VS Code
- 🔧 **Auto-Fix**: parcheador automático del acceso directo `.lnk` en Windows
- 🎛️ **Toggle** desde la barra de estado o `Ctrl+Shift+P`
- ⚙️ **Configurable**: intervalo de polling y textos personalizados

## Instalación

### 1. Habilitar modo debug (requerido)

La extensión necesita Chrome DevTools Protocol (CDP). La primera vez que se active la extensión sin el flag, te ofrecerá un **Auto-Fix automático**.

**Manual:** añade esto al Target del acceso directo de Antigravity:
```
--remote-debugging-port=9222
```

### 2. Instalar la extensión

**Desde VSIX (recomendado):**
1. `Ctrl+Shift+P` → `Extensions: Install from VSIX`
2. Selecciona el `.vsix` generado
3. Recarga la ventana

**Manual:**
```powershell
cd K:\ATG_WorkSpaces\PC_APPS\antigravity-autoaccept
npm install
npm run compile
npx vsce package
```

## Uso

| Acción | Descripción |
|---|---|
| Clic en `⚡ Auto: ON` | Toggle ON/OFF |
| `Ctrl+Shift+P` → `AntiGravity AutoAccept: Toggle` | Toggle desde paleta |
| Panel Output → `Antigravity AutoAccept` | Ver logs |

## Configuración

```json
{
    "autoAccept.pollInterval": 500,
    "autoAccept.customButtonTexts": [],
    "autoAccept.enableOnStartup": true,
    "autoAccept.cdpPort": 9222
}
```

## Cómo funciona

El panel del agente de Antigravity corre en un proceso Chromium aislado (OOPIF). La API estándar de VS Code no puede ver sus botones React. La extensión usa **CDP (Chrome DevTools Protocol)** en el puerto `9222` para:

1. Listar los targets Chromium activos
2. Detectar el panel del agente mediante un **Webview Guard** (`.react-app-container`)
3. Ejecutar un `TreeWalker` JS para encontrar y clicar botones de confirmación

## Licencia

MIT
