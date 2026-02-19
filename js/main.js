import CONFIG from './config.js';
import SokobanGame from './game.js';
import SokobanParser from './parser.js';

/**
 * Main application entry point
 */

document.addEventListener('DOMContentLoaded', async () => {
    // Update Title from Config
    document.querySelector('h1').innerHTML = `Sokoban <span class="accent">${CONFIG.COLLECTION_NAME}</span>`;

    const board = document.getElementById('board');
    const stats = {
        moves: document.getElementById('moves-count'),
        pushes: document.getElementById('pushes-count'),
        levelNum: document.getElementById('level-num')
    };

    const game = new SokobanGame(board, stats);

    // Overlay Handling
    const overlay = document.getElementById('message-overlay');
    const nextLevelBtn = document.getElementById('next-level-btn');
    const cancelBtn = document.getElementById('cancel-overlay-btn');

    // Keyboard Controls
    document.addEventListener('keydown', (e) => {
        // Handle Overlay Shortcuts
        if (!overlay.classList.contains('hidden')) {
            if (e.key === 'Escape') cancelBtn.click();
            if (e.key === 'Enter') nextLevelBtn.click();
            return;
        }

        if (game.isCompleted) {
            // Even if completed, allow level navigation and reset
            if (e.key === 'PageUp' || (e.altKey && e.key === 'ArrowRight')) {
                document.getElementById('next-btn').click();
            } else if (e.key === 'PageDown' || (e.altKey && e.key === 'ArrowLeft')) {
                document.getElementById('prev-btn').click();
            } else if (e.key === 'r' || e.key === 'R' || e.key === 'Delete') {
                game.reset();
                hideOverlay();
            } else if (e.key === 'z' || e.key === 'Z' || e.key === 'Backspace') {
                game.undo();
                hideOverlay();
            }
            return;
        }

        // Prevent scrolling with arrows/space/page keys
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'PageUp', 'PageDown'].includes(e.key)) {
            e.preventDefault();
        }

        // Level Navigation (PageUp/Down or Alt + Arrows)
        if (e.key === 'PageUp' || (e.altKey && e.key === 'ArrowRight')) {
            document.getElementById('next-btn').click();
            return;
        }
        if (e.key === 'PageDown' || (e.altKey && e.key === 'ArrowLeft')) {
            document.getElementById('prev-btn').click();
            return;
        }

        switch (e.key) {
            case 'ArrowUp':
            case 'w':
            case 'W':
                game.move(0, -1);
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                game.move(0, 1);
                break;
            case 'ArrowLeft':
            case 'a':
            case 'A':
                game.move(-1, 0);
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                game.move(1, 0);
                break;
            case 'z':
            case 'Z':
            case 'Backspace':
                game.undo();
                hideOverlay();
                break;
            case 'r':
            case 'R':
            case 'Delete':
                game.reset();
                hideOverlay();
                break;
        }
    });

    const updateNavButtons = () => {
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');
        const undoBtn = document.getElementById('undo-btn');
        const resetBtn = document.getElementById('reset-btn');

        if (prevBtn) prevBtn.disabled = (game.currentLevelIndex === 0);

        const nextPossible = (game.currentLevelIndex < game.levels.length - 1) &&
            (game.currentLevelIndex < game.highestCompletedLevel || game.isCompleted);
        if (nextBtn) nextBtn.disabled = !nextPossible;

        // Disable Undo/Reset if no moves have been made
        if (undoBtn) undoBtn.disabled = (game.history.length === 0);
        if (resetBtn) resetBtn.disabled = (game.moves === 0);
    };

    document.addEventListener('gameStateChanged', updateNavButtons);

    const hideOverlay = () => {
        overlay.classList.add('hidden');
        // If still completed, show the badge
        if (game.isCompleted) {
            document.getElementById('completed-badge').classList.add('show');
            document.getElementById('game-container').classList.add('level-solved');
        } else {
            document.getElementById('completed-badge').classList.remove('show');
            document.getElementById('game-container').classList.remove('level-solved');
        }
    };

    // UI Buttons
    document.getElementById('undo-btn').onclick = () => {
        game.undo();
        hideOverlay();
    };

    document.getElementById('reset-btn').onclick = () => {
        game.reset();
        hideOverlay();
    };

    document.getElementById('prev-btn').onclick = () => {
        game.loadLevel(game.currentLevelIndex - 1);
    };

    document.getElementById('next-btn').onclick = () => {
        game.loadLevel(game.currentLevelIndex + 1);
    };

    overlay.onclick = (e) => {
        if (e.target !== nextLevelBtn) hideOverlay();
    };

    // Event Listeners

    document.addEventListener('levelComplete', (e) => {
        overlay.classList.remove('hidden');
        const isLastLevel = game.currentLevelIndex === game.levels.length - 1;

        if (e.detail && e.detail.isLast) {
            document.getElementById('overlay-title').textContent = "Epic Victory!";
            document.getElementById('overlay-text').textContent = "You have mastered all levels of Sokoban!";
            nextLevelBtn.disabled = true;
        } else {
            document.getElementById('overlay-title').textContent = "Level Complete!";
            document.getElementById('overlay-text').textContent = "Fantastic job!";
            nextLevelBtn.disabled = false;
        }

        updateNavButtons();
    });

    document.addEventListener('levelLoaded', () => {
        updateNavButtons();
        // If we load a level that is already won, ensure badge/dimming is set
        if (game.isCompleted) {
            document.getElementById('completed-badge').classList.add('show');
            document.getElementById('game-container').classList.add('level-solved');
        } else {
            document.getElementById('completed-badge').classList.remove('show');
            document.getElementById('game-container').classList.remove('level-solved');
            overlay.classList.add('hidden');
        }
    });

    nextLevelBtn.onclick = () => {
        game.loadLevel(game.currentLevelIndex + 1);
    };

    cancelBtn.onclick = hideOverlay;

    // Click outside modal content to cancel
    overlay.onclick = (e) => {
        if (e.target === overlay) cancelBtn.click();
    };

    // Load level data and THEN start the game
    try {
        const response = await fetch(CONFIG.LEVEL_FILE);
        const content = await response.text();
        const levels = SokobanParser.parse(content);
        console.log(`Loaded ${levels.length} levels from ${CONFIG.LEVEL_FILE}.`);
        game.setLevels(levels);

        // Initial button state before first level load
        updateNavButtons();

        // Load the stored level (or 0)
        let lastLevel = parseInt(localStorage.getItem(`${CONFIG.STORAGE_PREFIX}_current_level`)) || 0;
        game.loadLevel(lastLevel);
    } catch (err) {
        console.error('Failed to load levels:', err);
    }
});
