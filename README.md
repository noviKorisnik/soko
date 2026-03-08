# SOKO — See the solution.

A polished, high-fidelity Sokoban experience built with modern web standards. Soko combines classic puzzle-solving with a premium design system, featuring a vast collection of challenges and a robust offline-first architecture.

> [!TIP]
> **SOKO is a PWA!** You can install it on your mobile device for a full-screen application experience and complete offline play.

## 🧩 Comprehensive Level library

**SOKO** provides a diverse range of puzzles organized into logical collections:

- **Our Original Levels**: Exclusive handcrafted puzzles designed specifically for this edition.
- **Classic Edition**: 90 original Thinking Rabbit puzzles that defined the genre.
- **Junior Edition 1 & 2**: Over 110 beginner-friendly puzzles perfect for learning and mastery.
- **Xsokoban Rooms**: Classic levels ported from the original Unix distribution.

## 🗃️ Collection Manager

The **Collection Manager** allows you to navigate the library and manage your progress seamlessly:
- **Smart Grouping**: Categories for *In Progress*, *Completed*, *Saved Offline*, and *Available*.
- **On-Demand Caching**: Save individual collections for offline play with a single tap.
- **Orientation-Aware**: Switch between a spacious Sidebar view on tablets/desktops and a compact Accordion view on mobile.
- **Progress Sync**: All solved levels and active puzzle states are persisted automatically.

## ✨ Cyber-Slate Aesthetics

We follow a **Cyber-Slate Aesthetics** philosophy to ensure the board feels alive:
- **Curated Palette**: A deep midnight slate (`#0f172a`) matched with vibrant electric blue (`#38bdf8`) and emerald indicators.
- **Glassmorphism**: UI controls utilize semi-transparent, blurred layers for a modern, tactile feel.
- **Reactive Energy**: A subtle **72 BPM pulsing player animation** provides visual feedback that the game is waiting for your move.
- **Smooth Transitions**: Move animations and UI shifts use precise cubic-bezier curves to eliminate jerkiness.

## 🛠 Technical Architecture

### 1. Unified Game Engine (`game.js`)
- **Aggressive Trimming**: Automatically removes decorative outer walls to maximize board size on small screens.
- **Infinite Undo**: A custom history stack tracks every move, allowing you to backtrack as needed.
- **Auto-Rotation**: Detects screen orientation and level data to optimally rotate the board for maximum cell size.

### 2. Single Source of Truth (`sw.js` & `version.js`)
- **Robust Versioning**: A centralized versioning system ensures the Application and Service Worker are always in sync.
- **Stale-While-Revalidate**: Updates assets in the background, ensuring you always play the latest version on the next visit.
- **Seamless Switching**: Switch between hundreds of puzzles across different collections without a page reload.

### 3. Progressive Web App
- Fully functional offline via Cache API.
- Manifest-ready for home screen installation.
- Touch-optimized swipe gestures and context-aware mobile controls.

---
*Focusing on premium puzzle design and flawless technical execution.*
