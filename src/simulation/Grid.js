import { ElementRegistry } from './../elements/ElementRegistry';

export class Grid {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.grid = this.createEmptyGrid();
    }

    createEmptyGrid() {
        return Array.from({ length: this.width }, () => Array(this.height).fill(null));
    }

    addElement(x, y, elementType) {
        if (!this.grid[x][y]) {
            const elementInfo = ElementRegistry[elementType];
            if (elementInfo) {
                this.grid[x][y] = new elementInfo.class(x, y);
            }
        }
    }

    updateElements() {
        for (let y = this.height - 1; y >= 0; y--) {
            for (let x = 0; x < this.width; x++) {
                const element = this.grid[x][y];
                if (element) {
                    element.update(this.grid);
                }
            }
        }
    }

    getGridState() {
        return this.grid;
    }
}
