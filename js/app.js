import CONFIG from './config.js';
import SokobanGame from './game.js';
import SokobanParser from './parser.js';
import ActionRepeater from './repeater.js';

/**
 * Unified Game Controller
 * Handles both Desktop and Mobile views
 */
document.addEventListener('DOMContentLoaded', async () => {
    const isMobile = document.documentElement.classList.contains('is-mobile');
    const suffix = isMobile ? 'mobile' : 'desktop';

    // UI Elements
    const board = document.getElementById('board');
    const gameContainer = document.getElementById('game-container');
    const stats = {
        moves: document.getElementById(`moves-count-${suffix}`),
        pushes: document.getElementById(`pushes-count-${suffix}`),
        levelNum: document.getElementById(`level-num-${suffix}`)
    };

    const game = new SokobanGame(board, stats);

    // Modals
    const overlay = document.getElementById('message-overlay');
    const aboutModal = document.getElementById('about-modal');
    const settingsModal = document.getElementById('settings-modal');

    const nextLevelBtn = document.getElementById('next-level-btn');
    const cancelBtn = document.getElementById('cancel-overlay-btn');

    const helpBtn = document.getElementById(`help-btn-${suffix}`);
    const closeAboutBtn = document.getElementById('close-about-btn');

    const settingsBtn = document.getElementById(`settings-btn-${suffix}`);
    const closeSettingsBtn = document.getElementById('close-settings-btn');
    const editionList = document.getElementById('edition-list');

    const toggleFullscreenBtn = document.getElementById(`fullscreen-btn-${suffix}`);

    // Platforms UI Actions
    if (helpBtn) helpBtn.onclick = () => aboutModal.classList.remove('hidden');
    if (closeAboutBtn) closeAboutBtn.onclick = () => aboutModal.classList.add('hidden');

    if (settingsBtn) settingsBtn.onclick = () => {
        renderEditionList();
        settingsModal.classList.remove('hidden');
    };
    if (closeSettingsBtn) closeSettingsBtn.onclick = () => settingsModal.classList.add('hidden');

    // Fullscreen Logic
    const supportsFullscreen = !!(document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen);
    if (supportsFullscreen && toggleFullscreenBtn) {
        toggleFullscreenBtn.onclick = () => {
            if (!document.fullscreenElement && !document.webkitFullscreenElement) {
                const req = document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen;
                req.call(document.documentElement).catch(err => console.log("Fullscreen failed", err));
            } else {
                const exit = document.exitFullscreen || document.webkitExitFullscreen;
                exit.call(document).catch(err => console.log("Exit failed", err));
            }
        };
    }

    const renderEditionList = () => {
        editionList.innerHTML = '';
        CONFIG.COLLECTIONS.forEach(col => {
            const btn = document.createElement('button');
            btn.className = 'primary-btn';
            btn.style.width = '100%';
            btn.style.justifyContent = 'center';
            btn.textContent = col.COLLECTION_NAME;

            if (col.ID === CONFIG.ID) {
                btn.style.border = '2px solid white';
                btn.textContent += ' (Active)';
            }

            btn.onclick = () => {
                localStorage.setItem('soko_active_collection', col.ID);
                window.location.reload();
            };
            editionList.appendChild(btn);
        });
    };

    // Close on backdrop click
    [aboutModal, settingsModal].forEach(modal => {
        modal.onclick = (e) => {
            if (e.target === modal) modal.classList.add('hidden');
        };
    });

    // Inputs & Logic
    const ui = {
        undo: document.getElementById(`undo-btn-${suffix}`),
        reset: document.getElementById(`reset-btn-${suffix}`),
        prev: document.getElementById(`prev-btn-${suffix}`),
        next: document.getElementById(`next-btn-${suffix}`)
    };

    const updateUIState = () => {
        if (ui.prev) ui.prev.disabled = (game.currentLevelIndex === 0);
        const nextPossible = (game.currentLevelIndex < game.levels.length - 1) &&
            (game.currentLevelIndex < game.highestCompletedLevel || game.isCompleted);
        if (ui.next) ui.next.disabled = !nextPossible;
        if (ui.undo) ui.undo.disabled = (game.history.length === 0);
        if (ui.reset) ui.reset.disabled = (game.moves === 0);
    };

    const hideOverlay = () => {
        overlay.classList.add('hidden');
        const badge = document.getElementById('completed-badge');
        const container = document.getElementById('game-container');
        if (game.isCompleted) {
            badge?.classList.add('show');
            container?.classList.add('level-solved');
        } else {
            badge?.classList.remove('show');
            container?.classList.remove('level-solved');
        }
    };

    document.addEventListener('keydown', (e) => {
        if (!overlay.classList.contains('hidden') || !aboutModal.classList.contains('hidden') || !settingsModal.classList.contains('hidden')) {
            if (e.key === 'Escape') {
                aboutModal.classList.add('hidden');
                settingsModal.classList.add('hidden');
                cancelBtn.click();
            }
            if (e.key === 'Enter' && !overlay.classList.contains('hidden')) nextLevelBtn.click();
            return;
        }

        if (game.isCompleted) {
            // Reverted per user request: PageUp for Next (level UP), PageDown for Prev (level DOWN)
            if (e.key === 'PageUp' || (e.altKey && e.key === 'ArrowRight')) updateLevelBy(1);
            else if (e.key === 'PageDown' || (e.altKey && e.key === 'ArrowLeft')) updateLevelBy(-1);
            else if (e.key === 'r' || e.key === 'R' || e.key === 'Delete') { game.reset(); hideOverlay(); }
            else if (e.key === 'z' || e.key === 'Z' || e.key === 'Backspace') { game.undo(); hideOverlay(); }
            return;
        }

        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'PageUp', 'PageDown'].includes(e.key)) e.preventDefault();

        if (e.key === 'PageUp' || (e.altKey && e.key === 'ArrowRight')) { updateLevelBy(1); return; }
        if (e.key === 'PageDown' || (e.altKey && e.key === 'ArrowLeft')) { updateLevelBy(-1); return; }

        switch (e.key) {
            case 'ArrowUp': case 'w': case 'W': game.move(0, -1); break;
            case 'ArrowDown': case 's': case 'S': game.move(0, 1); break;
            case 'ArrowLeft': case 'a': case 'A': game.move(-1, 0); break;
            case 'ArrowRight': case 'd': case 'D': game.move(1, 0); break;
            case 'z': case 'Z': case 'Backspace': game.undo(); hideOverlay(); break;
            case 'r': case 'R': case 'Delete': game.reset(); hideOverlay(); break;
        }
    });

    const updateLevelBy = (delta) => {
        const nextIdx = game.currentLevelIndex + delta;
        if (nextIdx >= 0 && nextIdx < game.levels.length) {
            // Check lockout for forward movement
            if (delta > 0) {
                const nextPossible = (game.currentLevelIndex < game.highestCompletedLevel || game.isCompleted);
                if (nextPossible) game.loadLevel(nextIdx);
            } else {
                game.loadLevel(nextIdx);
            }
        }
    };

    // --- INPUT REPEAT ENGINE ---
    const moveRepeater = new ActionRepeater(() => {
        if (moveDirection.dx !== 0 || moveDirection.dy !== 0) {
            return game.move(moveDirection.dx, moveDirection.dy);
        }
        return false;
    });

    const undoRepeater = new ActionRepeater(() => {
        const success = game.undo();
        hideOverlay();
        return success;
    }, 300, 60); // Faster repeat for rapid undo

    let moveDirection = { dx: 0, dy: 0 };
    let activePointers = new Map();

    // Prevent context menu on board to allow Right-Click Undo shortcut on Desktop
    gameContainer.addEventListener('contextmenu', e => e.preventDefault());

    // --- REPEATABLE BUTTONS ---
    const attachRepeaterToButton = (btn, action) => {
        if (!btn) return;
        const repeater = new ActionRepeater(() => {
            const success = action();
            hideOverlay();
            return success;
        });

        btn.addEventListener('pointerdown', (e) => {
            if (e.button !== 0) return; // Only left-click
            if (moveRepeater.isActive) return; // Ignore during active swipe
            btn.setPointerCapture(e.pointerId);
            repeater.start();
        });
        const stop = () => repeater.stop();
        btn.addEventListener('pointerup', stop);
        btn.addEventListener('pointercancel', stop);
        btn.addEventListener('pointerleave', stop);
    };

    attachRepeaterToButton(ui.undo, () => game.undo());
    attachRepeaterToButton(ui.prev, () => updateLevelBy(-1));
    attachRepeaterToButton(ui.next, () => updateLevelBy(1));

    // Reset remains single-click
    if (ui.reset) ui.reset.onclick = () => { game.reset(); hideOverlay(); };

    // --- GESTURES & MOVEMENT (Pointer Events) ---
    const swipeThreshold = 30;
    let swipeOrigin = null;

    gameContainer.addEventListener('pointerdown', (e) => {
        // If clicking on a button or modal, don't start a swipe
        if (e.target.closest('button') || e.target.closest('.overlay-content')) return;

        activePointers.set(e.pointerId, { x: e.screenX, y: e.screenY, button: e.button });
        gameContainer.setPointerCapture(e.pointerId);

        // 1. Check for Rapid Undo Shortcut: 2-fingers OR Right-Click
        const isRightClick = (e.button === 2);
        const isTwoFingers = (activePointers.size >= 2);

        if (isRightClick || isTwoFingers) {
            moveRepeater.stop(); // Stop any active movement
            undoRepeater.start();
        } else if (activePointers.size === 1) {
            // Start of a potential swipe / single-finger movement
            swipeOrigin = { x: e.screenX, y: e.screenY };
        }
    });

    gameContainer.addEventListener('pointermove', (e) => {
        if (activePointers.size === 0) return; // Guard: finger already up, ignore late events
        if (!activePointers.has(e.pointerId)) return;
        activePointers.get(e.pointerId).x = e.screenX;
        activePointers.get(e.pointerId).y = e.screenY;

        // Skip swipe logic if we are already in Undo mode
        if (undoRepeater.isActive) return;

        // Swipe / Glide Motion / Steering Detection
        if (swipeOrigin) {
            const dx = e.screenX - swipeOrigin.x;
            const dy = e.screenY - swipeOrigin.y;

            if (Math.abs(dx) > swipeThreshold || Math.abs(dy) > swipeThreshold) {
                let nextDir;
                if (Math.abs(dx) > Math.abs(dy)) {
                    nextDir = { dx: dx > 0 ? 1 : -1, dy: 0 };
                } else {
                    nextDir = { dx: 0, dy: dy > 0 ? 1 : -1 };
                }

                // If direction changed (Steering), update it and reset origin to current point
                if (nextDir.dx !== moveDirection.dx || nextDir.dy !== moveDirection.dy) {
                    moveDirection = nextDir;
                    swipeOrigin = { x: e.screenX, y: e.screenY }; // Pivot point for next steering

                    if (!moveRepeater.isActive) {
                        moveRepeater.start();
                    }
                }
            }
        }
    });

    const handlePointerUp = (e) => {
        activePointers.delete(e.pointerId);

        // Evaluate if Rapid Undo should still be active
        const hasRightClickActive = Array.from(activePointers.values()).some(p => p.button === 2);
        if (activePointers.size < 2 && !hasRightClickActive) {
            undoRepeater.stop();
        }

        if (activePointers.size === 0) {
            moveRepeater.stop();
            swipeOrigin = null;
            moveDirection = { dx: 0, dy: 0 };
        }
    };

    gameContainer.addEventListener('pointerup', handlePointerUp);
    gameContainer.addEventListener('pointercancel', handlePointerUp);

    nextLevelBtn.onclick = () => { game.loadLevel(game.currentLevelIndex + 1); };
    cancelBtn.onclick = hideOverlay;
    overlay.onclick = (e) => { if (e.target !== nextLevelBtn) hideOverlay(); };

    document.addEventListener('gameStateChanged', updateUIState);
    document.addEventListener('levelComplete', (e) => {
        overlay.classList.remove('hidden');
        const overlayTitle = document.getElementById('overlay-title');
        const overlayText = document.getElementById('overlay-text');
        const isLast = e.detail && e.detail.isLast;

        if (overlayTitle) {
            overlayTitle.textContent = isLast ? "Epic Victory!" : "Level Complete!";
        }

        if (overlayText) {
            overlayText.textContent = isLast
                ? `You have conquered all puzzles in the ${CONFIG.COLLECTION_NAME} collection!`
                : "Excellent job!";
        }

        nextLevelBtn.style.display = isLast ? 'none' : 'block';
        updateUIState();
    });

    document.addEventListener('levelLoaded', () => {
        updateUIState();
        const badge = document.getElementById('completed-badge');
        const container = document.getElementById('game-container');
        document.getElementById('app-title').innerHTML = `SOKO <span class="accent">${CONFIG.COLLECTION_NAME}</span>`;
        if (game.isCompleted) { badge?.classList.add('show'); container?.classList.add('level-solved'); }
        else { badge?.classList.remove('show'); container?.classList.remove('level-solved'); overlay.classList.add('hidden'); }
    });

    window.addEventListener('resize', () => game.render());

    try {
        const response = await fetch(CONFIG.LEVEL_FILE);
        game.setLevels(SokobanParser.parse(await response.text()));
        game.loadLevel(parseInt(localStorage.getItem(`${CONFIG.STORAGE_PREFIX}_current_level`)) || 0);
        // Initialize UI
        updateUIState();
        document.body.classList.add('ready');

        // Dynamic Versioning from Service Worker
        fetch('sw.js').then(r => r.text()).then(text => {
            const match = text.match(/const CACHE_NAME = '([^']+)';/);
            if (match) {
                const version = match[1].split('-').pop(); // Get v1.2 part
                const verElement = document.querySelector('.game-id');
                if (verElement) verElement.textContent = `SOKO-${version}-LURD`.toUpperCase();
            }
        });
    } catch (err) { console.error('Failed to load levels:', err); }
});
