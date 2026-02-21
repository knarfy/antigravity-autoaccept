import * as vscode from 'vscode';
import * as child_process from 'child_process';

export class ShortcutPatcher {
    private port: number;
    private outputLog: (msg: string) => void;

    constructor(port: number, outputLog: (msg: string) => void) {
        this.port = port;
        this.outputLog = outputLog;
    }

    async checkAndPrompt(): Promise<void> {
        const action = await vscode.window.showErrorMessage(
            `Antigravity AutoAccept: El puerto CDP ${this.port} no está disponible. ` +
            `Necesitas lanzar Antigravity con --remote-debugging-port=${this.port}.`,
            'Auto-Fix (Windows)',
            'Ver instrucciones manuales'
        );

        if (action === 'Auto-Fix (Windows)') {
            await this.applyWindowsFix();
        } else if (action === 'Ver instrucciones manuales') {
            vscode.env.openExternal(
                vscode.Uri.parse('https://github.com/yazanbaker94/AntiGravity-AutoAccept#setup')
            );
        }
    }

    private async applyWindowsFix(): Promise<void> {
        const script = this.buildPatchScript();
        return new Promise((resolve) => {
            child_process.exec(
                `powershell -NoProfile -ExecutionPolicy Bypass -Command "${script}"`,
                (err, stdout, stderr) => {
                    if (err) {
                        this.outputLog(`[ShortcutPatcher] Error: ${stderr}`);
                        vscode.window.showErrorMessage(
                            `AutoAccept: No se pudo parchear el acceso directo. ${stderr}`
                        );
                    } else {
                        this.outputLog(`[ShortcutPatcher] OK: ${stdout}`);
                        vscode.window.showInformationMessage(
                            `AutoAccept: ¡Acceso directo parchado! Reinicia Antigravity completamente.`
                        );
                    }
                    resolve();
                }
            );
        });
    }

    private buildPatchScript(): string {
        const flag = `--remote-debugging-port=${this.port}`;
        return `
$shell = New-Object -ComObject WScript.Shell;
$shortcuts = Get-ChildItem "$env:APPDATA\\Microsoft\\Windows\\Start Menu" -Recurse -Filter "*.lnk";
$shortcuts += Get-ChildItem "$env:USERPROFILE\\Desktop" -Filter "*.lnk" -ErrorAction SilentlyContinue;
$patched = 0;
foreach ($sc in $shortcuts) {
    $lnk = $shell.CreateShortcut($sc.FullName);
    if ($lnk.TargetPath -like '*antigravity*' -or $lnk.TargetPath -like '*Antigravity*') {
        if ($lnk.Arguments -notlike '*${flag}*') {
            $lnk.Arguments = $lnk.Arguments + ' ${flag}';
            $lnk.Save();
            $patched++;
            Write-Output "Parcheado: $($sc.FullName)";
        }
    }
}
if ($patched -eq 0) { Write-Output "No se encontraron accesos directos de Antigravity." }
`.replace(/\n/g, ' ');
    }
}
