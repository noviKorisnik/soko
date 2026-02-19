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

    // 3. Button Taps
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

    const updateNavButtons = () => {
        document.getElementById('prev-btn').disabled = (game.currentLevelIndex === 0);
        const nextPossible = (game.currentLevelIndex < game.levels.length - 1) &&
            (game.currentLevelIndex < game.highestCompletedLevel);
        document.getElementById('next-btn').disabled = !nextPossible;
    };

    // 6. Initial Load
    try {
        const response = await fetch(CONFIG.LEVEL_FILE);
        const content = await response.text();
        const levels = SokobanParser.parse(content);
        game.setLevels(levels);

        let lastLevel = parseInt(localStorage.getItem(`${CONFIG.STORAGE_PREFIX}_current_level`)) || 0;
        game.loadLevel(lastLevel);
    } catch (err) {
        console.error('Failed to load levels:', err);
    }
});
