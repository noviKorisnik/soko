# Soko Versioning Strategy

This document outlines how the Soko project handles versioning and cache management.

## Single Source of Truth
The canonical project version is defined in `js/version.js` via the `SOKO_VERSION` constant.
- Example: `const SOKO_VERSION = '1.9.1';`

The **Service Worker** (`sw.js`) imports this file to set its `CACHE_NAME`.
The **Application** (`app.js`) reads this global variable to synchronize its cache operations. This ensures that level loading and offline saving always use the correct cache bucket.

## Version Format: `X.Y.Z`
We use a three-part versioning system: `[Major].[Cycle].[Iteration]`

1.  **Major (X)**: Incremented for architectural shifts or complete redesigns.
2.  **Cycle (Y)**: Incremented for each major feature release or stable production deploy (e.g., `1.8`, `1.9`, `1.10`).
3.  **Iteration (Z)**: Used during development to invalidate caches on testing machines. 
    - Examples: `1.9.1`, `1.9.42`, `1.9.105`.

## Development Workflow
1.  **Start Cycle**: When beginning a new feature set (e.g., moving from `1.8` to `1.9`), update the version to `1.9.1`.
2.  **Active Development**: Increment the iteration number (`Z`) whenever a change requires a clean cache state for testing. 
3.  **Stable Release**: Once a cycle is ready for production, the version is set to exactly `X.Y` (e.g., `1.9`).
4.  **Next Cycle**: The next iteration begins at `X.(Y+1).1` (e.g., `1.10.1`).

## Impact on Users
When `CACHE_NAME` changes:
- Browsers will detect the updated Service Worker.
- The `activate` event in `sw.js` will automatically delete all previous caches.
- This ensures users never see a mix of old assets and new logic.
