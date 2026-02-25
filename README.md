# Antigravity AutoAccept

A lightweight VS Code extension that automatically accepts Antigravity Agent steps, terminal commands, and file modifications.

## Features

- **Hands-free Automation:** Automatically accepts pending steps from the Antigravity Agent.
- **Native Integration:** Uses official VS Code commands for maximum stability.
- **AutoScroll Support:** Automatically scrolls the agent chat to find off-screen action buttons.
- **Toggle Control:** Easily enable or disable the auto-acceptance from the status bar.
- **Zero Side Effects:** No browser tabs opened, no native dialog interference.

## How to use

1. Install the extension from the Marketplace or by downloading the `.vsix`.
2. Look for the **AutoAccept: ON** indicator in your status bar (bottom right).
3. Click the status bar item to toggle the automation **ON/OFF**.

## Auto-accepted actions

This extension polls every 500ms to trigger the following Antigravity commands:
- Agent step approvals
- Terminal command approvals
- File modification approvals
- General agent approvals

## Requirements

- VS Code 1.85.0 or higher.
- Antigravity extension installed and active.

## Version 1.1.2

- Instant AutoScroll: Changed smooth scroll to instant scroll to prevent false scroll-up detections during animation.
- Increased scroll detection tolerance to handle padding variations in dynamic panels.

## Version 1.1.1

- Improved AutoScroll with "Sticky Scroll" logic: Internal log panels and terminal view outputs will now correctly auto-scroll. 
- AutoScroll gracefully pauses if you manually scroll up to read, and resumes when you scroll back down.

## Version 1.1.0

- Added Smart AutoScroll: Automatically scrolls down the Antigravity chat panel to reveal hidden buttons.
- Excluded main VS Code text editors from autoscroll to allow normal reading.
- Configurable via `autoAccept.enableAutoScroll`.

## Version 1.0.0

- Complete overhaul using native commands.
- Improved stability and performance.
- Removed CDP dependency.
