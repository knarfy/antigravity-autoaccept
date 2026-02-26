import * as vscode from 'vscode';
import { CdpClient } from './cdpClient';
import { buildDetectorScriptWithCustomTexts } from './buttonDetector';
import { getConfig } from './config';
import { ShortcutPatcher } from './shortcutPatcher';

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
    const settingsToUpdate = [
        { name: 'chat.tools.global.autoApprove', value: false },
        { name: 'chat.tools.terminal.autoApprove', value: false },
        { name: 'antigravity.terminal.autoApprove', value: false }
    ];

    for (const item of settingsToUpdate) {
        try {
            const currentValue = config.inspect(item.name)?.globalValue;
            if (currentValue !== item.value) {
                await config.update(item.name, item.value, vscode.ConfigurationTarget.Global);
                outputChannel.appendLine(`[AutoAccept] Configurado ${item.name} = ${item.value}.`);
            }
        } catch (e) {
            outputChannel.appendLine(`[AutoAccept] Error configurando ${item.name}: ${e}`);
        }
    }
}

function startPolling() {
    if (pollTimer) { return; }

    const cfg = getConfig();

    // Comprobar puerto antes de empezar
    cdpClient.isPortOpen().then(isOpen => {
        if (!isOpen) {
            outputChannel.appendLine(`[AutoAccept] ⚠️ Puerto CDP ${cfg.cdpPort} CERRADO. La detección no funcionará.`);
            const patcher = new ShortcutPatcher(cfg.cdpPort, (msg) => outputChannel.appendLine(msg));
            patcher.checkAndPrompt();
        } else {
            outputChannel.appendLine(`[AutoAccept] ✅ Conectado al puerto CDP ${cfg.cdpPort}.`);
        }
    });

    outputChannel.appendLine(`[AutoAccept] CDP polling cada ${cfg.pollInterval}ms.`);

    pollTimer = setInterval(async () => {
        if (!isEnabled || isBusy) { return; }

        // Cooldown: si hicimos clic hace menos de COOLDOWN_MS, saltar
        if (Date.now() - lastClickTime < COOLDOWN_MS) { return; }

        isBusy = true;
        try {
            await runDetection();
        } catch (e: any) {
            if (e.message && e.message.includes('ECONNREFUSED')) {
                // Silencioso si el puerto está cerrado tras el primer aviso
            } else {
                outputChannel.appendLine(`[AutoAccept] Error en detección: ${e}`);
            }
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
