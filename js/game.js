/**
 * Core Game Engine for Sokoban
 */

import CONFIG from './config.js';
import SokobanParser from './parser.js';

export default class SokobanGame {
    constructor(boardElement, statsElements) {
        this.boardElement = boardElement;
        this.statsElements = statsElements; // { moves, pushes, levelNum }

        this.currentLevelIndex = 0;
        this.highestCompletedLevel = parseInt(localStorage.getItem(`${CONFIG.STORAGE_PREFIX}_highest`)) || 0;
        this.isCompleted = false;
        this.levels = [];
        this.grid = []; // 2D array of cells
        this.playerPos = { x: 0, y: 0 };
        this.moves = 0;
        this.pushes = 0;
        this.history = []; // For undo

        this.CELL_TYPES = {
            WALL: '#',
            PLAYER: '@',
            PLAYER_ON_TARGET: '+',
            BOX: '$',
            BOX_ON_TARGET: '*',
            TARGET: '.',
            FLOOR: ' '
        };
    }

    setLevels(levels) {
        this.levels = levels;
    }

    loadLevel(index, useSavedState = true) {
        if (index < 0 || index >= this.levels.length) return;

        // Navigation guard: can't skip ahead
        if (index > this.highestCompletedLevel) return;

        // BUG FIX: Clear memory of previous level when switching
        // We only want to keep memory of the "active" level state.
        if (this.currentLevelIndex !== index) {
            this.clearSavedState(this.currentLevelIndex);
        }

        this.currentLevelIndex = index;
        localStorage.setItem(`${CONFIG.STORAGE_PREFIX}_current_level`, index);
        this.isCompleted = false;

        const savedData = useSavedState ? this.getSavedState(index) : null;

        if (savedData) {
            this.grid = savedData.grid;
            this.playerPos = savedData.playerPos;
            this.moves = savedData.moves;
            this.pushes = savedData.pushes;
            this.history = savedData.history || [];
        } else {
            const levelData = this.levels[index];
            const rawGrid = SokobanParser.normalizeGrid(levelData.grid);

            this.grid = rawGrid.map((line, y) => {
                return line.split('').map((char, x) => {
                    if (char === this.CELL_TYPES.PLAYER || char === this.CELL_TYPES.PLAYER_ON_TARGET) {
                        this.playerPos = { x, y };
                    }
                    return char;
                });
            });
            this.moves = 0;
            this.pushes = 0;
            this.history = [];
        }

        this.updateStats();
        this.render();
        this.checkWin(false); // Check if loaded state is already win
        document.dispatchEvent(new CustomEvent('levelLoaded'));
    }

    render() {
        this.boardElement.innerHTML = '';

        // 1. Determine Grid View
        let gridToRender = this.grid;
        let startY = 0, endY = this.grid.length;
        let startX = 0, getMaxX = () => Math.max(...this.grid.map(row => row.length));

        // Mobile optimization: Strip outer walls if configured
        if (CONFIG.STRIP_OUTER_WALLS) {
            // Check if all perimeter cells are walls before stripping
            const canStripTop = this.grid[0].every(c => c === this.CELL_TYPES.WALL);
            const canStripBottom = this.grid[this.grid.length - 1].every(c => c === this.CELL_TYPES.WALL);
            const canStripLeft = this.grid.every(row => row[0] === this.CELL_TYPES.WALL);
            const canStripRight = this.grid.every(row => row[row.length - 1] === this.CELL_TYPES.WALL);

            if (canStripTop) startY = 1;
            if (canStripBottom) endY = this.grid.length - 1;
            if (canStripLeft) startX = 1;
            // Note: Right is trickier if rows aren't normalized yet, but parser usually does.
        }

        const viewRows = endY - startY;
        const baseCols = getMaxX();
        const viewCols = CONFIG.STRIP_OUTER_WALLS ? baseCols - 2 : baseCols;

        // 2. Auto-rotate if configured
        let isRotated = false;
        if (CONFIG.AUTO_ROTATE) {
            const screenPortrait = window.innerHeight > window.innerWidth;
            const levelLandscape = viewCols > viewRows;
            if (screenPortrait && levelLandscape) isRotated = true;
        }

        const finalRows = isRotated ? viewCols : viewRows;
        const finalCols = isRotated ? viewRows : viewCols;

        // 3. Size Calculations
        if (CONFIG.AUTO_ADJUST_SIZE) {
            const parent = this.boardElement.parentElement;
            const padding = 40; // Total padding
            const availW = parent.clientWidth - padding;
            const availH = parent.clientHeight - padding;

            const cellW = availW / finalCols;
            const cellH = availH / finalRows;
            const cellSize = Math.floor(Math.min(cellW, cellH, 60)); // Max 60px
            this.boardElement.style.setProperty('--cell-size', `${cellSize}px`);
        }

        this.boardElement.style.gridTemplateColumns = `repeat(${finalCols}, var(--cell-size))`;
        this.boardElement.style.gridTemplateRows = `repeat(${finalRows}, var(--cell-size))`;

        // 4. Populate
        for (let r = 0; r < finalRows; r++) {
            for (let c = 0; c < finalCols; c++) {
                // Map screen (r, c) back to grid (y, x)
                let x, y;
                if (isRotated) {
                    // 90 deg rotation: x = viewCols - 1 - r + startX, y = c + startY
                    x = (viewCols - 1 - r) + startX;
                    y = c + startY;
                } else {
                    x = c + startX;
                    y = r + startY;
                }

                const char = (this.grid[y] && this.grid[y][x]) || ' ';
                const cell = document.createElement('div');
                cell.classList.add('cell');

                // Determine base tile
                if (char === this.CELL_TYPES.WALL) {
                    cell.classList.add('wall');
                } else if (char === this.CELL_TYPES.TARGET || char === this.CELL_TYPES.PLAYER_ON_TARGET || char === this.CELL_TYPES.BOX_ON_TARGET) {
                    cell.classList.add('floor', 'target');
                } else {
                    cell.classList.add('floor');
                }

                // Determine dynamic object
                if (char === this.CELL_TYPES.PLAYER || char === this.CELL_TYPES.PLAYER_ON_TARGET) {
                    const player = document.createElement('div');
                    player.classList.add('cell', 'player');
                    cell.appendChild(player);
                } else if (char === this.CELL_TYPES.BOX || char === this.CELL_TYPES.BOX_ON_TARGET) {
                    const box = document.createElement('div');
                    box.classList.add('cell', 'box');
                    if (char === this.CELL_TYPES.BOX_ON_TARGET) {
                        box.classList.add('box-on-target');
                    }
                    cell.appendChild(box);
                }

                this.boardElement.appendChild(cell);
            }
        }

        // Save current view orientation for move logic
        this.isViewRotated = isRotated;
    }

    move(dx, dy) {
        if (this.isCompleted) return;

        // Rotation translation: If the board is rotated on screen, 
        // we must translate the input direction accordingly.
        if (this.isViewRotated) {
            // Screen Up (0, -1) -> Grid (1, 0) Right
            // Screen Down (0, 1) -> Grid (-1, 0) Left
            // Screen Left (-1, 0) -> Grid (0, -1) Up
            // Screen Right (1, 0) -> Grid (0, 1) Down
            const oldDx = dx;
            dx = -dy;
            dy = oldDx;
        }

        const newX = this.playerPos.x + dx;
        const newY = this.playerPos.y + dy;

        // Check bounds (though levels are surrounded by walls)
        if (newY < 0 || newY >= this.grid.length || newX < 0 || newX >= this.grid[newY].length) return;

        const targetChar = this.grid[newY][newX];

        // 1. Wall
        if (targetChar === this.CELL_TYPES.WALL) return;

        // 2. Box or Box on Target
        if (targetChar === this.CELL_TYPES.BOX || targetChar === this.CELL_TYPES.BOX_ON_TARGET) {
            const nextBoxX = newX + dx;
            const nextBoxY = newY + dy;

            // Check if box can be pushed
            const behindBoxChar = this.grid[nextBoxY][nextBoxX];
            if (behindBoxChar === this.CELL_TYPES.FLOOR || behindBoxChar === this.CELL_TYPES.TARGET) {
                // Save state for undo
                this.saveHistory();

                // Move box
                this.grid[nextBoxY][nextBoxX] = (behindBoxChar === this.CELL_TYPES.TARGET) ?
                    this.CELL_TYPES.BOX_ON_TARGET : this.CELL_TYPES.BOX;

                // Update new box position in original cell (becomes target or floor)
                this.grid[newY][newX] = (targetChar === this.CELL_TYPES.BOX_ON_TARGET) ?
                    this.CELL_TYPES.TARGET : this.CELL_TYPES.FLOOR;

                // Move player
                this.executePlayerMove(newX, newY);
                this.pushes++;
                this.moves++;
                this.saveState();
                this.updateStats();
                this.render();
                this.checkWin();
                return;
            } else {
                return; // Cant push
            }
        }

        // 3. Floor or Target
        if (targetChar === this.CELL_TYPES.FLOOR || targetChar === this.CELL_TYPES.TARGET) {
            this.saveHistory();
            this.executePlayerMove(newX, newY);
            this.moves++;
            this.saveState();
            this.updateStats();
            this.render();
            return;
        }
    }

    executePlayerMove(newX, newY) {
        // Reset current player position
        const currentPosChar = this.grid[this.playerPos.y][this.playerPos.x];
        this.grid[this.playerPos.y][this.playerPos.x] = (currentPosChar === this.CELL_TYPES.PLAYER_ON_TARGET) ?
            this.CELL_TYPES.TARGET : this.CELL_TYPES.FLOOR;

        // Set new player position
        const targetChar = this.grid[newY][newX];
        this.grid[newY][newX] = (targetChar === this.CELL_TYPES.TARGET) ?
            this.CELL_TYPES.PLAYER_ON_TARGET : this.CELL_TYPES.PLAYER;

        this.playerPos = { x: newX, y: newY };
    }

    saveHistory() {
        // Simple deep clone of grid and status
        this.history.push({
            grid: this.grid.map(row => [...row]),
            playerPos: { ...this.playerPos },
            moves: this.moves,
            pushes: this.pushes
        });
        if (this.history.length > 50) this.history.shift(); // Limit undo stack
    }

    undo() {
        if (this.history.length === 0) return;
        const state = this.history.pop();
        this.grid = state.grid;
        this.playerPos = state.playerPos;
        this.moves = state.moves;
        this.pushes = state.pushes;
        this.isCompleted = false;
        this.saveState();
        this.updateStats();
        this.render();
    }

    reset() {
        this.loadLevel(this.currentLevelIndex, false);
        this.saveState();
    }

    checkWin(triggerEvent = true) {
        for (let y = 0; y < this.grid.length; y++) {
            for (let x = 0; x < this.grid[y].length; x++) {
                if (this.grid[y][x] === this.CELL_TYPES.BOX) return false;
            }
        }

        this.isCompleted = true;

        // Update highest completed
        if (this.currentLevelIndex >= this.highestCompletedLevel) {
            this.highestCompletedLevel = this.currentLevelIndex + 1;
            localStorage.setItem(`${CONFIG.STORAGE_PREFIX}_highest`, this.highestCompletedLevel);
        }

        if (triggerEvent) {
            const isLast = this.currentLevelIndex === this.levels.length - 1;
            document.dispatchEvent(new CustomEvent('levelComplete', {
                detail: { isLast }
            }));
        }
        return true;
    }

    // Persistence Helpers
    saveState() {
        const data = {
            grid: this.grid,
            playerPos: this.playerPos,
            moves: this.moves,
            pushes: this.pushes,
            history: this.history
        };
        localStorage.setItem(`${CONFIG.STORAGE_PREFIX}_state_${this.currentLevelIndex}`, JSON.stringify(data));
    }

    getSavedState(index) {
        const item = localStorage.getItem(`${CONFIG.STORAGE_PREFIX}_state_${index}`);
        return item ? JSON.parse(item) : null;
    }

    clearSavedState(index) {
        localStorage.removeItem(`${CONFIG.STORAGE_PREFIX}_state_${index}`);
    }

    updateStats() {
        this.statsElements.moves.textContent = this.moves;
        this.statsElements.pushes.textContent = this.pushes;
        this.statsElements.levelNum.textContent = this.currentLevelIndex + 1;
    }
}
