import * as vscode from 'vscode';
import { CdpClient } from './cdpClient';
import { buildDetectorScriptWithCustomTexts } from './buttonDetector';
import { ShortcutPatcher } from './shortcutPatcher';
import { getConfig } from './config';

let isEnabled = false;
let pollTimer: ReturnType<typeof setInterval> | undefined;
let statusBarItem: vscode.StatusBarItem;
let outputChannel: vscode.OutputChannel;
let cdpClient: CdpClient;
let cdpAvailable = false;

export async function activate(context: vscode.ExtensionContext) {
    outputChannel = vscode.window.createOutputChannel('Antigravity AutoAccept');
    outputChannel.appendLine('[AutoAccept] Activando extensión...');
    vscode.window.showInformationMessage('Antigravity AutoAccept V10 Activada 🚀');

    // Auto-configuración de settings para automatización nativa
    await configureSettings();

    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.command = 'autoAccept.toggle';
    statusBarItem.tooltip = 'Antigravity AutoAccept - Haz clic para toggle ON/OFF';
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);
    context.subscriptions.push(outputChannel);

    const cfg = getConfig();
    cdpClient = new CdpClient(cfg.cdpPort, (msg) => outputChannel.appendLine(msg));

    const toggleCmd = vscode.commands.registerCommand('autoAccept.toggle', async () => {
        isEnabled = !isEnabled;
        updateStatusBar();
        if (isEnabled) {
            await startPolling();
        } else {
            stopPolling();
            outputChannel.appendLine('[AutoAccept] Desactivado por el usuario.');
        }
    });
    context.subscriptions.push(toggleCmd);

    if (cfg.enableOnStartup) {
        isEnabled = true;
        updateStatusBar();
        await startPolling();
    } else {
        updateStatusBar();
    }
}

async function configureSettings() {
    const config = vscode.workspace.getConfiguration();

    // Configuraciones que SÍ queremos forzar a true (Seguras, rápidas, no UI-blocking)
    const trueSettings = [
        'chat.tools.terminal.autoApprove',
        'antigravity.terminal.autoApprove'
    ];

    for (const setting of trueSettings) {
        try {
            const currentValue = config.inspect(setting)?.globalValue;
            if (currentValue !== true) {
                await config.update(setting, true, vscode.ConfigurationTarget.Global);
                outputChannel.appendLine(`[AutoAccept] Configurado ${setting} = true de forma nativa.`);
            }
        } catch (e) {
            outputChannel.appendLine(`[AutoAccept] Error configurando ${setting}: ${e}`);
        }
    }

    // Limpieza activa: Configuraciones que queremos forzar a FALSE para confiar en nuestro CDP
    const falseSettings = [
        'chat.tools.global.autoApprove'
    ];

    for (const setting of falseSettings) {
        try {
            const currentValue = config.inspect(setting)?.globalValue;
            if (currentValue === true) { // Si estaba en true por nuestra culpa anterior, lo apagamos
                await config.update(setting, false, vscode.ConfigurationTarget.Global);
                outputChannel.appendLine(`[AutoAccept] Limpiado ${setting} = false para ceder control al CDP.`);
            }
        } catch (e) {
            outputChannel.appendLine(`[AutoAccept] Error limpiando ${setting}: ${e}`);
        }
    }
}

async function startPolling() {
    const cfg = getConfig();
    outputChannel.appendLine(`[AutoAccept] Verificando CDP en puerto ${cfg.cdpPort}...`);
    cdpAvailable = await cdpClient.isPortOpen();

    if (!cdpAvailable) {
        outputChannel.appendLine('[AutoAccept] Puerto CDP no disponible. Mostrando aviso.');
        const patcher = new ShortcutPatcher(cfg.cdpPort, (msg) => outputChannel.appendLine(msg));
        await patcher.checkAndPrompt();

        cdpAvailable = await cdpClient.isPortOpen();
        if (!cdpAvailable) {
            outputChannel.appendLine('[AutoAccept] CDP sigue sin estar disponible. Polling desactivado.');
            isEnabled = false;
            updateStatusBar();
            return;
        }
    }

    outputChannel.appendLine(`[AutoAccept] CDP listo. Polling cada ${cfg.pollInterval}ms.`);

    if (pollTimer) {
        clearInterval(pollTimer);
    }

    pollTimer = setInterval(async () => {
        if (!isEnabled) {
            stopPolling();
            return;
        }
        await runDetection();
    }, cfg.pollInterval);
}

async function runDetection() {
    const cfg = getConfig();
    const script = buildDetectorScriptWithCustomTexts(cfg.customButtonTexts, cfg.excludedButtonTexts, cfg.enableAutoScroll);

    // Ejecución CDP Diagnóstica Agresiva
    try {
        const results = await cdpClient.evaluateOnAgentTargets(script);
        if (results.length === 0) {
            // outputChannel.appendLine('[AutoAccept] [DEBUG] No se han encontrado targets webview para escanear.');
        }
        for (const res of results) {
            if (res && res.clicked) {
                outputChannel.appendLine(`[AutoAccept] ✅ ¡ÉXITO! Botón Auto-Aceptado: "${res.text}"`);
                outputChannel.appendLine(`[AutoAccept] Target: ${res.title} (${res.url})`);
            } else if (res && res.scannned) {
                outputChannel.appendLine(`[AutoAccept] [DEBUG] Escaneado Target: "${res.title}" | URL: ${res.url}`);
            }
        }
    } catch (e) {
        outputChannel.appendLine(`[AutoAccept] ❌ Error CRÍTICO en ciclo de detección: ${e}`);
    }
}

function stopPolling() {
    if (pollTimer) {
        clearInterval(pollTimer);
        pollTimer = undefined;
    }
}

function updateStatusBar() {
    if (isEnabled) {
        statusBarItem.text = '⚡ Auto: ON';
        statusBarItem.backgroundColor = undefined;
    } else {
        statusBarItem.text = '✕ Auto: OFF';
        statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
    }
}

export function deactivate() {
    stopPolling();
    outputChannel?.appendLine('[AutoAccept] Extensión desactivada.');
}
