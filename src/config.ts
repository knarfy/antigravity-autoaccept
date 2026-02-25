import * as vscode from 'vscode';

export interface AutoAcceptConfig {
    pollInterval: number;
    customButtonTexts: string[];
    excludedButtonTexts: string[];
    enableOnStartup: boolean;
    cdpPort: number;
    enableAutoScroll: boolean;
}

export const DEFAULT_BUTTON_TEXTS = [
    'run',
    'accept',
    'always allow',
    'allow',
    'save',
    'apply',
    'yes',
    'ok',
    'always run',
    'run command',
    // Spanish translations
    'aceptar',
    'permitir siempre',
    'permitir',
    'guardar',
    'aplicar',
    'si',
    'sí',
    'ejecutar',
    'siempre ejecutar',
    'accept all',
    'aceptar todo',
    'acept all'
];

export const BLOCKED_COMMANDS: string[] = [];

export function getConfig(): AutoAcceptConfig {
    const cfg = vscode.workspace.getConfiguration('autoAccept');
    return {
        pollInterval: cfg.get<number>('pollInterval', 500),
        customButtonTexts: cfg.get<string[]>('customButtonTexts', []),
        excludedButtonTexts: Array.from(new Set([
            ...(cfg.get<string[]>('excludedButtonTexts') || []),
            "confirmar", "confirm", "aprobar", "approve", "proceed", "proceder",
            "enviar todo", "enviar",
            "continue", "continuar", "deshacer", "undo", "revert"
        ])),
        enableOnStartup: cfg.get<boolean>('enableOnStartup', true),
        cdpPort: cfg.get<number>('cdpPort', 9222),
        enableAutoScroll: cfg.get<boolean>('enableAutoScroll', true),
    };
}
