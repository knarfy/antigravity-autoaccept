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
    'continue',
    'proceed',
    'save',
    'apply',
    'yes',
    'ok',
    'confirm',
    'approve',
    // Spanish translations
    'aceptar',
    'permitir siempre',
    'permitir',
    'continuar',
    'proceder',
    'guardar',
    'aplicar',
    'si',
    'sí',
    'confirmar',
    'aprobar',
    // File modification specific
    'accept all',
    'aceptar todo'
];

export const BLOCKED_COMMANDS: string[] = [];

export function getConfig(): AutoAcceptConfig {
    const cfg = vscode.workspace.getConfiguration('autoAccept');
    return {
        pollInterval: cfg.get<number>('pollInterval', 500),
        customButtonTexts: cfg.get<string[]>('customButtonTexts', []),
        excludedButtonTexts: cfg.get<string[]>('excludedButtonTexts', ["confirmar", "confirm", "aprobar", "approve", "proceed", "proceder"]),
        enableOnStartup: cfg.get<boolean>('enableOnStartup', true),
        cdpPort: cfg.get<number>('cdpPort', 9222),
        enableAutoScroll: cfg.get<boolean>('enableAutoScroll', true),
    };
}
