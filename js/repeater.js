/**
 * Reusable engine for repeating actions while an input is held.
 * Mimics native keyboard key-repeat behavior.
 */
export default class ActionRepeater {
    constructor(actionCallback, initialDelay = 400, repeatInterval = 80) {
        this.actionCallback = actionCallback;
        this.initialDelay = initialDelay;
        this.repeatInterval = repeatInterval;
        this.timeoutTimer = null;
        this.intervalTimer = null;
        this.isActive = false;
    }

    start() {
        if (this.isActive) return;
        this.isActive = true;

        const shouldContinue = this.actionCallback();
        if (shouldContinue === false) {
            this.stop();
            return;
        }

        this.timeoutTimer = setTimeout(() => {
            if (!this.isActive) return;

            this.intervalTimer = setInterval(() => {
                if (!this.isActive) {
                    this.stop();
                    return;
                }
                const stillContinue = this.actionCallback();
                if (stillContinue === false) {
                    this.stop();
                }
            }, this.repeatInterval);
        }, this.initialDelay);
    }

    stop() {
        this.isActive = false;
        if (this.timeoutTimer) {
            clearTimeout(this.timeoutTimer);
            this.timeoutTimer = null;
        }
        if (this.intervalTimer) {
            clearInterval(this.intervalTimer);
            this.intervalTimer = null;
        }
    }
}
