import CONFIG from './config.js';
import SokobanGame from './game.js';
import SokobanParser from './parser.js';

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Setup UI & Config
    const appTitle = document.getElementById('app-title');
    appTitle.innerHTML = `Sokoban <span class="accent">${CONFIG.COLLECTION_NAME}</span>`;

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

    // 2. Swipe Gestures
    let touchStartX = 0;
    let touchStartY = 0;
    const swipeThreshold = 30; // Min pixels to count as swipe

    board.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
        e.preventDefault(); // Prevent scrolling while playing
    }, { passive: false });

    board.addEventListener('touchend', (e) => {
        const touchEndX = e.changedTouches[0].screenX;
        const touchEndY = e.changedTouches[0].screenY;

        const dx = touchEndX - touchStartX;
        const dy = touchEndY - touchStartY;

        if (Math.abs(dx) > Math.abs(dy)) {
            // Horizontal swipe
            if (Math.abs(dx) > swipeThreshold) {
                game.move(dx > 0 ? 1 : -1, 0);
            }
        } else {
            // Vertical swipe
            if (Math.abs(dy) > swipeThreshold) {
                game.move(0, dy > 0 ? 1 : -1);
            }
        }
    }, { passive: false });

    // 3. Desktop Parity Keyboard Controls (for testing/hybrid devices)
    document.addEventListener('keydown', (e) => {
        // Handle Overlay Shortcuts
        if (!overlay.classList.contains('hidden')) {
            if (e.key === 'Escape') cancelBtn.click();
            if (e.key === 'Enter') nextLevelBtn.click();
            return;
        }

        if (game.isCompleted) {
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

        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'PageUp', 'PageDown'].includes(e.key)) {
            e.preventDefault();
        }

        if (e.key === 'PageUp' || (e.altKey && e.key === 'ArrowRight')) {
            document.getElementById('next-btn').click();
            return;
        }
        if (e.key === 'PageDown' || (e.altKey && e.key === 'ArrowLeft')) {
            document.getElementById('prev-btn').click();
            return;
        }

        switch (e.key) {
            case 'ArrowUp': case 'w': case 'W': game.move(0, -1); break;
            case 'ArrowDown': case 's': case 'S': game.move(0, 1); break;
            case 'ArrowLeft': case 'a': case 'A': game.move(-1, 0); break;
            case 'ArrowRight': case 'd': case 'D': game.move(1, 0); break;
            case 'z': case 'Z': case 'Backspace': game.undo(); hideOverlay(); break;
            case 'r': case 'R': case 'Delete': game.reset(); hideOverlay(); break;
        }
    });

    // 4. Button Taps
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

    nextLevelBtn.onclick = () => {
        game.loadLevel(game.currentLevelIndex + 1);
    };

    const hideOverlay = () => {
        overlay.classList.add('hidden');
        if (game.isCompleted) {
            document.getElementById('completed-badge').classList.add('show');
            document.getElementById('game-area').classList.add('level-solved');
        } else {
            document.getElementById('completed-badge').classList.remove('show');
            document.getElementById('game-area').classList.remove('level-solved');
        }
    };

    cancelBtn.onclick = hideOverlay;

    // 4. Orientation & Resize Logic
    window.addEventListener('resize', () => {
        game.render(); // Re-calculate cell sizes and rotation
    });

    // 5. Game Events
    document.addEventListener('levelComplete', (e) => {
        overlay.classList.remove('hidden');
        const overlayTitle = document.getElementById('overlay-title');
        const isLastLevel = game.currentLevelIndex === game.levels.length - 1;

        if (e.detail && e.detail.isLast) {
            overlayTitle.textContent = "Epic Victory!";
            nextLevelBtn.disabled = true;
        } else {
            overlayTitle.textContent = "Level Complete!";
            nextLevelBtn.disabled = false;
        }
        updateNavButtons();
    });

    document.addEventListener('levelLoaded', () => {
        updateNavButtons();
        if (game.isCompleted) {
            document.getElementById('completed-badge').classList.add('show');
            document.getElementById('game-area').classList.add('level-solved');
        } else {
            document.getElementById('completed-badge').classList.remove('show');
            document.getElementById('game-area').classList.remove('level-solved');
            overlay.classList.add('hidden');
        }
    });

    overlay.onclick = (e) => {
        if (e.target !== nextLevelBtn) hideOverlay();
    };

    const updateNavButtons = () => {
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');
        const undoBtn = document.getElementById('undo-btn');
        const resetBtn = document.getElementById('reset-btn');

        if (prevBtn) prevBtn.disabled = (game.currentLevelIndex === 0);

        const nextPossible = (game.currentLevelIndex < game.levels.length - 1) &&
            (game.currentLevelIndex < game.highestCompletedLevel || game.isCompleted);
        if (nextBtn) nextBtn.disabled = !nextPossible;

        if (undoBtn) undoBtn.disabled = (game.history.length === 0);
        if (resetBtn) resetBtn.disabled = (game.moves === 0);
    };

    document.addEventListener('gameStateChanged', updateNavButtons);

    // 6. Initial Load
    try {
        const response = await fetch(CONFIG.LEVEL_FILE);
        const content = await response.text();
        const levels = SokobanParser.parse(content);
        game.setLevels(levels);

        let lastLevel = parseInt(localStorage.getItem(`${CONFIG.STORAGE_PREFIX}_current_level`)) || 0;
        game.loadLevel(lastLevel);
        updateNavButtons();
    } catch (err) {
        console.error('Failed to load levels:', err);
    }
});
