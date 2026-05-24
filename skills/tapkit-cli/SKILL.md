---
name: tapkit-cli
description: Control a physical iPhone from the terminal using the TapKit CLI. Use when the user wants to interact with an iPhone — take screenshots, tap, swipe, type, open apps, or navigate iOS.
allowed-tools: Bash
---

# TapKit CLI

Control a physical iPhone through `tapkit` commands. See the screen via screenshots and interact through taps, swipes, typing, and gestures.

## Setup

```bash
# Check if tapkit is installed
which tapkit || npm install -g tapkit

# Authenticate (one time)
tapkit auth login

# Check connection
tapkit status

# If multiple phones, set one
tapkit phones
tapkit phone set "iPhone 15 Pro"
```

If only one phone is connected, it auto-selects — just start using commands.

## Core Loop

Always: **screenshot → look → act → screenshot to verify**.

```bash
# 1. See what's on screen
tapkit screenshot --base64

# 2. Identify the element, estimate its center coordinates

# 3. Act
tapkit tap 300 672

# 4. Verify
tapkit screenshot --base64
```

You have no DOM, no accessibility tree, no element selectors. Everything is visual + coordinates.

## Use Direct Commands First

Always prefer a direct command over manual navigation:

```bash
# Open an app — don't scroll through home screens
tapkit open "Settings"

# Search — don't swipe and hunt visually
tapkit spotlight "calculator"

# Go home — don't swipe up from bottom
tapkit home
```

Only use tap/swipe for things **inside** an app where no shortcut exists.

## Commands

### Screenshots

```bash
tapkit screenshot --base64          # base64 to stdout (for viewing)
tapkit screenshot --base64 --json   # JSON with base64 + mimeType
tapkit screenshot --llm             # LLM-optimized (1344px max, JPEG)
tapkit screenshot                   # save PNG to current directory
tapkit screenshot --open            # save and open in Preview
```

### Touch Gestures

```bash
tapkit tap <x> <y>                  # single tap
tapkit double-tap <x> <y>          # double tap (zoom, text selection)
tapkit hold <x> <y>                # long press (context menus)
tapkit swipe up                    # swipe from screen center
tapkit swipe down
tapkit swipe left
tapkit swipe right
tapkit drag <x1> <y1> <x2> <y2>   # drag between points
```

### Input

```bash
tapkit type "Hello world"           # type into focused field (tap field first!)
tapkit escape                       # dismiss keyboard, alert, popup
```

### Navigation

```bash
tapkit open "Twitter"               # open app by name
tapkit home                         # press home button
tapkit spotlight "Notes"            # open Spotlight, optionally with query
```

### Device

```bash
tapkit lock                         # lock device
tapkit unlock                       # unlock device
tapkit volume up                    # volume up
tapkit volume down                  # volume down
tapkit siri                         # activate Siri
tapkit shortcut 1                   # run iOS Shortcut by index
```

### JSON Output

Add `--json` to any command for machine-readable output:

```bash
tapkit phones --json
tapkit screenshot --base64 --json
tapkit tap 200 400 --json
```

## Coordinate System

Coordinates map 1:1 with screenshot pixels. If an element is at pixel (300, 672) in the screenshot, use `tapkit tap 300 672`.

- (0, 0) is top-left
- x increases rightward, y increases downward
- Aim for the **center** of UI elements — iOS touch targets can be small
- Status bar is roughly top 47px, home indicator is bottom ~37px

## iOS Navigation Tips

```bash
# Scroll down in a list
tapkit swipe up

# Go back in an app (left-edge swipe)
tapkit drag 10 672 300 672

# Pull to refresh
tapkit drag 300 200 300 600

# Dismiss a popup — find "X" or "Cancel" and tap it

# Close keyboard
tapkit escape

# Tab bars at bottom are main navigation — tap the icons
```

## Text Input

```bash
# 1. Tap the text field
tapkit tap 300 400

# 2. Wait for keyboard, then type
tapkit type "your search query"

# 3. Tap the blue keyboard button (Search/Go/Send/Done)
tapkit tap 350 800

# To clear a field: triple-tap to select all, then type new value
```

## Important

- **Be precise with coordinates.** Off by 50px can mean tapping the wrong element
- **Always verify with screenshots.** Never assume an action succeeded
- **Apps take 1-2 seconds to load.** If screenshot looks unchanged, wait and screenshot again
- **If something doesn't work after 2-3 tries, try a different approach**
- **You cannot handle Face ID, CAPTCHAs, or biometric prompts** — tell the user
- **Don't type passwords** unless the user explicitly provided them
