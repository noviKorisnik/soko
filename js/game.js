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
        const rows = this.grid.length;
        const cols = Math.max(...this.grid.map(row => row.length));

        this.boardElement.style.gridTemplateColumns = `repeat(${cols}, var(--cell-size))`;
        this.boardElement.style.gridTemplateRows = `repeat(${rows}, var(--cell-size))`;

        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                const char = this.grid[y][x] || ' ';
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
    }

    move(dx, dy) {
        if (this.isCompleted) return;

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
