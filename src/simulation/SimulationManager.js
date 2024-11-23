import { Grid } from './Grid';

export class SimulationManager {
    constructor(width, height, tickRate = 60) {
        this.grid = new Grid(width, height);
        this.isRunning = true;
        this.tickRate = tickRate;
        this.intervalId = null;
        this.start();
    }

    start() {
        if (this.isRunning && !this.intervalId) {
            this.intervalId = setInterval(() => {
                this.grid.updateElements();
            }, 1000 / this.tickRate);
        }
    }

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    setTickRate(newTickRate) {
        this.stop();
        this.tickRate = newTickRate;
        this.start();
    }

    addElement(x, y, elementType) {
        this.grid.addElement(x, y, elementType);
    }

    getGrid() {
        return this.grid.getGridState();
    }
}
