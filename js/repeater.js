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
        // 1. check if active - if not - end
        if (!this.isActive) return;

        // 2. move
        this.actionCallback();

        // 3. set timeout for new call (without check)
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
