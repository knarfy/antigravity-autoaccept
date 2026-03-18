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
    'run command',
    'execute',
    'execute command',
    'accept',
    'accept all',
    'accept all changes',
    'always allow',
    'allow',
    'continue',
    'proceed',
    'save',
    'apply',
    'yes',
    'ok',
    'approve',
    'confirm',
    // Spanish translations
    'ejecutar',
    'ejecutar comando',
    'aceptar',
    'aceptar todo',
    'aceptar todos los cambios',
    'permitir siempre',
    'permitir',
    'continuar',
    'proceder',
    'guardar',
    'aplicar',
    'si',
    'sí',
    'aprobar',
    'confirmar'
];

export const BLOCKED_COMMANDS: string[] = [];

export function getConfig(): AutoAcceptConfig {
    const cfg = vscode.workspace.getConfiguration('autoAccept');
    return {
        pollInterval: cfg.get<number>('pollInterval', 500),
        customButtonTexts: cfg.get<string[]>('customButtonTexts', []),
        excludedButtonTexts: cfg.get<string[]>('excludedButtonTexts', ["confirmar", "confirm", "run and debug"]),
        enableOnStartup: cfg.get<boolean>('enableOnStartup', true),
        cdpPort: cfg.get<number>('cdpPort', 9222)
    };
}
