# Antigravity AutoAccept

A lightweight VS Code extension that automatically accepts Antigravity Agent steps, terminal commands, and file modifications using CDP physical clicks for maximum reliability.

## Features

- **Hands-free Automation:** Automatically accepts pending steps from the Antigravity Agent.
- **CDP Physical Clicks:** Uses Chrome DevTools Protocol to simulate real user clicks, bypassing Electron context isolation issues.
- **Smart Scroll-on-Found:** Automatically scrolls to action buttons only when detected, ensuring they are clickable without constant UI flickering.
- **Span & Button Support:** Detects both native buttons and styled spans (like "Accept All") with `cursor-pointer` classes.
- **Safety Exclusions:** Built-in safeguards to prevent auto-accepting critical actions like "Confirm", "Approve", or loop-prone dropdowns like "Always Run".
- **Toggle Control:** Quickly enable/disable the automation from the status bar.

## How to use

1. Install the extension from the Marketplace or via `.vsix`.
2. Ensure Antigravity is running with CDP enabled (default port 9222).
3. Look for the **Auto: ON** indicator in your status bar.
4. Click it to toggle the automation **ON/OFF**.

## Auto-accepted actions

Polls every 500ms (configurable) to trigger:
- Terminal command "Run" prompts.
- File modification "Accept All" or "Accept" banners.
- General agent approvals.

## Requirements

- VS Code 1.85.0 or higher.
- Antigravity extension installed and active.
- Access to the CDP port (default 9222).

## Changelog

### 1.1.5 - Stable Release
- **Final Stability Fixes**: Refined the polling engine to be non-blocking.
- **Cache Refresh**: Forced Marketplace update.

### 1.1.4 - Smart Automation
- **Scroll-on-Found**: Replaces constant autoscroll. It only scrolls when a clickable target is found.
- **Restricted Detection**: Improved logic to avoid false positives (like accidental folder opening).
- **Physical Click Engine**: Fully integrated `Input.dispatchMouseEvent` for 100% click reliability.

### 1.1.0 - Legacy Autoscroll
- Initial experiment with constant scrolling.

### 1.0.0
- Base redesign using native commands.

## License
MIT
