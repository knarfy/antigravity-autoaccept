import * as vscode from 'vscode';
import { CdpClient } from './cdpClient';
import { buildDetectorScriptWithCustomTexts } from './buttonDetector';
import { getConfig } from './config';

let isEnabled = false;
let pollTimer: ReturnType<typeof setInterval> | undefined;
let statusBarItem: vscode.StatusBarItem;
let outputChannel: vscode.OutputChannel;
let cdpClient: CdpClient;
let isBusy = false;
let lastClickTime = 0;
const COOLDOWN_MS = 800;

export async function activate(context: vscode.ExtensionContext) {
    outputChannel = vscode.window.createOutputChannel('Antigravity AutoAccept');
    outputChannel.appendLine('[AutoAccept] Activando extensión v1.1.2-fix16...');

    // Mostrar status bar INMEDIATAMENTE
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.command = 'autoAccept.toggle';
    statusBarItem.tooltip = 'Antigravity AutoAccept - Haz clic para toggle ON/OFF';
    statusBarItem.text = '⏳ Auto: INIT';
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);
    context.subscriptions.push(outputChannel);

    const cfg = getConfig();
    cdpClient = new CdpClient(cfg.cdpPort, (msg) => outputChannel.appendLine(msg));

    const toggleCmd = vscode.commands.registerCommand('autoAccept.toggle', async () => {
        isEnabled = !isEnabled;
        updateStatusBar();
        if (isEnabled) {
            startPolling();
        } else {
            stopPolling();
            outputChannel.appendLine('[AutoAccept] Desactivado por el usuario.');
        }
    });
    context.subscriptions.push(toggleCmd);

    // Configurar settings y arrancar en background
    setImmediate(async () => {
        try {
            await configureSettings();
        } catch (e) {
            outputChannel.appendLine(`[AutoAccept] Error en configureSettings: ${e}`);
        }

        if (cfg.enableOnStartup) {
            isEnabled = true;
            updateStatusBar();
            startPolling();
        } else {
            updateStatusBar();
        }
    });
}

async function configureSettings() {
    const config = vscode.workspace.getConfiguration();

    const trueSettings = [
        'chat.tools.global.autoApprove',
        'chat.tools.terminal.autoApprove',
        'antigravity.terminal.autoApprove'
    ];

    for (const setting of trueSettings) {
        try {
            const currentValue = config.inspect(setting)?.globalValue;
            if (currentValue !== true) {
                await config.update(setting, true, vscode.ConfigurationTarget.Global);
                outputChannel.appendLine(`[AutoAccept] Configurado ${setting} = true.`);
            }
        } catch (e) {
            outputChannel.appendLine(`[AutoAccept] Error configurando ${setting}: ${e}`);
        }
    }
}

function startPolling() {
    if (pollTimer) { return; } // Ya está corriendo, no duplicar

    const cfg = getConfig();
    outputChannel.appendLine(`[AutoAccept] CDP polling cada ${cfg.pollInterval}ms.`);

    pollTimer = setInterval(async () => {
        if (!isEnabled || isBusy) { return; }

        // Cooldown: si hicimos clic hace menos de COOLDOWN_MS, saltar
        if (Date.now() - lastClickTime < COOLDOWN_MS) { return; }

        isBusy = true;
        try {
            await runDetection();
        } catch (e) {
            // Ignorar errores temporales
        } finally {
            isBusy = false;
        }
    }, cfg.pollInterval);
}

async function runDetection() {
    const cfg = getConfig();
    const script = buildDetectorScriptWithCustomTexts(cfg.customButtonTexts, cfg.excludedButtonTexts);

    const results = await cdpClient.evaluateOnAgentTargets(script);

    for (const res of results) {
        const r = res as any;
        if (r && r.clicked) {
            outputChannel.appendLine(`[AutoAccept] ✅ Botón Auto-Aceptado: "${r.text}" (vía CDP).`);
            lastClickTime = Date.now();
        }
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
