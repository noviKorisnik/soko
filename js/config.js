/**
 * Game Configuration
 */
const CONFIG = {
    // Current level set to load
    LEVEL_FILE: 'resources/Our-Original-Levels.txt',

    // Prefix for localStorage to keep progress separate for different level sets
    STORAGE_PREFIX: 'soko_our', // Change this when switching level sets

    // Level set display name
    COLLECTION_NAME: 'Our Original Levels',

    // Mobile Specific Optimizations
    STRIP_OUTER_WALLS: true,  // Removes first/last row/col of walls to save space
    AUTO_ROTATE: true,        // Pairs longer level dim with longer screen dim
    AUTO_ADJUST_SIZE: true    // Dynamically calculates cell size to fill screen
};

export default CONFIG;

/*
const CONFIG = {
    LEVEL_FILE: 'resources/Thinking-Rabbit-Original-Plus-Extra.txt',
    STORAGE_PREFIX: 'soko_classic',
    COLLECTION_NAME: 'Classic Edition'
};
*/