import { Grid } from './Grid';

export class SimulationManager {
    constructor(width, height) {
        this.grid = new Grid(width, height);
        this.isRunning = true;
        this.start();
    }

    start() {
        this.run();
    }

    run() {
        if (this.isRunning) {
            this.grid.updateElements();
            requestAnimationFrame(this.run.bind(this));
        }
    }

    addElement(x, y, elementType) {
        this.grid.addElement(x, y, elementType);
    }

    getGrid() {
        return this.grid.getGridState();
    }
}
