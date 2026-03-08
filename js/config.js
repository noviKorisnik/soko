/**
 * Game Configuration
 */
const COLLECTIONS = [
    {
        id: 'our',
        levelFile: 'resources/Our-Original-Levels.txt',
        name: 'Our Original Levels',
        description: 'Handcrafted levels by the Soko team. A small but thoughtful set to get you started.',
        levelCount: 3
    },
    {
        id: 'classic',
        levelFile: 'resources/Thinking-Rabbit-Original-Plus-Extra.txt',
        name: 'Classic Edition',
        description: 'The original Thinking Rabbit puzzles — 90 levels of the game that started it all, plus extras.',
        levelCount: 90
    },
    {
        id: 'junior1',
        levelFile: 'resources/Junior-1.txt',
        name: 'Junior Edition 1',
        description: 'A beginner-friendly set with 60 accessible puzzles. Great for learning the ropes.',
        levelCount: 60
    }
];

// Derive storagePrefix from id automatically
COLLECTIONS.forEach(c => c.storagePrefix = `soko_${c.id}`);

// Determine active collection
const savedCollection = localStorage.getItem('soko_active_collection') || 'classic';
const activeCollection = COLLECTIONS.find(c => c.id === savedCollection) || COLLECTIONS[1];

const CONFIG = {
    ...activeCollection,
    COLLECTIONS
};

export default CONFIG;