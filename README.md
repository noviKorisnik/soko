# Sokoban Pro

A polished, high-fidelity Sokoban experience built with modern web standards, featuring original handcrafted levels and a premium user experience.

## 🧩 Level Collections

The heart of Sokoban Pro is our **Original Collection**, which is under active development.
- **Our Original Levels**: Hand-designed puzzles exclusive to this edition. We are launching with a curated set of **3 challenges**, with regular updates planned to expand this into a comprehensive original series.
- **Classic Edition**: A secondary repository of legacy levels provided for players who wish to explore historical layouts.

## ✨ Design Philosophy & Aesthetics

The primary goal was to transcend the typical "minimalist" Sokoban clone. We adopted a **Cyber-Slate Aesthetics** philosophy:
- **Curated Palette**: Using a deep midnight background (`#0f172a`) contrasted with vibrant electric blue accents (`#38bdf8`) for the user and emerald for solved goals.
- **Glassmorphism**: UI elements like the "Action Controls" and "Popups" utilize semi-transparent backgrounds with `backdrop-filter: blur`, giving the interface a layered, high-end feel.
- **Dynamic Energy**: The player character features a subtle **72 BPM pulsing animation**. This "breathing" effect prevents the board from feeling static and communicates that the game is "alive" and waiting for input.
- **Reactive Interactions**: Every tile transition and button hover is governed by smooth cubic-bezier transitions, making movements feel tactile rather than jerky.

## 🛠 Technical Architecture

The application is built using a **Zero-Dependency Vanilla Stack** (HTML5, CSS3, ES6+ JavaScript), ensuring maximum performance and zero build overhead.

### 1. The Game Engine (`game.js`)
- **State-Driven Rendering**: The board is rendered via CSS Grid, allowing for perfectly responsive level layouts regardless of the puzzle dimensions.
- **Undo/Redo System**: A custom history stack tracks every move and push, allowing players to backtrack seamlessly up to 50 steps.
- **Smart Logic**: Distinct handling for "pushed" vs "pushed onto target" states using a multi-character grid encoding system.

### 2. The Parser (`parser.js`)
- **Flexible Ingestion**: Designed to handle the standard Sokoban `.txt` format.
- **Metadata Aware**: It extracts level titles and collection data while normalizing disparate grid string formats (handling trailing spaces and irregular wall layouts).

### 3. State Persistence (`localStorage`)
To make the game feel like a complete "Campaign", we implemented a dual-layer persistence system:
- **Global Progress**: Tracks the `highestCompletedLevel`. Players cannot skip ahead to unsolved puzzles, creating a sense of progression and stakes.
- **Active Session Restore**: Every single move is persisted. If the browser is closed mid-puzzle, the game restores the exact board state, including the undo history, upon return.

### 4. UX & Accessibility
- **Mouse-Free "Contestant" Mode**: For power users, the entire game is playable via keyboard:
    - `WASD / Arrows` for movement.
    - `Backspace` for Undo.
    - `Delete` for Reset.
    - `Page Up / Down` for Level Navigation.
    - `Enter / Escape` for Modal interactions.
- **Visual Feedback Loop**: 
    - Full-screen modals celebrate level completion.
    - Post-solve "Level Solved" badges and board dimming communicate the transition from "active play" to "solved state".
    - The player pulse stops upon victory, visually signaling "rest".
- **Mobile-First Touch Interaction**: 
    - High-precision **Swipe Detection** for movement.
    - Context-aware mobile footer with quick-access **Undo** and **Reset**.
    - Responsive grid scaling ensures puzzles of all sizes fit perfectly on small screens.

## 🏁 Goal Fulfillment

This solution is designed to feel **Complete** by addressing the "edges" of the experience:
1. **The Beginning**: Correctly restoring the last played level and tracking global completion.
2. **The Middle**: Providing a frictionless undo/reset loop and responsive controls.
3. **The End**: A celebration of progress through our original handcrafted series.

---
*Focusing on original puzzle design and premium session continuity.*
