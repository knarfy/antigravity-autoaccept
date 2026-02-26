# Antigravity AutoAccept

A lightweight VS Code extension that automatically accepts Antigravity Agent steps, terminal commands, and file modifications using CDP physical clicks for maximum reliability.

## Features

- **Hands-free Automation:** Automatically accepts pending steps from the Antigravity Agent.
- **CDP Physical Clicks:** Uses Chrome DevTools Protocol to simulate real user clicks, bypassing Electron context isolation issues.
- **Smart Scroll-on-Found:** Automatically scrolls to action buttons only when detected, ensuring they are clickable without constant UI flickering.
- **Selective Targeting**: Only interacts with relevant webview panels, avoiding focus stealing from the main editor or external windows.
- **Span & Button Support:** Detects both native buttons and styled spans (like "Accept All") with `cursor-pointer` classes.
- **Safety Exclusions:** Built-in safeguards to prevent auto-accepting critical actions like "Confirm", "Approve", or loop-prone dropdowns like "Always Run".
- **Toggle Control:** Quickly enable/disable the automation from the status bar.

## How to use

1. Install the extension from the Marketplace or via `.vsix`.
2. Ensure Antigravity is running with CDP enabled (default port 9222).
3. Look for the **Auto: ON** indicator in your status bar.
4. Click it to toggle the automation **ON/OFF**.

## Setup & Troubleshooting (Windows)

If you experience external PowerShell/Node windows opening or loss of focus during command execution, follow these steps:

1. **Disable Auto-Approve:** Ensure that terminal auto-approval is disabled in both your User and Profile settings. Add these to your `settings.json`:
   ```json
   "chat.tools.terminal.autoApprove": false,
   "antigravity.terminal.autoApprove": false,
   "terminal.explorerKind": "integrated"
   ```
2. **Enable CDP:** Antigravity must be launched with the `--remote-debugging-port=9222` flag. The extension provides a built-in tool to patch your shortcuts automatically if the port is not detected.

## Requirements

- VS Code 1.85.0 or higher.
- Antigravity extension installed and active.
- Access to the CDP port (default 9222).

## Changelog

### 1.1.7 - Terminal Stability Update
- **Sandboxing Fix**: Automatically disables the "Terminal Sandboxing" feature that caused external window popups and command hangs on Windows.
- **Anti-Hang Watchdog**: Implemented a reactive mechanism that detects and terminates stuck PowerShell sessions when a "termination request" hang is detected in the UI.
- **Integrated Terminal Restoration**: Added automatic configuration for `ConPTY` and sandbox settings to ensure commands stay embedded within the chat panel.

### 1.1.6 - Stable Release
- **Focus Guard**: Implemented target filtering to prevent accidental clicks in external windows.
- **Terminal Fix**: Resolved issue with external PowerShell/Node window popups by managing terminal auto-approval settings.
- **Shortcut Patcher**: Added built-in detection and patching for Antigravity shortcuts to ensure CDP is enabled.
- **Improved Detection**: Broadened CDP target search to include `page` and `iframe` types used in the latest Antigravity versions.

### 1.1.5
- **Reliability Update**: Refined the physical click engine for better coordinate precision.

### 1.1.4
- **Physical Click Engine**: Integrated `Input.dispatchMouseEvent` for 100% click reliability.
- **Scroll-on-Found**: Optimized UI behavior to only scroll when a clickable target is found.

## License
MIT
