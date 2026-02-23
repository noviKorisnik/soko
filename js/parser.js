/**
 * Parser for Sokoban level files (.txt)
 * Handles the "Thinking Rabbit Original" format.
 */

export default class SokobanParser {
    static parse(content) {
        const levels = [];
        const lines = content.split(/\r?\n/);

        let currentGrid = [];
        let currentMetadata = { title: '', author: '', comment: '' };
        let inGrid = false;

        const pushLevel = () => {
            if (currentGrid.length > 0) {
                levels.push({
                    grid: [...currentGrid],
                    ...currentMetadata
                });
                currentGrid = [];
                currentMetadata = { title: '', author: '', comment: '' };
            }
            inGrid = false;
        };

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmed = line.trim();

            if (this.isGridLine(line)) {
                // If we hit a grid line but were previously in metadata/empty space, 
                // it means the previous level's metadata is done.
                if (!inGrid && currentGrid.length > 0) {
                    pushLevel();
                }
                currentGrid.push(line);
                inGrid = true;
            } else {
                // Metadata
                if (trimmed.startsWith('Title:')) {
                    currentMetadata.title = trimmed.replace('Title:', '').trim();
                } else if (trimmed.startsWith('Author:')) {
                    currentMetadata.author = trimmed.replace('Author:', '').trim();
                } else if (trimmed.startsWith('Comment:')) {
                    currentMetadata.comment = trimmed.replace('Comment:', '').trim();
                }

                // If the line is NOT a grid line and NOT empty, mark end of grid section
                if (trimmed !== '') {
                    inGrid = false;
                }
            }
        }

        // Final push
        pushLevel();

        return levels;
    }

    static isGridLine(line) {
        if (line.trim() === '') return false;

        // Skip metadata headers explicitly
        if (/^(Title:|Author:|Comment:|Collection:|Copyright:|Date:|Last change:)/i.test(line)) {
            return false;
        }

        // A valid grid line in this file MUST contain at least one wall '#' 
        // and only contain allowed Sokoban characters.
        const hasWall = line.indexOf('#') !== -1;
        const onlyAllowedChars = /^[#\s\-\.\$@\*\+]+$/.test(line);

        return hasWall && onlyAllowedChars;
    }

    /**
     * Normalizes the grid: maps all characters to standardized internal ones
     * and ensures the grid is rectangular if needed (optional).
     */
    static normalizeGrid(gridLines) {
        // Find max width
        let maxWidth = 0;
        gridLines.forEach(l => maxWidth = Math.max(maxWidth, l.length));

        const normalizedLines = gridLines.map(line => {
            // Replace '-' with ' ' (floor)
            let normalized = line.replace(/-/g, ' ');
            return normalized.padEnd(maxWidth, ' ');
        });

        return this.cleanOuterFloor(normalizedLines);
    }

    /**
     * Converts floor tiles unreachable by the player into walls.
     */
    static cleanOuterFloor(grid) {
        const height = grid.length;
        if (height === 0) return grid;
        const width = grid[0].length;

        const interior = Array.from({ length: height }, () => Array(width).fill(false));

        // Find player position
        let start = null;
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const char = grid[y][x];
                // Use standard chars for player
                if (char === '@' || char === '+') {
                    start = { x, y };
                    break;
                }
            }
            if (start) break;
        }

        if (!start) return grid;

        // Flood fill (BFS) from player
        const queue = [start];
        interior[start.y][start.x] = true;

        const offsets = [
            { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
            { dx: -1, dy: 0 }, { dx: 1, dy: 0 }
        ];

        while (queue.length > 0) {
            const { x, y } = queue.shift();

            for (const offset of offsets) {
                const nx = x + offset.dx;
                const ny = y + offset.dy;

                if (nx >= 0 && nx < width && ny >= 0 && ny < height &&
                    !interior[ny][nx] && grid[ny][nx] !== '#') {
                    interior[ny][nx] = true;
                    queue.push({ x: nx, y: ny });
                }
            }
        }

        // Convert untouchable floor to wall
        return grid.map((row, y) => {
            return row.split('').map((char, x) => {
                // If it's a space and not marked interior, it's outer/void space
                if (char === ' ' && !interior[y][x]) {
                    return '#';
                }
                return char;
            }).join('');
        });
    }
}
