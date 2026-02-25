import * as vscode from 'vscode';

export interface AutoAcceptConfig {
    pollInterval: number;
    customButtonTexts: string[];
    excludedButtonTexts: string[];
    enableOnStartup: boolean;
    cdpPort: number;
}

export const DEFAULT_BUTTON_TEXTS = [
    'run',
    'accept',
    'accept all',
    'always allow',
    'allow',
    'continue',
    'proceed',
    'save',
    'apply',
    'yes',
    'ok',
    // Spanish translations
    'ejecutar',
    'aceptar',
    'aceptar todo',
    'permitir siempre',
    'permitir',
    'continuar',
    'proceder',
    'guardar',
    'aplicar',
    'si',
    'sí'
];

export const BLOCKED_COMMANDS: string[] = [];

export function getConfig(): AutoAcceptConfig {
    const cfg = vscode.workspace.getConfiguration('autoAccept');
    return {
        pollInterval: cfg.get<number>('pollInterval', 500),
        customButtonTexts: cfg.get<string[]>('customButtonTexts', []),
        excludedButtonTexts: cfg.get<string[]>('excludedButtonTexts', ["confirmar", "confirm", "aprobar", "approve", "proceed", "proceder", "run and debug"]),
        enableOnStartup: cfg.get<boolean>('enableOnStartup', true),
        cdpPort: cfg.get<number>('cdpPort', 9222)
    };
}
