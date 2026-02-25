/**
 * Game Configuration
 */
const COLLECTIONS = [
    {
        ID: 'our',
        LEVEL_FILE: 'resources/Our-Original-Levels.txt',
        STORAGE_PREFIX: 'soko_our',
        COLLECTION_NAME: ' Our Original Levels',
        STRIP_OUTER_WALLS: true,
        AUTO_ROTATE: true,
        AUTO_ADJUST_SIZE: true
    },
    {
        ID: 'classic',
        LEVEL_FILE: 'resources/Thinking-Rabbit-Original-Plus-Extra.txt',
        STORAGE_PREFIX: 'soko_classic',
        COLLECTION_NAME: 'Classic Edition',
        STRIP_OUTER_WALLS: true,
        AUTO_ROTATE: true,
        AUTO_ADJUST_SIZE: true
    },
    {
        ID: 'junior1',
        LEVEL_FILE: 'resources/Junior-1.txt',
        STORAGE_PREFIX: 'soko_junior1',
        COLLECTION_NAME: 'Junior Edition 1',
        STRIP_OUTER_WALLS: true,
        AUTO_ROTATE: true,
        AUTO_ADJUST_SIZE: true
    }
];

// Determine active collection
const savedCollection = localStorage.getItem('soko_active_collection') || 'classic';
const activeCollection = COLLECTIONS.find(c => c.ID === savedCollection) || COLLECTIONS[1];

const CONFIG = {
    ...activeCollection,
    COLLECTIONS // Export available options
};

export default CONFIG;