import CONFIG from './config.js';
import SokobanGame from './game.js';
import SokobanParser from './parser.js';

/**
 * Unified Game Controller
 * Handles both Desktop and Mobile views
 */
document.addEventListener('DOMContentLoaded', async () => {
    const isMobile = document.documentElement.classList.contains('is-mobile');
    const suffix = isMobile ? 'mobile' : 'desktop';

    // UI Elements
    const board = document.getElementById('board');
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

    // Platforms UI Actions
    if (helpBtn) helpBtn.onclick = () => aboutModal.classList.remove('hidden');
    if (closeAboutBtn) closeAboutBtn.onclick = () => aboutModal.classList.add('hidden');

    if (settingsBtn) settingsBtn.onclick = () => {
        renderEditionList();
        settingsModal.classList.remove('hidden');
    };
    if (closeSettingsBtn) closeSettingsBtn.onclick = () => settingsModal.classList.add('hidden');

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
            if (e.key === 'PageUp' || (e.altKey && e.key === 'ArrowRight')) ui.next?.click();
            else if (e.key === 'PageDown' || (e.altKey && e.key === 'ArrowLeft')) ui.prev?.click();
            else if (e.key === 'r' || e.key === 'R' || e.key === 'Delete') { game.reset(); hideOverlay(); }
            else if (e.key === 'z' || e.key === 'Z' || e.key === 'Backspace') { game.undo(); hideOverlay(); }
            return;
        }

        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'PageUp', 'PageDown'].includes(e.key)) e.preventDefault();

        if (e.key === 'PageUp' || (e.altKey && e.key === 'ArrowRight')) { ui.next?.click(); return; }
        if (e.key === 'PageDown' || (e.altKey && e.key === 'ArrowLeft')) { ui.prev?.click(); return; }

        switch (e.key) {
            case 'ArrowUp': case 'w': case 'W': game.move(0, -1); break;
            case 'ArrowDown': case 's': case 'S': game.move(0, 1); break;
            case 'ArrowLeft': case 'a': case 'A': game.move(-1, 0); break;
            case 'ArrowRight': case 'd': case 'D': game.move(1, 0); break;
            case 'z': case 'Z': case 'Backspace': game.undo(); hideOverlay(); break;
            case 'r': case 'R': case 'Delete': game.reset(); hideOverlay(); break;
        }
    });

    if (isMobile || 'ontouchstart' in window) {
        let touchStartX = 0, touchStartY = 0;
        const swipeThreshold = 30;
        board.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
            touchStartY = e.changedTouches[0].screenY;
            if (e.target === board || board.contains(e.target)) e.preventDefault();
        }, { passive: false });

        board.addEventListener('touchend', (e) => {
            const dx = e.changedTouches[0].screenX - touchStartX;
            const dy = e.changedTouches[0].screenY - touchStartY;
            if (Math.abs(dx) > Math.abs(dy)) {
                if (Math.abs(dx) > swipeThreshold) game.move(dx > 0 ? 1 : -1, 0);
            } else {
                if (Math.abs(dy) > swipeThreshold) game.move(0, dy > 0 ? 1 : -1);
            }
        }, { passive: false });
    }

    if (ui.undo) ui.undo.onclick = () => { game.undo(); hideOverlay(); };
    if (ui.reset) ui.reset.onclick = () => { game.reset(); hideOverlay(); };
    if (ui.prev) ui.prev.onclick = () => { game.loadLevel(game.currentLevelIndex - 1); };
    if (ui.next) ui.next.onclick = () => { game.loadLevel(game.currentLevelIndex + 1); };

    nextLevelBtn.onclick = () => { game.loadLevel(game.currentLevelIndex + 1); };
    cancelBtn.onclick = hideOverlay;
    overlay.onclick = (e) => { if (e.target !== nextLevelBtn) hideOverlay(); };

    document.addEventListener('gameStateChanged', updateUIState);
    document.addEventListener('levelComplete', (e) => {
        overlay.classList.remove('hidden');
        const overlayTitle = document.getElementById('overlay-title');
        if (overlayTitle) overlayTitle.textContent = (e.detail && e.detail.isLast) ? "Epic Victory!" : "Level Complete!";
        nextLevelBtn.disabled = (e.detail && e.detail.isLast);
        updateUIState();
    });

    document.addEventListener('levelLoaded', () => {
        updateUIState();
        const badge = document.getElementById('completed-badge');
        const container = document.getElementById('game-container');
        document.getElementById('app-title').innerHTML = `Sokoban <span class="accent">${CONFIG.COLLECTION_NAME}</span>`;
        if (game.isCompleted) { badge?.classList.add('show'); container?.classList.add('level-solved'); }
        else { badge?.classList.remove('show'); container?.classList.remove('level-solved'); overlay.classList.add('hidden'); }
    });

    window.addEventListener('resize', () => game.render());

    try {
        const response = await fetch(CONFIG.LEVEL_FILE);
        game.setLevels(SokobanParser.parse(await response.text()));
        game.loadLevel(parseInt(localStorage.getItem(`${CONFIG.STORAGE_PREFIX}_current_level`)) || 0);
        updateUIState();
    } catch (err) { console.error('Failed to load levels:', err); }
});
