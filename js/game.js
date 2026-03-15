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
        this.highestCompletedLevel = parseInt(localStorage.getItem(`${CONFIG.storagePrefix}_highest`)) || 0;
        this.isCompleted = false;
        this.levels = [];
        this.grid = []; // 2D array of cells
        this.playerPos = { x: 0, y: 0 };
        this.moves = 0;
        this.pushes = 0;
        this.history = ''; // LURD string

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
        localStorage.setItem(`${CONFIG.storagePrefix}_current_level`, index);
        this.isCompleted = false;

        const savedData = useSavedState ? this.getSavedState(index) : null;

        if (savedData) {
            this.grid = savedData.grid;
            this.playerPos = savedData.playerPos;
            this.moves = savedData.moves;
            this.pushes = savedData.pushes;
            this.history = savedData.history || '';
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
            this.history = '';
        }

        this.updateStats();
        this.render();
        this.checkWin(false); // Check if loaded state is already win
        document.dispatchEvent(new CustomEvent('levelLoaded'));
    }

    render() {
        this.boardElement.innerHTML = '';

        // 1. Determine Grid View Bounds
        let startY = 0;
        let endY = this.grid.length;
        let startX = 0;
        let endX = this.grid[0] ? this.grid[0].length : 0;

        // Aggressive Trim: Iteratively remove outer rows/cols that are purely walls
        const isWall = (y, x) => (this.grid[y] && this.grid[y][x]) === this.CELL_TYPES.WALL;

        // Trim top rows
        while (endY - startY > 3) {
            let allWalls = true;
            for (let x = startX; x < endX; x++) {
                if (!isWall(startY, x)) { allWalls = false; break; }
            }
            if (allWalls) startY++; else break;
        }
        // Trim bottom rows
        while (endY - startY > 3) {
            let allWalls = true;
            for (let x = startX; x < endX; x++) {
                if (!isWall(endY - 1, x)) { allWalls = false; break; }
            }
            if (allWalls) endY--; else break;
        }
        // Trim left columns
        while (endX - startX > 3) {
            let allWalls = true;
            for (let y = startY; y < endY; y++) {
                if (!isWall(y, startX)) { allWalls = false; break; }
            }
            if (allWalls) startX++; else break;
        }
        // Trim right columns
        while (endX - startX > 3) {
            let allWalls = true;
            for (let y = startY; y < endY; y++) {
                if (!isWall(y, endX - 1)) { allWalls = false; break; }
            }
            if (allWalls) endX--; else break;
        }

        const viewRows = endY - startY;
        const viewCols = endX - startX;

        // Auto-rotate: if screen is portrait and level is landscape, rotate
        let isRotated = false;
        const screenPortrait = window.innerHeight > window.innerWidth;
        const levelLandscape = viewCols > viewRows;
        if (screenPortrait && levelLandscape) isRotated = true;

        const finalRows = isRotated ? viewCols : viewRows;
        const finalCols = isRotated ? viewRows : viewCols;

        // Auto-size: fit board to available container space
        const parent = this.boardElement.parentElement;
        const padding = 40;
        const availW = parent.clientWidth - padding;
        const availH = parent.clientHeight - padding;
        const borderSpace = 30;
        const cellW = (availW - borderSpace) / finalCols;
        const cellH = (availH - borderSpace) / finalRows;
        const cellSize = Math.floor(Math.min(cellW, cellH, 60));
        this.boardElement.style.setProperty('--cell-size', `${cellSize}px`);

        this.boardElement.style.gridTemplateColumns = `repeat(${finalCols}, var(--cell-size))`;
        this.boardElement.style.gridTemplateRows = `repeat(${finalRows}, var(--cell-size))`;

        // 4. Populate
        for (let r = 0; r < finalRows; r++) {
            for (let c = 0; c < finalCols; c++) {
                let x, y;
                if (isRotated) {
                    x = (viewCols - 1 - r) + startX;
                    y = c + startY;
                } else {
                    x = c + startX;
                    y = r + startY;
                }

                const char = (this.grid[y] && this.grid[y][x]) || ' ';
                const cell = document.createElement('div');

                if (char === this.CELL_TYPES.WALL) {
                    cell.classList.add('wall');
                } else if (char === this.CELL_TYPES.TARGET || char === this.CELL_TYPES.PLAYER_ON_TARGET || char === this.CELL_TYPES.BOX_ON_TARGET) {
                    cell.classList.add('floor', 'target');
                } else {
                    cell.classList.add('floor');
                }

                if (char === this.CELL_TYPES.PLAYER || char === this.CELL_TYPES.PLAYER_ON_TARGET) {
                    cell.classList.add('player');
                } else if (char === this.CELL_TYPES.BOX || char === this.CELL_TYPES.BOX_ON_TARGET) {
                    cell.classList.add('box');
                    if (char === this.CELL_TYPES.BOX_ON_TARGET) {
                        cell.classList.add('box-on-target');
                    }
                }

                this.boardElement.appendChild(cell);
            }
        }

        this.isViewRotated = isRotated;
    }

    move(dx, dy) {
        if (this.isCompleted) return false;

        // Rotation translation: If the board is rotated on screen, 
        // we must translate the input direction accordingly.
        if (this.isViewRotated) {
            const oldDx = dx;
            dx = -dy;
            dy = oldDx;
        }

        const newX = this.playerPos.x + dx;
        const newY = this.playerPos.y + dy;

        // Check bounds (though levels are surrounded by walls)
        if (newY < 0 || newY >= this.grid.length || newX < 0 || newX >= this.grid[newY].length) return false;

        const targetChar = this.grid[newY][newX];

        // 1. Wall
        if (targetChar === this.CELL_TYPES.WALL) return false;

        // 2. Box or Box on Target
        if (targetChar === this.CELL_TYPES.BOX || targetChar === this.CELL_TYPES.BOX_ON_TARGET) {
            const nextBoxX = newX + dx;
            const nextBoxY = newY + dy;

            // Check if box can be pushed
            const behindBoxChar = this.grid[nextBoxY][nextBoxX];
            if (behindBoxChar === this.CELL_TYPES.FLOOR || behindBoxChar === this.CELL_TYPES.TARGET) {
                // Save state for undo
                this.saveHistory(dx, dy, true);

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
                return true;
            } else {
                return false; // Cant push
            }
        }

        // 3. Floor or Target
        if (targetChar === this.CELL_TYPES.FLOOR || targetChar === this.CELL_TYPES.TARGET) {
            this.saveHistory(dx, dy, false);
            this.executePlayerMove(newX, newY);
            this.moves++;
            this.saveState();
            this.updateStats();
            this.render();
            return true;
        }

        return false;
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

    saveHistory(dx, dy, isPush) {
        let moveChar = '';
        if (dx === 0 && dy === -1) moveChar = 'u';
        else if (dx === 0 && dy === 1) moveChar = 'd';
        else if (dx === -1 && dy === 0) moveChar = 'l';
        else if (dx === 1 && dy === 0) moveChar = 'r';

        if (isPush) moveChar = moveChar.toUpperCase();
        this.history += moveChar;
    }

    undo() {
        if (this.history.length === 0) return false;

        const lastMove = this.history.slice(-1);
        this.history = this.history.slice(0, -1);

        const isPush = lastMove === lastMove.toUpperCase();
        const move = lastMove.toLowerCase();

        let dx = 0, dy = 0;
        if (move === 'u') dy = -1;
        else if (move === 'd') dy = 1;
        else if (move === 'l') dx = -1;
        else if (move === 'r') dx = 1;

        // 1. Move player back
        const oldX = this.playerPos.x - dx;
        const oldY = this.playerPos.y - dy;

        // Current tile becomes floor/target again
        const currentPosChar = this.grid[this.playerPos.y][this.playerPos.x];
        this.grid[this.playerPos.y][this.playerPos.x] = (currentPosChar === this.CELL_TYPES.PLAYER_ON_TARGET) ?
            this.CELL_TYPES.TARGET : this.CELL_TYPES.FLOOR;

        // Previous tile becomes player/player_on_target
        const prevTileChar = this.grid[oldY][oldX];
        this.grid[oldY][oldX] = (prevTileChar === this.CELL_TYPES.TARGET) ?
            this.CELL_TYPES.PLAYER_ON_TARGET : this.CELL_TYPES.PLAYER;

        this.playerPos = { x: oldX, y: oldY };

        // 2. If it was a push, pull the box back
        if (isPush) {
            const boxX = oldX + dx * 2;
            const boxY = oldY + dy * 2;
            const boxLandingX = oldX + dx;
            const boxLandingY = oldY + dy;

            // Box that was pushed away
            const boxChar = this.grid[boxY][boxX];
            this.grid[boxY][boxX] = (boxChar === this.CELL_TYPES.BOX_ON_TARGET) ?
                this.CELL_TYPES.TARGET : this.CELL_TYPES.FLOOR;

            // Bring it back to the landing spot (where player was before undo)
            const landingChar = this.grid[boxLandingY][boxLandingX];

            // Check if the landing field is a TARGET (since player already moved back)
            this.grid[boxLandingY][boxLandingX] = (landingChar === this.CELL_TYPES.TARGET) ?
                this.CELL_TYPES.BOX_ON_TARGET : this.CELL_TYPES.BOX;

            this.pushes--;
        }

        this.moves--;
        this.isCompleted = false;
        this.saveState();
        this.updateStats();
        this.render();
        return true;
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
            localStorage.setItem(`${CONFIG.storagePrefix}_highest`, this.highestCompletedLevel);
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
        localStorage.setItem(`${CONFIG.storagePrefix}_state_${this.currentLevelIndex}`, JSON.stringify(data));
    }

    getSavedState(index) {
        const item = localStorage.getItem(`${CONFIG.storagePrefix}_state_${index}`);
        return item ? JSON.parse(item) : null;
    }

    clearSavedState(index) {
        localStorage.removeItem(`${CONFIG.storagePrefix}_state_${index}`);
    }

    updateStats() {
        if (this.statsElements.moves) this.statsElements.moves.textContent = this.moves;
        if (this.statsElements.pushes) this.statsElements.pushes.textContent = this.pushes;
        if (this.statsElements.levelNum) this.statsElements.levelNum.textContent = this.currentLevelIndex + 1;
        document.dispatchEvent(new CustomEvent('gameStateChanged'));
    }
}
