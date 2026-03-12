export default class ActionRepeater {
    constructor(actionCallback, initialDelay = 400, repeatInterval = 110) {
        this.actionCallback = actionCallback;
        this.initialDelay = initialDelay;
        this.repeatInterval = repeatInterval;
        this.rafId = null;
        this.isActive = false;
        this.lastActionTime = 0;
        this.isInitialDelayPassed = false;
    }

    start() {
        if (this.isActive) return;
        this.isActive = true;
        this.isInitialDelayPassed = false;

        // First action is immediate
        const result = this.actionCallback();
        if (result === false) {
            this.stop();
            return;
        }

        this.lastActionTime = performance.now();
        this.rafId = requestAnimationFrame((t) => this.loop(t));
    }

    loop(currentTime) {
        if (!this.isActive) return;

        const delta = currentTime - this.lastActionTime;
        const currentInterval = this.isInitialDelayPassed ? this.repeatInterval : this.initialDelay;

        if (delta >= currentInterval) {
            const result = this.actionCallback();
            this.lastActionTime = currentTime;
            this.isInitialDelayPassed = true;

            if (result === false) {
                this.stop();
                return;
            }
        }

        this.rafId = requestAnimationFrame((t) => this.loop(t));
    }

    stop() {
        this.isActive = false;
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
    }
}
