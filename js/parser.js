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

        return gridLines.map(line => {
            // Replace '-' with ' ' (floor)
            let normalized = line.replace(/-/g, ' ');
            // Pad to maxWidth if you want perfectly rectangular (useful for grid-area if needed)
            // But usually we just let CSS Grid handle it.
            return normalized;
        });
    }
}
