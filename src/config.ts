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
    'accept changes',
    'accept all changes',
    'accept all',
    'accept',
    'apply changes',
    'apply edits',
    'apply all',
    'apply',
    'always allow',
    'allow',
    'continue',
    'proceed',
    'save',
    'yes',
    'ok',
    'approve',
    'confirm',
    // Spanish translations
    'ejecutar',
    'ejecutar comando',
    'aceptar cambios',
    'aceptar todos los cambios',
    'aceptar todo',
    'aceptar',
    'aplicar cambios',
    'aplicar ediciones',
    'aplicar todo',
    'aplicar',
    'permitir siempre',
    'permitir',
    'continuar',
    'proceder',
    'guardar',
    'sí, confirmar',
    'sí, aceptar',
    'aprobar',
    'confirmar',
    // File/Edits specific
    'overwrite',
    'sobrescribir',
    'overwrite file',
    'overwrite and save',
    'yes, overwrite',
    'sí, sobrescribir'
];

export const BLOCKED_COMMANDS: string[] = [];

export function getConfig(): AutoAcceptConfig {
    const cfg = vscode.workspace.getConfiguration('autoAccept');
    return {
        pollInterval: cfg.get<number>('pollInterval', 500),
        customButtonTexts: cfg.get<string[]>('customButtonTexts', []),
        excludedButtonTexts: cfg.get<string[]>('excludedButtonTexts', ["run and debug"]),
        enableOnStartup: cfg.get<boolean>('enableOnStartup', true),
        cdpPort: cfg.get<number>('cdpPort', 9222)
    };
}
