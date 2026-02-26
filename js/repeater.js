export default class ActionRepeater {
    constructor(actionCallback, initialDelay = 400, repeatInterval = 110) {
        this.actionCallback = actionCallback;
        this.initialDelay = initialDelay;
        this.repeatInterval = repeatInterval;
        this.timer = null;
        this.isActive = false;
    }

    start() {
        if (this.isActive) return;
        this.isActive = true;

        // First action is immediate
        const result = this.actionCallback();
        if (result === false) {
            this.stop();
            return;
        }

        // Schedule first repeat after the long delay
        this.timer = setTimeout(() => this.run(), this.initialDelay);
    }

    run() {
        if (!this.isActive) return;

        const result = this.actionCallback();
        if (result === false) {
            this.stop();
            return;
        }

        // Recursive call for the next repeat
        this.timer = setTimeout(() => this.run(), this.repeatInterval);
    }

    stop() {
        this.isActive = false;
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
    }
}
